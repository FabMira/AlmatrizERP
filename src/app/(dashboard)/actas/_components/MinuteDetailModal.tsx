"use client";

import { useEffect, useState } from "react";
import {
  Button, Modal, ModalBackdrop, ModalContainer, ModalDialog,
  ModalHeader, ModalHeading, ModalBody, ModalFooter, ModalCloseTrigger,
  Chip, useOverlayState,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import type { MeetingMinute } from "@/domain/minutes/types";

type OverlayState = ReturnType<typeof useOverlayState>;

interface Props {
  state: OverlayState;
  minute: MeetingMinute | null;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
}

export default function MinuteDetailModal({ state, minute, onEdit, onDelete, deleting = false }: Props) {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => { setConfirming(false); }, [minute]);
  if (!minute) return null;

  const formattedDate = new Date(minute.meeting_date + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedCreated = new Date(minute.created_at).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Modal state={state}>
      <ModalBackdrop>
        <ModalContainer size="lg">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading className="pr-8 leading-snug">{minute.title}</ModalHeading>
              <ModalCloseTrigger />
            </ModalHeader>
            <ModalBody>
              <div className="space-y-5">
                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-on-surface-variant)]">
                  <div className="flex items-center gap-1.5">
                    <Icon icon="material-symbols:calendar-today-outline" className="text-base" />
                    <span className="capitalize">{formattedDate}</span>
                  </div>
                  {minute.areas && (
                    <Chip size="sm" className="h-6 text-xs">
                      {minute.areas.name}
                    </Chip>
                  )}
                  <div className="flex items-center gap-1.5 ml-auto text-xs text-[var(--color-outline)]">
                    <Icon icon="material-symbols:history" className="text-sm" />
                    <span>Registrada el {formattedCreated}</span>
                  </div>
                </div>

                {/* Attendees */}
                {minute.attendees.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-outline)] mb-2">
                      Asistentes
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {minute.attendees.map((name, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]"
                        >
                          <Icon icon="material-symbols:person-outline" className="text-xs" />
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-[var(--color-outline-variant)]" />

                {/* Content */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-outline)] mb-2">
                    Contenido del Acta
                  </p>
                  {minute.content?.trim() ? (
                    <p className="text-sm text-[var(--color-on-surface)] leading-relaxed whitespace-pre-wrap">
                      {minute.content}
                    </p>
                  ) : (
                    <p className="text-sm italic text-[var(--color-outline)]">Sin contenido registrado.</p>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              {confirming ? (
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="text-sm font-medium text-[var(--color-error)]">
                    ¿Eliminar esta acta?
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onPress={() => setConfirming(false)}
                      isDisabled={deleting}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="bg-[var(--color-error)] text-white"
                      onPress={onDelete}
                      isDisabled={deleting}
                    >
                      {deleting && (
                        <Icon icon="material-symbols:progress-activity" className="text-lg animate-spin" />
                      )}
                      {deleting ? "Eliminando..." : "Confirmar"}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onPress={() => setConfirming(true)}
                    className="border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error-container)]"
                  >
                    <Icon icon="material-symbols:delete-outline" className="text-base" />
                    Eliminar
                  </Button>
                  <Button
                    className="bg-[var(--color-primary)] text-white ml-auto"
                    onPress={onEdit}
                  >
                    <Icon icon="material-symbols:edit-outline" className="text-base" />
                    Editar
                  </Button>
                </>
              )}
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
