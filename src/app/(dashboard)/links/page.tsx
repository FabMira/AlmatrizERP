"use client";

import { useState } from "react";
import { Button, Chip, Skeleton, useOverlayState } from "@heroui/react";
import { Icon } from "@iconify/react";

import { useLinks } from "@/hooks/use-links";
import type { Link } from "@/domain/links/types";
import AddLinkModal from "./_components/AddLinkModal";
import LinkDetailModal from "./_components/LinkDetailModal";

const categories = ["Todas", "Administración", "Área Académica", "Servicios", "Gestión y Marketing"];

const categoryColors: Record<string, string> = {
  Administración: "var(--color-primary)",
  "Área Académica": "var(--color-secondary)",
  Servicios: "var(--color-tertiary)",
  "Gestión y Marketing": "var(--color-tertiary-container)",
};

export default function LinksPage() {
  const { links, loading, fetchLinks } = useLinks();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todas");

  const addState = useOverlayState();
  const detailState = useOverlayState();
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [resetKey, setResetKey] = useState(0);

  function openAdd() {
    setResetKey((k) => k + 1);
    addState.open();
  }

  function openDetail(link: Link) {
    setSelectedLink(link);
    detailState.open();
  }

  const filteredLinks = links.filter((l) => {
    const matchCategory = activeCategory === "Todas" || l.category === activeCategory;
    const matchSearch =
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const pinnedLinks = filteredLinks.filter((l) => l.pinned);
  const regularLinks = filteredLinks.filter((l) => !l.pinned);

  return (
    <div className="p-4 md:p-6 space-y-6 pb-28">
      {/* Filter/action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative max-w-xs">
          <Icon icon="material-symbols:search-outline" className="absolute left-2.5 top-2 text-[var(--color-on-surface-variant)] text-lg pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar link..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 pr-3 w-full rounded-xl border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
        <select
          className="h-9 px-3 rounded-xl border border-[var(--color-outline-variant)] bg-white text-[var(--color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-48"
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <Button
          className="sm:ml-auto bg-[var(--color-primary)] text-white"
          size="sm"
          onPress={openAdd}
        >
          <Icon icon="material-symbols:add-link-outline" className="text-lg" />
          Agregar Link
        </Button>
      </div>

      {/* Pinned section */}
      {!loading && pinnedLinks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Icon icon="material-symbols:push-pin-outline" className="text-[var(--color-on-surface-variant)]" />
            <h2 className="font-semibold text-sm text-[var(--color-on-surface-variant)]">Fijados</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {pinnedLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => openDetail(link)}
                className="flex-shrink-0 w-[300px] rounded-2xl bg-[var(--color-surface-container-lowest)] border-l-4 border border-[var(--color-outline-variant)] p-5 flex flex-col gap-3 text-left hover:shadow-md transition-shadow"
                style={{ borderLeftColor: categoryColors[link.category] ?? "var(--color-primary)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <Chip
                    size="sm"
                    style={{
                      backgroundColor: (categoryColors[link.category] ?? "var(--color-primary)") + "20",
                      color: categoryColors[link.category] ?? "var(--color-primary)",
                    }}
                  >
                    {link.category}
                  </Chip>
                  <Icon icon="material-symbols:push-pin" className="text-[var(--color-outline)] text-sm" />
                </div>
                <div>
                  <p className="font-bold text-sm text-[var(--color-on-surface)] leading-tight">{link.title}</p>
                  <p className="text-xs text-[var(--color-on-surface-variant)] mt-1 leading-snug line-clamp-2">{link.description}</p>
                </div>
                <div className="mt-auto inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl bg-[var(--color-primary)] text-white text-sm font-medium">
                  Abrir Link
                  <Icon icon="material-symbols:open-in-new" className="text-sm" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All links grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Icon icon="material-symbols:link-outline" className="text-[var(--color-on-surface-variant)]" />
          <h2 className="font-semibold text-sm text-[var(--color-on-surface-variant)]">Todos los links</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[130px] rounded-2xl" />
              ))
            : regularLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => openDetail(link)}
                  className="text-left w-full rounded-2xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: (categoryColors[link.category] ?? "var(--color-primary)") + "20" }}
                    >
                      <Icon icon={link.icon || "material-symbols:link-outline"} className="text-xl" style={{ color: categoryColors[link.category] ?? "var(--color-primary)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Chip size="sm" className="mb-1.5 h-5" style={{
                        backgroundColor: (categoryColors[link.category] ?? "var(--color-primary)") + "15",
                        color: categoryColors[link.category] ?? "var(--color-primary)",
                      }}>
                        {link.category}
                      </Chip>
                      <p className="font-bold text-sm text-[var(--color-on-surface)] leading-tight">{link.title}</p>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-on-surface-variant)] leading-snug line-clamp-2 mb-4">{link.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--color-outline)] truncate max-w-[140px]">
                      {link.url.replace(/^https?:\/\//, "")}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-fixed)] text-[var(--color-primary)] flex items-center justify-center">
                      <Icon icon="material-symbols:open-in-new" className="text-sm" />
                    </div>
                  </div>
                </button>
              ))}
          {!loading && regularLinks.length === 0 && (
            <p className="col-span-full text-center text-[var(--color-on-surface-variant)] text-sm py-8">
              {links.length === 0
                ? "No hay links guardados todavía. ¡Agrega el primero!"
                : "No se encontraron links con esos filtros."}
            </p>
          )}
        </div>
      </div>

      <AddLinkModal state={addState} resetKey={resetKey} onCreated={fetchLinks} />
      <LinkDetailModal
        state={detailState}
        link={selectedLink}
        onDeleted={fetchLinks}
        onPinToggled={fetchLinks}
        onUpdated={fetchLinks}
      />

      {/* Insight ribbon — fixed bottom */}
      <div className="fixed bottom-16 lg:bottom-0 inset-x-0 lg:left-60 bg-[var(--color-inverse-surface)] text-[var(--color-inverse-on-surface)] px-5 py-3 flex items-center gap-4 z-20">
        <Icon icon="material-symbols:info-outline" className="text-xl text-[var(--color-inverse-primary)] flex-shrink-0" />
        <p className="text-xs flex-1">
          Los links se verifican periódicamente. Reporta un link roto contactando a administración.
        </p>
        <Button size="sm" variant="outline" className="border-[var(--color-inverse-primary)] text-[var(--color-inverse-primary)] flex-shrink-0 hidden sm:flex">
          Reportar
        </Button>
      </div>
    </div>
  );
}
