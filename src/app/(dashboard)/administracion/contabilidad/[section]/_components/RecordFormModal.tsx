"use client";

import { useEffect, useState } from "react";
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
import {
  createAccountingRecordAction,
  updateAccountingRecordAction,
  deleteAccountingRecordAction,
} from "@/actions/accounting.actions";
import type { ColumnConfig } from "@/domain/accounting/types";

type OverlayState = ReturnType<typeof useOverlayState>;

interface Props {
  state: OverlayState;
  section: string;
  columns: ColumnConfig[];
  emptyForm: Record<string, unknown>;
  record?: Record<string, unknown> | null;
  onSaved: () => void;
  onDeleted?: () => void;
}

const fieldClass =
  "w-full rounded-lg border border-[var(--color-outline-variant)] bg-transparent px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-[var(--color-primary)] transition-colors";

export default function RecordFormModal({
  state,
  section,
  columns,
  emptyForm,
  record,
  onSaved,
  onDeleted,
}: Props) {
  const isEdit = !!record;
  const [form, setForm] = useState<Record<string, unknown>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      const populated: Record<string, unknown> = { ...emptyForm };
      for (const key of Object.keys(emptyForm)) {
        if (record[key] != null) populated[key] = record[key];
      }
      setForm(populated);
    } else {
      setForm({ ...emptyForm });
    }
    setError(null);
    setConfirmDelete(false);
  }, [record, emptyForm, state.isOpen]);

  function set(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const formableColumns = columns.filter((c) => c.formField);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = isEdit
      ? await updateAccountingRecordAction(section, String(record!.id), form)
      : await createAccountingRecordAction(section, form);
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    state.close();
    onSaved();
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    const result = await deleteAccountingRecordAction(section, String(record!.id));
    setDeleting(false);
    if (result.error) { setError(result.error); return; }
    state.close();
    onDeleted?.();
  }

  return (
    <Modal state={state}>
      <ModalBackdrop>
        <ModalContainer size="lg">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{isEdit ? "Editar registro" : "Nuevo registro"}</ModalHeading>
              <ModalCloseTrigger />
            </ModalHeader>

            <ModalBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formableColumns.map((col) => {
                  const ff = col.formField!;
                  const val = form[col.key];

                  return (
                    <div
                      key={col.key}
                      className={`flex flex-col gap-1 ${ff.type === "textarea" ? "sm:col-span-2" : ""}`}
                    >
                      <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">
                        {col.label}
                        {ff.required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
                      </label>

                      {ff.type === "select" ? (
                        <select
                          value={String(val ?? "")}
                          onChange={(e) => set(col.key, e.target.value)}
                          className={fieldClass}
                        >
                          {ff.options?.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : ff.type === "textarea" ? (
                        <textarea
                          value={String(val ?? "")}
                          onChange={(e) => set(col.key, e.target.value)}
                          placeholder={ff.placeholder}
                          rows={3}
                          className={`${fieldClass} resize-none`}
                        />
                      ) : (
                        <input
                          type={ff.type}
                          value={String(val ?? "")}
                          onChange={(e) => set(col.key, e.target.value)}
                          placeholder={ff.placeholder}
                          step={ff.type === "number" ? "1" : undefined}
                          className={fieldClass}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {error && (
                <p className="mt-3 text-xs text-[var(--color-error)] font-medium">{error}</p>
              )}
            </ModalBody>

            <ModalFooter>
              {isEdit && (
                <div className="flex-1">
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--color-error)] font-medium">¿Eliminar registro?</span>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="text-xs px-2 py-1 rounded text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="text-xs px-2 py-1 rounded bg-[var(--color-error)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {deleting ? "Eliminando…" : "Eliminar"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="text-xs px-2 py-1 rounded text-[var(--color-error)] hover:bg-[var(--color-error-container)] transition-colors"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              )}
              <Button variant="outline" className="border-[var(--color-outline-variant)]" onPress={() => state.close()}>
                Cancelar
              </Button>
              <Button
                className="bg-[var(--color-primary)] text-white"
                isDisabled={saving}
                onPress={handleSave}
              >
                {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear registro"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
