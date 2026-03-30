"use client";

import { useMemo, useState } from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { formatCLP } from "@/domain/accounting/helpers";
import { useConsolidadoLive } from "@/hooks/use-consolidado-live";

type TabId = "live" | "imported";

interface MonthlySummaryRecord {
  id: string;
  anio: number;
  mes: number;
  categoria: string;
  total_ingresos: number;
  total_gastos: number;
  resultado: number;
  notas?: string | null;
}

interface Props {
  records: Record<string, unknown>[];
  loading: boolean;
  onAdd: () => void;
  onImport: () => void;
  onRowClick: (record: Record<string, unknown>) => void;
}

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEPT", "OCT", "NOV", "DIC"];

// Canonical order for income categories — unknown ones go at the end
const INGRESO_RANK: Record<string, number> = {
  "Saldo escuela 2025": 0,
  "Escuela 2025": 1,
  "Escuela 2026": 2,
  "Formación continua": 3,
};

const GASTO_RANK: Record<string, number> = {
  "Sueldos equipo": 0,
  "Retiros": 1,
  "Imposiciones": 2,
  "Servicios admin./ Contadora": 3,
  "Servicios admin./Contadora": 3,
  "Servicios docencia": 4,
  "Banco": 5,
  "Plataformas": 6,
  "Publicidad": 7,
  "IVA y retenciones": 8,
  "Otros gastos": 9,
};

function rankOf(cat: string, map: Record<string, number>): number {
  return map[cat] ?? 999;
}

function useConsolidadoData(records: Record<string, unknown>[], year: number) {
  return useMemo(() => {
    const typed = records.filter(
      (r) => r.anio == null || Number(r.anio) === year
    ) as unknown as MonthlySummaryRecord[];

    // Build pivot: categoria → { mes → { ingresos, gastos } }
    const ingresoMap = new Map<string, number[]>();
    const gastoMap = new Map<string, number[]>();

    for (const r of typed) {
      const m = r.mes - 1; // 0-indexed
      if (m < 0 || m > 11) continue;

      if (r.total_ingresos > 0) {
        if (!ingresoMap.has(r.categoria)) ingresoMap.set(r.categoria, Array(12).fill(0));
        ingresoMap.get(r.categoria)![m] += r.total_ingresos;
      }
      if (r.total_gastos > 0) {
        if (!gastoMap.has(r.categoria)) gastoMap.set(r.categoria, Array(12).fill(0));
        gastoMap.get(r.categoria)![m] += r.total_gastos;
      }
    }

    // Sort categories
    const ingresoCats = [...ingresoMap.keys()].sort(
      (a, b) => rankOf(a, INGRESO_RANK) - rankOf(b, INGRESO_RANK)
    );
    const gastoCats = [...gastoMap.keys()].sort(
      (a, b) => rankOf(a, GASTO_RANK) - rankOf(b, GASTO_RANK)
    );

    // Monthly totals
    const ingresoTotals = Array(12).fill(0);
    const gastoTotals = Array(12).fill(0);
    for (const vals of ingresoMap.values()) vals.forEach((v, i) => (ingresoTotals[i] += v));
    for (const vals of gastoMap.values()) vals.forEach((v, i) => (gastoTotals[i] += v));

    // Row totals
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
      ingresoTotals,
      gastoTotals,
      ingresoRowTotals,
      gastoRowTotals,
      totalIngresos,
      totalGastos,
      diferencia: ingresoTotals.map((v, i) => v - gastoTotals[i]),
    };
  }, [records, year]);
}

