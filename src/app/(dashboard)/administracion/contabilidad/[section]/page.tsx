"use client";

import { use, useMemo, useState } from "react";
import { useOverlayState } from "@heroui/react";
import { getSectionBySlug } from "@/domain/accounting/helpers";
import { useAccounting } from "@/hooks/use-accounting";
import ContabilidadTable from "@/components/accounting/ContabilidadTable";
import RecordFormModal from "./_components/RecordFormModal";
import ExcelImportModal from "./_components/ExcelImportModal";
import AccountingSummaryBar from "./_components/AccountingSummaryBar";
import ConsolidadoDashboard from "./_components/ConsolidadoDashboard";
import ProyeccionDashboard from "./_components/ProyeccionDashboard";
import GastosDashboard from "./_components/GastosDashboard";
import {
  EXPENSE_CATEGORY_LABELS,
} from "@/domain/accounting/constants";

interface PageProps {
  params: Promise<{ section: string }>;
}

const fieldClass =
  "rounded-lg border border-[var(--color-outline-variant)] bg-transparent px-3 py-1.5 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-colors";

export default function SectionPage({ params }: PageProps) {
  const { section } = use(params);
  const config = getSectionBySlug(section);

  const { records, loading, fetchRecords } = useAccounting(section);
  const addModal = useOverlayState();
  const editModal = useOverlayState();
  const importModal = useOverlayState();
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);

  // ── Extra filters ─────────────────────────────────────────────────────────────
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [anioFilter, setAnioFilter] = useState("");

  const filteredRecords = useMemo(() => {
    let result = records;
    if (section === "gastos" && categoriaFilter) {
      result = result.filter((r) => r.categoria === categoriaFilter);
    }
    if ((section === "consolidado" || section === "proyeccion") && anioFilter) {
      result = result.filter((r) => String(r.anio) === anioFilter);
    }
    return result;
  }, [records, section, categoriaFilter, anioFilter]);

  if (!config) {
    return (
      <div className="p-6 text-[var(--color-on-surface-variant)]">
        Sección no encontrada.
      </div>
    );
  }

  const extraFilters =
    section === "gastos" ? (
      <select
        value={categoriaFilter}
        onChange={(e) => setCategoriaFilter(e.target.value)}
        className={fieldClass}
      >
        <option value="">Todas las categorías</option>
        {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    ) : section === "consolidado" || section === "proyeccion" ? (
      <input
        type="number"
        value={anioFilter}
        onChange={(e) => setAnioFilter(e.target.value)}
        placeholder="Año"
        className={`${fieldClass} w-24`}
      />
    ) : undefined;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {section !== "consolidado" && section !== "proyeccion" && section !== "gastos" && (
        <AccountingSummaryBar section={config} records={filteredRecords} />
      )}

      <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] p-4 md:p-5">
        {section === "consolidado" ? (
          <ConsolidadoDashboard
            records={records}
            loading={loading}
            onAdd={addModal.open}
            onImport={importModal.open}
            onRowClick={(record) => {
              setSelectedRecord(record);
              editModal.open();
            }}
          />
        ) : section === "proyeccion" ? (
          <ProyeccionDashboard
            records={records}
            loading={loading}
            onAdd={addModal.open}
            onImport={importModal.open}
            onRowClick={(record) => {
              setSelectedRecord(record);
              editModal.open();
            }}
          />
        ) : section === "gastos" ? (
          <GastosDashboard
            records={records}
            loading={loading}
            onAdd={addModal.open}
            onImport={importModal.open}
            onRowClick={(record) => {
              setSelectedRecord(record);
              editModal.open();
            }}
          />
        ) : (
          <ContabilidadTable
            columns={config.columns}
            data={filteredRecords}
            loading={loading}
            title={config.label}
            onAdd={addModal.open}
            onImport={importModal.open}
            onRowClick={(record) => {
              setSelectedRecord(record);
              editModal.open();
            }}
            extraFilters={extraFilters}
          />
        )}
      </div>

      <RecordFormModal
        state={addModal}
        section={section}
        columns={config.columns}
        emptyForm={config.emptyForm}
        onSaved={fetchRecords}
      />

      <RecordFormModal
        state={editModal}
        section={section}
        columns={config.columns}
        emptyForm={config.emptyForm}
        record={selectedRecord}
        onSaved={() => {
          fetchRecords();
          setSelectedRecord(null);
        }}
        onDeleted={() => {
          fetchRecords();
          setSelectedRecord(null);
        }}
      />

      <ExcelImportModal
        state={importModal}
        onImported={fetchRecords}
      />
    </div>
  );
}
