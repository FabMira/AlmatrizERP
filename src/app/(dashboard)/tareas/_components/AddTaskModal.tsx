"use client";

import { useEffect, useState } from "react";
import {
  Button, Modal, ModalBackdrop, ModalContainer, ModalDialog,
  ModalHeader, ModalHeading, ModalBody, ModalFooter, ModalCloseTrigger,
  useOverlayState,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/lib/supabase/client";
import type { NewTaskForm, TaskStatus, TaskPriority } from "../_types";
import { EMPTY_TASK_FORM, COLUMNS } from "../_types";

type OverlayState = ReturnType<typeof useOverlayState>;

interface Area {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  full_name: string | null;
}

interface Props {
  state: OverlayState;
  areas: Area[];
  defaultStatus: TaskStatus;
  resetKey: number;
  onCreated: () => void;
}

const fieldClass =
  "w-full rounded-lg border border-[var(--color-outline-variant)] bg-transparent px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-[var(--color-primary)] transition-colors";

const supabase = createClient();

export default function AddTaskModal({
  state, areas, defaultStatus, resetKey, onCreated,
}: Props) {
  const [form, setForm] = useState<NewTaskForm>({ ...EMPTY_TASK_FORM, status: defaultStatus });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name")
      .then(({ data }) => { if (data) setProfiles(data as Profile[]); });
  }, []);

  useEffect(() => {
    if (!resetKey) return;
    setForm({ ...EMPTY_TASK_FORM, status: defaultStatus, area_id: areas[0]?.id ?? "" });
    setFormError(null);
  }, [resetKey, defaultStatus, areas]);

  async function handleSave() {
    if (!form.title.trim()) { setFormError("El título es obligatorio."); return; }
    setSaving(true);
    setFormError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("tasks").insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      status: form.status,
      area_id: form.area_id || null,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date || null,
      created_by: user?.id ?? null,
    });
    setSaving(false);
    if (error) { setFormError("Error al guardar. Intenta de nuevo."); return; }
    state.close();
    onCreated();
  }

  return (
    <Modal state={state}>
      <ModalBackdrop>
        <ModalContainer size="md">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>Nueva Tarea</ModalHeading>
              <ModalCloseTrigger />
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Título *</label>
                  <input
                    className={fieldClass}
                    placeholder="Nombre de la tarea"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Descripción</label>
                  <textarea
                    className={`${fieldClass} resize-none`}
                    placeholder="Detalles de la tarea (opcional)"
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Prioridad</label>
                    <select
                      className={fieldClass}
                      value={form.priority}
                      onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                    >
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Estado</label>
                    <select
                      className={fieldClass}
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
                    >
                      {COLUMNS.map((c) => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {areas.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Área</label>
                    <select
                      className={fieldClass}
                      value={form.area_id}
                      onChange={(e) => setForm((f) => ({ ...f, area_id: e.target.value }))}
                    >
                      <option value="">Sin área</option>
                      {areas.map((area) => (
                        <option key={area.id} value={area.id}>{area.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Asignada a</label>
                    <select
                      className={fieldClass}
                      value={form.assigned_to}
                      onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
                    >
                      <option value="">Sin asignar</option>
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name ?? p.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Fecha límite</label>
                    <input
                      className={fieldClass}
                      type="date"
                      value={form.due_date}
                      onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                    />
                  </div>
                </div>
                {formError && (
                  <p className="text-sm text-red-500">{formError}</p>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" onPress={state.close} isDisabled={saving}>
                Cancelar
              </Button>
              <Button
                className="bg-[var(--color-primary)] text-white"
                onPress={handleSave}
                isDisabled={saving}
              >
                {saving && (
                  <Icon icon="material-symbols:progress-activity" className="text-lg animate-spin" />
                )}
                {saving ? "Guardando..." : "Guardar Tarea"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
