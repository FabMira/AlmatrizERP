"use client";

import { useRouter } from "next/navigation";
import { Button, Card, CardContent } from "@heroui/react";
import { Icon } from "@iconify/react";

// TODO: fetch from API
interface Activity {
  icon: string;
  title: string;
  subtitle: string;
  time: string;
  color: string;
}
interface BarEntry { label: string; value: number; }

const quickActions = [
  {
    icon: "material-symbols:add-circle-outline",
    title: "Nueva Acta",
    description: "Crear documento de reunión",
    color: "var(--color-primary-container)",
  },
  {
    icon: "material-symbols:person-add-outline",
    title: "Registrar Alumna",
    description: "Agregar nueva estudiante",
    color: "var(--color-secondary-container)",
  },
  {
    icon: "material-symbols:calendar-add-on-outline",
    title: "Agendar Evento",
    description: "Programar en el calendario",
    color: "var(--color-tertiary-container)",
  },
  {
    icon: "material-symbols:upload-file-outline",
    title: "Subir Documento",
    description: "Portafolio o comprobante",
    color: "var(--color-error-container)",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  // TODO: replace with API data
  const barData: BarEntry[] = [];
  const activities: Activity[] = [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Insight Ribbon */}
      <div className="rounded-2xl bg-[var(--color-inverse-surface)] text-[var(--color-inverse-on-surface)] px-5 py-4 flex items-center gap-4">
        <Icon
          icon="material-symbols:info-outline"
          className="text-2xl flex-shrink-0 text-[var(--color-inverse-primary)]"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Ciclo escolar 2024–2025 en curso</p>
          <p className="text-xs opacity-80 mt-0.5">
              Cargando resumen del ciclo escolar actual...
            </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-[var(--color-inverse-primary)] text-[var(--color-inverse-primary)] flex-shrink-0 hidden sm:flex"
        >
          Ver pendientes
        </Button>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Performance chart — 8 cols */}
        <Card className="md:col-span-8 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="font-bold text-[var(--color-on-surface)] text-lg">
                Rendimiento Académico 2024
              </h2>
              <p className="text-[var(--color-on-surface-variant)] text-sm mt-1">
                Promedio general de asistencia y calificaciones por mes
              </p>
            </div>
            {/* Bar chart */}
            {barData.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center gap-2 text-[var(--color-on-surface-variant)]">
                <Icon icon="material-symbols:bar-chart-4-bars-outline" className="text-3xl opacity-30" />
                <p className="text-sm opacity-50">Sin datos disponibles</p>
              </div>
            ) : (
              <div className="flex items-end gap-3 h-40">
                {barData.map((bar) => (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-[var(--color-on-surface-variant)]">{bar.value}%</span>
                    <div className="w-full rounded-t-lg bg-[var(--color-primary)] opacity-80" style={{ height: `${(bar.value / 100) * 120}px` }} />
                    <span className="text-xs text-[var(--color-on-surface-variant)]">{bar.label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance metric — 4 cols */}
        <Card className="md:col-span-4 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] border-0 text-white">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <Icon
                icon="material-symbols:groups-outline"
                className="text-3xl mb-4 opacity-80"
              />
              <p className="text-sm opacity-80 font-medium">Asistencia Global</p>
              <p className="text-5xl font-bold mt-1">--%</p>
              <p className="text-sm opacity-70 mt-1">Sin datos del período</p>
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs opacity-80">
                <span>Meta anual</span>
                <span>95%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: "0%" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent activities — 5 cols */}
        <Card className="md:col-span-5 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]">
          <CardContent className="p-6">
            <h2 className="font-bold text-[var(--color-on-surface)] text-base mb-4">
              Actividad Reciente
            </h2>
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-[var(--color-on-surface-variant)]">
                <Icon icon="material-symbols:history-outline" className="text-3xl opacity-30" />
                <p className="text-sm opacity-50">Sin actividad reciente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((act, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: act.color + "20" }}>
                      <Icon icon={act.icon} className="text-lg" style={{ color: act.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-on-surface)] leading-tight">{act.title}</p>
                      <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5 truncate">{act.subtitle}</p>
                    </div>
                    <span className="text-xs text-[var(--color-outline)] flex-shrink-0">{act.time}</span>
                  </div>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" className="mt-4 text-[var(--color-primary)]">
              Ver todo
            </Button>
          </CardContent>
        </Card>

        {/* Quick actions — 7 cols */}
        <Card className="md:col-span-7 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]">
          <CardContent className="p-6">
            <h2 className="font-bold text-[var(--color-on-surface)] text-base mb-4">
              Acciones Rápidas
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (i === 0) router.push("/actas");
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)] transition-all text-left group"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: action.color }}
                  >
                    <Icon
                      icon={action.icon}
                      className="text-xl text-[var(--color-on-surface)]"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-on-surface)] leading-tight">
                      {action.title}
                    </p>
                    <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5 leading-tight">
                      {action.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
