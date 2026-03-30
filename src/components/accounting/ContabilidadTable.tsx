"use client";

import { ReactNode, useMemo, useState } from "react";
import { Button, Chip, Skeleton } from "@heroui/react";
import { Icon } from "@iconify/react";
import { formatCLP, formatDate } from "@/domain/accounting/helpers";
import type { ColumnConfig } from "@/domain/accounting/types";

interface Props {
  columns: ColumnConfig[];
  data: Record<string, unknown>[];
  loading: boolean;
  title: string;
  onAdd: () => void;
  onRowClick: (record: Record<string, unknown>) => void;
  onImport?: () => void;
  extraFilters?: ReactNode;
}

const PER_PAGE = 15;

function PageNav({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-1">
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="w-8 h-8 rounded-lg border border-[var(--color-outline-variant)] flex items-center justify-center disabled:opacity-40 hover:bg-[var(--color-surface-container-low)] transition-colors"
      >
        <Icon icon="material-symbols:chevron-left" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
            p === page
              ? "bg-[var(--color-primary)] text-white"
              : "border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page === total}
        onClick={() => onChange(page + 1)}
        className="w-8 h-8 rounded-lg border border-[var(--color-outline-variant)] flex items-center justify-center disabled:opacity-40 hover:bg-[var(--color-surface-container-low)] transition-colors"
      >
        <Icon icon="material-symbols:chevron-right" />
      </button>
    </div>
  );
}

function renderCell(value: unknown, col: ColumnConfig) {
  switch (col.type) {
    case "currency": {
      const n = Number(value) || 0;
      const color = n > 0 ? "text-emerald-600" : n < 0 ? "text-red-500" : "";
      return (
        <span className={`font-mono tabular-nums ${color}`}>{formatCLP(n)}</span>
      );
    }
    case "date":
      return <span>{value ? formatDate(String(value)) : "—"}</span>;
    case "status": {
      const val = String(value ?? "");
      const chipColor = (col.colorMap?.[val] ?? "default") as
        | "default"
        | "accent"
        | "success"
        | "warning"
        | "danger";
      const label = col.labelMap?.[val] ?? val;
      return (
        <Chip size="sm" color={chipColor} variant="soft">
          {label}
        </Chip>
      );
    }
    case "number":
      return (
        <span className="font-mono tabular-nums">{value != null ? String(value) : "—"}</span>
      );
    default:
      return (
        <span className="truncate max-w-[200px] block">{value != null && value !== "" ? String(value) : "—"}</span>
      );
  }
}

export default function ContabilidadTable({
  columns,
  data,
  loading,
  title,
  onAdd,
  onRowClick,
  onImport,
  extraFilters,
}: Props) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);

  const textColumns = useMemo(() => columns.filter((c) => c.type === "text"), [columns]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      textColumns.some((col) => String(row[col.key] ?? "").toLowerCase().includes(q))
    );
  }, [data, search, textColumns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const col = columns.find((c) => c.key === sortKey);
      let cmp = 0;
      if (col?.type === "currency" || col?.type === "number") {
        cmp = (Number(av) || 0) - (Number(bv) || 0);
      } else if (col?.type === "date") {
        cmp = String(av ?? "").localeCompare(String(bv ?? ""));
      } else {
        cmp = String(av ?? "").localeCompare(String(bv ?? ""), "es");
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortAsc, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  function toggleSort(key: string) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
    setPage(1);
  }

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  return (
    <div>
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-[var(--color-on-surface)]">{title}</h2>
          <p className="text-xs text-[var(--color-on-surface-variant)]">{filtered.length} registros</p>
        </div>
        {extraFilters}
        <div className="relative">
          <Icon
            icon="material-symbols:search"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar..."
            className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-[var(--color-outline-variant)] bg-transparent text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-[var(--color-primary)] w-44 transition-colors"
          />
        </div>
        <Button size="sm" className="bg-[var(--color-primary)] text-white" onPress={onAdd}>
          <Icon icon="material-symbols:add" className="mr-1" />
          Agregar
        </Button>
        {onImport && (
          <Button
            size="sm"
            variant="ghost"
            className="border border-[var(--color-outline-variant)]"
            onPress={onImport}
          >
            <Icon icon="material-symbols:upload-file-outline" className="mr-1" />
            Importar Excel
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--color-outline-variant)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-surface-container-low)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && toggleSort(col.key)}
                  className={`text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)] whitespace-nowrap ${
                    col.hiddenOnMobile ? "hidden md:table-cell" : ""
                  } ${col.sortable ? "cursor-pointer select-none hover:text-[var(--color-primary)]" : ""}`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <Icon
                      icon={sortAsc ? "material-symbols:arrow-upward" : "material-symbols:arrow-downward"}
                      className="inline text-xs ml-1"
                    />
                  )}
                </th>
              ))}
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-[var(--color-outline-variant)]">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 ${col.hiddenOnMobile ? "hidden md:table-cell" : ""}`}
                      >
                        <Skeleton className="h-4 w-full rounded" />
                      </td>
                    ))}
                    <td className="px-4 py-3" />
                  </tr>
                ))
              : paginated.map((row) => (
                  <tr
                    key={String(row.id)}
                    onClick={() => onRowClick(row)}
                    className="border-t border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)] cursor-pointer transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 ${col.hiddenOnMobile ? "hidden md:table-cell" : ""}`}
                      >
                        {renderCell(row[col.key], col)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <Icon
                        icon="material-symbols:chevron-right"
                        className="text-[var(--color-on-surface-variant)]"
                      />
                    </td>
                  </tr>
                ))}

            {/* Empty state */}
            {!loading && paginated.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-12 text-center text-[var(--color-on-surface-variant)]"
                >
                  No hay registros.
                </td>
              </tr>
            )}

            {/* Summary / totals row */}
            {!loading && paginated.length > 0 && columns.some((c) => c.summable) && (
              <tr className="border-t-2 border-[var(--color-outline)] bg-[var(--color-surface-container-low)] font-semibold">
                {columns.map((col, i) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 ${col.hiddenOnMobile ? "hidden md:table-cell" : ""}`}
                  >
                    {col.summable ? (
                      <span className="font-mono tabular-nums">
                        {formatCLP(
                          filtered.reduce((sum, r) => sum + (Number(r[col.key]) || 0), 0)
                        )}
                      </span>
                    ) : i === 0 ? (
                      <span className="text-xs text-[var(--color-on-surface-variant)]">TOTALES</span>
                    ) : null}
                  </td>
                ))}
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && sorted.length > PER_PAGE && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-[var(--color-on-surface-variant)]">
            Mostrando {paginated.length} de {filtered.length}
          </p>
          <PageNav page={safePage} total={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
