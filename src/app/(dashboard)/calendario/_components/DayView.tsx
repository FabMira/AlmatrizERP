"use client";

import { useRef, useEffect, useMemo } from "react";
import { Button, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import type { CalendarEvent } from "@/domain/calendar/types";
import { getEventColor, formatTime } from "@/domain/calendar/helpers";

const HOUR_HEIGHT = 64; // px per hour row
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DAY_NAMES = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
];
const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

interface PositionedEvent {
  event: CalendarEvent;
  top: number;
  height: number;
  column: number;
  totalColumns: number;
}

function positionEvents(events: CalendarEvent[], date: Date): PositionedEvent[] {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  type Raw = PositionedEvent & { startMin: number; endMin: number };

  const raws: Raw[] = events.map((ev) => {
    const evStart = new Date(ev.start_at) < dayStart ? new Date(dayStart) : new Date(ev.start_at);
    const evEnd = new Date(ev.end_at) > dayEnd ? new Date(dayEnd) : new Date(ev.end_at);

    const startMin = evStart.getHours() * 60 + evStart.getMinutes();
    // If event ends exactly at midnight (next day boundary), treat as 24*60
    let endMin = evEnd.getHours() * 60 + evEnd.getMinutes();
    if (endMin === 0 && new Date(ev.end_at) > dayEnd) endMin = 24 * 60;

    const durationMin = Math.max(endMin - startMin, 30); // min 30 min for visibility

    return {
      event: ev,
      top: startMin * (HOUR_HEIGHT / 60),
      height: durationMin * (HOUR_HEIGHT / 60),
      startMin,
      endMin,
      column: 0,
      totalColumns: 1,
    };
  });

  // Sort by start, then longer events first (so short events get pushed to secondary columns)
  raws.sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

  // Assign columns: pick first column whose last occupant ended at/before this event starts
  const slots: number[] = []; // each index = column, value = endMin of last event in that column
  for (const ev of raws) {
    let col = slots.findIndex((end) => end <= ev.startMin);
    if (col === -1) {
      col = slots.length;
      slots.push(0);
    }
    slots[col] = ev.endMin;
    ev.column = col;
  }

  // totalColumns for each event = max column index among all overlapping events + 1
  for (const ev of raws) {
    const maxCol = raws
      .filter((o) => o.startMin < ev.endMin && o.endMin > ev.startMin)
      .reduce((m, o) => Math.max(m, o.column), 0);
    ev.totalColumns = maxCol + 1;
  }

  return raws.map(({ event, top, height, column, totalColumns }) => ({
    event,
    top,
    height,
    column,
    totalColumns,
  }));
}

interface Props {
  date: Date;
  events: CalendarEvent[];
  onBack: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onEventClick: (event: CalendarEvent) => void;
  onAddEvent: () => void;
}

