"use client";

import { Icon } from "@iconify/react";
import { formatCLP } from "@/domain/accounting/helpers";
import { EXPENSE_CATEGORY_LABELS } from "@/domain/accounting/constants";
import type { SectionConfig } from "@/domain/accounting/types";

interface Stat {
  label: string;
  value: string;
  icon: string;
  color: string;
}

interface Props {
  section: SectionConfig;
  records: Record<string, unknown>[];
}

function sum(records: Record<string, unknown>[], key: string): number {
  return records.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
}

function buildStats(section: SectionConfig, records: Record<string, unknown>[]): Stat[] {
  const slug = section.slug;

  if (slug === "libro-diario" || slug === "historico") {
    const lastSaldo = records.length > 0 ? Number(records[0].saldo) || 0 : 0;
    return [
      { label: "Total Cargos", value: formatCLP(sum(records, "cargos")), icon: "material-symbols:arrow-downward", color: "#ef4444" },
      { label: "Total Abonos", value: formatCLP(sum(records, "abonos")), icon: "material-symbols:arrow-upward", color: "#10b981" },
      { label: "Saldo Final", value: formatCLP(lastSaldo), icon: "material-symbols:account-balance-wallet-outline", color: "#6366f1" },
    ];
  }

  if (slug === "transbank") {
    return [
      { label: "Total Bruto", value: formatCLP(sum(records, "monto_bruto")), icon: "material-symbols:payments-outline", color: "#6366f1" },
      { label: "Total Comisión", value: formatCLP(sum(records, "comision")), icon: "material-symbols:percent", color: "#f59e0b" },
      { label: "Total Neto", value: formatCLP(sum(records, "monto_neto")), icon: "material-symbols:credit-card-outline", color: "#10b981" },
    ];
  }

  if (slug === "gastos") {
    const total = sum(records, "monto");
    const byCategory = records.reduce<Record<string, number>>((acc, r) => {
      const cat = String(r.categoria ?? "otro");
      acc[cat] = (acc[cat] || 0) + (Number(r.monto) || 0);
      return acc;
    }, {});
    const topCat = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    return [
      { label: "Total Gastos", value: formatCLP(total), icon: "material-symbols:receipt-long-outline", color: "#ef4444" },
      { label: "# Registros", value: String(records.length), icon: "material-symbols:format-list-bulleted", color: "#6366f1" },
      ...(topCat ? [{ label: `Mayor: ${EXPENSE_CATEGORY_LABELS[topCat[0]] ?? topCat[0]}`, value: formatCLP(topCat[1]), icon: "material-symbols:category-outline", color: "#f59e0b" }] : []),
    ];
  }

  if (slug === "escuela-v25" || slug === "escuela-v26" || slug === "formacion-continua") {
    const pagados = records.filter((r) => r.estado === "pagado").length;
    const pendientes = records.filter((r) => r.estado === "pendiente").length;
    return [
      { label: "Total Cobrado", value: formatCLP(sum(records, "monto")), icon: "material-symbols:payments-outline", color: "#10b981" },
      { label: "Pagados", value: String(pagados), icon: "material-symbols:check-circle-outline", color: "#10b981" },
      { label: "Pendientes", value: String(pendientes), icon: "material-symbols:pending-outline", color: "#f59e0b" },
      { label: "Total Registros", value: String(records.length), icon: "material-symbols:people-outline", color: "#6366f1" },
    ];
  }

  if (slug === "consolidado") {
    return [
      { label: "Total Ingresos", value: formatCLP(sum(records, "total_ingresos")), icon: "material-symbols:arrow-upward", color: "#10b981" },
      { label: "Total Gastos", value: formatCLP(sum(records, "total_gastos")), icon: "material-symbols:arrow-downward", color: "#ef4444" },
      { label: "Resultado", value: formatCLP(sum(records, "resultado")), icon: "material-symbols:bar-chart-outline", color: "#6366f1" },
    ];
  }

  if (slug === "proyeccion") {
    const variacion = sum(records, "variacion");
    return [
      { label: "Total Estimado", value: formatCLP(sum(records, "monto_estimado")), icon: "material-symbols:trending-up-outline", color: "#6366f1" },
      { label: "Total Real", value: formatCLP(sum(records, "monto_real")), icon: "material-symbols:check-circle-outline", color: "#10b981" },
      { label: "Variación", value: formatCLP(variacion), icon: variacion >= 0 ? "material-symbols:arrow-upward" : "material-symbols:arrow-downward", color: variacion >= 0 ? "#10b981" : "#ef4444" },
    ];
  }

  return [];
}

export default function AccountingSummaryBar({ section, records }: Props) {
  const stats = buildStats(section, records);

  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] p-4 flex items-center gap-3"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: s.color + "20" }}
          >
            <Icon icon={s.icon} className="text-xl" style={{ color: s.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-black text-[var(--color-on-surface)] truncate">{s.value}</p>
            <p className="text-xs text-[var(--color-on-surface-variant)] leading-tight">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
