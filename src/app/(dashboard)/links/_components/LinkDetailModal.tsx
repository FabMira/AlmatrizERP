"use client";

import { useEffect, useState } from "react";
import {
  Button, Chip, Modal, ModalBackdrop, ModalContainer, ModalDialog,
  ModalHeader, ModalHeading, ModalBody, ModalFooter, ModalCloseTrigger,
  useOverlayState,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { deleteLinkAction, togglePinLinkAction, updateLinkAction } from "@/actions/link.actions";
import type { Link, NewLinkForm } from "@/domain/links/types";

type OverlayState = ReturnType<typeof useOverlayState>;

interface Props {
  state: OverlayState;
  link: Link | null;
  onDeleted: () => void;
  onPinToggled: () => void;
  onUpdated: () => void;
}

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

const categoryColors: Record<string, string> = {
  Administración: "var(--color-primary)",
  "Área Académica": "var(--color-secondary)",
  Servicios: "var(--color-tertiary)",
  "Gestión y Marketing": "var(--color-tertiary-container)",
};

const fieldClass =
  "w-full rounded-lg border border-[var(--color-outline-variant)] bg-transparent px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-[var(--color-primary)] transition-colors";

export default function LinkDetailModal({ state, link, onDeleted, onPinToggled, onUpdated }: Props) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editForm, setEditForm] = useState<NewLinkForm>({ title: "", description: "", url: "", category: "", icon: "" });
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Reset to view mode and populate form whenever the link changes
  useEffect(() => {
    if (!link) return;
    setMode("view");
    setActionError(null);
    setEditForm({
      title: link.title,
      description: link.description,
      url: link.url,
      category: link.category,
      icon: link.icon,
    });
  }, [link]);

  async function handleSaveEdit() {
    if (!link) return;
    setSaving(true);
    setActionError(null);
    const { error } = await updateLinkAction(link.id, editForm);
    setSaving(false);
    if (error) { setActionError(error); return; }
    state.close();
    onUpdated();
  }

  async function handleTogglePin() {
    if (!link) return;
    setToggling(true);
    setActionError(null);
    const { error } = await togglePinLinkAction(link.id, !link.pinned);
    setToggling(false);
    if (error) { setActionError(error); return; }
    state.close();
    onPinToggled();
  }

  async function handleDelete() {
    if (!link) return;
    setDeleting(true);
    setActionError(null);
    const { error } = await deleteLinkAction(link.id);
    setDeleting(false);
    if (error) { setActionError(error); return; }
    state.close();
    onDeleted();
  }

  const color = link ? (categoryColors[link.category] ?? "var(--color-primary)") : "var(--color-primary)";

  return (
    <Modal state={state}>
      <ModalBackdrop>
        <ModalContainer size="md">
          <ModalDialog>
            {link && (
              <>
                <ModalHeader>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: color + "20" }}
                    >
                      <Icon
                        icon={(mode === "edit" ? editForm.icon : link.icon) || "material-symbols:link-outline"}
                        className="text-xl"
                        style={{ color }}
                      />
                    </div>
                    <ModalHeading className="truncate">
                      {mode === "edit" ? "Editar Link" : link.title}
                    </ModalHeading>
                  </div>
                  <ModalCloseTrigger />
                </ModalHeader>

                {mode === "view" ? (
                  <>
                    <ModalBody>
                      <div className="space-y-3">
                        <Chip size="sm" style={{ backgroundColor: color + "20", color }}>
                          {link.category}
                        </Chip>
                        {link.description && (
                          <div className="flex items-start gap-3 text-[var(--color-on-surface-variant)] text-sm">
                            <Icon icon="material-symbols:notes-outline" className="text-lg flex-shrink-0 mt-0.5" />
                            <p className="leading-relaxed">{link.description}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-[var(--color-on-surface-variant)] text-sm">
                          <Icon icon="material-symbols:link-outline" className="text-lg flex-shrink-0" />
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--color-primary)] underline truncate"
                          >
                            {link.url}
                          </a>
                        </div>
                        {link.pinned && (
                          <div className="flex items-center gap-3 text-[var(--color-on-surface-variant)] text-sm">
                            <Icon icon="material-symbols:push-pin" className="text-lg flex-shrink-0" />
                            <span>Fijado en la sección de destacados</span>
                          </div>
                        )}
                        {actionError && <p className="text-sm text-red-500">{actionError}</p>}
                      </div>
                    </ModalBody>
                    <ModalFooter>
                      <Button
                        variant="outline"
                        className="text-red-500 border-red-200 hover:bg-red-50"
                        onPress={handleDelete}
                        isDisabled={deleting || toggling}
                      >
                        {deleting
                          ? <Icon icon="material-symbols:progress-activity" className="text-lg animate-spin" />
                          : <Icon icon="material-symbols:delete-outline" className="text-lg" />}
                        Eliminar
                      </Button>
                      <Button
                        variant="outline"
                        onPress={handleTogglePin}
                        isDisabled={toggling || deleting}
                      >
                        {toggling
                          ? <Icon icon="material-symbols:progress-activity" className="text-lg animate-spin" />
                          : <Icon icon={link.pinned ? "material-symbols:push-pin-off-outline" : "material-symbols:push-pin-outline"} className="text-lg" />}
                        {link.pinned ? "Desfijar" : "Fijar"}
                      </Button>
                      <Button variant="outline" onPress={() => { setActionError(null); setMode("edit"); }}>
                        <Icon icon="material-symbols:edit-outline" className="text-lg" />
                        Editar
                      </Button>
                      <Button
                        className="bg-[var(--color-primary)] text-white"
                        onPress={() => window.open(link.url, "_blank", "noopener,noreferrer")}
                      >
                        <Icon icon="material-symbols:open-in-new" className="text-lg" />
                        Abrir
                      </Button>
                    </ModalFooter>
                  </>
                ) : (
                  <>
                    <ModalBody>
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Título *</label>
                          <input
                            className={fieldClass}
                            value={editForm.title}
                            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">URL *</label>
                          <div className="relative">
                            <Icon icon="material-symbols:link-outline" className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[var(--color-on-surface-variant)] pointer-events-none" />
                            <input
                              className={`${fieldClass} pl-9`}
                              type="url"
                              value={editForm.url}
                              onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Descripción</label>
                          <textarea
                            className={`${fieldClass} resize-none`}
                            rows={2}
                            value={editForm.description}
                            onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Categoría</label>
                          <select
                            className={fieldClass}
                            value={editForm.category}
                            onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
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
                                onClick={() => setEditForm((f) => ({ ...f, icon: opt.icon }))}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                                  editForm.icon === opt.icon
                                    ? "bg-[var(--color-primary)] text-white shadow-sm scale-110"
                                    : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
                                }`}
                              >
                                <Icon icon={opt.icon} className="text-lg" />
                              </button>
                            ))}
                          </div>
                        </div>
                        {actionError && <p className="text-sm text-red-500">{actionError}</p>}
                      </div>
                    </ModalBody>
                    <ModalFooter>
                      <Button variant="outline" onPress={() => { setMode("view"); setActionError(null); }} isDisabled={saving}>
                        Cancelar
                      </Button>
                      <Button
                        className="bg-[var(--color-primary)] text-white"
                        onPress={handleSaveEdit}
                        isDisabled={saving}
                      >
                        {saving && <Icon icon="material-symbols:progress-activity" className="text-lg animate-spin" />}
                        {saving ? "Guardando..." : "Guardar cambios"}
                      </Button>
                    </ModalFooter>
                  </>
                )}
              </>
            )}
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
