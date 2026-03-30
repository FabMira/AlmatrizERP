"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { useRealtime } from "./use-realtime";

// ── Label maps (must match DB values) ─────────────────────────────────────────

const PROGRAMA_TO_LABEL: Record<string, string> = {
  escuela_v25: "Escuela 2025",
  escuela_v26: "Escuela 2026",
  formacion_continua: "Formación continua",
};

// Canonical income order
const INGRESO_ORDER = ["Escuela 2025", "Escuela 2026", "Formación continua"];

const CATEGORIA_TO_LABEL: Record<string, string> = {
  sueldos: "Sueldos equipo",
  retiros_socias: "Retiros de Socias",
  admin: "Servicios Admin.",
  iva_retenciones: "IVA y retenciones",
  docencia: "Servicios Docencia",
  banco: "Banco",
  plataformas: "Plataformas",
  publicidad: "Publicidad",
  caja_chica: "Caja Chica",
  otros: "Otros gastos",
};

// Canonical expense order
const GASTO_ORDER = [
  "Sueldos equipo",
  "Retiros de Socias",
  "Servicios Admin.",
  "IVA y retenciones",
  "Servicios Docencia",
  "Banco",
  "Plataformas",
  "Publicidad",
  "Caja Chica",
  "Otros gastos",
];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConsolidadoLiveData {
  ingresoMap: Map<string, number[]>;
  gastoMap: Map<string, number[]>;
  ingresoCats: string[];
  gastoCats: string[];
  ingresoRowTotals: Map<string, number>;
  gastoRowTotals: Map<string, number>;
  ingresoTotals: number[];
  gastoTotals: number[];
  totalIngresos: number;
  totalGastos: number;
  diferencia: number[];
}

function extractMonth(dateStr: string | null | undefined): number {
  if (!dateStr) return -1;
  // "YYYY-MM-DD" → month index 0-11
  const parts = String(dateStr).split("-");
  if (parts.length < 2) return -1;
  return parseInt(parts[1]) - 1;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useConsolidadoLive(year: number) {
  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);
  const [expenses, setExpenses] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const [pmResult, expResult] = await Promise.all([
      supabase
        .from("acc_program_payments")
        .select("programa, monto, fecha_pago")
        .gte("fecha_pago", startDate)
        .lte("fecha_pago", endDate),
      supabase
        .from("acc_expenses")
        .select("categoria, monto, fecha")
        .gte("fecha", startDate)
        .lte("fecha", endDate),
    ]);

    setPayments((pmResult.data ?? []) as Record<string, unknown>[]);
    setExpenses((expResult.data ?? []) as Record<string, unknown>[]);
    setLoading(false);
  }, [year]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Re-fetch whenever program payments or expenses change in real time
  useRealtime("acc_program_payments", fetchData);
  useRealtime("acc_expenses", fetchData);

  const data = useMemo<ConsolidadoLiveData>(() => {
    const ingresoMap = new Map<string, number[]>();
    const gastoMap = new Map<string, number[]>();

    // ── Income: program payments grouped by programa → month → Σ monto
    for (const p of payments) {
      const label = PROGRAMA_TO_LABEL[String(p.programa)] ?? String(p.programa);
      const month = extractMonth(p.fecha_pago as string);
      if (month < 0 || month > 11) continue;
      if (!ingresoMap.has(label)) ingresoMap.set(label, Array(12).fill(0));
      ingresoMap.get(label)![month] += Number(p.monto) || 0;
    }

    // ── Expenses: grouped by categoria → month → Σ monto
    for (const e of expenses) {
      const label = CATEGORIA_TO_LABEL[String(e.categoria)] ?? String(e.categoria);
      const month = extractMonth(e.fecha as string);
      if (month < 0 || month > 11) continue;
      if (!gastoMap.has(label)) gastoMap.set(label, Array(12).fill(0));
      gastoMap.get(label)![month] += Number(e.monto) || 0;
    }

    // Sort by canonical order, unknowns appended alphabetically
    const ingresoCats = [...ingresoMap.keys()].sort((a, b) => {
      const ra = INGRESO_ORDER.indexOf(a);
      const rb = INGRESO_ORDER.indexOf(b);
      if (ra === -1 && rb === -1) return a.localeCompare(b, "es");
      if (ra === -1) return 1;
      if (rb === -1) return -1;
      return ra - rb;
    });

    const gastoCats = [...gastoMap.keys()].sort((a, b) => {
      const ra = GASTO_ORDER.indexOf(a);
      const rb = GASTO_ORDER.indexOf(b);
      if (ra === -1 && rb === -1) return a.localeCompare(b, "es");
      if (ra === -1) return 1;
      if (rb === -1) return -1;
      return ra - rb;
    });

    const ingresoTotals = Array(12).fill(0);
    const gastoTotals = Array(12).fill(0);
    for (const vals of ingresoMap.values()) vals.forEach((v, i) => (ingresoTotals[i] += v));
    for (const vals of gastoMap.values()) vals.forEach((v, i) => (gastoTotals[i] += v));

    const ingresoRowTotals = new Map<string, number>();
    const gastoRowTotals = new Map<string, number>();
    for (const [cat, vals] of ingresoMap) ingresoRowTotals.set(cat, vals.reduce((a, b) => a + b, 0));
    for (const [cat, vals] of gastoMap) gastoRowTotals.set(cat, vals.reduce((a, b) => a + b, 0));

    const totalIngresos = ingresoTotals.reduce((a, b) => a + b, 0);
    const totalGastos = gastoTotals.reduce((a, b) => a + b, 0);

    return {
      ingresoMap,
      gastoMap,
      ingresoCats,
      gastoCats,
      ingresoRowTotals,
      gastoRowTotals,
      ingresoTotals,
      gastoTotals,
      totalIngresos,
      totalGastos,
      diferencia: ingresoTotals.map((v, i) => v - gastoTotals[i]),
    };
  }, [payments, expenses]);

  return { data, loading, refetch: fetchData };
}
