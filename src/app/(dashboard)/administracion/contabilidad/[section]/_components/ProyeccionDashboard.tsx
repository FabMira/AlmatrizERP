"use client";

import { useMemo, useState } from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { formatCLP } from "@/domain/accounting/helpers";
import { useProyeccionLive, INGRESO_CATS, COSTE_CAT, GASTOS_DE_IMPUESTOS_CAT } from "@/hooks/use-proyeccion-live";

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEPT", "OCT", "NOV", "DIC"];

// ── Sub-components ────────────────────────────────────────────────────────────

function Num({ value, dim, bold }: { value: number; dim?: boolean; bold?: boolean }) {
  const base = "font-mono tabular-nums text-xs";
  if (value === 0)
    return (
      <span className={`${base} ${dim ? "text-[var(--color-outline)]" : "text-[var(--color-on-surface-variant)]"}`}>
        0
      </span>
    );
  return (
    <span className={`${base} ${bold ? "font-bold" : ""} text-[var(--color-on-surface)]`}>
      {formatCLP(value)}
    </span>
  );
}

function ColorNum({ value }: { value: number }) {
  const cls =
    value > 0
      ? "text-emerald-600"
      : value < 0
      ? "text-red-500"
      : "text-[var(--color-on-surface-variant)]";
  return (
    <span className={`font-mono tabular-nums text-xs font-semibold ${cls}`}>
      {value === 0 ? "0" : formatCLP(value)}
    </span>
  );
}

// ── Data row ──────────────────────────────────────────────────────────────────

function DataRow({
  label,
  values,
  rowTotal,
  dim,
  indent,
}: {
  label: string;
  values: number[];
  rowTotal: number;
  dim?: boolean;
  indent?: boolean;
}) {
  return (
    <tr className="border-t border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors">
      <td className={`sticky left-0 z-10 bg-[var(--color-surface-container-lowest)] hover:bg-[var(--color-surface-container-low)] px-4 py-2 text-sm font-medium text-[var(--color-on-surface)] whitespace-nowrap ${indent ? "pl-7" : ""}`}>
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} className="px-2 py-2 text-right">
          <Num value={v} dim={dim} />
        </td>
      ))}
      <td className="px-3 py-2 text-right">
        <span className="font-mono tabular-nums text-xs font-semibold text-[var(--color-on-surface)]">
          {formatCLP(rowTotal)}
        </span>
      </td>
    </tr>
  );
}

// ── Summary row (highlighted) ─────────────────────────────────────────────────

function SummaryRow({
  label,
  values,
  rowTotal,
  bg,
  text,
  colorize,
}: {
  label: string;
  values: number[];
  rowTotal: number;
  bg: string;
  text: string;
  colorize?: boolean;
}) {
  return (
    <tr className={`border-t-2 border-[var(--color-outline)] ${bg}`}>
      <td className={`sticky left-0 z-10 ${bg} px-4 py-2.5 text-xs font-bold uppercase tracking-wide ${text}`}>
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} className="px-2 py-2.5 text-right">
          {colorize ? (
            <span className={`font-mono tabular-nums text-xs font-bold ${v > 0 ? "text-emerald-600" : v < 0 ? "text-red-500" : "text-[var(--color-on-surface-variant)]"}`}>
              {v === 0 ? "0" : formatCLP(v)}
            </span>
          ) : (
            <span className={`font-mono tabular-nums text-xs font-bold ${text}`}>
              {v === 0 ? "0" : formatCLP(v)}
            </span>
          )}
        </td>
      ))}
      <td className="px-3 py-2.5 text-right">
        {colorize ? (
          <span className={`font-mono tabular-nums text-sm font-bold ${rowTotal > 0 ? "text-emerald-600" : rowTotal < 0 ? "text-red-500" : "text-[var(--color-on-surface-variant)]"}`}>
            {formatCLP(rowTotal)}
          </span>
        ) : (
          <span className={`font-mono tabular-nums text-sm font-bold ${text}`}>
            {formatCLP(rowTotal)}
          </span>
        )}
      </td>
    </tr>
  );
}

// ── Section header row ────────────────────────────────────────────────────────

