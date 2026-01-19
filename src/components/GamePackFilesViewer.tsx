"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { usePackPrefetch } from "@/hooks/usePackPrefetch"; // ajustá el path si difiere
import type { PackFile } from "@/data/packs";
import AudioPlayer from "@/components/AudioPlayer"; // ajustá path
import { AudioVizConfig } from "@/data/packs"; // ajustá si el type vive en otro lado

type Props = {
  packId: string;
  title?: string;
  initialFileId?: string;
  prefetch?: "audio" | "all" | "none";
  onSelect?: (file: PackFile) => void;
};

function isPdf(f: PackFile) {
  // según tu schema: f.type === "doc" o "pdf" (lo adapto defensivo)
  return f.type === "doc";
}
function isAudio(f: PackFile) {
  return f.type === "audio";
}

function displayName(f: PackFile) {
  // según tu schema puede ser title/name
  return (f as any).title ?? (f as any).name ?? "Archivo";
}

function displayDate(f: PackFile) {
  return (f as any).date ?? (f as any).createdAt ?? "";
}

function isLocked(f: PackFile) {
  // si tu API ya filtra desbloqueados, esto casi ni se usa, pero queda.
  return Boolean((f as any).locked);
}

/** Mejora el "fit" en visores nativos de PDF (Chrome/Edge suelen obedecer) */
function withPdfViewerHints(url: string) {
  // fragmentos típicos: view=FitH, zoom=page-width, toolbar=0
  // No todos los visores lo respetan, pero no rompe nada.
  const frag = "view=FitH&zoom=page-width&toolbar=0&navpanes=0";
  return url.includes("#") ? url : `${url}#${frag}`;
}

