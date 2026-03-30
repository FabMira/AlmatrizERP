"use client";

import { Fragment, useMemo, useState } from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { formatCLP } from "@/domain/accounting/helpers";

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEPT", "OCT", "NOV", "DIC"];

// Canonical category order and styles matching the Excel Gastos tab
const CATEGORY_ORDER = [
  "sueldos",
  "retiros_socias",
  "admin",
  "iva_retenciones",
  "docencia",
  "banco",
  "plataformas",
  "publicidad",
  "caja_chica",
  "otros",
] as const;

const CATEGORY_LABEL: Record<string, string> = {
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

const CATEGORY_STYLE: Record<string, { header: string; total: string; totalText: string }> = {
  sueldos:         { header: "bg-[#1a5276] text-white",   total: "bg-[#2e86c1]", totalText: "text-white" },
  retiros_socias:  { header: "bg-[#7b3f00] text-white",   total: "bg-[#d4661a]", totalText: "text-white" },
  admin:           { header: "bg-[#1d3a8a] text-white",   total: "bg-[#457b9d]", totalText: "text-white" },
  iva_retenciones: { header: "bg-[#6e2f00] text-white",   total: "bg-[#c0392b]", totalText: "text-white" },
  docencia:        { header: "bg-[#4a1a5c] text-white",   total: "bg-[#9b59b6]", totalText: "text-white" },
  banco:           { header: "bg-[#145a32] text-white",   total: "bg-[#27ae60]", totalText: "text-white" },
  plataformas:     { header: "bg-[#00687a] text-white",   total: "bg-[#52b788]", totalText: "text-white" },
  publicidad:      { header: "bg-[#9b2335] text-white",   total: "bg-[#e76f51]", totalText: "text-white" },
  caja_chica:      { header: "bg-[#4d4d4d] text-white",   total: "bg-[#7f8c8d]", totalText: "text-white" },
  otros:           { header: "bg-[#2c3e50] text-white",   total: "bg-[#566573]", totalText: "text-white" },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  records: Record<string, unknown>[];
  loading: boolean;
  onAdd: () => void;
  onImport: () => void;
  onRowClick: (record: Record<string, unknown>) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractMonth(dateStr: string): number {
  const parts = String(dateStr).split("-");
  if (parts.length < 2) return -1;
  return parseInt(parts[1]) - 1; // 0-indexed
}

function extractYear(dateStr: string): number {
  return parseInt(String(dateStr).split("-")[0]);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Num({ value, dim }: { value: number; dim?: boolean }) {
  if (value === 0)
    return (
      <span className={`font-mono tabular-nums text-xs ${dim ? "text-[var(--color-outline)]" : "text-[var(--color-on-surface-variant)]"}`}>
        0
      </span>
    );
  return (
    <span className="font-mono tabular-nums text-xs text-[var(--color-on-surface)]">
      {formatCLP(value)}
    </span>
  );
}

// ── Category section ──────────────────────────────────────────────────────────

function CategorySection({
  catKey,
  items,
  sourceRecords,
  onCellClick,
}: {
  catKey: string;
  items: Map<string, number[]>;
  // desc → month[12] → records[]
  sourceRecords: Map<string, Record<string, unknown>[][]>;
  onCellClick: (record: Record<string, unknown>) => void;
}) {
  const label = CATEGORY_LABEL[catKey] ?? catKey;
  const style = CATEGORY_STYLE[catKey] ?? { header: "bg-gray-700 text-white", total: "bg-gray-500", totalText: "text-white" };

  const monthTotals = Array(12).fill(0);
  for (const vals of items.values()) {
    vals.forEach((v, i) => (monthTotals[i] += v));
  }
  const grandTotal = monthTotals.reduce((a, b) => a + b, 0);
  if (grandTotal === 0 && items.size === 0) return null;

  // Item row totals
  const itemTotals = new Map<string, number>();
  for (const [desc, vals] of items) {
    itemTotals.set(desc, vals.reduce((a, b) => a + b, 0));
  }

  return (
    <>
      {/* Section header */}
      <tr>
        <td colSpan={14} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${style.header}`}>
          {label}
        </td>
      </tr>
      {/* Column labels */}
      <tr className="bg-[var(--color-surface-container-high)]">
        <th className="sticky left-0 z-10 bg-[var(--color-surface-container-high)] px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)] min-w-[200px]">
          ÍTEM / PERIODO
        </th>
        {MONTHS.map((m) => (
          <th key={m} className="px-2 py-2 text-right text-[10px] font-semibold text-[var(--color-on-surface-variant)] min-w-[80px]">
            {m}
          </th>
        ))}
        <th className="px-3 py-2 text-right text-[10px] font-semibold text-[var(--color-on-surface-variant)] min-w-[90px]">
          Total
        </th>
      </tr>
      {/* Data rows */}
      {[...items.entries()].map(([desc, vals]) => (
        <tr
          key={desc}
          className="border-t border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors"
        >
          <td className="sticky left-0 z-10 bg-[var(--color-surface-container-lowest)] hover:bg-[var(--color-surface-container-low)] px-4 py-2 text-sm font-medium text-[var(--color-on-surface)] whitespace-nowrap">
            {desc}
          </td>
          {vals.map((v, i) => {
            const recs = sourceRecords.get(desc)?.[i] ?? [];
            const isClickable = v > 0 && recs.length > 0;
            return (
              <td
                key={i}
                className={`px-2 py-2 text-right ${isClickable ? "cursor-pointer group" : ""}`}
                onClick={isClickable ? () => onCellClick(recs[0]) : undefined}
                title={isClickable ? "Click para editar" : undefined}
              >
                {isClickable ? (
                  <span className="font-mono tabular-nums text-xs text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)] group-hover:underline underline-offset-2 transition-colors">
                    {formatCLP(v)}
                  </span>
                ) : (
                  <Num value={v} dim />
                )}
              </td>
            );
          })}
          <td className="px-3 py-2 text-right">
            <span className="font-mono tabular-nums text-xs font-semibold text-[var(--color-on-surface)]">
              {formatCLP(itemTotals.get(desc) ?? 0)}
            </span>
          </td>
        </tr>
      ))}
      {/* Category total */}
      <tr className={`border-t-2 border-[var(--color-outline)] ${style.total}`}>
        <td className={`sticky left-0 z-10 ${style.total} px-4 py-2.5 text-xs font-bold uppercase tracking-wide ${style.totalText}`}>
          Total {label}
        </td>
        {monthTotals.map((v, i) => (
          <td key={i} className="px-2 py-2.5 text-right">
            <span className={`font-mono tabular-nums text-xs font-bold ${style.totalText}`}>
              {v === 0 ? "0" : formatCLP(v)}
            </span>
          </td>
        ))}
        <td className="px-3 py-2.5 text-right">
          <span className={`font-mono tabular-nums text-sm font-bold ${style.totalText}`}>
            {formatCLP(grandTotal)}
          </span>
        </td>
      </tr>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GastosDashboard({ records, loading, onAdd, onImport, onRowClick }: Props) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  // Derive available years from data
  const availableYears = useMemo(() => {
    const ys = new Set<number>([currentYear]);
    for (const r of records) {
      if (r.fecha) {
        const y = extractYear(r.fecha as string);
        if (y > 2000) ys.add(y);
      }
    }
    return [...ys].sort((a, b) => b - a);
  }, [records, currentYear]);

  // Pivot: categoria → descripcion → number[12]
  // Also build: sourceMap: categoria → desc → month[12] → record[]
  const { pivot, sourceMap, grandMonthlyTotals, grandTotal, topCategories } = useMemo(() => {
    // categoria → Map<descripcion, number[12]>
    const pivot = new Map<string, Map<string, number[]>>();
    // categoria → Map<descripcion, Record[][12]>  (records per cell for editing)
    const sourceMap = new Map<string, Map<string, Record<string, unknown>[][]>>();

    for (const r of records) {
      const fecha = r.fecha as string;
      if (!fecha) continue;
      if (extractYear(fecha) !== year) continue;
      const month = extractMonth(fecha);
      if (month < 0 || month > 11) continue;

      const cat = String(r.categoria ?? "admin");
      const desc = String(r.descripcion || r.proveedor || "Sin descripción").trim();
      const monto = Number(r.monto) || 0;
      if (monto === 0) continue;

      // amounts pivot
      if (!pivot.has(cat)) pivot.set(cat, new Map());
      const catMap = pivot.get(cat)!;
      if (!catMap.has(desc)) catMap.set(desc, Array(12).fill(0));
      catMap.get(desc)![month] += monto;

      // source records map
      if (!sourceMap.has(cat)) sourceMap.set(cat, new Map());
      const srcCatMap = sourceMap.get(cat)!;
      if (!srcCatMap.has(desc)) srcCatMap.set(desc, Array.from({ length: 12 }, () => []));
      srcCatMap.get(desc)![month].push(r);
    }

    // Grand monthly totals
    const grandMonthlyTotals = Array(12).fill(0);
    for (const catMap of pivot.values()) {
      for (const vals of catMap.values()) {
        vals.forEach((v, i) => (grandMonthlyTotals[i] += v));
      }
    }
    const grandTotal = grandMonthlyTotals.reduce((a, b) => a + b, 0);

    // Top categories by spend (for KPIs)
    const topCategories = CATEGORY_ORDER.map((cat) => {
      const items = pivot.get(cat);
      let total = 0;
      if (items) for (const vals of items.values()) total += vals.reduce((a, b) => a + b, 0);
      return { cat, label: CATEGORY_LABEL[cat], total };
    }).sort((a, b) => b.total - a.total);

    return { pivot, sourceMap, grandMonthlyTotals, grandTotal, topCategories };
  }, [records, year]);

  // Ordered category sections to render
  const orderedCategories = CATEGORY_ORDER.filter(
    (cat) => pivot.has(cat) && (pivot.get(cat)?.size ?? 0) > 0
  );

  // Unknown categories not in CATEGORY_ORDER
  const unknownCategories = [...pivot.keys()].filter(
    (c) => !(CATEGORY_ORDER as readonly string[]).includes(c)
  );

  const isEmpty = !loading && orderedCategories.length === 0 && unknownCategories.length === 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-[var(--color-on-surface)]">GASTOS {year}</h2>
          <p className="text-xs text-[var(--color-on-surface-variant)]">
            Detalle de gastos mensuales por categoría
          </p>
        </div>
        {/* Year selector */}
        <div className="flex items-center gap-1 rounded-lg border border-[var(--color-outline-variant)] overflow-hidden">
          {availableYears.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                y === year
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="border border-[var(--color-outline-variant)]"
          onPress={onImport}
        >
          <Icon icon="material-symbols:upload-file-outline" className="mr-1" />
          Importar Excel
        </Button>
        <Button size="sm" className="bg-[var(--color-primary)] text-white" onPress={onAdd}>
          <Icon icon="material-symbols:add" className="mr-1" />
          Agregar
        </Button>
      </div>

      {/* KPI strip — top 3 categories by spend */}
      {!loading && grandTotal > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 sm:col-span-1 col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-700 mb-0.5">
              Total Gastos {year}
            </p>
            <p className="text-lg font-bold font-mono tabular-nums text-orange-700">
              {formatCLP(grandTotal)}
            </p>
          </div>
          {topCategories.slice(0, 3).map(({ cat, label, total }) => (
            <div
              key={cat}
              className="rounded-xl bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] px-4 py-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-on-surface-variant)] mb-0.5 truncate">
                {label}
              </p>
              <p className="text-base font-bold font-mono tabular-nums text-[var(--color-on-surface)]">
                {formatCLP(total)}
              </p>
              <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-0.5">
                {grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0}% del total
              </p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-[var(--color-surface-container-low)] animate-pulse" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="py-16 text-center text-[var(--color-on-surface-variant)]">
          <Icon icon="material-symbols:receipt-long-outline" className="text-5xl mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin gastos registrados para {year}.</p>
          <p className="text-xs mt-1">Importa el archivo Excel o agrega registros manualmente.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-outline-variant)]">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {/* Known categories in canonical order */}
              {orderedCategories.map((cat, idx) => (
                <Fragment key={cat}>
                  {idx > 0 && (
                    <tr>
                      <td colSpan={14} className="h-3 bg-[var(--color-surface-container-low)]" />
                    </tr>
                  )}
                  <CategorySection
                    catKey={cat}
                    items={pivot.get(cat)!}
                    sourceRecords={sourceMap.get(cat) ?? new Map()}
                    onCellClick={onRowClick}
                  />
                </Fragment>
              ))}

              {/* Unknown categories appended at the end */}
              {unknownCategories.map((cat) => (
                <Fragment key={`unk-${cat}`}>
                  <tr>
                    <td colSpan={14} className="h-3 bg-[var(--color-surface-container-low)]" />
                  </tr>
                  <CategorySection
                    catKey={cat}
                    items={pivot.get(cat)!}
                    sourceRecords={sourceMap.get(cat) ?? new Map()}
                    onCellClick={onRowClick}
                  />
                </Fragment>
              ))}

              {/* Grand total */}
              {(orderedCategories.length + unknownCategories.length) > 1 && (
                <>
                  <tr>
                    <td colSpan={14} className="h-3 bg-[var(--color-surface-container-low)]" />
                  </tr>
                  <tr className="border-t-2 border-[var(--color-outline)] bg-[#7b3000]">
                    <td className="sticky left-0 z-10 bg-[#7b3000] px-4 py-3 text-xs font-bold uppercase tracking-wide text-white">
                      TOTAL GASTOS {year}
                    </td>
                    {grandMonthlyTotals.map((v, i) => (
                      <td key={i} className="px-2 py-3 text-right">
                        <span className="font-mono tabular-nums text-xs font-bold text-white">
                          {v === 0 ? "0" : formatCLP(v)}
                        </span>
                      </td>
                    ))}
                    <td className="px-3 py-3 text-right">
                      <span className="font-mono tabular-nums text-sm font-bold text-white">
                        {formatCLP(grandTotal)}
                      </span>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
