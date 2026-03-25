"use client";

import { useEffect, useState } from "react";
import { Button, Avatar, AvatarFallback, useOverlayState } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useStudents } from "@/hooks/use-students";
import { useGenerations } from "@/hooks/use-generations";
import { STATUS_LABELS } from "@/domain/students/constants";
import type { Student, StudentStatus } from "@/domain/students/types";
import StudentModal from "./_components/StudentModal";
import CsvUploadModal from "./_components/CsvUploadModal";
import GenerationModal from "./_components/GenerationModal";
import StatusCell from "./_components/StatusCell";

const STATUS_FILTER_OPTIONS: (StudentStatus | "todas")[] = ["todas", "activa", "egresada", "baja"];

const PER_PAGE = 10;

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PortafolioAlumnasPage() {
  const { students, loading, fetchStudents, updateStatus } = useStudents();
  const { generations, fetchGenerations } = useGenerations();
  const [activeGen, setActiveGen] = useState<string>("");
  const [activeStatus, setActiveStatus] = useState<StudentStatus | "todas">("todas");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const studentModalState = useOverlayState();
  const csvModalState = useOverlayState();
  const genModalState = useOverlayState();

  // Set active generation when generations load
  useEffect(() => {
    if (generations.length > 0 && !activeGen) {
      setActiveGen(generations[0].name);
    }
  }, [generations, activeGen]);

  // Kick off initial fetch
  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ── Filter + paginate ──────────────────────────────────────────────────────
  const filtered = students.filter((s) => {
    const matchGen = !activeGen || s.generation === activeGen;
    const matchStatus = activeStatus === "todas" || s.status === activeStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.full_name.toLowerCase().includes(q) ||
      (s.email ?? "").toLowerCase().includes(q) ||
      (s.city ?? "").toLowerCase().includes(q);
    return matchGen && matchStatus && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function changeGen(name: string) {
    setActiveGen(name);
    setPage(1);
  }

  function changeSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  function changeStatus(val: StudentStatus | "todas") {
    setActiveStatus(val);
    setPage(1);
  }

  function openAdd() {
    setEditStudent(null);
    studentModalState.open();
  }

  function openEdit(student: Student) {
    setEditStudent(student);
    studentModalState.open();
  }

  // ── Generation created callback ────────────────────────────────────────────
  async function onGenerationCreated(name: string) {
    await fetchGenerations();
    setActiveGen(name);
    setPage(1);
  }


  // ── Initials helper ────────────────────────────────────────────────────────
  function initials(name: string) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase();
  }

  return (
    <div className="p-4 md:p-6">
      {/* Generation tabs + new generation button */}
      <div className="flex items-center border-b border-[var(--color-outline-variant)] mb-4 gap-1">
        {generations.map((g) => (
          <button
            key={g.id}
            onClick={() => changeGen(g.name)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeGen === g.name
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
            }`}
          >
            {g.label ?? `Gen ${g.name}`}
          </button>
        ))}
        {loading && generations.length === 0 && (
          <div className="flex gap-2 px-2 pb-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-14 rounded bg-[var(--color-outline-variant)] animate-pulse" />
            ))}
          </div>
        )}
        <button
          onClick={() => genModalState.open()}
          className="ml-1 mb-[2px] flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-primary)] transition-colors"
          title="Nueva generación"
        >
          <Icon icon="material-symbols:add" className="text-base" />
          Nueva
        </button>
      </div>

      {/* Search + status filters + actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative max-w-xs">
          <Icon
            icon="material-symbols:search-outline"
            className="absolute left-2.5 top-2 text-[var(--color-on-surface-variant)] text-lg pointer-events-none"
          />
          <input
            type="search"
            placeholder="Buscar alumna…"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            className="h-9 pl-9 pr-3 w-full rounded-xl border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTER_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                activeStatus === s
                  ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                  : "border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]"
              }`}
            >
              {s === "todas" ? "Todas" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="flex gap-2 sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)]"
            onPress={() => csvModalState.open()}
          >
            <Icon icon="material-symbols:upload-file-outline" className="text-base" />
            Importar CSV
          </Button>
          <Button
            className="bg-[var(--color-primary)] text-white"
            size="sm"
            onPress={openAdd}
          >
            <Icon icon="material-symbols:person-add-outline" className="text-base" />
            Agregar alumna
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--color-outline-variant)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-surface-container-low)]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)]">ALUMNA</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)] hidden lg:table-cell">CORREO</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)] hidden sm:table-cell">CIUDAD</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)]">ESTADO</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-on-surface-variant)]"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-[var(--color-outline-variant)]">
                  {[160, 180, 90, 70, 60].map((w, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3 rounded animate-pulse bg-[var(--color-outline-variant)]" style={{ width: w }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-[var(--color-on-surface-variant)] text-sm">
                  {students.length === 0
                    ? "No hay alumnas registradas en esta generación."
                    : "No se encontraron alumnas con ese criterio."}
                </td>
              </tr>
            ) : (
              paginated.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)] transition-colors cursor-pointer"
                  onClick={() => openEdit(s)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm" className="bg-[var(--color-secondary-container)] flex-shrink-0">
                        <AvatarFallback className="text-[var(--color-on-secondary-container)] text-xs font-medium">
                          {initials(s.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--color-on-surface)] truncate">{s.full_name}</p>
                        <p className="text-xs text-[var(--color-on-surface-variant)] sm:hidden truncate">{s.city ?? s.email ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-[var(--color-on-surface-variant)]">{s.email ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-[var(--color-on-surface-variant)]">{s.city ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3" onPointerDown={(e) => e.stopPropagation()}>
                    <StatusCell student={s} onUpdate={updateStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); openEdit(s); }}
                      className="p-1 rounded text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
                      title="Editar"
                    >
                      <Icon icon="material-symbols:edit-outline" className="text-base" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-[var(--color-on-surface-variant)]">
          {filtered.length === 0
            ? "0 alumnas"
            : `${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} de ${filtered.length}`}
        </p>
        <div className="flex items-center gap-1">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="w-8 h-8 rounded-lg border border-[var(--color-outline-variant)] flex items-center justify-center disabled:opacity-40 hover:bg-[var(--color-surface-container-low)] transition-colors"
          >
            <Icon icon="material-symbols:chevron-left" className="text-lg" />
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
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
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="w-8 h-8 rounded-lg border border-[var(--color-outline-variant)] flex items-center justify-center disabled:opacity-40 hover:bg-[var(--color-surface-container-low)] transition-colors"
          >
            <Icon icon="material-symbols:chevron-right" className="text-lg" />
          </button>
        </div>
      </div>

      {/* Modals */}
      <StudentModal
        state={studentModalState}
        generations={generations}
        student={editStudent}
        onSaved={() => fetchStudents()}
        onDeleted={() => fetchStudents()}
      />
      <CsvUploadModal
        state={csvModalState}
        activeGeneration={activeGen}
        onImported={() => fetchStudents()}
      />
      <GenerationModal
        state={genModalState}
        onCreated={onGenerationCreated}
      />
    </div>
  );
}
