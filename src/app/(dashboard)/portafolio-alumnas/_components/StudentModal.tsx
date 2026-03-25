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
import { Icon } from "@iconify/react";
import {
  createStudentAction,
  updateStudentAction,
  deleteStudentAction,
} from "@/actions/student.actions";
import type { Student, Generation, StudentForm } from "@/domain/students/types";
import { EMPTY_STUDENT_FORM, STATUS_LABELS } from "@/domain/students/constants";

type OverlayState = ReturnType<typeof useOverlayState>;

interface Props {
  state: OverlayState;
  generations: Generation[];
  student?: Student | null;
  onSaved: () => void;
  onDeleted?: () => void;
}

const fieldClass =
  "w-full rounded-lg border border-[var(--color-outline-variant)] bg-transparent px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-[var(--color-primary)] transition-colors";

export default function StudentModal({ state, generations, student, onSaved, onDeleted }: Props) {
  const isEdit = !!student;
  const [form, setForm] = useState<StudentForm>(EMPTY_STUDENT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setForm({
        full_name: student.full_name,
        email: student.email ?? "",
        phone: student.phone ?? "",
        city: student.city ?? "",
        generation: student.generation,
        status: student.status,
        notes: student.notes ?? "",
      });
    } else {
      setForm({
        ...EMPTY_STUDENT_FORM,
        generation: generations[0]?.name ?? "",
      });
    }
    setError(null);
    setConfirmDelete(false);
  }, [student, generations, state.isOpen]);

  function set(field: keyof StudentForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = isEdit
      ? await updateStudentAction(student!.id, form)
      : await createStudentAction(form);
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    state.close();
    onSaved();
  }

  async function handleDelete() {
    if (!student) return;
    setDeleting(true);
    await deleteStudentAction(student.id);
    setDeleting(false);
    state.close();
    onDeleted?.();
  }

  return (
    <Modal state={state}>
      <ModalBackdrop>
        <ModalContainer size="lg">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{isEdit ? "Editar Alumna" : "Agregar Alumna"}</ModalHeading>
              <ModalCloseTrigger />
            </ModalHeader>

            <ModalBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full name */}
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Nombre completo *</label>
                  <input className={fieldClass} placeholder="Nombre completo" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Correo electrónico</label>
                  <input type="email" className={fieldClass} placeholder="correo@ejemplo.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Teléfono</label>
                  <input className={fieldClass} placeholder="10 dígitos" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </div>

                {/* City */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Ciudad</label>
                  <input className={fieldClass} placeholder="Ciudad de residencia" value={form.city} onChange={(e) => set("city", e.target.value)} />
                </div>

                {/* Generation */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Generación *</label>
                  <select className={fieldClass} value={form.generation} onChange={(e) => set("generation", e.target.value)}>
                    <option value="">Seleccionar generación</option>
                    {generations.map((g) => (
                      <option key={g.id} value={g.name}>{g.label ?? `Gen ${g.name}`}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Estado</label>
                  <select className={fieldClass} value={form.status} onChange={(e) => set("status", e.target.value as StudentForm["status"])}>
                    {(Object.entries(STATUS_LABELS) as [StudentForm["status"], string][]).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Notas</label>
                  <textarea className={`${fieldClass} resize-none`} rows={2} placeholder="Observaciones adicionales" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                </div>
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
                      <span className="text-xs text-[var(--color-error)] font-medium">¿Eliminar alumna?</span>
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
                      className="flex items-center gap-1.5 text-xs text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] transition-colors"
                    >
                      <Icon icon="material-symbols:delete-outline" className="text-base" />
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
                {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Agregar alumna"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