export default function GamePackFilesViewer({
  packId,
  title = "Archivos",
  initialFileId,
  prefetch = "audio", // 👈 recomendado: audio + docs on-demand
  onSelect,
}: Props) {
  const { files, loading, error, cacheVersion, getObjectUrl, getBlob, ensureCached } = usePackPrefetch(packId, {
    prefetch,
    concurrency: 3,
  });

  console.log("files to render")
  console.log(files)

  const selectableFiles = useMemo(() => files ?? [], [files]);

  const initial = useMemo(() => {
    if (!selectableFiles.length) return null;
    if (initialFileId) return selectableFiles.find((f) => f.id === initialFileId) ?? selectableFiles[0];
    return selectableFiles[0];
  }, [selectableFiles, initialFileId]);

  const [selectedId, setSelectedId] = useState<string | null>(initial?.id ?? null);
  const selected = useMemo(
    () => selectableFiles.find((f) => f.id === selectedId) ?? null,
    [selectableFiles, selectedId]
  );

  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectFile = async (f: PackFile) => {
    if (isLocked(f)) return;
    setSelectedId(f.id);
    onSelect?.(f);
    setDrawerOpen(false);

    // ✅ trae docs/audio si no estaban cacheados
    await ensureCached(f);
  };

  useEffect(() => {
    if (!selectableFiles.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !selectableFiles.some((f) => f.id === selectedId)) {
      setSelectedId(initial?.id ?? selectableFiles[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId, selectableFiles.length]);

  // ✅ al cambiar selección, asegurar cache (por si selectedId se setea por efecto)
  useEffect(() => {
    if (!selected) return;
    if (isLocked(selected)) return;
    ensureCached(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const selectedObjectUrl = selected ? getObjectUrl(selected.id) : null;
  const selectedBlob = selected ? getBlob(selected.id) : null;

  const viewerUrl = useMemo(() => {
    if (!selected) return null;
    const url = selectedObjectUrl; // ✅ sin fallback al proxy
    if (!url) return null;
    return isPdf(selected) ? withPdfViewerHints(url) : url;
  }, [selected, selectedObjectUrl]);

  return (
    <Shell>
      {/* Top bar (mobile) */}
      <TopBar>
        <TopLeft>
          <DrawerBtn onClick={() => setDrawerOpen(true)} aria-label="Abrir archivos">
            ☰
          </DrawerBtn>
          <TopTitle>{title}</TopTitle>
        </TopLeft>
        <TopRight>
          {selected ? <TopSelected>{displayName(selected)}</TopSelected> : <TopSelected>—</TopSelected>}
        </TopRight>
      </TopBar>

      {/* Sidebar normal (desktop) */}
      <SidebarDesktop>
        <SidebarHeader>
          <SidebarTitle>{title}</SidebarTitle>
          <SidebarMeta>
            {loading ? "Cargando…" : `${selectableFiles.length} archivo${selectableFiles.length === 1 ? "" : "s"}`}
          </SidebarMeta>
        </SidebarHeader>

        <List>
          {loading && <SkeletonList />}
          {!loading &&
            selectableFiles.map((f) => {
              const active = f.id === selectedId;
              const locked = isLocked(f);
              return (
                <Row key={f.id} $active={active} $locked={locked} onClick={() => selectFile(f)}>
                  <IconBadge $kind={isPdf(f) ? "pdf" : "audio"} $locked={locked}>
                    {locked ? "🔒" : isPdf(f) ? "📄" : "🎧"}
                  </IconBadge>

                  <RowMain>
                    <RowName title={displayName(f)}>{displayName(f)}</RowName>
                    <RowMeta>
                      <span>{isPdf(f) ? "Documento" : "Audio"}</span>
                      <span>{displayDate(f) || " "}</span>
                    </RowMeta>
                  </RowMain>

                  <RowRight aria-hidden>›</RowRight>
                </Row>
              );
            })}
        </List>
      </SidebarDesktop>

      {/* Drawer (mobile/tablet) */}
      <DrawerOverlay $open={drawerOpen} onClick={() => setDrawerOpen(false)} />
      <SidebarDrawer $open={drawerOpen}>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerClose onClick={() => setDrawerOpen(false)} aria-label="Cerrar">
            ✕
          </DrawerClose>
        </DrawerHeader>

        <List>
          {loading && <SkeletonList />}
          {!loading &&
            selectableFiles.map((f) => {
              const active = f.id === selectedId;
              const locked = isLocked(f);
              return (
                <Row key={f.id} $active={active} $locked={locked} onClick={() => selectFile(f)}>
                  <IconBadge $kind={isPdf(f) ? "pdf" : "audio"} $locked={locked}>
                    {locked ? "🔒" : isPdf(f) ? "📄" : "🎧"}
                  </IconBadge>

                  <RowMain>
                    <RowName title={displayName(f)}>{displayName(f)}</RowName>
                    <RowMeta>
                      <span>{isPdf(f) ? "Documento" : "Audio"}</span>
                      <span>{displayDate(f) || " "}</span>
                    </RowMeta>
                  </RowMain>

                  <RowRight aria-hidden>›</RowRight>
                </Row>
              );
            })}
        </List>
      </SidebarDrawer>

      {/* Viewer */}
      <Viewer>
        {error ? (
          <EmptyState>
            <EmptyTitle>Error</EmptyTitle>
            <EmptyText>{error}</EmptyText>
          </EmptyState>
        ) : !selected ? (
          <EmptyState>
            <EmptyTitle>Sin selección</EmptyTitle>
            <EmptyText>Elegí un archivo para visualizar.</EmptyText>
          </EmptyState>
        ) : isLocked(selected) ? (
          <EmptyState>
            <EmptyTitle>Bloqueado</EmptyTitle>
            <EmptyText>Se desbloquea más adelante.</EmptyText>
          </EmptyState>
        ) : isPdf(selected) ? (
          <Pane>
            <PaneHeader>
              <PaneTitle>{displayName(selected)}</PaneTitle>
              <PaneActions>
                {viewerUrl && (
                  <ActionLink href={viewerUrl} target="_blank" rel="noreferrer">
                    Abrir
                  </ActionLink>
                )}
              </PaneActions>
            </PaneHeader>

            {/* PDF responsive: ocupa todo el pane. */}
            <PdfWrap>
              {viewerUrl ? (
                // <object> suele “fittear” un poco mejor que iframe en algunos navegadores
                <PdfObject data={viewerUrl} type="application/pdf" aria-label={displayName(selected)}>
                  {/* fallback si no soporta embed */}
                  <FallbackBox>
                    <div>Tu navegador no puede embeber PDFs.</div>
                    <a href={viewerUrl} target="_blank" rel="noreferrer">
                      Abrir PDF
                    </a>
                  </FallbackBox>
                </PdfObject>
              ) : (
                <LoadingBox>Preparando documento… (cache: {cacheVersion})</LoadingBox>
              )}
            </PdfWrap>
          </Pane>
        ) : (
          <Pane>
            <PaneHeader>
              <PaneTitle>{displayName(selected)}</PaneTitle>
              <PaneActions>
                {viewerUrl && (
                  <ActionLink href={viewerUrl} target="_blank" rel="noreferrer">
                    Abrir
                  </ActionLink>
                )}
              </PaneActions>
            </PaneHeader>

            <AudioWrap>
              {/* Usamos tu AudioPlayer sí o sí */}
              <AudioPlayer
                src={viewerUrl as string}
                blob={selectedBlob as Blob}
                title={(selected as any).title ?? displayName(selected)}
                viz={((selected as any).viz ?? undefined) as AudioVizConfig}
              />
            </AudioWrap>
          </Pane>
        )}
      </Viewer>
    </Shell>
  );
}

/* ===================== Styles ===================== */

const Shell = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 320px 1fr;
  grid-template-rows: auto 1fr;
  gap: 12px;
  color: #fff;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const TopBar = styled.div`
  grid-column: 1 / -1;
  display: none;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.06);

  @media (max-width: 900px) {
    display: flex;
  }
`;

const TopLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;
const TopRight = styled.div`
  min-width: 0;
`;

const DrawerBtn = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border-radius: 12px;
  padding: 8px 10px;
  cursor: pointer;
`;

const TopTitle = styled.div`
  font-weight: 900;
  font-size: 13px;
  opacity: 0.95;
`;

const TopSelected = styled.div`
  font-size: 12px;
  opacity: 0.75;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 46vw;
`;

const SidebarDesktop = styled.aside`
  grid-row: 2;
  height: 100%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 900px) {
    display: none;
  }
`;

const SidebarHeader = styled.div`
  padding: 14px 14px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(0, 0, 0, 0.20);
`;

const SidebarTitle = styled.div`
  font-weight: 900;
  font-size: 14px;
`;

const SidebarMeta = styled.div`
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.7;
`;

const DrawerOverlay = styled.div<{ $open: boolean }>`
  display: none;

  @media (max-width: 900px) {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    opacity: ${(p) => (p.$open ? 1 : 0)};
    pointer-events: ${(p) => (p.$open ? "auto" : "none")};
    transition: opacity 180ms ease;
    z-index: 2000;
  }
`;

const SidebarDrawer = styled.aside<{ $open: boolean }>`
  display: none;

  @media (max-width: 900px) {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(360px, 88vw);
    background: rgba(18, 18, 18, 0.98);
    border-right: 1px solid rgba(255, 255, 255, 0.12);
    z-index: 2100;
    transform: translateX(${(p) => (p.$open ? "0%" : "-102%")});
    transition: transform 220ms ease;
    flex-direction: column;
  }
`;

const DrawerHeader = styled.div`
  padding: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const DrawerTitle = styled.div`
  font-weight: 900;
  font-size: 14px;
`;

const DrawerClose = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border-radius: 12px;
  padding: 8px 10px;
  cursor: pointer;
`;

const List = styled.div`
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
`;

const Row = styled.button<{ $active: boolean; $locked: boolean }>`
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: ${({ $active }) => ($active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)")};
  color: #fff;
  padding: 10px;
  display: grid;
  grid-template-columns: 34px 1fr 16px;
  gap: 10px;
  align-items: center;
  cursor: ${({ $locked }) => ($locked ? "not-allowed" : "pointer")};
  opacity: ${({ $locked }) => ($locked ? 0.55 : 1)};
  text-align: left;

  &:hover {
    background: ${({ $active }) => ($active ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)")};
  }
`;

const IconBadge = styled.div<{ $kind: "pdf" | "audio"; $locked: boolean }>`
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: ${({ $locked, $kind }) =>
    $locked ? "rgba(255,255,255,0.06)" : $kind === "pdf" ? "rgba(120,180,255,0.12)" : "rgba(180,255,180,0.12)"};
`;

const RowMain = styled.div`
  min-width: 0;
`;

const RowName = styled.div`
  font-weight: 900;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RowMeta = styled.div`
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 11px;
  opacity: 0.7;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 48%;
  }
`;

const RowRight = styled.div`
  opacity: 0.6;
  font-size: 18px;
`;

const Viewer = styled.section`
  grid-row: 2;
  height: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 18px;
  overflow: hidden;

  @media (max-width: 900px) {
    grid-row: 2;
  }
`;

const Pane = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const PaneHeader = styled.div`
  padding: 14px 14px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(0, 0, 0, 0.20);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const PaneTitle = styled.div`
  font-weight: 900;
  font-size: 14px;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PaneActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionLink = styled.a`
  font-size: 12px;
  opacity: 0.85;
  color: #fff;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
  padding: 7px 10px;
  border-radius: 12px;

  &:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.12);
  }
`;

const PdfWrap = styled.div`
  flex: 1;
  min-height: 0; /* clave para que el embed no colapse */
  background: rgba(0, 0, 0, 0.18);
`;

const PdfObject = styled.object`
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
`;

const AudioWrap = styled.div`
  flex: 1;
  min-height: 0;
  padding: 14px;
`;

const EmptyState = styled.div`
  height: 100%;
  display: grid;
  place-items: center;
  padding: 24px;
`;

const EmptyTitle = styled.div`
  font-weight: 900;
  font-size: 16px;
`;

const EmptyText = styled.div`
  margin-top: 8px;
  opacity: 0.75;
  font-size: 13px;
  text-align: center;
  max-width: 420px;
`;

const LoadingBox = styled.div`
  height: 100%;
  display: grid;
  place-items: center;
  opacity: 0.75;
`;

const FallbackBox = styled.div`
  height: 100%;
  display: grid;
  place-items: center;
  gap: 10px;
  padding: 20px;
  text-align: center;

  a {
    color: #fff;
    opacity: 0.9;
  }
`;

function SkeletonList() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </>
  );
}

const shimmer = css`
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.10) 45%,
    rgba(255, 255, 255, 0.05) 90%
  );
  background-size: 200% 100%;
  animation: sk 1.2s ease-in-out infinite;

  @keyframes sk {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const SkeletonRow = styled.div`
  height: 54px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  ${shimmer}
`;
