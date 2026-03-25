"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/client";
import { Icon } from "@iconify/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Correo o contraseña incorrectos. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ─────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ backgroundColor: "var(--color-sidebar)" }}
      >
        {/* Musical staff lines — decorative background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {[18, 30, 42, 54, 66].map((pct) => (
            <div
              key={pct}
              className="absolute left-0 right-0 h-px opacity-[0.07]"
              style={{ top: `${pct}%`, backgroundColor: "var(--color-primary-fixed)" }}
            />
          ))}
          {/* Floating quarter-note shape */}
          <div
            className="absolute -right-16 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-[0.06]"
            style={{ background: `radial-gradient(circle, var(--color-primary-container), transparent 70%)` }}
          />
          <div
            className="absolute -left-8 bottom-24 w-48 h-48 rounded-full opacity-[0.08]"
            style={{ background: `radial-gradient(circle, var(--color-tertiary-container), transparent 70%)` }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Icon icon="material-symbols:music-note" className="text-white text-xl" />
            </div>
            <span
              className="text-xl font-bold tracking-tight"
              style={{ color: "var(--color-primary-fixed)", fontFamily: "var(--font-headline)" }}
            >
              Almatriz
            </span>
          </div>
        </div>

        {/* Center copy */}
        <div className="relative z-10 space-y-6">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
            style={{
              borderColor: "var(--color-primary)40",
              color: "var(--color-primary-fixed-dim)",
              backgroundColor: "var(--color-primary)15",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-primary-container)" }} />
            Sistema de Gestión Escolar
          </div>
          <h1
            className="text-4xl font-bold leading-tight"
            style={{ color: "#f0f4f8", fontFamily: "var(--font-headline)" }}
          >
            Administra tu
            <br />
            <span style={{ color: "var(--color-primary-fixed-dim)" }}>escuela de música</span>
            <br />
            con claridad.
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
            Portafolios docentes, control de alumnas, calendario de eventos y
            gestión administrativa — todo en un solo lugar.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs" style={{ color: "#475569" }}>
            © {new Date().getFullYear()} Almatriz ERP. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Icon icon="material-symbols:music-note" className="text-white text-base" />
          </div>
          <span
            className="text-lg font-bold"
            style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-headline)" }}
          >
            Almatriz
          </span>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <h2
              className="text-2xl font-bold"
              style={{ color: "var(--color-on-surface)", fontFamily: "var(--font-headline)" }}
            >
              Bienvenida de vuelta
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-on-surface-variant)" }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Icon
                  icon="material-symbols:mail-outline"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none"
                  style={{ color: "var(--color-outline)" }}
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: "var(--color-surface-container-lowest)",
                    borderColor: "var(--color-outline-variant)",
                    color: "var(--color-on-surface)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-primary)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary)20";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-outline-variant)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Contraseña
              </label>
              <div className="relative">
                <Icon
                  icon="material-symbols:lock-outline"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none"
                  style={{ color: "var(--color-outline)" }}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-11 rounded-xl border text-sm transition-all focus:outline-none"
                  style={{
                    backgroundColor: "var(--color-surface-container-lowest)",
                    borderColor: "var(--color-outline-variant)",
                    color: "var(--color-on-surface)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-primary)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-primary)20";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-outline-variant)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded transition-opacity hover:opacity-70"
                  style={{ color: "var(--color-outline)" }}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <Icon
                    icon={showPassword ? "material-symbols:visibility-off-outline" : "material-symbols:visibility-outline"}
                    className="text-lg"
                  />
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                style={{
                  backgroundColor: "var(--color-error-container)",
                  color: "var(--color-on-error-container)",
                }}
                role="alert"
              >
                <Icon icon="material-symbols:error-outline" className="text-base flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-on-primary)",
              }}
            >
              {loading ? (
                <>
                  <Icon icon="material-symbols:progress-activity" className="text-lg animate-spin" />
                  Ingresando...
                </>
              ) : (
                <>
                  Ingresar
                  <Icon icon="material-symbols:arrow-forward" className="text-base" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-xs text-center" style={{ color: "var(--color-outline)" }}>
            ¿Problemas para acceder? Contacta a{" "}
            <span style={{ color: "var(--color-primary)" }} className="font-medium">
              administración
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
