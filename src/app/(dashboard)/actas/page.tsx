"use client";

import { useState } from "react";
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

export default function ActasPage() {
  const { minutes, loading, fetchMinutes, deleteMinute } = useMinutes();
  const { areas } = useAreas();

  const [search, setSearch] = useState("");
  const [activeAreaId, setActiveAreaId] = useState("all");
  const [selectedMinute, setSelectedMinute] = useState<MeetingMinute | null>(null);
  const [editingMinute, setEditingMinute] = useState<MeetingMinute | null>(null);
  const [addResetKey, setAddResetKey] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const addModal = useOverlayState();
  const editModal = useOverlayState();
  const detailModal = useOverlayState();

  // Build a stable color map: area id → color
  const areaColorMap = Object.fromEntries(
    areas.map((a, i) => [a.id, getAreaColor(i)])
  );

  const filtered = minutes.filter((m) => {
    const matchArea = activeAreaId === "all" || m.area_id === activeAreaId;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      m.title.toLowerCase().includes(q) ||
      (m.content ?? "").toLowerCase().includes(q) ||
      m.attendees.some((a) => a.toLowerCase().includes(q));
    return matchArea && matchSearch;
  });

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

        {/* Search */}
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

        {/* Area filter */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-[var(--color-on-surface-variant)]">
          <Icon
            icon="material-symbols:description-outline"
            className="text-6xl opacity-20"
          />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((minute) => {
            const areaColor = minute.area_id
              ? (areaColorMap[minute.area_id] ?? "var(--color-primary)")
              : "var(--color-outline-variant)";
            const snippet = minute.content?.trim().slice(0, 120) ?? "";
            const formattedDate = new Date(minute.meeting_date + "T00:00:00").toLocaleDateString("es-MX", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <button
                key={minute.id}
                onClick={() => openDetail(minute)}
                className="text-left rounded-2xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] border-l-4 p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                style={{ borderLeftColor: areaColor }}
              >
                {/* Header */}
                <div className="flex items-start gap-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: areaColor + "20" }}
                  >
                    <Icon
                      icon="material-symbols:description-outline"
                      className="text-lg"
                      style={{ color: areaColor }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    {minute.areas && (
                      <Chip
                        size="sm"
                        className="mb-1 h-5 text-[10px]"
                        style={{
                          backgroundColor: areaColor + "20",
                          color: areaColor,
                        }}
                      >
                        {minute.areas.name}
                      </Chip>
                    )}
                    <p className="font-bold text-sm text-[var(--color-on-surface)] leading-snug line-clamp-2">
                      {minute.title}
                    </p>
                  </div>
                </div>

                {/* Snippet */}
                {snippet && (
                  <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed line-clamp-3">
                    {snippet}{minute.content && minute.content.length > 120 ? "…" : ""}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-1 border-t border-[var(--color-outline-variant)]">
                  <div className="flex items-center gap-1 text-xs text-[var(--color-outline)]">
                    <Icon icon="material-symbols:calendar-today-outline" className="text-xs" />
                    <span>{formattedDate}</span>
                  </div>
                  {minute.attendees.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-[var(--color-outline)]">
                      <Icon icon="material-symbols:group-outline" className="text-xs" />
                      <span>{minute.attendees.length}</span>
                    </div>
                  )}
                </div>
              </button>
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
