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
import { createClient } from "@/lib/supabase/client";

type OverlayState = ReturnType<typeof useOverlayState>;

interface ParsedRow {
  full_name: string;
  phone: string;
  email: string;
  city: string;
  valid: boolean;
  error?: string;
}

interface Props {
  state: OverlayState;
  activeGeneration: string;
  onImported: () => void;
}

const supabase = createClient();

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  // Detect header row: skip if first cell looks like a label, not a name
  const firstCells = lines[0].split(",").map((c) => c.trim().toLowerCase());
  const hasHeader =
    firstCells.some((c) => ["nombre", "name", "full_name"].includes(c));
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines
    .filter((l) => l.trim())
    .map((line) => {
      // Handle quoted fields
      const cells: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; continue; }
        if (ch === "," && !inQuotes) { cells.push(cur.trim()); cur = ""; continue; }
        cur += ch;
      }
      cells.push(cur.trim());

      const [nombre = "", telefono = "", email = "", ciudad = ""] = cells;
      const valid = nombre.trim().length > 0;
      return {
        full_name: nombre.trim(),
        phone: telefono.trim(),
        email: email.trim(),
        city: ciudad.trim(),
        valid,
        error: valid ? undefined : "Nombre requerido",
      };
    });
}

export default function CsvUploadModal({ state, activeGeneration, onImported }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; fail: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  function reset() {
    setRows([]);
    setFileName("");
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) return;
    setFileName(file.name);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRows(parseCSV(text));
    };
    reader.readAsText(file, "UTF-8");
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    const validRows = rows.filter((r) => r.valid);
    if (!validRows.length) return;
    setImporting(true);
    const payload = validRows.map((r) => ({
      full_name: r.full_name,
      phone: r.phone || null,
      email: r.email || null,
      city: r.city || null,
      generation: activeGeneration,
      status: "activa" as const,
    }));

    const { error } = await supabase.from("students").insert(payload);
    setImporting(false);

    if (error) {
      setImportResult({ ok: 0, fail: validRows.length });
    } else {
      setImportResult({ ok: validRows.length, fail: rows.length - validRows.length });
      onImported();
    }
  }

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.length - validCount;
  const preview = rows.slice(0, 10);

  return (
    <Modal state={state}>
      <ModalBackdrop>
        <ModalContainer size="lg">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>Importar alumnas desde CSV</ModalHeading>
              <ModalCloseTrigger onPress={reset} />
            </ModalHeader>

            <ModalBody>
              <p className="text-xs text-[var(--color-on-surface-variant)] mb-4">
                Generación activa: <span className="font-semibold text-[var(--color-primary)]">Gen {activeGeneration}</span>
                {" · "}Columnas esperadas: <span className="font-mono">nombre, telefono, email, ciudad</span>
              </p>

              {/* Drop zone */}
              {!rows.length && (
                <div
                  onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl py-10 cursor-pointer transition-colors ${
                    dragging
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-container)]/20"
                      : "border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)]"
                  }`}
                >
                  <Icon icon="material-symbols:upload-file-outline" className="text-4xl text-[var(--color-on-surface-variant)]" />
                  <p className="text-sm text-[var(--color-on-surface-variant)]">
                    Arrastra un archivo CSV o <span className="text-[var(--color-primary)] font-medium">haz clic para seleccionar</span>
                  </p>
                  <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
                </div>
              )}

              {/* Preview */}
              {rows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-[var(--color-on-surface-variant)]">{fileName}</span>
                      <span className="text-[var(--color-primary)] font-medium">{validCount} válidas</span>
                      {invalidCount > 0 && (
                        <span className="text-[var(--color-error)] font-medium">{invalidCount} con error</span>
                      )}
                    </div>
                    <button onClick={reset} className="text-xs text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] flex items-center gap-1">
                      <Icon icon="material-symbols:close" className="text-sm" />
                      Cambiar
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[var(--color-outline-variant)]">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[var(--color-surface-container-low)]">
                          <th className="text-left px-3 py-2 font-semibold text-[var(--color-on-surface-variant)]">NOMBRE</th>
                          <th className="text-left px-3 py-2 font-semibold text-[var(--color-on-surface-variant)]">TELÉFONO</th>
                          <th className="text-left px-3 py-2 font-semibold text-[var(--color-on-surface-variant)]">EMAIL</th>
                          <th className="text-left px-3 py-2 font-semibold text-[var(--color-on-surface-variant)]">CIUDAD</th>
                          <th className="text-left px-3 py-2 font-semibold text-[var(--color-on-surface-variant)]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, i) => (
                          <tr
                            key={i}
                            className={`border-t border-[var(--color-outline-variant)] ${
                              !row.valid ? "bg-[var(--color-error-container)]/30" : ""
                            }`}
                          >
                            <td className="px-3 py-2 text-[var(--color-on-surface)]">{row.full_name || <span className="italic text-[var(--color-error)]">vacío</span>}</td>
                            <td className="px-3 py-2 text-[var(--color-on-surface-variant)]">{row.phone || "—"}</td>
                            <td className="px-3 py-2 text-[var(--color-on-surface-variant)]">{row.email || "—"}</td>
                            <td className="px-3 py-2 text-[var(--color-on-surface-variant)]">{row.city || "—"}</td>
                            <td className="px-3 py-2">
                              {!row.valid && (
                                <span className="text-[var(--color-error)] flex items-center gap-1">
                                  <Icon icon="material-symbols:error-outline" className="text-sm" />
                                  {row.error}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rows.length > 10 && (
                      <p className="px-3 py-2 text-[10px] text-[var(--color-on-surface-variant)] border-t border-[var(--color-outline-variant)]">
                        …y {rows.length - 10} filas más
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Result */}
              {importResult && (
                <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 ${
                  importResult.fail === rows.length
                    ? "bg-[var(--color-error-container)] text-[var(--color-error)]"
                    : "bg-[var(--color-primary-container)] text-[var(--color-primary)]"
                }`}>
                  <Icon icon={importResult.ok > 0 ? "material-symbols:check-circle-outline" : "material-symbols:error-outline"} className="text-lg flex-shrink-0" />
                  <p className="text-sm font-medium">
                    {importResult.ok > 0
                      ? `${importResult.ok} alumna(s) importadas correctamente.${importResult.fail > 0 ? ` ${importResult.fail} omitidas por errores.` : ""}`
                      : "Error al importar. Intenta de nuevo."}
                  </p>
                </div>
              )}
            </ModalBody>

            <ModalFooter>
              <Button variant="outline" className="border-[var(--color-outline-variant)]" onPress={() => { reset(); state.close(); }}>
                {importResult ? "Cerrar" : "Cancelar"}
              </Button>
              {rows.length > 0 && !importResult && (
                <Button
                  className="bg-[var(--color-primary)] text-white"
                  isDisabled={validCount === 0 || importing}
                  onPress={handleImport}
                >
                  {importing ? "Importando…" : `Importar ${validCount} alumna${validCount !== 1 ? "s" : ""}`}
                </Button>
              )}
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