function SectionHeader({ title, bg, text }: { title: string; bg: string; text: string }) {
  return (
    <tr>
      <td colSpan={14} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${bg} ${text}`}>
        {title}
      </td>
    </tr>
  );
}

// ── Column label row ──────────────────────────────────────────────────────────

function ColLabels() {
  return (
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
        AÑO HASTA LA FECHA
      </th>
    </tr>
  );
}

// ── Live badge ────────────────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-200">
      <Icon icon="material-symbols:electric-bolt" className="text-xs" />
      EN VIVO
    </span>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  records: Record<string, unknown>[];
  loading: boolean;
  onAdd: () => void;
  onImport: () => void;
  onRowClick: (record: Record<string, unknown>) => void;
}

// ── Importado data derived from acc_budget records ────────────────────────────

function useImportedData(records: Record<string, unknown>[], year: number) {
  return useMemo(() => {
    const budgetMap = new Map<string, number[]>();
    for (const r of records) {
      if (r.anio != null && Number(r.anio) !== year) continue;
      const cat = String(r.categoria ?? "").trim();
      const mes = Number(r.mes);
      if (!cat || mes < 1 || mes > 12) continue;
      if (!budgetMap.has(cat)) budgetMap.set(cat, Array(12).fill(0));
      budgetMap.get(cat)![mes - 1] += Number(r.monto_estimado) || 0;
    }

    const zero = () => Array(12).fill(0);
    const sum = (a: number[], b: number[]) => a.map((v, i) => v + b[i]);
    const sub = (a: number[], b: number[]) => a.map((v, i) => v - b[i]);

    // Ventas estimadas row (from budget, as typed in Excel)
    const ventasImported = budgetMap.get("Ventas estimadas") ?? zero();

    const ingresoCats = (INGRESO_CATS as readonly string[]).filter(
      (c) => c !== "Ventas estimadas" && budgetMap.has(c)
    );

    const ingresoSet = new Set<string>([...INGRESO_CATS, COSTE_CAT]);
    const gastoCats = [...budgetMap.keys()].filter(
      (c) => !ingresoSet.has(c) && c !== GASTOS_DE_IMPUESTOS_CAT
    );

    let ventasNetas = [...ventasImported];
    for (const cat of ingresoCats) {
      const vals = budgetMap.get(cat) ?? zero();
      if (/^menos/i.test(cat)) ventasNetas = sub(ventasNetas, vals);
      else ventasNetas = sum(ventasNetas, vals);
    }

    const coste = budgetMap.get(COSTE_CAT) ?? zero();
    const beneficioBruto = sub(ventasNetas, coste);

    let gastosTotales = zero();
    for (const cat of gastoCats) gastosTotales = sum(gastosTotales, budgetMap.get(cat) ?? zero());

    const ingresosAntesImpuestos = sub(beneficioBruto, gastosTotales);
    const gastosImpuestos = budgetMap.get(GASTOS_DE_IMPUESTOS_CAT) ?? zero();
    const ingresosNetos = sub(ingresosAntesImpuestos, gastosImpuestos);

    const t = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

    return {
      ventasRow: ventasImported,
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
      totalVentas: t(ventasImported),
      totalGastos: t(gastosTotales),
      totalNeto: t(ingresosNetos),
    };
  }, [records, year]);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProyeccionDashboard({ records, loading, onAdd, onImport }: Props) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [tab, setTab] = useState<"live" | "imported">("live");

  const { data: liveData, loading: liveLoading } = useProyeccionLive(year);
  const importedData = useImportedData(records, year);

  const isLoading = tab === "live" ? liveLoading : loading;

  const availableYears = useMemo(() => {
    const ys = new Set<number>([currentYear]);
    for (const r of records) if (r.anio) ys.add(Number(r.anio));
    return [...ys].sort((a, b) => b - a);
  }, [records, currentYear]);

  // Choose which set of data to render in the pivot table
  const d = tab === "live" ? liveData : importedData;
  const ventasRow = tab === "live" ? liveData.ventasLive : importedData.ventasRow;
  const totalVentas = tab === "live" ? liveData.totalVentasLive : importedData.totalVentas;
  const isLive = tab === "live";

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-[var(--color-on-surface)]">PROYECCIÓN {year}</h2>
          <p className="text-xs text-[var(--color-on-surface-variant)]">
            Estado de resultados proyectado por mes
          </p>
        </div>
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

      {/* Live hint */}
      {tab === "live" && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed-variant)] text-xs">
          <Icon icon="material-symbols:electric-bolt" className="text-sm shrink-0" />
          <span>
            <strong>Ventas estimadas</strong> calculado en tiempo real desde pagos de programas.
            Gastos y proyecciones adicionales provienen del Excel importado.
          </span>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 mb-0.5">
            Ventas Estimadas {year}
          </p>
          <p className="text-lg font-bold font-mono tabular-nums text-emerald-700">
            {formatCLP(totalVentas)}
          </p>
        </div>
        <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-700 mb-0.5">
            Gastos Totales {year}
          </p>
          <p className="text-lg font-bold font-mono tabular-nums text-orange-700">
            {formatCLP(d.totalGastos)}
          </p>
        </div>
        <div
          className={`rounded-xl border px-4 py-3 ${
            d.totalNeto >= 0
              ? "bg-[var(--color-primary-fixed)] border-[var(--color-primary)]"
              : "bg-red-50 border-red-300"
          }`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-on-primary-fixed-variant)] mb-0.5">
            Ingresos Netos {year}
          </p>
          <p
            className={`text-lg font-bold font-mono tabular-nums ${
              d.totalNeto >= 0 ? "text-[var(--color-on-primary-fixed-variant)]" : "text-red-700"
            }`}
          >
            {formatCLP(d.totalNeto)}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-[var(--color-surface-container-low)] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* ── Pivot table ─────────────────────────────────────────────────── */}
          <div className="overflow-x-auto rounded-xl border border-[var(--color-outline-variant)] mb-6">
            <table className="w-full border-collapse text-sm">
              <tbody>
                {/* ── INGRESOS ── */}
                <SectionHeader title="INGRESOS" bg="bg-[#2d6a4f]" text="text-white" />
                <ColLabels />

                {/* Ventas estimadas */}
                <tr className="border-t border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors">
                  <td className="sticky left-0 z-10 bg-[var(--color-surface-container-lowest)] hover:bg-[var(--color-surface-container-low)] px-4 py-2 text-sm font-medium text-[var(--color-on-surface)] whitespace-nowrap">
                    Ventas estimadas
                    {isLive && <LiveBadge />}
                  </td>
                  {ventasRow.map((v, i) => (
                    <td key={i} className="px-2 py-2 text-right">
                      <Num value={v} />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right">
                    <span className="font-mono tabular-nums text-xs font-semibold text-[var(--color-on-surface)]">
                      {formatCLP(totalVentas)}
                    </span>
                  </td>
                </tr>

                {/* Other income rows from budget */}
                {d.ingresoCats.map((cat) => {
                  const vals = d.budgetMap.get(cat) ?? Array(12).fill(0);
                  const rt = vals.reduce((a: number, b: number) => a + b, 0);
                  return <DataRow key={cat} label={cat} values={vals} rowTotal={rt} indent />;
                })}

                {/* Ventas netas */}
                <SummaryRow
                  label="Ventas netas"
                  values={d.ventasNetas}
                  rowTotal={d.ventasNetas.reduce((a, b) => a + b, 0)}
                  bg="bg-[#f0e6d3]"
                  text="text-[var(--color-on-surface)]"
                />

                {/* Coste de bienes vendidos */}
                {(d.budgetMap.has(COSTE_CAT) || true) && (
                  <DataRow
                    label="Coste de bienes vendidos"
                    values={d.budgetMap.get(COSTE_CAT) ?? Array(12).fill(0)}
                    rowTotal={(d.budgetMap.get(COSTE_CAT) ?? Array(12).fill(0)).reduce((a: number, b: number) => a + b, 0)}
                    dim
                  />
                )}

                {/* Beneficio bruto */}
                <SummaryRow
                  label="Beneficio bruto"
                  values={d.beneficioBruto}
                  rowTotal={d.beneficioBruto.reduce((a, b) => a + b, 0)}
                  bg="bg-[#f0e6d3]"
                  text="text-[var(--color-on-surface)]"
                />

                {/* Spacer */}
                <tr><td colSpan={14} className="h-3 bg-[var(--color-surface-container-low)]" /></tr>

                {/* ── GASTOS ── */}
                <SectionHeader title="GASTOS" bg="bg-[#d4661a]" text="text-white" />
                <ColLabels />

                {d.gastoCats.length === 0 ? (
                  <tr className="border-t border-[var(--color-outline-variant)]">
                    <td colSpan={14} className="px-4 py-4 text-xs text-center text-[var(--color-on-surface-variant)]">
                      Sin gastos proyectados importados. Importa el Excel o agrega registros.
                    </td>
                  </tr>
                ) : (
                  d.gastoCats.map((cat) => {
                    const vals = d.budgetMap.get(cat) ?? Array(12).fill(0);
                    const rt = vals.reduce((a: number, b: number) => a + b, 0);
                    return <DataRow key={cat} label={cat} values={vals} rowTotal={rt} dim />;
                  })
                )}

                {/* Gastos totales */}
                <SummaryRow
                  label="Gastos totales"
                  values={d.gastosTotales}
                  rowTotal={d.totalGastos}
                  bg="bg-[#f4a261]"
                  text="text-white"
                />

                {/* Ingresos antes de impuestos */}
                <SummaryRow
                  label="Ingresos antes de impuestos"
                  values={d.ingresosAntesImpuestos}
                  rowTotal={d.ingresosAntesImpuestos.reduce((a, b) => a + b, 0)}
                  bg="bg-[#f0e6d3]"
                  text="text-[var(--color-on-surface)]"
                />

                {/* Gastos de impuestos */}
                <DataRow
                  label="Gastos de impuestos"
                  values={d.gastosImpuestos}
                  rowTotal={d.gastosImpuestos.reduce((a: number, b: number) => a + b, 0)}
                  dim
                />

                {/* Spacer */}
                <tr><td colSpan={14} className="h-3 bg-[var(--color-surface-container-low)]" /></tr>

                {/* INGRESOS NETOS */}
                <tr className="bg-[#00687a]">
                  <td className="sticky left-0 z-10 bg-[#00687a] px-4 py-3 text-xs font-bold uppercase tracking-wide text-white">
                    INGRESOS NETOS
                  </td>
                  {d.ingresosNetos.map((v, i) => (
                    <td key={i} className="px-2 py-3 text-right">
                      <span className={`font-mono tabular-nums text-xs font-bold ${v >= 0 ? "text-white" : "text-red-200"}`}>
                        {v === 0 ? "0" : formatCLP(v)}
                      </span>
                    </td>
                  ))}
                  <td className="px-3 py-3 text-right">
                    <span className={`font-mono tabular-nums text-sm font-bold ${d.totalNeto >= 0 ? "text-white" : "text-red-200"}`}>
                      {formatCLP(d.totalNeto)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── CURSO table (always live from acc_program_payments) ──────────── */}
          {isLive && liveData.cursoRows.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-[var(--color-on-surface)] mb-2 flex items-center gap-2">
                CURSO — Detalle de Pagos por Alumna
                <LiveBadge />
              </h3>
              <div className="overflow-x-auto rounded-xl border border-[var(--color-outline-variant)]">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#2d6a4f]">
                      <th className="sticky left-0 z-10 bg-[#2d6a4f] px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-white min-w-[180px]">
                        Nombre
                      </th>
                      {MONTHS.map((m) => (
                        <th key={m} className="px-2 py-2.5 text-right text-[10px] font-bold text-white min-w-[70px]">
                          {m}
                        </th>
                      ))}
                      <th className="px-3 py-2.5 text-right text-[10px] font-bold text-white min-w-[80px]">
                        Pagado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveData.cursoRows.map((row) => (
                      <tr
                        key={row.nombre}
                        className="border-t border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors"
                      >
                        <td className="sticky left-0 z-10 bg-[var(--color-surface-container-lowest)] hover:bg-[var(--color-surface-container-low)] px-4 py-2 text-sm font-medium text-[var(--color-on-surface)] whitespace-nowrap">
                          {row.nombre}
                        </td>
                        {row.monthly.map((v, i) => (
                          <td key={i} className="px-2 py-2 text-right">
                            <Num value={v} dim />
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right">
                          <span className="font-mono tabular-nums text-xs font-semibold text-emerald-700">
                            {formatCLP(row.total)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr className="border-t-2 border-[var(--color-outline)] bg-[#52b788]">
                      <td className="sticky left-0 z-10 bg-[#52b788] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white">
                        Total
                      </td>
                      {liveData.ventasLive.map((v, i) => (
                        <td key={i} className="px-2 py-2.5 text-right">
                          <span className="font-mono tabular-nums text-xs font-bold text-white">
                            {v === 0 ? "0" : formatCLP(v)}
                          </span>
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-right">
                        <span className="font-mono tabular-nums text-sm font-bold text-white">
                          {formatCLP(liveData.totalVentasLive)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
