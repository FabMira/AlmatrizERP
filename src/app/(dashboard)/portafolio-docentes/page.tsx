"use client";

import { useState } from "react";
import { Button, Chip, Avatar, AvatarFallback, Card, CardContent, Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalHeader, ModalHeading, ModalBody, ModalFooter, ModalCloseTrigger, useOverlayState } from "@heroui/react";
import { Icon } from "@iconify/react";

import type { DocStatus, Teacher } from "@/domain/teachers/types";

const statusProps: Record<DocStatus, { color: string; bg: string }> = {
  Activo: { color: "var(--color-primary)", bg: "var(--color-primary-fixed)" },
  Licencia: { color: "var(--color-tertiary)", bg: "var(--color-tertiary-fixed)" },
  Nuevo: { color: "var(--color-secondary)", bg: "var(--color-secondary-container)" },
};

export default function PortafolioDocentesPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const modalState = useOverlayState();

  const openTeacher = (t: Teacher) => {
    setSelectedTeacher(t);
    modalState.open();
  };

  const activeCount = teachers.filter((t) => t.status === "Activo").length;
  const licenciaCount = teachers.filter((t) => t.status === "Licencia").length;
  const nuevoCount = teachers.filter((t) => t.status === "Nuevo").length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            {teachers.length} docentes registrados en el sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-[var(--color-outline-variant)]">
            <Icon icon="material-symbols:download-outline" className="text-lg" />
            Exportar
          </Button>
          <Button className="bg-[var(--color-primary)] text-white" size="sm">
            <Icon icon="material-symbols:person-add-outline" className="text-lg" />
            Nuevo Docente
          </Button>
        </div>
      </div>

      {/* Teacher card grid */}
      {teachers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--color-on-surface-variant)]">
          <Icon icon="material-symbols:person-search-outline" className="text-5xl opacity-20" />
          <p className="text-sm opacity-50">No hay docentes registrados</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.map((t) => (
          <Card key={t.id} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] hover:shadow-md transition-shadow overflow-hidden">
            <div className="h-1 w-full" style={{ backgroundColor: statusProps[t.status].color }} />
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Avatar size="lg" className="rounded-2xl bg-[var(--color-secondary-container)]">
                  <AvatarFallback className="rounded-2xl text-[var(--color-on-secondary-container)] font-bold">{t.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[var(--color-on-surface)] leading-tight">{t.name}</p>
                  <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">{t.subject}</p>
                  <Chip size="sm" className="mt-2 h-5" style={{ backgroundColor: statusProps[t.status].bg, color: statusProps[t.status].color }}>
                    {t.status}
                  </Chip>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)]">
                  <Icon icon="material-symbols:mail-outline" className="text-sm" />
                  <span className="truncate">{t.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)]">
                  <Icon icon="material-symbols:phone-outline" className="text-sm" />
                  <span>{t.phone}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="flex-1 text-[var(--color-primary)] bg-[var(--color-primary-fixed)]" onPress={() => openTeacher(t)}>
                  Ver Perfil
                </Button>
                <Button size="sm" variant="outline" className="flex-1 border-[var(--color-outline-variant)]" onPress={() => openTeacher(t)}>
                  Documentos
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
      <div className="rounded-2xl bg-[var(--color-inverse-surface)] px-6 py-4 flex flex-wrap gap-6">
        {[
          { label: "Activos", value: activeCount, color: "var(--color-inverse-primary)" },
          { label: "En Licencia", value: licenciaCount, color: "var(--color-tertiary-fixed-dim)" },
          { label: "Nuevos este ciclo", value: nuevoCount, color: "var(--color-secondary-fixed-dim)" },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-3">
            <span className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</span>
            <span className="text-sm text-[var(--color-inverse-on-surface)] opacity-80">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Detail modal — HeroUI v3 compound */}
      <Modal state={modalState}>
        <ModalBackdrop>
          <ModalContainer size="cover">
          <ModalDialog>
            <ModalHeader>
              <ModalHeading>
                {selectedTeacher ? `Perfil Docente — ${selectedTeacher.name}` : "Perfil Docente"}
              </ModalHeading>
              <ModalCloseTrigger />
            </ModalHeader>
            <ModalBody>
              {selectedTeacher && (
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left: form */}
                  <div className="flex-[3] space-y-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Nombre completo</label>
                      <input type="text" defaultValue={selectedTeacher.name} className="h-9 px-3 rounded-xl border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                    </div>
                    <select
                      className="w-full h-12 px-3 rounded-xl border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      defaultValue={selectedTeacher.area}
                    >
                      <option value="Área Académica">Área Académica</option>
                      <option value="Administración">Administración</option>
                    </select>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Correo electrónico</label>
                      <input type="email" defaultValue={selectedTeacher.email} className="h-9 px-3 rounded-xl border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">Teléfono</label>
                      <input type="tel" defaultValue={selectedTeacher.phone} className="h-9 px-3 rounded-xl border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-[var(--color-on-surface-variant)]">Biografía</label>
                      <textarea
                        defaultValue={selectedTeacher.bio}
                        rows={4}
                        className="w-full px-3 py-2 rounded-xl border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                      />
                    </div>
                  </div>
                  {/* Right: documents */}
                  <div className="flex-[2] space-y-4">
                    <p className="font-semibold text-sm text-[var(--color-on-surface)]">Documentos</p>
                    {["Título profesional", "Cédula profesional", "Contrato vigente", "CV actualizado"].map((doc) => (
                      <div key={doc} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-outline-variant)]">
                        <Icon icon="material-symbols:description-outline" className="text-[var(--color-primary)] text-xl" />
                        <span className="flex-1 text-sm text-[var(--color-on-surface)]">{doc}</span>
                        <Button isIconOnly size="sm" variant="ghost" className="text-[var(--color-on-surface-variant)]">
                          <Icon icon="material-symbols:download-outline" className="text-base" />
                        </Button>
                      </div>
                    ))}
                    <button className="flex items-center gap-2 w-full border-2 border-dashed border-[var(--color-outline-variant)] rounded-xl p-4 text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
                      <Icon icon="material-symbols:upload-file-outline" className="text-xl" />
                      <span className="text-sm">Subir documento</span>
                    </button>
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" onPress={modalState.close}>Cancelar</Button>
              <Button className="bg-[var(--color-primary)] text-white">Guardar Cambios</Button>
            </ModalFooter>
          </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>
    </div>
  );
}
