"use client";

import { useEffect, useState } from "react";
import {
  Button, Modal, ModalBackdrop, ModalContainer, ModalDialog,
  ModalHeader, ModalHeading, ModalBody, ModalFooter, ModalCloseTrigger,
  useOverlayState,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { createEventAction } from "@/actions/event.actions";
import type { NewEventForm } from "@/domain/calendar/types";
import type { Area } from "@/domain/shared/types";
import { EMPTY_EVENT_FORM } from "@/domain/calendar/types";

type OverlayState = ReturnType<typeof useOverlayState>;

interface Props {
  state: OverlayState;
  areas: Area[];
  resetKey: number;
  onCreated: () => void;
}

function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function localNow(): string {
  return toLocalDateTimeString(new Date());
}

function addOneHour(dateTimeLocal: string): string {
  const d = new Date(dateTimeLocal);
  d.setHours(d.getHours() + 1);
  return toLocalDateTimeString(d);
}

const fieldClass =
  "w-full rounded-lg border border-[var(--color-outline-variant)] bg-transparent px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-[var(--color-primary)] transition-colors";

export default function AddEventModal({ state, areas, resetKey, onCreated }: Props) {
  const [form, setForm] = useState<NewEventForm>(EMPTY_EVENT_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!resetKey) return;
    const now = localNow();
    setForm({ ...EMPTY_EVENT_FORM, start_at: now, end_at: addOneHour(now), area_id: areas[0]?.id ?? "" });
    setFormError(null);
  }, [resetKey, areas]);

  async function handleSave() {
    if (!form.title.trim()) { setFormError("El título es obligatorio."); return; }
    if (!form.start_at || !form.end_at) { setFormError("Las fechas son obligatorias."); return; }
    if (new Date(form.end_at) <= new Date(form.start_at)) {
      setFormError("La fecha de fin debe ser posterior al inicio."); return;
    }
    setSaving(true);
    setFormError(null);
    const { error } = await createEventAction(form);
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
              <ModalHeading>Agregar Evento</ModalHeading>
              <ModalCloseTrigger />
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Título *</label>
                  <input
                    className={fieldClass}
                    placeholder="Nombre del evento"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Descripción</label>
                  <textarea
                    className={`${fieldClass} resize-none`}
                    placeholder="Detalles del evento (opcional)"
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Inicio *</label>
                    <input
                      className={fieldClass}
                      type="datetime-local"
                      value={form.start_at}
                      onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value, end_at: addOneHour(e.target.value) }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Fin *</label>
                    <input
                      className={fieldClass}
                      type="datetime-local"
                      value={form.end_at}
                      onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Link de reunión</label>
                  <div className="relative">
                    <Icon
                      icon="material-symbols:video-call-outline"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[var(--color-on-surface-variant)] pointer-events-none"
                    />
                    <input
                      className={`${fieldClass} pl-9`}
                      placeholder="https://meet.google.com/..."
                      value={form.meeting_link}
                      onChange={(e) => setForm((f) => ({ ...f, meeting_link: e.target.value }))}
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
                {saving ? "Guardando..." : "Guardar Evento"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
