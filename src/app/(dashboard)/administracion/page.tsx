"use client";

import { useState } from "react";
import { Button, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Docente {
  id: number;
  nombre: string;
  correo: string;
  materia: string;
  estado: "Activo" | "Inactivo" | "Licencia";
}

interface Alumna {
  id: number;
  nombre: string;
  correo: string;
  generacion: string;
  estado: "Activa" | "Inactiva" | "Baja";
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const estadoColors: Record<string, string> = {
  Activo: "success",
  Activa: "success",
  Inactivo: "warning",
  Inactiva: "warning",
  Licencia: "default",
  Baja: "danger",
};

const PAGE_SIZE = 5;

export default function AdministracionPage() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [alumnas, setAlumnas] = useState<Alumna[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [docenteSearch, setDocenteSearch] = useState("");
  const [alumnaSearch, setAlumnaSearch] = useState("");
  const [docenteEstado, setDocenteEstado] = useState("Todos");
  const [alumnaGen, setAlumnaGen] = useState("Todas");
  const [docentePage, setDocentePage] = useState(1);
  const [alumnaPage, setAlumnaPage] = useState(1);

  // ── Filtered data ────────────────────────────────────────────────────────────
  const filteredDocentes = docentes.filter((d) => {
    const matchEstado = docenteEstado === "Todos" || d.estado === docenteEstado;
    const matchSearch =
      d.nombre.toLowerCase().includes(docenteSearch.toLowerCase()) ||
      d.correo.toLowerCase().includes(docenteSearch.toLowerCase());
    return matchEstado && matchSearch;
  });

  const filteredAlumnas = alumnas.filter((a) => {
    const matchGen = alumnaGen === "Todas" || a.generacion === alumnaGen;
    const matchSearch =
      a.nombre.toLowerCase().includes(alumnaSearch.toLowerCase()) ||
      a.correo.toLowerCase().includes(alumnaSearch.toLowerCase());
    return matchGen && matchSearch;
  });

  // ── Pagination helpers ────────────────────────────────────────────────────────
  function paginate<T>(items: T[], page: number, size: number) {
    return items.slice((page - 1) * size, page * size);
  }

  const docentePages = Math.max(1, Math.ceil(filteredDocentes.length / PAGE_SIZE));
  const alumnaPages = Math.max(1, Math.ceil(filteredAlumnas.length / PAGE_SIZE));
  const pagedDocentes = paginate(filteredDocentes, docentePage, PAGE_SIZE);
  const pagedAlumnas = paginate(filteredAlumnas, alumnaPage, PAGE_SIZE);

  // ── Stat cards ─────────────────────────────────────────────────────────────────
  const stats = [
    { label: "Docentes Activos", value: docentes.filter((d) => d.estado === "Activo").length, icon: "material-symbols:person-pin-outline", color: "var(--color-primary)" },
    { label: "Alumnas Activas", value: alumnas.filter((a) => a.estado === "Activa").length, icon: "material-symbols:school-outline", color: "var(--color-secondary)" },
    { label: "Generaciones", value: [...new Set(alumnas.map((a) => a.generacion))].length, icon: "material-symbols:groups-outline", color: "var(--color-tertiary)" },
    { label: "Materias Impartidas", value: [...new Set(docentes.map((d) => d.materia))].length, icon: "material-symbols:menu-book-outline", color: "var(--color-primary-container)" },
  ];

  // ── Render helpers ─────────────────────────────────────────────────────────────
  function PageNav({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
    return (
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="w-8 h-8 rounded-lg border border-[var(--color-outline-variant)] flex items-center justify-center disabled:opacity-40 hover:bg-[var(--color-surface-container-low)] transition-colors"
        >
          <Icon icon="material-symbols:chevron-left" />
        </button>
        {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
              p === page
                ? "bg-[var(--color-primary)] text-white"
                : "border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          disabled={page === total}
          onClick={() => onChange(page + 1)}
          className="w-8 h-8 rounded-lg border border-[var(--color-outline-variant)] flex items-center justify-center disabled:opacity-40 hover:bg-[var(--color-surface-container-low)] transition-colors"
        >
          <Icon icon="material-symbols:chevron-right" />
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 pb-28">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] p-4 flex items-center gap-3"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: s.color + "20" }}
            >
              <Icon icon={s.icon} className="text-xl" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-black text-[var(--color-on-surface)]">{s.value}</p>
              <p className="text-xs text-[var(--color-on-surface-variant)] leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab panel */}
      <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]">
        {/* Tab nav */}
        <div className="flex border-b border-[var(--color-outline-variant)] px-4">
          {["Docentes", "Alumnas"].map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === i
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Docentes tab */}
        {activeTab === 0 && (
          <div className="p-4 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative max-w-xs">
                <Icon icon="material-symbols:search-outline" className="absolute left-2.5 top-2 text-[var(--color-on-surface-variant)] text-lg pointer-events-none" />
                <input
                  type="search"
                  placeholder="Buscar docente..."
                  value={docenteSearch}
                  onChange={(e) => { setDocenteSearch(e.target.value); setDocentePage(1); }}
                  className="h-9 pl-9 pr-3 w-full rounded-xl border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <select
                value={docenteEstado}
                onChange={(e) => { setDocenteEstado(e.target.value); setDocentePage(1); }}
                className="h-9 px-3 rounded-xl border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                {["Todos", "Activo", "Inactivo", "Licencia"].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              <Button
                className="ml-auto bg-[var(--color-primary)] text-white"
                size="sm"
              >
                <Icon icon="material-symbols:person-add-outline" className="text-lg" />
                Agregar Docente
              </Button>
            </div>

            {/* Docentes table */}
            <div className="overflow-x-auto rounded-xl border border-[var(--color-outline-variant)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-surface-container-low)]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)]">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)] hidden sm:table-cell">Correo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)] hidden md:table-cell">Materia</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)]">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {pagedDocentes.map((d) => (
                    <tr key={d.id} className="border-t border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors">
                      <td className="px-4 py-3 font-medium text-[var(--color-on-surface)]">{d.nombre}</td>
                      <td className="px-4 py-3 text-[var(--color-on-surface-variant)] hidden sm:table-cell">{d.correo}</td>
                      <td className="px-4 py-3 text-[var(--color-on-surface-variant)] hidden md:table-cell">{d.materia}</td>
                      <td className="px-4 py-3">
                        <Chip size="sm" color={estadoColors[d.estado] as "success" | "warning" | "default" | "danger"}>
                          {d.estado}
                        </Chip>
                      </td>
                      <td className="px-4 py-3">
                        <Button isIconOnly size="sm" variant="ghost">
                          <Icon icon="material-symbols:more-vert" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {pagedDocentes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-on-surface-variant)]">
                        No se encontraron docentes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Docentes pagination */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--color-on-surface-variant)]">
                Mostrando {pagedDocentes.length} de {filteredDocentes.length} docentes
              </p>
              <PageNav page={docentePage} total={docentePages} onChange={setDocentePage} />
            </div>
          </div>
        )}

        {/* Alumnas tab */}
        {activeTab === 1 && (
          <div className="p-4 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative max-w-xs">
                <Icon icon="material-symbols:search-outline" className="absolute left-2.5 top-2 text-[var(--color-on-surface-variant)] text-lg pointer-events-none" />
                <input
                  type="search"
                  placeholder="Buscar alumna..."
                  value={alumnaSearch}
                  onChange={(e) => { setAlumnaSearch(e.target.value); setAlumnaPage(1); }}
                  className="h-9 pl-9 pr-3 w-full rounded-xl border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <select
                value={alumnaGen}
                onChange={(e) => { setAlumnaGen(e.target.value); setAlumnaPage(1); }}
                className="h-9 px-3 rounded-xl border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                {["Todas", ...new Set(alumnas.map((a) => a.generacion))].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              <Button
                className="ml-auto bg-[var(--color-primary)] text-white"
                size="sm"
              >
                <Icon icon="material-symbols:person-add-outline" className="text-lg" />
                Agregar Alumna
              </Button>
            </div>

            {/* Alumnas table */}
            <div className="overflow-x-auto rounded-xl border border-[var(--color-outline-variant)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-surface-container-low)]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)]">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)] hidden sm:table-cell">Correo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)] hidden md:table-cell">Generación</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)]">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {pagedAlumnas.map((a) => (
                    <tr key={a.id} className="border-t border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors">
                      <td className="px-4 py-3 font-medium text-[var(--color-on-surface)]">{a.nombre}</td>
                      <td className="px-4 py-3 text-[var(--color-on-surface-variant)] hidden sm:table-cell">{a.correo}</td>
                      <td className="px-4 py-3 text-[var(--color-on-surface-variant)] hidden md:table-cell">{a.generacion}</td>
                      <td className="px-4 py-3">
                        <Chip size="sm" color={estadoColors[a.estado] as "success" | "warning" | "danger"}>
                          {a.estado}
                        </Chip>
                      </td>
                      <td className="px-4 py-3">
                        <Button isIconOnly size="sm" variant="ghost">
                          <Icon icon="material-symbols:more-vert" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {pagedAlumnas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-on-surface-variant)]">
                        No se encontraron alumnas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Alumnas pagination */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--color-on-surface-variant)]">
                Mostrando {pagedAlumnas.length} de {filteredAlumnas.length} alumnas
              </p>
              <PageNav page={alumnaPage} total={alumnaPages} onChange={setAlumnaPage} />
            </div>
          </div>
        )}
      </div>

      {/* Quick actions ribbon */}
      <div className="rounded-2xl bg-[var(--color-primary-container)] border border-[var(--color-outline-variant)] p-4 flex flex-wrap items-center gap-3">
        <Icon icon="material-symbols:settings-outline" className="text-2xl text-[var(--color-on-primary-container)] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--color-on-primary-container)]">Acciones Rápidas</p>
          <p className="text-xs text-[var(--color-on-primary-container)]/70">Gestiona usuarios, exporta reportes o configura el sistema.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="bg-[var(--color-on-primary-container)] text-[var(--color-primary-container)]">
            Exportar CSV
          </Button>
          <Button size="sm" variant="outline" className="border-[var(--color-on-primary-container)] text-[var(--color-on-primary-container)]">
            Configurar Sistema
          </Button>
        </div>
      </div>
    </div>
  );
}