function CellAmount({ value, dim }: { value: number; dim?: boolean }) {
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

function TableSection({
  title,
  bgHeader,
  textHeader,
  categories,
  dataMap,
  rowTotals,
  monthTotals,
  grandTotal,
  totalLabel,
  totalBg,
  totalText,
}: {
  title: string;
  bgHeader: string;
  textHeader: string;
  categories: string[];
  dataMap: Map<string, number[]>;
  rowTotals: Map<string, number>;
  monthTotals: number[];
  grandTotal: number;
  totalLabel: string;
  totalBg: string;
  totalText: string;
}) {
  return (
    <>
      {/* Section header */}
      <tr>
        <td
          colSpan={14}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${bgHeader} ${textHeader}`}
        >
          {title}
        </td>
      </tr>
      {/* Column labels */}
      <tr className="bg-[var(--color-surface-container-high)]">
        <th className="sticky left-0 z-10 bg-[var(--color-surface-container-high)] px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)] min-w-[180px]">
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
      {categories.map((cat) => (
        <tr
          key={cat}
          className="border-t border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors"
        >
          <td className="sticky left-0 z-10 bg-[var(--color-surface-container-lowest)] hover:bg-[var(--color-surface-container-low)] px-4 py-2 text-sm text-[var(--color-on-surface)] font-medium whitespace-nowrap">
            {cat}
          </td>
          {(dataMap.get(cat) ?? Array(12).fill(0)).map((v, i) => (
            <td key={i} className="px-2 py-2 text-right">
              <CellAmount value={v} dim />
            </td>
          ))}
          <td className="px-3 py-2 text-right font-semibold text-sm">
            <span className="font-mono tabular-nums text-[var(--color-on-surface)]">
              {formatCLP(rowTotals.get(cat) ?? 0)}
            </span>
          </td>
        </tr>
      ))}
      {/* Total row */}
      <tr className={`border-t-2 border-[var(--color-outline)] ${totalBg}`}>
        <td className={`sticky left-0 z-10 ${totalBg} px-4 py-2.5 text-xs font-bold uppercase tracking-wide ${totalText}`}>
          {totalLabel}
        </td>
        {monthTotals.map((v, i) => (
          <td key={i} className="px-2 py-2.5 text-right">
            <span className={`font-mono tabular-nums text-xs font-bold ${totalText}`}>
              {v === 0 ? "0" : formatCLP(v)}
            </span>
          </td>
        ))}
        <td className="px-3 py-2.5 text-right">
          <span className={`font-mono tabular-nums text-sm font-bold ${totalText}`}>
            {formatCLP(grandTotal)}
          </span>
        </td>
      </tr>
    </>
  );
}

export default function ConsolidadoDashboard({
  records,
  loading,
  onAdd,
  onImport,
}: Props) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [tab, setTab] = useState<TabId>("live");

  const importedData = useConsolidadoData(records, year);
  const { data: liveData, loading: liveLoading } = useConsolidadoLive(year);

  const data = tab === "live" ? liveData : importedData;
  const isLoading = tab === "live" ? liveLoading : loading;
  const isEmpty = tab === "imported" && records.length === 0;

  const availableYears = useMemo(() => {
    const ys = new Set<number>([currentYear]);
    for (const r of records) if (r.anio) ys.add(Number(r.anio));
    return [...ys].sort((a, b) => b - a);
  }, [records, currentYear]);

  return (
    <div>
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-[var(--color-on-surface)]">CONSOLIDADO {year}</h2>
          <p className="text-xs text-[var(--color-on-surface-variant)]">
            Ingresos vs gastos mensuales por categoría
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

      {/* Tab toggle */}
      <div className="flex items-center gap-1 mb-5 p-1 rounded-lg bg-[var(--color-surface-container-low)] w-fit">
        <button
          onClick={() => setTab("live")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "live"
              ? "bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm"
              : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
          }`}
        >
          <Icon icon="material-symbols:electric-bolt" className="text-base" />
          En vivo
        </button>
        <button
          onClick={() => setTab("imported")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "imported"
              ? "bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm"
              : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
          }`}
        >
          <Icon icon="material-symbols:table-chart-outline" className="text-base" />
          Importado
        </button>
      </div>

      {/* Live tab hint */}
      {tab === "live" && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed-variant)] text-xs">
          <Icon icon="material-symbols:electric-bolt" className="text-sm shrink-0" />
          Calculado en tiempo real desde los registros de pagos de programas y gastos.
          Se actualiza automáticamente cuando cambia algún dato.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-[var(--color-surface-container-low)] animate-pulse" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="py-16 text-center text-[var(--color-on-surface-variant)]">
          <Icon icon="material-symbols:bar-chart-outline" className="text-5xl mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin datos importados para {year}. Importa el archivo Excel o agrega registros.</p>
        </div>
      ) : tab === "live" && data.ingresoCats.length === 0 && data.gastoCats.length === 0 ? (
        <div className="py-16 text-center text-[var(--color-on-surface-variant)]">
          <Icon icon="material-symbols:electric-bolt" className="text-5xl mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin pagos ni gastos registrados para {year}.</p>
          <p className="text-xs mt-1">Agrega pagos de programas y gastos para ver el consolidado en vivo.</p>
        </div>
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 mb-0.5">
                Total Ingresos {year}
              </p>
              <p className="text-lg font-bold font-mono tabular-nums text-emerald-700">
                {formatCLP(data.totalIngresos)}
              </p>
            </div>
            <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-700 mb-0.5">
                Total Gastos {year}
              </p>
              <p className="text-lg font-bold font-mono tabular-nums text-orange-700">
                {formatCLP(data.totalGastos)}
              </p>
            </div>
            <div
              className={`rounded-xl border px-4 py-3 ${
                data.totalIngresos - data.totalGastos >= 0
                  ? "bg-[var(--color-primary-fixed)] border-[var(--color-primary)]"
                  : "bg-red-50 border-red-300"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-on-primary-fixed-variant)] mb-0.5">
                Resultado {year}
              </p>
              <p
                className={`text-lg font-bold font-mono tabular-nums ${
                  data.totalIngresos - data.totalGastos >= 0
                    ? "text-[var(--color-on-primary-fixed-variant)]"
                    : "text-red-700"
                }`}
              >
                {formatCLP(data.totalIngresos - data.totalGastos)}
              </p>
            </div>
          </div>

          {/* Pivot table */}
          <div className="overflow-x-auto rounded-xl border border-[var(--color-outline-variant)]">
            <table className="w-full border-collapse text-sm">
              <tbody>
                {/* ── INGRESOS ── */}
                <TableSection
                  title="INGRESOS (con IVA)"
                  bgHeader="bg-[#2d6a4f]"
                  textHeader="text-white"
                  categories={data.ingresoCats}
                  dataMap={data.ingresoMap}
                  rowTotals={data.ingresoRowTotals}
                  monthTotals={data.ingresoTotals}
                  grandTotal={data.totalIngresos}
                  totalLabel="Total Mes"
                  totalBg="bg-[#52b788]"
                  totalText="text-white"
                />

                {/* Spacer */}
                <tr>
                  <td colSpan={14} className="h-3 bg-[var(--color-surface-container-low)]" />
                </tr>

                {/* ── GASTOS ── */}
                <TableSection
                  title="GASTOS (con IVA)"
                  bgHeader="bg-[#d4661a]"
                  textHeader="text-white"
                  categories={data.gastoCats}
                  dataMap={data.gastoMap}
                  rowTotals={data.gastoRowTotals}
                  monthTotals={data.gastoTotals}
                  grandTotal={data.totalGastos}
                  totalLabel="Total Mes"
                  totalBg="bg-[#f4a261]"
                  totalText="text-white"
                />

                {/* Spacer */}
                <tr>
                  <td colSpan={14} className="h-3 bg-[var(--color-surface-container-low)]" />
                </tr>

                {/* ── DIFERENCIA ── */}
                <tr className="bg-[var(--color-surface-container-high)] border-t-2 border-[var(--color-outline)]">
                  <td className="sticky left-0 z-10 bg-[var(--color-surface-container-high)] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface)]">
                    Diferencia
                    <span className="block text-[10px] font-normal normal-case text-[var(--color-on-surface-variant)]">
                      ingresos menos gastos
                    </span>
                  </td>
                  {data.diferencia.map((v, i) => (
                    <td key={i} className="px-2 py-3 text-right">
                      <span
                        className={`font-mono tabular-nums text-xs font-semibold ${
                          v > 0 ? "text-emerald-600" : v < 0 ? "text-red-500" : "text-[var(--color-on-surface-variant)]"
                        }`}
                      >
                        {v === 0 ? "0" : formatCLP(v)}
                      </span>
                    </td>
                  ))}
                  <td className="px-3 py-3 text-right">
                    <span
                      className={`font-mono tabular-nums text-sm font-bold ${
                        data.totalIngresos - data.totalGastos > 0
                          ? "text-emerald-600"
                          : data.totalIngresos - data.totalGastos < 0
                          ? "text-red-500"
                          : "text-[var(--color-on-surface-variant)]"
                      }`}
                    >
                      {formatCLP(data.totalIngresos - data.totalGastos)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
