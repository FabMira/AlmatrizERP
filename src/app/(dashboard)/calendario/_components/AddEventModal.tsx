"use client";

import { useEffect, useState } from "react";
import {
  Button, Modal, ModalBackdrop, ModalContainer, ModalDialog,
  ModalHeader, ModalHeading, ModalBody, ModalFooter, ModalCloseTrigger,
  useOverlayState,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { createEventAction, updateEventAction } from "@/actions/event.actions";
import type { CalendarEvent, NewEventForm } from "@/domain/calendar/types";
import type { Area } from "@/domain/shared/types";
import { EMPTY_EVENT_FORM } from "@/domain/calendar/types";

type OverlayState = ReturnType<typeof useOverlayState>;

interface Props {
  state: OverlayState;
  areas: Area[];
  resetKey: number;
  event?: CalendarEvent | null;
  defaultDate?: Date | null;
  onSaved: () => void;
}

function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addMinutes(dateTimeLocal: string, minutes: number): string {
  const d = new Date(dateTimeLocal);
  d.setMinutes(d.getMinutes() + minutes);
  return toLocalDateTimeString(d);
}

const DURATION_PRESETS = [
  { label: "30 min", minutes: 30 },
  { label: "1 h", minutes: 60 },
  { label: "2 h", minutes: 120 },
  { label: "4 h", minutes: 240 },
  { label: "6 h", minutes: 360 },
  { label: "1 día", minutes: 24 * 60 },
  { label: "2 días", minutes: 2 * 24 * 60 },
];

const fieldClass =
  "w-full rounded-lg border border-[var(--color-outline-variant)] bg-transparent px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-[var(--color-primary)] transition-colors";

export default function AddEventModal({ state, areas, resetKey, event, defaultDate, onSaved }: Props) {
  const [form, setForm] = useState<NewEventForm>(EMPTY_EVENT_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = !!event;

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title,
        description: event.description ?? "",
        start_at: toLocalDateTimeString(new Date(event.start_at)),
        end_at: toLocalDateTimeString(new Date(event.end_at)),
        area_id: event.area_id ?? "",
        meeting_link: event.meeting_link ?? "",
      });
    } else {
      const base = defaultDate ? new Date(defaultDate) : new Date();
      if (defaultDate) base.setHours(9, 0, 0, 0);
      const start = toLocalDateTimeString(base);
      setForm({ ...EMPTY_EVENT_FORM, start_at: start, end_at: addMinutes(start, 60), area_id: areas[0]?.id ?? "" });
    }
    setFormError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, event]);

  function applyDurationPreset(minutes: number) {
    if (!form.start_at) return;
    setForm((f) => ({ ...f, end_at: addMinutes(f.start_at, minutes) }));
  }

  function getActiveDuration(): number | null {
    if (!form.start_at || !form.end_at) return null;
    const diff = (new Date(form.end_at).getTime() - new Date(form.start_at).getTime()) / 60000;
    return diff;
  }

  async function handleSave() {
    if (!form.title.trim()) { setFormError("El título es obligatorio."); return; }
    if (!form.start_at || !form.end_at) { setFormError("Las fechas son obligatorias."); return; }
    if (new Date(form.end_at) <= new Date(form.start_at)) {
      setFormError("La fecha de fin debe ser posterior al inicio."); return;
    }
    setSaving(true);
    setFormError(null);
    const { error } = isEditing
      ? await updateEventAction(event.id, form)
      : await createEventAction(form);
    setSaving(false);
    if (error) { setFormError(error); return; }
    state.close();
    onSaved();
  }

  const activeDuration = getActiveDuration();

  return (
    <Modal state={state}>
      <ModalBackdrop>
        <ModalContainer size="md">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>{isEditing ? "Editar Evento" : "Agregar Evento"}</ModalHeading>
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
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          start_at: e.target.value,
                          end_at: addMinutes(e.target.value, activeDuration ?? 60),
                        }))
                      }
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

                {/* Duration presets */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Duración rápida</label>
                  <div className="flex flex-wrap gap-1.5">
                    {DURATION_PRESETS.map((preset) => {
                      const isActive = activeDuration === preset.minutes;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => applyDurationPreset(preset.minutes)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                            isActive
                              ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                              : "border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
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
                {saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Guardar Evento"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
