"use client";

import { useState } from "react";
import { Button, Chip, Avatar, AvatarFallback } from "@heroui/react";
import { Icon } from "@iconify/react";

type Status = "Activa" | "Egresada" | "Baja";

interface Student {
  id: number;
  name: string;
  initials: string;
  curp: string;
  email: string;
  phone: string;
  enrolled: string;
  status: Status;
  gen: string;
}

const statusChipProps: Record<Status, { color: string; bg: string }> = {
  Activa: { color: "var(--color-primary)", bg: "var(--color-primary-fixed)" },
  Egresada: { color: "var(--color-on-surface-variant)", bg: "var(--color-surface-container)" },
  Baja: { color: "var(--color-error)", bg: "var(--color-error-container)" },
};

const generations = ["2022", "2023", "2024", "2025"];
const statusFilters: (Status | "Todas")[] = ["Todas", "Activa", "Egresada", "Baja"];
const TABS = ["Perfil General", "Asistencia", "Historial"];

export default function PortafolioAlumnasPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [activeGen, setActiveGen] = useState("2025");
  const [activeStatus, setActiveStatus] = useState<Status | "Todas">("Todas");
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [drawerTab, setDrawerTab] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 5;

  const filtered = students.filter((s) => {
    const matchGen = s.gen === activeGen;
    const matchStatus = activeStatus === "Todas" || s.status === activeStatus;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    return matchGen && matchStatus && matchSearch;
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  return (
    <div className={`p-4 md:p-6 transition-all ${selectedStudent ? "lg:pr-[500px]" : ""}`}>
      {/* Generation tabs */}
      <div className="flex border-b border-[var(--color-outline-variant)] mb-4">
        {generations.map((g) => (
          <button
            key={g}
            onClick={() => { setActiveGen(g); setPage(1); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeGen === g
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
            }`}
          >
            Gen {g}
          </button>
        ))}
      </div>

      {/* Search + status filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative max-w-xs">
          <Icon icon="material-symbols:search-outline" className="absolute left-2.5 top-2 text-[var(--color-on-surface-variant)] text-lg pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar alumna..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-9 pl-9 pr-3 w-full rounded-xl border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => { setActiveStatus(s); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                activeStatus === s
                  ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                  : "border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <Button
          className="sm:ml-auto bg-[var(--color-primary)] text-white"
          size="sm"
        >
          <Icon icon="material-symbols:person-add-outline" className="text-lg" />
          Agregar Alumna
        </Button>
      </div>

      {/* Native table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--color-outline-variant)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-surface-container-low)]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)]">ALUMNA</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)]">CURP</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)] hidden md:table-cell">CONTACTO</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)] hidden sm:table-cell">INSCRIPCIÓN</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)]">ESTADO</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)]">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-[var(--color-on-surface-variant)] text-sm">
                  No se encontraron alumnas
                </td>
              </tr>
            ) : (
              paginated.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors cursor-pointer"
                  onClick={() => setSelectedStudent(s)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        size="sm"
                        className="bg-[var(--color-secondary-container)]"
                      >
                        <AvatarFallback className="text-[var(--color-on-secondary-container)] text-xs">{s.initials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-[var(--color-on-surface)]">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-[var(--color-on-surface-variant)] font-mono">{s.curp}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-[var(--color-on-surface-variant)]">{s.email}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-[var(--color-on-surface-variant)]">{s.enrolled}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Chip
                      size="sm"
                      style={{ backgroundColor: statusChipProps[s.status].bg, color: statusChipProps[s.status].color }}
                    >
                      {s.status}
                    </Chip>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button isIconOnly variant="ghost" size="sm" className="text-[var(--color-on-surface-variant)]">
                        <Icon icon="material-symbols:visibility-outline" className="text-base" />
                      </Button>
                      <Button isIconOnly variant="ghost" size="sm" className="text-[var(--color-on-surface-variant)]">
                        <Icon icon="material-symbols:edit-outline" className="text-base" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Simple pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-[var(--color-on-surface-variant)]">
          {filtered.length === 0 ? "0" : `${(page - 1) * perPage + 1}–${Math.min(page * perPage, filtered.length)}`} de {filtered.length}
        </p>
        <div className="flex items-center gap-1">
          <Button
            isIconOnly
            variant="outline"
            size="sm"
            isDisabled={page === 1}
            onPress={() => setPage((p) => p - 1)}
            className="border-[var(--color-outline-variant)]"
          >
            <Icon icon="material-symbols:chevron-left" className="text-lg" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]"
              }`}
            >
              {p}
            </button>
          ))}
          <Button
            isIconOnly
            variant="outline"
            size="sm"
            isDisabled={page === totalPages}
            onPress={() => setPage((p) => p + 1)}
            className="border-[var(--color-outline-variant)]"
          >
            <Icon icon="material-symbols:chevron-right" className="text-lg" />
          </Button>
        </div>
      </div>

      {/* Right drawer */}
      {selectedStudent && (
        <div className="fixed inset-y-0 right-0 z-50 w-[480px] max-w-full bg-[var(--color-surface-container-lowest)] border-l border-[var(--color-outline-variant)] flex flex-col shadow-2xl">
          <div className="flex items-center gap-4 px-6 py-5 border-b border-[var(--color-outline-variant)]">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-container)] flex items-center justify-center">
              <Icon icon="material-symbols:school-outline" className="text-2xl text-[var(--color-primary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[var(--color-on-surface)]">{selectedStudent.name}</p>
              <p className="text-sm text-[var(--color-on-surface-variant)]">Gen {selectedStudent.gen}</p>
            </div>
            <Button isIconOnly variant="ghost" size="sm" onPress={() => setSelectedStudent(null)} className="text-[var(--color-on-surface-variant)]">
              <Icon icon="material-symbols:close" className="text-xl" />
            </Button>
          </div>

          {/* Drawer tabs */}
          <div className="flex border-b border-[var(--color-outline-variant)]">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setDrawerTab(i)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  drawerTab === i
                    ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                    : "border-transparent text-[var(--color-on-surface-variant)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {drawerTab === 0 && (
              <div className="space-y-4">
                {[
                  { label: "Nombre completo", value: selectedStudent.name },
                  { label: "CURP", value: selectedStudent.curp },
                  { label: "Correo electrónico", value: selectedStudent.email },
                  { label: "Teléfono", value: selectedStudent.phone },
                  { label: "Fecha de inscripción", value: selectedStudent.enrolled },
                ].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[var(--color-on-surface-variant)]">{f.label}</label>
                    <input
                      type="text"
                      defaultValue={f.value}
                      className="h-9 px-3 rounded-xl border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                ))}
              </div>
            )}
            {drawerTab === 1 && (
              <p className="py-4 text-sm text-[var(--color-on-surface-variant)]">Historial de asistencia próximamente.</p>
            )}
            {drawerTab === 2 && (
              <p className="py-4 text-sm text-[var(--color-on-surface-variant)]">Historial académico próximamente.</p>
            )}

            {drawerTab === 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-[var(--color-on-surface)] mb-3">Documentos</p>
                <div className="space-y-2">
                  {["Acta de nacimiento", "CURP", "Comprobante de domicilio"].map((doc) => (
                    <div key={doc} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]">
                      <Icon icon="material-symbols:description-outline" className="text-[var(--color-primary)] text-xl" />
                      <span className="flex-1 text-sm text-[var(--color-on-surface)]">{doc}</span>
                      <Button isIconOnly variant="ghost" size="sm" className="text-[var(--color-on-surface-variant)]">
                        <Icon icon="material-symbols:download-outline" className="text-base" />
                      </Button>
                    </div>
                  ))}
                </div>
                <button className="mt-3 flex items-center gap-2 w-full border-2 border-dashed border-[var(--color-outline-variant)] rounded-xl p-4 text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
                  <Icon icon="material-symbols:upload-file-outline" className="text-xl" />
                  <span className="text-sm">Subir documento</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-[var(--color-outline-variant)]">
            <Button variant="outline" className="flex-1 border-[var(--color-outline-variant)]" onPress={() => setSelectedStudent(null)}>
              Descartar
            </Button>
            <Button className="flex-1 bg-[var(--color-primary)] text-white">
              Guardar Cambios
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
