"use client";

import { useEffect, useState } from "react";
import {
  Button, Modal, ModalBackdrop, ModalContainer, ModalDialog,
  ModalHeader, ModalHeading, ModalBody, ModalFooter, ModalCloseTrigger,
  useOverlayState,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { createMinuteAction, updateMinuteAction } from "@/actions/minute.actions";
import type { MeetingMinute, NewMinuteForm } from "@/domain/minutes/types";
import { EMPTY_MINUTE_FORM } from "@/domain/minutes/types";

type OverlayState = ReturnType<typeof useOverlayState>;

interface Area {
  id: string;
  name: string;
}

interface Props {
  state: OverlayState;
  areas: Area[];
  resetKey: number;
  onSaved: () => void;
  minute?: MeetingMinute;
}

const fieldClass =
  "w-full rounded-lg border border-[var(--color-outline-variant)] bg-transparent px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-[var(--color-primary)] transition-colors";

export default function AddMinuteModal({ state, areas, resetKey, onSaved, minute }: Props) {
  const isEditing = !!minute;
  const [form, setForm] = useState<NewMinuteForm>({ ...EMPTY_MINUTE_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (minute) {
      setForm({
        title: minute.title,
        content: minute.content ?? "",
        meeting_date: minute.meeting_date,
        area_id: minute.area_id ?? "",
        attendees: minute.attendees.join(", "),
      });
      setFormError(null);
    }
  }, [minute]);

  useEffect(() => {
    if (!resetKey) return;
    setForm({ ...EMPTY_MINUTE_FORM });
    setFormError(null);
  }, [resetKey]);

  async function handleSave() {
    if (!form.title.trim()) { setFormError("El título es obligatorio."); return; }
    setSaving(true);
    setFormError(null);

    const result = isEditing && minute
      ? await updateMinuteAction(minute.id, form)
      : await createMinuteAction(form);

    setSaving(false);
    if (result.error) { setFormError(result.error); return; }
    state.close();
    onSaved();
  }

  return (
    <Modal state={state}>
      <ModalBackdrop>
        <ModalContainer size="lg">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{isEditing ? "Editar Acta" : "Nueva Acta de Reunión"}</ModalHeading>
              <ModalCloseTrigger />
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                {/* Title */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Título *</label>
                  <input
                    className={fieldClass}
                    placeholder="Ej. Reunión de Consejo Técnico"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>

                {/* Date + Area */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Fecha de reunión *</label>
                    <input
                      className={fieldClass}
                      type="date"
                      value={form.meeting_date}
                      onChange={(e) => setForm((f) => ({ ...f, meeting_date: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Área</label>
                    <select
                      className={fieldClass}
                      value={form.area_id}
                      onChange={(e) => setForm((f) => ({ ...f, area_id: e.target.value }))}
                    >
                      <option value="">Sin área</option>
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Attendees */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Asistentes (separados por coma)</label>
                  <input
                    className={fieldClass}
                    placeholder="Ej. Ana López, María García, Carlos Ruiz"
                    value={form.attendees}
                    onChange={(e) => setForm((f) => ({ ...f, attendees: e.target.value }))}
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Contenido del acta</label>
                  <textarea
                    className={`${fieldClass} resize-none`}
                    placeholder="Acuerdos, temas tratados, resolutivos…"
                    rows={8}
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  />
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
                {saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Guardar Acta"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
