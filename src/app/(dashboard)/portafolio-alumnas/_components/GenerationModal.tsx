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
import { createClient } from "@/lib/supabase/client";

type OverlayState = ReturnType<typeof useOverlayState>;

interface Props {
  state: OverlayState;
  onCreated: (name: string) => void;
}

const fieldClass =
  "w-full rounded-lg border border-[var(--color-outline-variant)] bg-transparent px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-[var(--color-primary)] transition-colors";

const supabase = createClient();

export default function GenerationModal({ state, onCreated }: Props) {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state.isOpen) {
      setName("");
      setLabel("");
      setError(null);
    }
  }, [state.isOpen]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) { setError("El nombre de la generación es obligatorio."); return; }
    setSaving(true);
    setError(null);
    const { error: dbErr } = await supabase.from("generations").insert({
      name: trimmed,
      label: label.trim() || null,
    });
    setSaving(false);
    if (dbErr) {
      setError(dbErr.code === "23505" ? "Ya existe una generación con ese nombre." : "Error al guardar. Intenta de nuevo.");
      return;
    }
    state.close();
    onCreated(trimmed);
  }

  return (
    <Modal state={state}>
      <ModalBackdrop>
        <ModalContainer size="sm">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>Nueva generación</ModalHeading>
              <ModalCloseTrigger />
            </ModalHeader>

            <ModalBody>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Nombre * <span className="text-[var(--color-outline)]">(ej. 2026)</span></label>
                  <input
                    className={fieldClass}
                    placeholder="2026"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Etiqueta <span className="text-[var(--color-outline)]">(opcional)</span></label>
                  <input
                    className={fieldClass}
                    placeholder="Generación 2026–2027"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </div>
              </div>
              {error && <p className="mt-3 text-xs text-[var(--color-error)] font-medium">{error}</p>}
            </ModalBody>

            <ModalFooter>
              <Button variant="outline" className="border-[var(--color-outline-variant)]" onPress={() => state.close()}>
                Cancelar
              </Button>
              <Button className="bg-[var(--color-primary)] text-white" isDisabled={saving} onPress={handleSave}>
                {saving ? "Guardando…" : "Crear generación"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
