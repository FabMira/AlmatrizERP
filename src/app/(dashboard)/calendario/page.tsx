"use client";

import { useState } from "react";
import { Button, Chip, Skeleton, useOverlayState } from "@heroui/react";
import { Icon } from "@iconify/react";
import type { CalendarEvent } from "@/domain/calendar/types";
import { getEventColor, formatTime } from "@/domain/calendar/helpers";
import { useEvents } from "@/hooks/use-events";
import { useAreas } from "@/hooks/use-areas";
import EventDetailModal from "./_components/EventDetailModal";
import AddEventModal from "./_components/AddEventModal";
import DayView from "./_components/DayView";

const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function CalendarioPage() {

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const { events, loading, fetchEvents } = useEvents(viewYear, viewMonth);
  const { areas } = useAreas();
  const [activeFilter, setActiveFilter] = useState("Todas");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [addResetKey, setAddResetKey] = useState(0);

  const detailModal = useOverlayState();
  const addModal = useOverlayState();

  // ── Calendar grid ──────────────────────────────────────────────────────────

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthStartDay = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(monthStartDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // ── Month navigation ───────────────────────────────────────────────────────

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filteredEvents = events.filter(
    (e) => activeFilter === "Todas" || e.areas?.name === activeFilter
  );

  function getEventsForDay(day: number): CalendarEvent[] {
    const dayStart = new Date(viewYear, viewMonth, day, 0, 0, 0, 0);
    const dayEnd = new Date(viewYear, viewMonth, day, 23, 59, 59, 999);
    return filteredEvents.filter((e) => {
      const start = new Date(e.start_at);
      const end = new Date(e.end_at);
      return start <= dayEnd && end >= dayStart;
    });
  }

  function getEventsForDate(date: Date): CalendarEvent[] {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    return filteredEvents.filter((e) => {
      const start = new Date(e.start_at);
      const end = new Date(e.end_at);
      return start <= dayEnd && end >= dayStart;
    });
  }

  const upcomingEvents = events
    .filter((e) => new Date(e.start_at) >= new Date())
    .slice(0, 4);

  const categories = ["Todas", ...areas.map((a) => a.name)];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6">

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2 flex-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                activeFilter === cat
                  ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                  : "border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <Button
          className="bg-[var(--color-primary)] text-white flex-shrink-0"
          onPress={() => { setEditingEvent(null); setAddResetKey(k => k + 1); addModal.open(); }}
        >
          <Icon icon="material-symbols:add" className="text-lg" />
          Agregar Evento
        </Button>
      </div>

      {/* Day view */}
      {selectedDay && (
        <DayView
          date={selectedDay}
          events={getEventsForDate(selectedDay)}
          onBack={() => setSelectedDay(null)}
          onPrevDay={() => {
            const d = new Date(selectedDay);
            d.setDate(d.getDate() - 1);
            // If we cross month boundary, update viewMonth/viewYear so events load
            if (d.getMonth() !== viewMonth || d.getFullYear() !== viewYear) {
              setViewMonth(d.getMonth());
              setViewYear(d.getFullYear());
            }
            setSelectedDay(d);
          }}
          onNextDay={() => {
            const d = new Date(selectedDay);
            d.setDate(d.getDate() + 1);
            if (d.getMonth() !== viewMonth || d.getFullYear() !== viewYear) {
              setViewMonth(d.getMonth());
              setViewYear(d.getFullYear());
            }
            setSelectedDay(d);
          }}
          onEventClick={(ev) => { setSelectedEvent(ev); detailModal.open(); }}
          onAddEvent={() => {
            setEditingEvent(null);
            setAddResetKey(k => k + 1);
            addModal.open();
          }}
        />
      )}

      {/* Month grid + sidebar */}
      {!selectedDay && (
      <div className="flex gap-6">

        {/* Calendar grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xl text-[var(--color-on-surface)]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <div className="flex gap-1">
              <Button isIconOnly variant="ghost" size="sm" onPress={prevMonth} className="text-[var(--color-on-surface)]">
                <Icon icon="material-symbols:chevron-left" className="text-xl" />
              </Button>
              <Button isIconOnly variant="ghost" size="sm" onPress={nextMonth} className="text-[var(--color-on-surface)]">
                <Icon icon="material-symbols:chevron-right" className="text-xl" />
              </Button>
            </div>
          </div>

          <div className="calendar-grid mb-1">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="text-xs font-semibold text-[var(--color-on-surface-variant)] text-center py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="calendar-grid gap-1">
            {loading
              ? Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="min-h-[80px] rounded-xl" />
                ))
              : cells.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const dayEvents = getEventsForDay(day);
                  const isToday =
                    day === today.getDate() &&
                    viewMonth === today.getMonth() &&
                    viewYear === today.getFullYear();
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedDay(new Date(viewYear, viewMonth, day))}
                      className={`min-h-[80px] rounded-xl p-1.5 border transition-colors cursor-pointer ${
                        isToday
                          ? "ring-2 ring-[var(--color-primary)] bg-[var(--color-primary)]/5 border-transparent"
                          : "border-[var(--color-outline-variant)]/50 hover:bg-[var(--color-surface-container-low)]"
                      }`}
                    >
                      <span className={`text-xs font-semibold leading-none ${
                        isToday ? "text-[var(--color-primary)]" : "text-[var(--color-on-surface-variant)]"
                      }`}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev) => {
                          const color = getEventColor(ev);
                          return (
                            <button
                              key={ev.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); detailModal.open(); }}
                              className="w-full text-left text-[10px] leading-tight rounded px-1 py-0.5 truncate"
                              style={{ backgroundColor: color + "25", color }}
                            >
                              {ev.title}
                            </button>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <p className="text-[9px] text-[var(--color-outline)] px-1">
                            +{dayEvents.length - 2} más
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 space-y-4">
          <h3 className="font-bold text-[var(--color-on-surface)]">Próximos Eventos</h3>

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          )}

          {!loading && upcomingEvents.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-6 text-[var(--color-on-surface-variant)]">
              <Icon icon="material-symbols:event-busy-outline" className="text-3xl opacity-30" />
              <p className="text-sm opacity-50">Sin eventos próximos</p>
            </div>
          )}

          {!loading && upcomingEvents.map((ev) => {
            const color = getEventColor(ev);
            return (
              <button
                key={ev.id}
                onClick={() => { setSelectedEvent(ev); detailModal.open(); }}
                className="w-full text-left rounded-xl border border-[var(--color-outline-variant)] p-4 hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)] transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-on-surface)] leading-tight">{ev.title}</p>
                    <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
                      {new Date(ev.start_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" })} — {formatTime(ev.start_at)}
                    </p>
                    {ev.areas && (
                      <Chip size="sm" className="mt-2 h-5 text-[10px]">{ev.areas.name}</Chip>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          <div className="rounded-xl bg-[var(--color-secondary-container)] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="material-symbols:auto-awesome-outline" className="text-[var(--color-on-secondary-container)]" />
              <p className="text-xs font-semibold text-[var(--color-on-secondary-container)]">Resumen del mes</p>
            </div>
            <p className="text-xs text-[var(--color-on-secondary-container)] opacity-80 leading-snug">
              {events.length === 0
                ? "No hay eventos este mes."
                : `${events.length} evento${events.length > 1 ? "s" : ""} en ${MONTH_NAMES[viewMonth]}.`}
            </p>
          </div>
        </aside>
      </div>
      )}

      <EventDetailModal
        state={detailModal}
        event={selectedEvent}
        onDeleted={() => { setSelectedEvent(null); fetchEvents(); }}
        onEdit={() => {
          setEditingEvent(selectedEvent);
          setAddResetKey(k => k + 1);
          addModal.open();
        }}
      />
      <AddEventModal
        state={addModal}
        areas={areas}
        resetKey={addResetKey}
        event={editingEvent}
        defaultDate={selectedDay}
        onSaved={fetchEvents}
      />

    </div>
  );
}
