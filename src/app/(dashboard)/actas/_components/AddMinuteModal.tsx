"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button, Modal, ModalBackdrop, ModalContainer, ModalDialog,
  ModalHeader, ModalHeading, ModalBody, ModalFooter, ModalCloseTrigger,
  useOverlayState,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { createMinuteAction, updateMinuteAction } from "@/actions/minute.actions";
import type { MeetingMinute, NewMinuteForm } from "@/domain/minutes/types";
import { EMPTY_MINUTE_FORM } from "@/domain/minutes/types";
import { useProfiles } from "@/hooks/use-profiles";

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
  const { nonAdminProfiles } = useProfiles();

  const [form, setForm] = useState<NewMinuteForm>({ ...EMPTY_MINUTE_FORM });
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (minute) {
      setForm({
        title: minute.title,
        content: minute.content ?? "",
        meeting_date: minute.meeting_date,
        area_id: minute.area_id ?? "",
        attendees: minute.attendees.join(", "),
      });
      setSelectedAttendees(minute.attendees);
      setFormError(null);
    }
  }, [minute]);

  useEffect(() => {
    if (!resetKey) return;
    setForm({ ...EMPTY_MINUTE_FORM });
    setSelectedAttendees([]);
    setAttendeeSearch("");
    setFormError(null);
  }, [resetKey]);

  function toggleAttendee(name: string) {
    setSelectedAttendees((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  function removeAttendee(name: string) {
    setSelectedAttendees((prev) => prev.filter((n) => n !== name));
  }

  const filteredProfiles = nonAdminProfiles.filter((p) => {
    const displayName = p.full_name ?? "";
    return displayName.toLowerCase().includes(attendeeSearch.toLowerCase());
  });

  async function handleSave() {
    if (!form.title.trim()) { setFormError("El título es obligatorio."); return; }
    setSaving(true);
    setFormError(null);

    const formWithAttendees: NewMinuteForm = {
      ...form,
      attendees: selectedAttendees.join(", "),
    };

    const result = isEditing && minute
      ? await updateMinuteAction(minute.id, formWithAttendees)
      : await createMinuteAction(formWithAttendees);

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

                {/* Attendees multi-select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">
                    Asistentes
                    {selectedAttendees.length > 0 && (
                      <span className="ml-1.5 text-[var(--color-primary)]">
                        ({selectedAttendees.length} seleccionado{selectedAttendees.length !== 1 ? "s" : ""})
                      </span>
                    )}
                  </label>

                  {/* Selected chips */}
                  {selectedAttendees.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedAttendees.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => removeAttendee(name)}
                            className="ml-0.5 hover:opacity-70 transition-opacity"
                            aria-label={`Quitar ${name}`}
                          >
                            <Icon icon="material-symbols:close" className="text-xs" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Dropdown trigger */}
                  <div ref={dropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setDropdownOpen((o) => !o)}
                      className="w-full flex items-center justify-between rounded-lg border border-[var(--color-outline-variant)] bg-transparent px-3 py-2 text-sm text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    >
                      <span>
                        {selectedAttendees.length === 0
                          ? "Seleccionar asistentes…"
                          : `${selectedAttendees.length} persona${selectedAttendees.length !== 1 ? "s" : ""} seleccionada${selectedAttendees.length !== 1 ? "s" : ""}`}
                      </span>
                      <Icon
                        icon="material-symbols:expand-more"
                        className="text-base transition-transform duration-150 flex-shrink-0"
                        style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] shadow-lg overflow-hidden">
                        {/* Search inside dropdown */}
                        <div className="p-2 border-b border-[var(--color-outline-variant)]">
                          <div className="relative">
                            <Icon
                              icon="material-symbols:search-outline"
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] text-base pointer-events-none"
                            />
                            <input
                              autoFocus
                              type="text"
                              placeholder="Buscar persona…"
                              value={attendeeSearch}
                              onChange={(e) => setAttendeeSearch(e.target.value)}
                              className="w-full rounded-lg border border-[var(--color-outline-variant)] bg-transparent pl-8 pr-3 py-1.5 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                            />
                          </div>
                        </div>

                        {/* List */}
                        <ul className="max-h-48 overflow-y-auto py-1" role="listbox" aria-multiselectable="true">
                          {filteredProfiles.length === 0 ? (
                            <li className="px-3 py-2 text-sm text-[var(--color-on-surface-variant)] text-center">
                              Sin resultados
                            </li>
                          ) : (
                            filteredProfiles.map((profile) => {
                              const name = profile.full_name ?? profile.id.slice(0, 8) + "…";
                              const checked = selectedAttendees.includes(name);
                              return (
                                <li
                                  key={profile.id}
                                  role="option"
                                  aria-selected={checked}
                                >
                                  <button
                                    type="button"
                                    onClick={() => toggleAttendee(name)}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-[var(--color-surface-container-high)] transition-colors"
                                  >
                                    {/* Checkbox */}
                                    <span
                                      className="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors"
                                      style={
                                        checked
                                          ? { backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary)" }
                                          : { borderColor: "var(--color-outline-variant)" }
                                      }
                                    >
                                      {checked && (
                                        <Icon icon="material-symbols:check" className="text-white text-xs" />
                                      )}
                                    </span>
                                    {/* Avatar initials */}
                                    <span
                                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                      style={{ backgroundColor: "var(--color-secondary)" }}
                                    >
                                      {name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                                    </span>
                                    <span className="text-[var(--color-on-surface)] flex-1 truncate">{name}</span>
                                    {profile.role && (
                                      <span className="text-[10px] text-[var(--color-on-surface-variant)] flex-shrink-0 capitalize">
                                        {profile.role}
                                      </span>
                                    )}
                                  </button>
                                </li>
                              );
                            })
                          )}
                        </ul>

                        {/* Footer actions */}
                        {filteredProfiles.length > 0 && (
                          <div className="border-t border-[var(--color-outline-variant)] px-3 py-1.5 flex justify-between">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedAttendees(
                                  filteredProfiles.map((p) => p.full_name ?? p.id.slice(0, 8) + "…")
                                )
                              }
                              className="text-xs text-[var(--color-primary)] hover:underline"
                            >
                              Seleccionar todos
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedAttendees([])}
                              className="text-xs text-[var(--color-on-surface-variant)] hover:underline"
                            >
                              Limpiar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
