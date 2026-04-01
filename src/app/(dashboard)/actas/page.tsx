"use client";

import { useState, useMemo } from "react";
import { Button, Chip, Skeleton, useOverlayState } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMinutes } from "@/hooks/use-minutes";
import { useAreas } from "@/hooks/use-areas";
import type { MeetingMinute } from "@/domain/minutes/types";
import AddMinuteModal from "./_components/AddMinuteModal";
import MinuteDetailModal from "./_components/MinuteDetailModal";

const AREA_COLORS: string[] = [
  "var(--color-primary)",
  "var(--color-secondary)",
  "var(--color-tertiary)",
  "var(--color-error)",
];

function getAreaColor(index: number): string {
  return AREA_COLORS[index % AREA_COLORS.length];
}

// ── Grouping helpers ──────────────────────────────────────────────────────────

function getWeekOfMonth(date: Date): number {
  return Math.ceil(date.getDate() / 7);
}

function getWeekDateRange(year: number, month: number, weekNum: number): string {
  const start = (weekNum - 1) * 7 + 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const end = Math.min(weekNum * 7, daysInMonth);
  const abbr = new Date(year, month - 1, 1).toLocaleDateString("es-MX", { month: "short" });
  return `${start}–${end} ${abbr.charAt(0).toUpperCase() + abbr.slice(1)}`;
}

type WeekGroup = { weekNum: number; dateRange: string; minutes: MeetingMinute[] };
type MonthGroup = { key: string; monthLabel: string; year: number; totalCount: number; weeks: WeekGroup[] };

function groupByMonthAndWeek(minutes: MeetingMinute[]): MonthGroup[] {
  const sorted = [...minutes].sort(
    (a, b) =>
      new Date(b.meeting_date + "T00:00:00").getTime() -
      new Date(a.meeting_date + "T00:00:00").getTime()
  );
  const monthMap = new Map<string, MonthGroup>();

  for (const minute of sorted) {
    const date = new Date(minute.meeting_date + "T00:00:00");
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const weekNum = getWeekOfMonth(date);

    if (!monthMap.has(monthKey)) {
      const label = date.toLocaleDateString("es-MX", { month: "long" });
      monthMap.set(monthKey, {
        key: monthKey,
        monthLabel: label.charAt(0).toUpperCase() + label.slice(1),
        year,
        totalCount: 0,
        weeks: [],
      });
    }

    const mg = monthMap.get(monthKey)!;
    mg.totalCount++;

    let wg = mg.weeks.find((w) => w.weekNum === weekNum);
    if (!wg) {
      wg = { weekNum, dateRange: getWeekDateRange(year, month, weekNum), minutes: [] };
      mg.weeks.push(wg);
    }
    wg.minutes.push(minute);
  }

  monthMap.forEach((mg) => mg.weeks.sort((a, b) => b.weekNum - a.weekNum));
  return Array.from(monthMap.values());
}