export default function DayView({
  date,
  events,
  onBack,
  onPrevDay,
  onNextDay,
  onEventClick,
  onAddEvent,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const positioned = useMemo(() => positionEvents(events, date), [events, date]);

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const nowMinutes = isToday ? today.getHours() * 60 + today.getMinutes() : -1;
  const nowTop = nowMinutes >= 0 ? nowMinutes * (HOUR_HEIGHT / 60) : -1;

  // Auto-scroll to current time or first event
  useEffect(() => {
    if (!scrollRef.current) return;
    let target = 8 * HOUR_HEIGHT; // default: 8 AM
    if (nowMinutes >= 0) {
      target = Math.max(0, nowMinutes * (HOUR_HEIGHT / 60) - 160);
    } else if (positioned.length > 0) {
      target = Math.max(0, positioned[0].top - 64);
    }
    scrollRef.current.scrollTop = target;
  // run only when the date changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date.toDateString()]);

  const dayName = DAY_NAMES[date.getDay()];
  const dayNum = date.getDate();
  const monthName = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {/* Back to month */}
          <Button
            variant="outline"
            size="sm"
            onPress={onBack}
            className="gap-1.5 text-[var(--color-on-surface-variant)] border-[var(--color-outline-variant)] hover:text-[var(--color-on-surface)] flex-shrink-0"
          >
            <Icon icon="material-symbols:chevron-left" className="text-base" />
            Mes
          </Button>

          {/* Prev / Next day */}
          <div className="flex items-center gap-1">
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              onPress={onPrevDay}
              className="text-[var(--color-on-surface)]"
            >
              <Icon icon="material-symbols:chevron-left" className="text-xl" />
            </Button>
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              onPress={onNextDay}
              className="text-[var(--color-on-surface)]"
            >
              <Icon icon="material-symbols:chevron-right" className="text-xl" />
            </Button>
          </div>

          <div>
            <h2 className="font-bold text-xl text-[var(--color-on-surface)] capitalize">
              {dayName} {dayNum} de {monthName}
              {year !== today.getFullYear() ? ` ${year}` : ""}
            </h2>
            <p className="text-xs text-[var(--color-on-surface-variant)]">
              {isToday && <span className="text-[var(--color-primary)] font-medium">Hoy · </span>}
              {events.length === 0
                ? "Sin eventos"
                : `${events.length} evento${events.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <Button
          className="bg-[var(--color-primary)] text-white"
          size="sm"
          onPress={onAddEvent}
        >
          <Icon icon="material-symbols:add" className="text-lg" />
          Agregar
        </Button>
      </div>

      {/* Timeline */}
      <div
        ref={scrollRef}
        className="overflow-y-auto rounded-xl border border-[var(--color-outline-variant)]/40"
        style={{ maxHeight: "calc(100vh - 260px)" }}
      >
        <div className="relative flex" style={{ height: `${24 * HOUR_HEIGHT}px` }}>

          {/* Hour labels column */}
          <div className="w-14 flex-shrink-0 border-r border-[var(--color-outline-variant)]/40">
            {HOURS.map((h) => (
              <div
                key={h}
                className="flex items-start justify-end pr-3"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="text-[10px] font-medium text-[var(--color-on-surface-variant)] -translate-y-2 select-none">
                  {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
                </span>
              </div>
            ))}
          </div>

          {/* Grid area */}
          <div className="flex-1 relative">

            {/* Horizontal hour lines */}
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-[var(--color-outline-variant)]/30"
                style={{ top: h * HOUR_HEIGHT }}
              />
            ))}

            {/* Half-hour dashed lines */}
            {HOURS.map((h) => (
              <div
                key={`half-${h}`}
                className="absolute left-0 right-0 border-t border-dashed border-[var(--color-outline-variant)]/20"
                style={{ top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
              />
            ))}

            {/* Current time indicator */}
            {nowTop >= 0 && (
              <div
                className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                style={{ top: nowTop }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 -translate-x-1 flex-shrink-0 shadow-sm" />
                <div className="flex-1 h-px bg-red-500 shadow-sm" />
              </div>
            )}

            {/* Empty state */}
            {events.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--color-on-surface-variant)] pointer-events-none">
                <Icon icon="material-symbols:event-busy-outline" className="text-4xl opacity-20" />
                <p className="text-sm opacity-40">Sin eventos este día</p>
              </div>
            )}

            {/* Positioned events */}
            {positioned.map(({ event, top, height, column, totalColumns }) => {
              const color = getEventColor(event);
              const GAP = 3;
              const colW = `calc((100% - ${GAP * (totalColumns - 1)}px - 8px) / ${totalColumns})`;
              const colL = `calc(((100% - ${GAP * (totalColumns - 1)}px - 8px) / ${totalColumns} + ${GAP}px) * ${column} + 4px)`;

              return (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="absolute rounded-lg px-2 py-1 text-left overflow-hidden hover:brightness-95 active:brightness-90 transition-all cursor-pointer"
                  style={{
                    top: top + 1,
                    height: Math.max(height - 2, 22),
                    width: colW,
                    left: colL,
                    backgroundColor: color + "22",
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <p
                    className="text-[11px] font-semibold leading-tight truncate"
                    style={{ color }}
                  >
                    {event.title}
                  </p>
                  {height > 38 && (
                    <p
                      className="text-[10px] leading-tight mt-0.5 truncate"
                      style={{ color: color + "cc" }}
                    >
                      {formatTime(event.start_at)} – {formatTime(event.end_at)}
                    </p>
                  )}
                  {height > 60 && event.areas && (
                    <Chip
                      size="sm"
                      className="mt-1 h-4 text-[9px]"
                      style={{ backgroundColor: color + "30", color }}
                    >
                      {event.areas.name}
                    </Chip>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
