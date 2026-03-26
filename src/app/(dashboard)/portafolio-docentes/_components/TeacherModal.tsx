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
  createTeacherAction,
  updateTeacherAction,
  deleteTeacherAction,
} from "@/actions/teacher.actions";
import type { Teacher, TeacherForm } from "@/domain/teachers/types";
import { EMPTY_TEACHER_FORM, STATUS_LABELS } from "@/domain/teachers/constants";
import type { Area, Course } from "@/domain/shared/types";

type OverlayState = ReturnType<typeof useOverlayState>;

const CATEGORY_LABELS: Record<string, string> = {
  teorico: "Teórico",
  rol_doula: "Rol de la Doula",
  gestion_oficio: "Gestión del Oficio",
  salud_mental: "Salud Mental de la Doula",
};

interface Props {
  state: OverlayState;
  areas: Area[];
  courses: Course[];
  teacher?: Teacher | null;
  onSaved: () => void;
  onDeleted?: () => void;
}

const fieldClass =
  "w-full rounded-lg border border-[var(--color-outline-variant)] bg-transparent px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-[var(--color-primary)] transition-colors";

export default function TeacherModal({ state, areas, courses, teacher, onSaved, onDeleted }: Props) {
  const isEdit = !!teacher;
  const [form, setForm] = useState<TeacherForm>(EMPTY_TEACHER_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teacher) {
      setForm({
        full_name: teacher.full_name,
        email: teacher.email ?? "",
        phone: teacher.phone ?? "",
        subject: teacher.subject ?? "",
        area_id: teacher.area_id ?? "",
        status: teacher.status,
        bio: teacher.bio ?? "",
        course_ids: teacher.teacher_courses?.map((tc) => tc.course_id) ?? [],
      });
    } else {
      setForm(EMPTY_TEACHER_FORM);
    }
    setError(null);
    setConfirmDelete(false);
  }, [teacher, state.isOpen]);

  function set(field: keyof TeacherForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleCourse(id: string) {
    setForm((f) => ({
      ...f,
      course_ids: f.course_ids.includes(id)
        ? f.course_ids.filter((c) => c !== id)
        : [...f.course_ids, id],
    }));
  }

  // Group courses by module then category
  const grouped = courses.reduce<Record<number, Record<string, Course[]>>>((acc, c) => {
    if (!acc[c.module]) acc[c.module] = {};
    if (!acc[c.module][c.category]) acc[c.module][c.category] = [];
    acc[c.module][c.category].push(c);
    return acc;
  }, {});

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = isEdit
      ? await updateTeacherAction(teacher!.id, form)
      : await createTeacherAction(form);
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    state.close();
    onSaved();
  }

  async function handleDelete() {
    if (!teacher) return;
    setDeleting(true);
    const result = await deleteTeacherAction(teacher.id);
    setDeleting(false);
    if (result.error) { setError(result.error); setConfirmDelete(false); return; }
    state.close();
    onDeleted?.();
  }

  return (
    <Modal state={state}>
      <ModalBackdrop>
        <ModalContainer size="lg">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{isEdit ? "Editar Docente" : "Agregar Docente"}</ModalHeading>
              <ModalCloseTrigger />
            </ModalHeader>

            <ModalBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full name */}
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Nombre completo *</label>
                  <input
                    className={fieldClass}
                    placeholder="Nombre completo"
                    value={form.full_name}
                    onChange={(e) => set("full_name", e.target.value)}
                  />
                </div>

                {/* Courses multi-select */}
                {courses.length > 0 && (
                  <div className="sm:col-span-2 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">
                        Cursos que imparte
                      </label>
                      <span className="text-xs text-[var(--color-on-surface-variant)]">
                        {form.course_ids.length} seleccionado{form.course_ids.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="rounded-xl border border-[var(--color-outline-variant)] divide-y divide-[var(--color-outline-variant)] max-h-64 overflow-y-auto">
                      {Object.entries(grouped).map(([mod, categories]) => (
                        <div key={mod} className="bg-[var(--color-surface-container-lowest)]">
                          <p className="px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary-fixed)] sticky top-0">
                            Módulo {mod}
                          </p>
                          {Object.entries(categories).map(([cat, items]) => (
                            <div key={cat} className="px-3 py-2 space-y-1">
                              <p className="text-[10px] uppercase tracking-wide font-medium text-[var(--color-on-surface-variant)] opacity-70">
                                {CATEGORY_LABELS[cat] ?? cat}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {items.map((c) => {
                                  const selected = form.course_ids.includes(c.id);
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => toggleCourse(c.id)}
                                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                                        selected
                                          ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                                          : "border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                                      }`}
                                    >
                                      {selected && (
                                        <Icon icon="material-symbols:check" className="inline text-sm mr-0.5 -mt-0.5" />
                                      )}
                                      {c.title}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Correo electrónico</label>
                  <input
                    type="email"
                    className={fieldClass}
                    placeholder="correo@ejemplo.com"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Teléfono</label>
                  <input
                    className={fieldClass}
                    placeholder="10 dígitos"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </div>

                {/* Area */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Área</label>
                  <select
                    className={fieldClass}
                    value={form.area_id}
                    onChange={(e) => set("area_id", e.target.value)}
                  >
                    <option value="">Sin área asignada</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Estado</label>
                  <select
                    className={fieldClass}
                    value={form.status}
                    onChange={(e) => set("status", e.target.value as TeacherForm["status"])}
                  >
                    {(Object.entries(STATUS_LABELS) as [TeacherForm["status"], string][]).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Bio */}
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Biografía</label>
                  <textarea
                    className={`${fieldClass} resize-none`}
                    rows={3}
                    placeholder="Breve descripción del docente…"
                    value={form.bio}
                    onChange={(e) => set("bio", e.target.value)}
                  />
                </div>

                {/* Documents placeholder */}
                {isEdit && (
                  <div className="sm:col-span-2 space-y-3 pt-2 border-t border-[var(--color-outline-variant)]">
                    <p className="text-xs font-medium text-[var(--color-on-surface-variant)]">Documentos</p>
                    {["Título profesional", "Cédula profesional", "Contrato vigente", "CV actualizado"].map((doc) => (
                      <div key={doc} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-outline-variant)]">
                        <Icon icon="material-symbols:description-outline" className="text-[var(--color-primary)] text-xl" />
                        <span className="flex-1 text-sm text-[var(--color-on-surface)]">{doc}</span>
                        <span className="text-xs text-[var(--color-on-surface-variant)] opacity-50">Próximamente</span>
                      </div>
                    ))}
                  </div>
                )}
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
                      <span className="text-xs text-[var(--color-error)] font-medium">¿Eliminar docente?</span>
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
              <Button
                variant="outline"
                className="border-[var(--color-outline-variant)]"
                onPress={() => state.close()}
              >
                Cancelar
              </Button>
              <Button
                className="bg-[var(--color-primary)] text-white"
                isDisabled={saving}
                onPress={handleSave}
              >
                {saving ? "Guardando…" : isEdit ? "Guardar Cambios" : "Agregar Docente"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
