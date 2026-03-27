"use client";

import { useEffect, useState } from "react";
import {
  Button, Modal, ModalBackdrop, ModalContainer, ModalDialog,
  ModalHeader, ModalHeading, ModalBody, ModalFooter, ModalCloseTrigger,
  useOverlayState,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { createLinkAction } from "@/actions/link.actions";
import { EMPTY_LINK_FORM, type NewLinkForm } from "@/domain/links/types";

type OverlayState = ReturnType<typeof useOverlayState>;

const categories = ["Administración", "Área Académica", "Servicios", "Gestión y Marketing"];

const ICON_OPTIONS = [
  { icon: "material-symbols:link-outline",          label: "Link" },
  { icon: "logos:zoom-icon",                         label: "Zoom" },
  { icon: "logos:google-meet",                       label: "Meet" },
  { icon: "logos:google-drive",                      label: "Drive" },
  { icon: "material-symbols:school",                 label: "Classroom" },
  { icon: "material-symbols:description",            label: "Docs" },
  { icon: "material-symbols:table-chart",            label: "Sheets" },
  { icon: "material-symbols:assignment",             label: "Forms" },
  { icon: "material-symbols:slideshow",              label: "Slides" },
  { icon: "logos:youtube-icon",                      label: "YouTube" },
  { icon: "logos:whatsapp-icon",                     label: "WhatsApp" },
  { icon: "logos:instagram",                         label: "Instagram" },
  { icon: "material-symbols:calendar-month-outline", label: "Calendario" },
  { icon: "material-symbols:folder-outline",         label: "Carpeta" },
  { icon: "material-symbols:groups",                 label: "Reunión" },
  { icon: "material-symbols:menu-book",              label: "Manual" },
  { icon: "material-symbols:download",               label: "Descarga" },
  { icon: "material-symbols:videocam",               label: "Video" },
];

interface Props {
  state: OverlayState;
  resetKey: number;
  onCreated: () => void;
}

const fieldClass =
  "w-full rounded-lg border border-[var(--color-outline-variant)] bg-transparent px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-[var(--color-primary)] transition-colors";

export default function AddLinkModal({ state, resetKey, onCreated }: Props) {
  const [form, setForm] = useState<NewLinkForm>(EMPTY_LINK_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!resetKey) return;
    setForm(EMPTY_LINK_FORM);
    setFormError(null);
  }, [resetKey]);

  async function handleSave() {
    if (!form.title.trim()) { setFormError("El título es obligatorio."); return; }
    if (!form.url.trim()) { setFormError("La URL es obligatoria."); return; }
    setSaving(true);
    setFormError(null);
    const { error } = await createLinkAction(form);
    setSaving(false);
    if (error) { setFormError(error); return; }
    state.close();
    onCreated();
  }

  return (
    <Modal state={state}>
      <ModalBackdrop>
        <ModalContainer size="md">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>Agregar Link</ModalHeading>
              <ModalCloseTrigger />
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Título *</label>
                  <input
                    className={fieldClass}
                    placeholder="Ej: Zoom de clases"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">URL *</label>
                  <div className="relative">
                    <Icon
                      icon="material-symbols:link-outline"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[var(--color-on-surface-variant)] pointer-events-none"
                    />
                    <input
                      className={`${fieldClass} pl-9`}
                      placeholder="https://..."
                      type="url"
                      value={form.url}
                      onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Descripción</label>
                  <textarea
                    className={`${fieldClass} resize-none`}
                    placeholder="Breve descripción del link (opcional)"
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Categoría</label>
                  <select
                    className={fieldClass}
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Ícono</label>
                  <div className="grid grid-cols-9 gap-1.5">
                    {ICON_OPTIONS.map((opt) => (
                      <button
                        key={opt.icon}
                        type="button"
                        title={opt.label}
                        onClick={() => setForm((f) => ({ ...f, icon: opt.icon }))}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                          form.icon === opt.icon
                            ? "bg-[var(--color-primary)] text-white shadow-sm scale-110"
                            : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
                        }`}
                      >
                        <Icon icon={opt.icon} className="text-lg" />
                      </button>
                    ))}
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
                {saving ? "Guardando..." : "Guardar Link"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
