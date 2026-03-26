"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Avatar,
  AvatarFallback,
  Card,
  CardContent,
  Skeleton,
  useOverlayState,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTeachers } from "@/hooks/use-teachers";
import { useAreas } from "@/hooks/use-areas";
import { useCourses } from "@/hooks/use-courses";
import TeacherModal from "./_components/TeacherModal";
import StatusCell from "./_components/StatusCell";
import type { Teacher, TeacherStatus } from "@/domain/teachers/types";

const PER_PAGE = 12;

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export default function PortafolioDocentesPage() {
  const { teachers, loading, fetchTeachers, updateStatus } = useTeachers();
  const { areas } = useAreas();
  const { courses } = useCourses();

  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<TeacherStatus | "">("");
  const [page, setPage] = useState(1);

  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const addModalState = useOverlayState();
  const editModalState = useOverlayState();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return teachers.filter((t) => {
      if (
        q &&
        !t.full_name.toLowerCase().includes(q) &&
        !(t.email ?? "").toLowerCase().includes(q) &&
        !(t.subject ?? "").toLowerCase().includes(q)
      ) return false;
      if (areaFilter && t.area_id !== areaFilter) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      return true;
    });
  }, [teachers, search, areaFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function resetPage() { setPage(1); }

  const activeCount = teachers.filter((t) => t.status === "activo").length;
  const licenciaCount = teachers.filter((t) => t.status === "licencia").length;
  const nuevoCount = teachers.filter((t) => t.status === "nuevo").length;

  function openEdit(t: Teacher) {
    setSelectedTeacher(t);
    editModalState.open();
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
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
          <Button className="bg-[var(--color-primary)] text-white" size="sm" onPress={addModalState.open}>
            <Icon icon="material-symbols:person-add-outline" className="text-lg" />
            Nuevo Docente
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon
            icon="material-symbols:search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] text-lg"
          />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            placeholder="Buscar por nombre, correo o materia…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-[var(--color-outline-variant)] bg-transparent text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>
        <select
          value={areaFilter}
          onChange={(e) => { setAreaFilter(e.target.value); resetPage(); }}
          className="h-10 px-3 rounded-xl border border-[var(--color-outline-variant)] bg-transparent text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        >
          <option value="">Todas las áreas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["", "Todos"],
            ["activo", "Activos"],
            ["licencia", "En Licencia"],
            ["nuevo", "Nuevos"],
          ] as [TeacherStatus | "", string][]
        ).map(([val, label]) => (
          <button
            key={val}
            onClick={() => { setStatusFilter(val); resetPage(); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
              statusFilter === val
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                : "border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Card grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] overflow-hidden">
              <Skeleton className="h-1 w-full" />
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-8 w-full rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--color-on-surface-variant)]">
          <Icon icon="material-symbols:person-search-outline" className="text-5xl opacity-20" />
          <p className="text-sm opacity-50">
            {teachers.length === 0
              ? "No hay docentes registrados"
              : "Sin resultados para los filtros seleccionados"}
          </p>
          {teachers.length === 0 && (
            <Button
              size="sm"
              className="bg-[var(--color-primary)] text-white mt-2"
              onPress={addModalState.open}
            >
              Agregar primer docente
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((t) => {
            const areaColor = t.areas?.color ?? "var(--color-primary)";
            // Group this teacher's assigned courses by module
            const assignedIds = new Set((t.teacher_courses ?? []).map((tc) => tc.course_id));
            const assignedCourses = courses.filter((c) => assignedIds.has(c.id));
            const byModule = assignedCourses.reduce<Record<number, { name: string; titles: string[] }>>((acc, c) => {
              if (!acc[c.module]) acc[c.module] = { name: c.module_name, titles: [] };
              acc[c.module].titles.push(c.title);
              return acc;
            }, {});
            return (
              <Card
                key={t.id}
                className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                onClick={() => openEdit(t)}
              >
                <div className="h-1 w-full" style={{ backgroundColor: areaColor }} />
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar size="lg" className="rounded-2xl bg-[var(--color-secondary-container)]">
                      <AvatarFallback className="rounded-2xl text-[var(--color-on-secondary-container)] font-bold">
                        {getInitials(t.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[var(--color-on-surface)] leading-tight">{t.full_name}</p>
                      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                        <StatusCell teacher={t} onUpdate={updateStatus} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1.5">
                    {t.email && (
                      <div className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)]">
                        <Icon icon="material-symbols:mail-outline" className="text-sm flex-shrink-0" />
                        <span className="truncate">{t.email}</span>
                      </div>
                    )}
                    {t.phone && (
                      <div className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)]">
                        <Icon icon="material-symbols:phone-outline" className="text-sm flex-shrink-0" />
                        <span>{t.phone}</span>
                      </div>
                    )}
                    {t.areas && (
                      <div className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)]">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.areas.color }} />
                        <span>{t.areas.name}</span>
                      </div>
                    )}
                  </div>
                  {/* Courses grouped by module */}
                  {Object.keys(byModule).length > 0 && (
                    <div className="mt-3 space-y-2">
                      {Object.entries(byModule).map(([mod, { name, titles }]) => (
                        <div key={mod}>
                          <p className="text-[10px] uppercase tracking-wide font-semibold text-[var(--color-primary)] opacity-80 mb-1">
                            Módulo {mod} · {name}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {titles.map((title) => (
                              <span
                                key={title}
                                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--color-primary-fixed)] text-[var(--color-on-primary-fixed)]"
                              >
                                {title}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4">
                    <Button
                      size="sm"
                      className="w-full text-[var(--color-primary)] bg-[var(--color-primary-fixed)]"
                      onPress={() => openEdit(t)}
                    >
                      Ver Perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-[var(--color-outline-variant)]"
            isDisabled={page === 1}
            onPress={() => setPage((p) => p - 1)}
          >
            <Icon icon="material-symbols:chevron-left" className="text-lg" />
          </Button>
          <span className="text-sm text-[var(--color-on-surface-variant)]">
            Página {page} de {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="border-[var(--color-outline-variant)]"
            isDisabled={page === totalPages}
            onPress={() => setPage((p) => p + 1)}
          >
            <Icon icon="material-symbols:chevron-right" className="text-lg" />
          </Button>
        </div>
      )}

      {/* Summary bar */}
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

      {/* Add Modal */}
      <TeacherModal
        state={addModalState}
        areas={areas}
        courses={courses}
        onSaved={fetchTeachers}
      />

      {/* Edit Modal */}
      <TeacherModal
        state={editModalState}
        areas={areas}
        courses={courses}
        teacher={selectedTeacher}
        onSaved={fetchTeachers}
        onDeleted={fetchTeachers}
      />
    </div>
  );
}
