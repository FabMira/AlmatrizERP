"use client";

import {
  Button, Chip, Modal, ModalBackdrop, ModalContainer, ModalDialog,
  ModalHeader, ModalHeading, ModalBody, ModalFooter, ModalCloseTrigger,
  useOverlayState,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { deleteEventAction } from "@/actions/event.actions";
import type { CalendarEvent } from "@/domain/calendar/types";
import { getEventColor, formatDateLabel } from "@/domain/calendar/helpers";

type OverlayState = ReturnType<typeof useOverlayState>;

interface Props {
  state: OverlayState;
  event: CalendarEvent | null;
  onDeleted: () => void;
}

export default function EventDetailModal({ state, event, onDeleted }: Props) {
  async function handleDelete() {
    if (!event) return;
    await deleteEventAction(event.id);
    state.close();
    onDeleted();
  }

  return (
    <Modal state={state}>
      <ModalBackdrop>
        <ModalContainer size="md">
          <ModalDialog>
            {event && (
              <>
                <ModalHeader>
                  <ModalHeading>{event.title}</ModalHeading>
                  <ModalCloseTrigger />
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-3">
                    {event.areas && (
                      <Chip
                        size="sm"
                        style={{
                          backgroundColor: getEventColor(event) + "20",
                          color: getEventColor(event),
                        }}
                      >
                        {event.areas.name}
                      </Chip>
                    )}
                    <div className="flex items-center gap-3 text-[var(--color-on-surface-variant)] text-sm">
                      <Icon icon="material-symbols:schedule-outline" className="text-lg flex-shrink-0" />
                      <span>{formatDateLabel(event.start_at, event.end_at)}</span>
                    </div>
                    {event.description && (
                      <div className="flex items-start gap-3 text-[var(--color-on-surface-variant)] text-sm">
                        <Icon icon="material-symbols:notes-outline" className="text-lg flex-shrink-0 mt-0.5" />
                        <p className="leading-relaxed">{event.description}</p>
                      </div>
                    )}
                    {event.meeting_link && (
                      <div className="flex items-center gap-3 text-[var(--color-on-surface-variant)] text-sm">
                        <Icon icon="material-symbols:video-call-outline" className="text-lg flex-shrink-0" />
                        <a
                          href={event.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--color-primary)] underline truncate"
                        >
                          Unirse a la reunión
                        </a>
                      </div>
                    )}
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button
                    variant="outline"
                    className="text-red-500 border-red-200 hover:bg-red-50"
                    onPress={handleDelete}
                  >
                    <Icon icon="material-symbols:delete-outline" className="text-lg" />
                    Eliminar
                  </Button>
                  <Button variant="outline" onPress={state.close}>
                    Cerrar
                  </Button>
                  {event.meeting_link && (
                    <Button
                      className="bg-[var(--color-primary)] text-white"
                      onPress={() => window.open(event.meeting_link!, "_blank")}
                    >
                      <Icon icon="material-symbols:video-call-outline" className="text-lg" />
                      Unirse
                    </Button>
                  )}
                </ModalFooter>
              </>
            )}
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}