export default function ActasPage() {
  const { minutes, loading, fetchMinutes, deleteMinute } = useMinutes();
  const { areas } = useAreas();

  const [search, setSearch] = useState("");
  const [activeAreaId, setActiveAreaId] = useState("all");
  const [selectedMinute, setSelectedMinute] = useState<MeetingMinute | null>(null);
  const [editingMinute, setEditingMinute] = useState<MeetingMinute | null>(null);
  const [addResetKey, setAddResetKey] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());

  const addModal = useOverlayState();
  const editModal = useOverlayState();
  const detailModal = useOverlayState();

  const areaColorMap = useMemo(
    () => Object.fromEntries(areas.map((a, i) => [a.id, getAreaColor(i)])),
    [areas]
  );

  const filtered = useMemo(
    () =>
      minutes.filter((m) => {
        const matchArea = activeAreaId === "all" || m.area_id === activeAreaId;
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          m.title.toLowerCase().includes(q) ||
          (m.content ?? "").toLowerCase().includes(q) ||
          m.attendees.some((a) => a.toLowerCase().includes(q));
        return matchArea && matchSearch;
      }),
    [minutes, search, activeAreaId]
  );

  const grouped = useMemo(() => groupByMonthAndWeek(filtered), [filtered]);

  function toggleMonth(key: string) {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function openDetail(minute: MeetingMinute) {
    setSelectedMinute(minute);
    detailModal.open();
  }

  function openAdd() {
    setAddResetKey((k) => k + 1);
    addModal.open();
  }

  function openEdit() {
    if (!selectedMinute) return;
    setEditingMinute(selectedMinute);
    detailModal.close();
    editModal.open();
  }

  async function handleDelete() {
    if (!selectedMinute) return;
    setDeleting(true);
    await deleteMinute(selectedMinute.id);
    setDeleting(false);
    detailModal.close();
    setSelectedMinute(null);
  }

  return (
    <div className="p-4 md:p-6 space-y-6 pb-28">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-xl font-bold text-[var(--color-on-surface)] sm:hidden">Actas de Reunión</h1>

        <div className="relative max-w-xs w-full">
          <Icon
            icon="material-symbols:search-outline"
            className="absolute left-2.5 top-2 text-[var(--color-on-surface-variant)] text-lg pointer-events-none"
          />
          <input
            type="search"
            placeholder="Buscar acta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 pr-3 w-full rounded-xl border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <select
          className="h-9 px-3 rounded-xl border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-48"
          value={activeAreaId}
          onChange={(e) => setActiveAreaId(e.target.value)}
        >
          <option value="all">Todas las áreas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <Button
          className="sm:ml-auto bg-[var(--color-primary)] text-white"
          onPress={openAdd}
        >
          <Icon icon="material-symbols:add" className="text-lg" />
          Nueva Acta
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, mi) => (
            <div key={mi} className="space-y-3">
              <Skeleton className="h-8 w-52 rounded-xl" />
              <div className="space-y-2 pl-4">
                <Skeleton className="h-5 w-36 rounded-lg" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-2xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-[var(--color-on-surface-variant)]">
          <Icon icon="material-symbols:description-outline" className="text-6xl opacity-20" />
          <p className="text-base font-medium opacity-50">
            {search || activeAreaId !== "all"
              ? "No se encontraron actas con esos filtros."
              : "Aún no hay actas registradas."}
          </p>
          {!search && activeAreaId === "all" && (
            <Button
              variant="outline"
              onPress={openAdd}
              className="border-[var(--color-primary)] text-[var(--color-primary)]"
            >
              <Icon icon="material-symbols:add" className="text-lg" />
              Registrar primera acta
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((mg) => {
            const isCollapsed = collapsedMonths.has(mg.key);
            return (
              <section key={mg.key}>
                {/* Month header */}
                <button
                  onClick={() => toggleMonth(mg.key)}
                  className="w-full flex items-center gap-3 mb-5 group"
                >
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-xl font-black tracking-tight text-[var(--color-on-surface)]">
                      {mg.monthLabel}
                    </h2>
                    <span className="text-base font-light text-[var(--color-on-surface-variant)]">
                      {mg.year}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-[var(--color-outline-variant)]" />
                  <span className="text-xs font-semibold bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] rounded-full px-2.5 py-0.5 flex-shrink-0">
                    {mg.totalCount} acta{mg.totalCount !== 1 ? "s" : ""}
                  </span>
                  <Icon
                    icon="material-symbols:expand-more"
                    className="text-[var(--color-on-surface-variant)] transition-transform duration-200 flex-shrink-0"
                    style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
                  />
                </button>

                {/* Month body */}
                {!isCollapsed && (
                  <div className="space-y-6 pl-1">
                    {mg.weeks.map((wg) => (
                      <div key={wg.weekNum} className="relative pl-5">
                        {/* Timeline spine */}
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-[var(--color-outline-variant)]" />
                        {/* Timeline dot */}
                        <div className="absolute left-[-3px] top-1.5 w-[7px] h-[7px] rounded-full bg-[var(--color-outline)] ring-2 ring-[var(--color-surface)]" />

                        {/* Week label */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">
                            Semana {wg.weekNum}
                          </span>
                          <span className="text-xs text-[var(--color-outline)]">
                            · {wg.dateRange}
                          </span>
                          <span className="text-xs text-[var(--color-outline)] ml-auto">
                            {wg.minutes.length} acta{wg.minutes.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Minute rows */}
                        <div className="space-y-2">
                          {wg.minutes.map((minute) => {
                            const areaColor = minute.area_id
                              ? (areaColorMap[minute.area_id] ?? "var(--color-primary)")
                              : "var(--color-outline-variant)";
                            const date = new Date(minute.meeting_date + "T00:00:00");
                            const dayNum = String(date.getDate()).padStart(2, "0");
                            const dayName = date
                              .toLocaleDateString("es-MX", { weekday: "short" })
                              .replace(".", "");
                            const snippet = minute.content?.trim().slice(0, 100) ?? "";

                            return (
                              <button
                                key={minute.id}
                                onClick={() => openDetail(minute)}
                                className="group w-full text-left flex items-center gap-3 rounded-2xl p-3.5 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface-container-low)] hover:shadow-sm transition-all duration-150"
                              >
                                {/* Day badge */}
                                <div
                                  className="flex-shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center"
                                  style={{ backgroundColor: areaColor + "18" }}
                                >
                                  <span
                                    className="text-base font-black leading-none"
                                    style={{ color: areaColor }}
                                  >
                                    {dayNum}
                                  </span>
                                  <span
                                    className="text-[9px] uppercase font-semibold leading-none mt-0.5"
                                    style={{ color: areaColor, opacity: 0.75 }}
                                  >
                                    {dayName}
                                  </span>
                                </div>

                                {/* Body */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                    <p className="font-semibold text-sm text-[var(--color-on-surface)] truncate">
                                      {minute.title}
                                    </p>
                                    {minute.areas && (
                                      <Chip
                                        size="sm"
                                        className="h-5 text-[10px] flex-shrink-0"
                                        style={{
                                          backgroundColor: areaColor + "18",
                                          color: areaColor,
                                        }}
                                      >
                                        {minute.areas.name}
                                      </Chip>
                                    )}
                                  </div>
                                  {snippet ? (
                                    <p className="text-xs text-[var(--color-on-surface-variant)] line-clamp-1 leading-relaxed">
                                      {snippet}{minute.content && minute.content.length > 100 ? "…" : ""}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-[var(--color-outline)] italic">Sin contenido</p>
                                  )}
                                </div>

                                {/* Attendees */}
                                {minute.attendees.length > 0 && (
                                  <div className="flex-shrink-0 flex items-center gap-1 text-xs text-[var(--color-outline)] mr-1">
                                    <Icon icon="material-symbols:group-outline" className="text-sm" />
                                    <span>{minute.attendees.length}</span>
                                  </div>
                                )}

                                {/* Arrow */}
                                <Icon
                                  icon="material-symbols:chevron-right"
                                  className="flex-shrink-0 text-[var(--color-outline-variant)] group-hover:text-[var(--color-primary)] transition-colors"
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <AddMinuteModal
        state={addModal}
        areas={areas}
        resetKey={addResetKey}
        onSaved={fetchMinutes}
      />

      {/* Edit modal */}
      <AddMinuteModal
        state={editModal}
        areas={areas}
        resetKey={0}
        onSaved={() => {
          fetchMinutes();
          setSelectedMinute(null);
        }}
        minute={editingMinute ?? undefined}
      />

      {/* Detail modal */}
      <MinuteDetailModal
        state={detailModal}
        minute={selectedMinute}
        onEdit={openEdit}
        onDelete={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}
