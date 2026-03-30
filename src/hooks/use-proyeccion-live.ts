"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { useRealtime } from "./use-realtime";

// ── Category classification ───────────────────────────────────────────────────
// These are the canonical INGRESOS category names as they appear in the Excel.
// Everything else in acc_budget is treated as a GASTO.

export const INGRESO_CATS = [
  "Ventas estimadas",         // dynamically replaced by live payments in "En vivo" tab
  "Menos (descuentos, errores, etc.)",
  "Ingresos por servicios",
  "Otros ingresos",
] as const;

export const COSTE_CAT = "Coste de bienes vendidos";
export const GASTOS_DE_IMPUESTOS_CAT = "Gastos de impuestos";

export type IngresoCategory = (typeof INGRESO_CATS)[number];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CursoRow {
  nombre: string;
  programa: string;
  monthly: number[]; // [12]
  total: number;
}

export interface ProyeccionLiveData {
  /** Live "Ventas estimadas" from acc_program_payments per month */
  ventasLive: number[];
  /** All acc_budget rows grouped by categoria → monthly monto_estimado[12] */
  budgetMap: Map<string, number[]>;
  /** Ordered INGRESOS categories present in budgetMap (excl. "Ventas estimadas") */
  ingresoCats: string[];
  /** Ordered GASTOS categories present in budgetMap (excl. "Gastos de impuestos") */
  gastoCats: string[];
  /** Computed monthly summaries */
  ventasNetas: number[];
  coste: number[];
  beneficioBruto: number[];
  gastosTotales: number[];
  ingresosAntesImpuestos: number[];
  gastosImpuestos: number[];
  ingresosNetos: number[];
  /** Grand-total scalars */
  totalVentasLive: number;
  totalGastos: number;
  totalNeto: number;
  /** CURSO table: one row per student */
  cursoRows: CursoRow[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sum12(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i]);
}

function sub12(a: number[], b: number[]): number[] {
  return a.map((v, i) => v - b[i]);
}

function total(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function zeroes(): number[] {
  return Array(12).fill(0);
}

function extractMonth(dateStr: string | null | undefined): number {
  if (!dateStr) return -1;
  const parts = String(dateStr).split("-");
  if (parts.length < 2) return -1;
  return parseInt(parts[1]) - 1;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useProyeccionLive(year: number) {
  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);
  const [budgetRows, setBudgetRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const [pmResult, budgetResult] = await Promise.all([
      supabase
        .from("acc_program_payments")
        .select("programa, alumna_nombre, monto, fecha_pago")
        .gte("fecha_pago", startDate)
        .lte("fecha_pago", endDate),
      supabase
        .from("acc_budget")
        .select("categoria, mes, monto_estimado")
        .eq("anio", year),
    ]);

    setPayments((pmResult.data ?? []) as Record<string, unknown>[]);
    setBudgetRows((budgetResult.data ?? []) as Record<string, unknown>[]);
    setLoading(false);
  }, [year]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useRealtime("acc_program_payments", fetchData);
  useRealtime("acc_budget", fetchData);

  const data = useMemo<ProyeccionLiveData>(() => {
    // ── 1. "Ventas estimadas" live from program payments (monthly totals) ──────
    const ventasLive = zeroes();
    const studentMap = new Map<string, { programa: string; monthly: number[] }>();

    for (const p of payments) {
      const month = extractMonth(p.fecha_pago as string);
      if (month < 0 || month > 11) continue;
      const monto = Number(p.monto) || 0;
      ventasLive[month] += monto;

      // Build CURSO table row per student
      const nombre = String(p.alumna_nombre ?? "").trim();
      if (!nombre) continue;
      if (!studentMap.has(nombre)) {
        studentMap.set(nombre, { programa: String(p.programa ?? ""), monthly: zeroes() });
      }
      studentMap.get(nombre)!.monthly[month] += monto;
    }

    // ── 2. Budget rows from acc_budget aggregated into map ─────────────────────
    const budgetMap = new Map<string, number[]>();
    for (const row of budgetRows) {
      const cat = String(row.categoria ?? "").trim();
      const mes = Number(row.mes);
      if (!cat || mes < 1 || mes > 12) continue;
      if (!budgetMap.has(cat)) budgetMap.set(cat, zeroes());
      budgetMap.get(cat)![mes - 1] += Number(row.monto_estimado) || 0;
    }

    // ── 3. INGRESOS categories (from budget, excluding "Ventas estimadas") ─────
    const ingresoCats = INGRESO_CATS.filter(
      (c) => c !== "Ventas estimadas" && budgetMap.has(c)
    ) as string[];
    // Add any unknown income cats from budget that keyword-match income
    for (const cat of budgetMap.keys()) {
      const isKnown =
        (INGRESO_CATS as readonly string[]).includes(cat) ||
        cat === COSTE_CAT ||
        cat === GASTOS_DE_IMPUESTOS_CAT;
      if (!isKnown) continue; // stays in GASTOS below
    }

    // ── 4. GASTOS categories ───────────────────────────────────────────────────
    const ingresoSet = new Set<string>([
      ...INGRESO_CATS,
      COSTE_CAT,
    ]);
    const gastoCats = [...budgetMap.keys()].filter(
      (c) => !ingresoSet.has(c) && c !== GASTOS_DE_IMPUESTOS_CAT
    );

    // ── 5. Computed summary vectors ────────────────────────────────────────────
    // Ventas netas = Ventas estimadas live + other ingreso cats (Menos is a deduction)
    let ventasNetas = [...ventasLive];
    for (const cat of ingresoCats) {
      const vals = budgetMap.get(cat) ?? zeroes();
      // "Menos..." is a deduction — subtract; others add
      if (/^menos/i.test(cat)) {
        ventasNetas = sub12(ventasNetas, vals);
      } else {
        ventasNetas = sum12(ventasNetas, vals);
      }
    }

    const coste = budgetMap.get(COSTE_CAT) ?? zeroes();
    const beneficioBruto = sub12(ventasNetas, coste);

    let gastosTotales = zeroes();
    for (const cat of gastoCats) {
      gastosTotales = sum12(gastosTotales, budgetMap.get(cat) ?? zeroes());
    }

    const ingresosAntesImpuestos = sub12(beneficioBruto, gastosTotales);
    const gastosImpuestos = budgetMap.get(GASTOS_DE_IMPUESTOS_CAT) ?? zeroes();
    const ingresosNetos = sub12(ingresosAntesImpuestos, gastosImpuestos);

    // ── 6. CURSO rows sorted by total desc ────────────────────────────────────
    const cursoRows: CursoRow[] = [...studentMap.entries()]
      .map(([nombre, { programa, monthly }]) => ({
        nombre,
        programa,
        monthly,
        total: total(monthly),
      }))
      .sort((a, b) => b.total - a.total);

    return {
      ventasLive,
      budgetMap,
      ingresoCats,
      gastoCats,
      ventasNetas,
      coste,
      beneficioBruto,
      gastosTotales,
      ingresosAntesImpuestos,
      gastosImpuestos,
      ingresosNetos,
      totalVentasLive: total(ventasLive),
      totalGastos: total(gastosTotales),
      totalNeto: total(ingresosNetos),
      cursoRows,
    };
  }, [payments, budgetRows]);

  return { data, loading, refetch: fetchData };
}
