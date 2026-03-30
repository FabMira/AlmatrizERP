"use client";

import { useRef, useState } from "react";
import {
  Button,
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalHeading,
  ModalBody,
  ModalFooter,
  ModalCloseTrigger,
  useOverlayState,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { bulkImportAccountingAction } from "@/actions/accounting.actions";
import {
  parseBorrar,
  parseCart,
  parseTransbank,
  parseProgramPayments,
  parseFormacionContinua,
  parseGastos,
  parseConsolidado,
  parseProyeccion,
} from "@/lib/accounting/excel-parser";
import type { ImportBatch } from "@/actions/accounting.actions";

type OverlayState = ReturnType<typeof useOverlayState>;

interface SheetResult {
  slug: string;
  label: string;
  rows: Record<string, unknown>[];
  selected: boolean;
}

interface Props {
  state: OverlayState;
  onImported: () => void;
}

const SHEET_MAP: Record<
  string,
  {
    slug: string;
    label: string;
    parse: (rows: unknown[][], year: number) => Record<string, unknown>[];
    needsYear: boolean;
    defaultYear: number;
  }
> = {
  Borrar: {
    slug: "libro-diario",
    label: "Libro Diario",
    parse: (rows) => parseBorrar(rows),
    needsYear: false,
    defaultYear: new Date().getFullYear(),
  },
  Cart: {
    slug: "historico",
    label: "Histórico (Cartola)",
    parse: (rows) => parseCart(rows),
    needsYear: false,
    defaultYear: new Date().getFullYear(),
  },
  "Transbank ": {
    slug: "transbank",
    label: "Transbank",
    parse: (rows) => parseTransbank(rows),
    needsYear: false,
    defaultYear: new Date().getFullYear(),
  },
  // Also handle without trailing space
  Transbank: {
    slug: "transbank",
    label: "Transbank",
    parse: (rows) => parseTransbank(rows),
    needsYear: false,
    defaultYear: new Date().getFullYear(),
  },
  EscV25: {
    slug: "escuela-v25",
    label: "Escuela Doulas V25",
    parse: (rows, year) =>
      parseProgramPayments(rows, "escuela_v25", year, 6, 7, 1, 2),
    needsYear: true,
    defaultYear: 2025,
  },
  EscV26: {
    slug: "escuela-v26",
    label: "Escuela Doulas V26",
    parse: (rows, year) =>
      parseProgramPayments(rows, "escuela_v26", year, 6, 7, 1, 2),
    needsYear: true,
    defaultYear: 2026,
  },
  "F Cont": {
    slug: "formacion-continua",
    label: "Formación Continua",
    parse: (rows, year) => parseFormacionContinua(rows, year),
    needsYear: true,
    defaultYear: 2026,
  },
  Gastos: {
    slug: "gastos",
    label: "Gastos",
    parse: (rows, year) => parseGastos(rows, year),
    needsYear: true,
    defaultYear: 2026,
  },
  Consolidado: {
    slug: "consolidado",
    label: "Consolidado (resumen mensual)",
    parse: (rows, year) => parseConsolidado(rows, year),
    needsYear: true,
    defaultYear: 2026,
  },
  // The sheet name uses a Unicode accent
  "Proyecci\u00f3n": {
    slug: "proyeccion",
    label: "Proyección (presupuesto)",
    parse: (rows, year) => parseProyeccion(rows, year),
    needsYear: true,
    defaultYear: 2026,
  },
};

export default function ExcelImportModal({ state, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [sheets, setSheets] = useState<SheetResult[]>([]);
  const [years, setYears] = useState<Record<string, number>>({});
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Record<string, number> | null>(null);

  function reset() {
    setSheets([]);
    setYears({});
    setError(null);
    setSuccess(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleFile(file: File) {
    if (!file) return;
    setError(null);
    setSuccess(null);
    setSheets([]);
    setParsing(true);

    try {
      // Dynamic import keeps xlsx out of the initial JS bundle
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });

      const parsedSheets: SheetResult[] = [];
      const initialYears: Record<string, number> = {};

      for (const sheetName of wb.SheetNames) {
        const config = SHEET_MAP[sheetName];
        if (!config) continue; // ignore sheets we don't know how to parse
        if (parsedSheets.some((s) => s.slug === config.slug)) continue; // dedup (Transbank w/ and w/o space)

        const ws = wb.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
          header: 1,
          defval: null,
          raw: true,
        });

        const year = config.defaultYear;
        initialYears[config.slug] = year;

        const rows = config.parse(rawRows, year);
        parsedSheets.push({
          slug: config.slug,
          label: config.label,
          rows,
          selected: rows.length > 0,
        });
      }

      setYears(initialYears);
      setSheets(parsedSheets);
    } catch (err) {
      console.error(err);
      setError("No se pudo leer el archivo. Asegúrate de que sea un .xlsx válido.");
    } finally {
      setParsing(false);
    }
  }

  /** Re-parse a specific sheet when the year changes */
  async function reParseSheet(slug: string, newYear: number) {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });

    // Find the sheet name for this slug
    const sheetEntry = Object.entries(SHEET_MAP).find(([, cfg]) => cfg.slug === slug);
    if (!sheetEntry) return;
    const [sheetName, config] = sheetEntry;
    const ws = wb.Sheets[sheetName];
    if (!ws) return;

    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: null,
      raw: true,
    });
    const rows = config.parse(rawRows, newYear);

    setSheets((prev) =>
      prev.map((s) => (s.slug === slug ? { ...s, rows } : s))
    );
    setYears((prev) => ({ ...prev, [slug]: newYear }));
  }

  function toggleSheet(slug: string) {
    setSheets((prev) =>
      prev.map((s) => (s.slug === slug ? { ...s, selected: !s.selected } : s))
    );
  }

  async function handleImport() {
    const selected = sheets.filter((s) => s.selected && s.rows.length > 0);
    if (selected.length === 0) return;

    setImporting(true);
    setError(null);

    const batches: ImportBatch[] = selected.map((s) => ({
      slug: s.slug,
      rows: s.rows,
    }));

    const result = await bulkImportAccountingAction(batches);
    setImporting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(result.totals ?? {});
  }

  const totalSelected = sheets
    .filter((s) => s.selected)
    .reduce((acc, s) => acc + s.rows.length, 0);

  const needsYear = (slug: string) =>
    Object.values(SHEET_MAP).some((c) => c.slug === slug && c.needsYear);

  return (
    <Modal state={state}>
      <ModalBackdrop>
        <ModalContainer size="lg">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>Importar desde Excel</ModalHeading>
              <ModalCloseTrigger />
            </ModalHeader>

            <ModalBody>
              {/* File picker */}
              {!success && (
                <div className="mb-4">
                  <p className="text-sm text-[var(--color-on-surface-variant)] mb-3">
                    Selecciona el archivo <strong>MASTER contabilidad</strong> (.xlsx) para importar
                    los datos a la base de datos.
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border-2 border-dashed border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] transition-colors">
                    <Icon
                      icon="material-symbols:upload-file-outline"
                      className="text-2xl text-[var(--color-primary)] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-on-surface)]">
                        {fileRef.current?.files?.[0]?.name ?? "Elige un archivo .xlsx"}
                      </p>
                      <p className="text-xs text-[var(--color-on-surface-variant)]">
                        Se procesará directamente en el navegador
                      </p>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".xlsx"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                      }}
                    />
                  </label>
                </div>
              )}

              {/* Parsing indicator */}
              {parsing && (
                <div className="flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] py-4">
                  <Icon icon="svg-spinners:ring-resize" className="text-[var(--color-primary)]" />
                  Leyendo archivo…
                </div>
              )}

              {/* Sheet preview */}
              {sheets.length > 0 && !success && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wide mb-2">
                    Hojas detectadas
                  </p>
                  {sheets.map((sheet) => (
                    <div
                      key={sheet.slug}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors cursor-pointer ${
                        sheet.selected
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-container)]"
                          : "border-[var(--color-outline-variant)] opacity-50"
                      }`}
                      onClick={() => toggleSheet(sheet.slug)}
                    >
                      <Icon
                        icon={
                          sheet.selected
                            ? "material-symbols:check-circle"
                            : "material-symbols:radio-button-unchecked"
                        }
                        className={
                          sheet.selected
                            ? "text-[var(--color-primary)] text-lg"
                            : "text-[var(--color-on-surface-variant)] text-lg"
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-on-surface)]">
                          {sheet.label}
                        </p>
                        <p className="text-xs text-[var(--color-on-surface-variant)]">
                          {sheet.rows.length.toLocaleString("es-CL")} registros
                        </p>
                      </div>
                      {/* Year selector for monthly-expanded sheets */}
                      {needsYear(sheet.slug) && sheet.selected && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 shrink-0"
                        >
                          <span className="text-xs text-[var(--color-on-surface-variant)]">
                            Año:
                          </span>
                          <input
                            type="number"
                            value={years[sheet.slug] ?? 2026}
                            min={2020}
                            max={2040}
                            onChange={(e) => {
                              const y = parseInt(e.target.value);
                              if (y >= 2020 && y <= 2040) reParseSheet(sheet.slug, y);
                            }}
                            className="w-20 text-sm rounded-lg border border-[var(--color-outline-variant)] bg-transparent px-2 py-1 text-center text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)]"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Success screen */}
              {success && (
                <div className="py-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Icon
                      icon="material-symbols:check-circle"
                      className="text-3xl text-emerald-500"
                    />
                    <div>
                      <p className="font-semibold text-[var(--color-on-surface)]">
                        ¡Importación completada!
                      </p>
                      <p className="text-sm text-[var(--color-on-surface-variant)]">
                        Los datos ya están disponibles en cada sección.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-[var(--color-surface-container-low)] p-3 space-y-1">
                    {Object.entries(success).map(([slug, count]) => (
                      <div key={slug} className="flex justify-between text-sm">
                        <span className="text-[var(--color-on-surface-variant)]">
                          {sheets.find((s) => s.slug === slug)?.label ?? slug}
                        </span>
                        <span className="font-mono font-semibold text-emerald-600">
                          +{count.toLocaleString("es-CL")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="mt-3 text-xs text-[var(--color-error)] font-medium">{error}</p>
              )}
            </ModalBody>

            <ModalFooter>
              {success ? (
                <Button
                  className="bg-[var(--color-primary)] text-white"
                  onPress={() => {
                    reset();
                    state.close();
                    onImported();
                  }}
                >
                  Cerrar
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onPress={() => {
                      reset();
                      state.close();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="bg-[var(--color-primary)] text-white"
                    isDisabled={totalSelected === 0 || parsing || importing}
                    onPress={handleImport}
                  >
                    {importing ? (
                      <Icon icon="svg-spinners:ring-resize" className="mr-1" />
                    ) : (
                      <Icon icon="material-symbols:upload" className="mr-1" />
                    )}
                    Importar {totalSelected > 0 ? `${totalSelected.toLocaleString("es-CL")} registros` : ""}
                  </Button>
                </>
              )}
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
