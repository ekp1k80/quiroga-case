// src\components\GamePackFilesViewer.tsx
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import styled, { css } from "styled-components";
import { usePackPrefetch } from "@/hooks/usePackPrefetch";
import type { PackFile } from "@/data/packs";
import AudioPlayer from "@/components/AudioPlayer";
import type { AudioVizConfig } from "@/data/packs";

type Props = {
  packId: string;
  title?: string;
  initialFileId?: string;
  prefetch?: "audio" | "all" | "none";
  onSelect?: (file: PackFile) => void;

  /**
   * ✅ se dispara cuando el usuario vio todos los files del pack (según cache local)
   * Útil para que el orquestador cambie de pantalla inmediatamente.
   */
  onAllSeen?: (payload: { packId: string; fileIds: string[] }) => void;

  /**
   * ✅ si true, cuando se completa "all seen" llama al backend
   * para que el server decida si avanza storyNode (sin exponer patch).
   */
  notifyBackendOnAllSeen?: boolean;
};

function isPdf(f: PackFile) {
  return f.type === "doc";
}
function isAudio(f: PackFile) {
  return f.type === "audio";
}
function isImg(f: PackFile) {
  return f.type === "img";
}

function displayName(f: PackFile) {
  return (f as any).title ?? (f as any).name ?? "Archivo";
}

function displayDate(f: PackFile) {
  return (f as any).date ?? (f as any).createdAt ?? "";
}

function kindLabel(f: PackFile) {
  if (isPdf(f)) return "Documento";
  if (isAudio(f)) return "Audio";
  if (isImg(f)) return "Imagen";
  return "Archivo";
}

function isLocked(f: PackFile) {
  return Boolean((f as any).locked);
}

function withPdfViewerHints(url: string) {
  const frag = "view=FitH&zoom=page-width&toolbar=0&navpanes=0";
  return url.includes("#") ? url : `${url}#${frag}`;
}

function storageKey(packId: string) {
  return `cq_seen_files__${packId}`;
}

function readSeen(packId: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(packId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.map(String));
  } catch {
    return new Set();
  }
}

function writeSeen(packId: string, seen: Set<string>) {
  try {
    localStorage.setItem(storageKey(packId), JSON.stringify(Array.from(seen)));
  } catch {
    // ignore
  }
}

export default function GamePackFilesViewer({
  packId,
  title = "Archivos",
  initialFileId,
  prefetch = "audio",
  onSelect,
  onAllSeen,
  notifyBackendOnAllSeen = true,
}: Props) {
  const { files, loading, error, cacheVersion, getObjectUrl, getBlob, ensureCached } = usePackPrefetch(packId, {
    prefetch,
    concurrency: 3,
  });
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

  // ✅ vistos (local)
  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set());
  const allSeenTriggeredRef = useRef(false);

  // cargar vistos al cambiar pack
  useEffect(() => {
    allSeenTriggeredRef.current = false;
    setSeenIds(readSeen(packId));
  }, [packId]);

  const markSeen = (fileId: string) => {
    setSeenIds((prev) => {
      if (prev.has(fileId)) return prev;
      const next = new Set(prev);
      next.add(fileId);
      writeSeen(packId, next);
      return next;
    });
  };

  const selectFile = async (f: PackFile) => {
    if (isLocked(f)) return;
    setSelectedId(f.id);
    onSelect?.(f);
    setDrawerOpen(false);

    // trae file al cache
    await ensureCached(f);

    // marcamos como visto (una vez que intentamos abrirlo)
    markSeen(f.id);
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

  // al cambiar selección por efecto, cache + visto
  useEffect(() => {
    if (!selected) return;
    if (isLocked(selected)) return;
    ensureCached(selected);
    markSeen(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const selectedObjectUrl = selected ? getObjectUrl(selected.id) : null;
  const selectedBlob = selected ? getBlob(selected.id) : null;

  const viewerUrl = useMemo(() => {
    if (!selected) return null;
    const url = selectedObjectUrl;
    if (!url) return null;
    return isPdf(selected) ? withPdfViewerHints(url) : url;
  }, [selected, selectedObjectUrl]);

  // ✅ all seen: si todos los files del pack están en vistos, disparamos 1 vez.
  const allSeen = useMemo(() => {
    if (!selectableFiles.length) return false;
    // ignoramos locked en el conteo, por si el pack trae cosas “futuras”
    const unlocked = selectableFiles.filter((f) => !isLocked(f));
    if (!unlocked.length) return false;
    return unlocked.every((f) => seenIds.has(f.id));
  }, [selectableFiles, seenIds]);

  useEffect(() => {
    if (!allSeen) return;
    if (allSeenTriggeredRef.current) return;
    allSeenTriggeredRef.current = true;

    const unlockedIds = selectableFiles.filter((f) => !isLocked(f)).map((f) => f.id);
    onAllSeen?.({ packId, fileIds: unlockedIds });

    if (!notifyBackendOnAllSeen) return;

    // ✅ backend decide si avanza storyNode
    fetch("/api/progress/files-seen", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        packId,
        fileIds: unlockedIds,
        // si preferís la otra modalidad:
        // seenAll: true,
      }),
    }).catch(() => {});
  }, [allSeen, selectableFiles, packId, onAllSeen, notifyBackendOnAllSeen]);

  return (
    <Shell>
      <TopBar>
        <TopLeft>
          <DrawerBtn onClick={() => setDrawerOpen(true)} aria-label="Abrir archivos">
            ☰
          </DrawerBtn>
          <TopTitle>
            {title}
            {allSeen ? <SeenPill>✓ vistos</SeenPill> : null}
          </TopTitle>
        </TopLeft>
        <TopRight>
          {selected ? <TopSelected>{displayName(selected)}</TopSelected> : <TopSelected>—</TopSelected>}
        </TopRight>
      </TopBar>

      <SidebarDesktop>
        <SidebarHeader>
          <SidebarTitle>
            {title}
            {allSeen ? <SeenPill>✓ vistos</SeenPill> : null}
          </SidebarTitle>
          <SidebarMeta>
            {loading ? "Cargando…" : `${selectableFiles.length} archivo${selectableFiles.length === 1 ? "" : "s"}`}
          </SidebarMeta>
        </SidebarHeader>

        <List>
          {loading && <SkeletonList />}
          {!loading &&
            selectableFiles.filter(f => !f.notShowFileViewer).map((f) => {
              const active = f.id === selectedId;
              const locked = isLocked(f);
              const seen = seenIds.has(f.id);

              const icon = locked ? "🔒" : isPdf(f) ? "📄" : isAudio(f) ? "🎧" : isImg(f) ? "🖼️" : "📁";

              return (
                <Row key={f.id} $active={active} $locked={locked} $seen={seen} onClick={() => selectFile(f)}>
                  <IconBadge $kind={isPdf(f) ? "pdf" : isAudio(f) ? "audio" : "img"} $locked={locked}>
                    {icon}
                  </IconBadge>

                  <RowMain>
                    <RowName title={displayName(f)}>
                      {displayName(f)} {seen && !locked ? <SeenTick aria-label="Visto">✓</SeenTick> : null}
                    </RowName>
                    <RowMeta>
                      <span>{kindLabel(f)}</span>
                      <span>{displayDate(f) || " "}</span>
                    </RowMeta>
                  </RowMain>

                  <RowRight aria-hidden>›</RowRight>
                </Row>
              );
            })}
        </List>
      </SidebarDesktop>

      <DrawerOverlay $open={drawerOpen} onClick={() => setDrawerOpen(false)} />
      <SidebarDrawer $open={drawerOpen}>
        <DrawerHeader>
          <DrawerTitle>
            {title}
            {allSeen ? <SeenPill>✓ vistos</SeenPill> : null}
          </DrawerTitle>
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
              const seen = seenIds.has(f.id);

              const icon = locked ? "🔒" : isPdf(f) ? "📄" : isAudio(f) ? "🎧" : isImg(f) ? "🖼️" : "📁";

              return (
                <Row key={f.id} $active={active} $locked={locked} $seen={seen} onClick={() => selectFile(f)}>
                  <IconBadge $kind={isPdf(f) ? "pdf" : isAudio(f) ? "audio" : "img"} $locked={locked}>
                    {icon}
                  </IconBadge>

                  <RowMain>
                    <RowName title={displayName(f)}>
                      {displayName(f)} {seen && !locked ? <SeenTick aria-label="Visto">✓</SeenTick> : null}
                    </RowName>
                    <RowMeta>
                      <span>{kindLabel(f)}</span>
                      <span>{displayDate(f) || " "}</span>
                    </RowMeta>
                  </RowMain>

                  <RowRight aria-hidden>›</RowRight>
                </Row>
              );
            })}
        </List>
      </SidebarDrawer>

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

            <PdfWrap>
              {viewerUrl ? (
                <PdfObject data={viewerUrl} type="application/pdf" aria-label={displayName(selected)}>
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
        ) : isImg(selected) ? (
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

            <ImgWrap>
              {viewerUrl ? (
                <Img
                  src={viewerUrl}
                  alt={(selected as any).alt ?? displayName(selected)}
                  draggable={false}
                />
              ) : (
                <LoadingBox>Preparando imagen… (cache: {cacheVersion})</LoadingBox>
              )}
            </ImgWrap>
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
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SeenPill = styled.span`
  font-size: 11px;
  font-weight: 900;
  padding: 6px 9px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(140, 255, 180, 0.10);
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
  display: flex;
  gap: 8px;
  align-items: center;
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
  display: flex;
  gap: 8px;
  align-items: center;
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

const Row = styled.button<{ $active: boolean; $locked: boolean; $seen: boolean }>`
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
  opacity: ${({ $locked, $seen }) => ($locked ? 0.55 : $seen ? 0.78 : 1)};
  text-align: left;

  &:hover {
    background: ${({ $active }) => ($active ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)")};
  }
`;

const IconBadge = styled.div<{ $kind: "pdf" | "audio" | "img"; $locked: boolean }>`
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: ${({ $locked, $kind }) =>
    $locked
      ? "rgba(255,255,255,0.06)"
      : $kind === "pdf"
      ? "rgba(120,180,255,0.12)"
      : $kind === "img"
      ? "rgba(255,220,160,0.10)"
      : "rgba(180,255,180,0.12)"};
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

const SeenTick = styled.span`
  margin-left: 6px;
  opacity: 0.9;
  font-weight: 900;
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
  min-height: 0;
  background: rgba(0, 0, 0, 0.18);
`;

const PdfObject = styled.object`
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
`;

const ImgWrap = styled.div`
  flex: 1;
  min-height: 0;
  background: rgba(0, 0, 0, 0.18);
  display: grid;
  place-items: center;
  padding: 12px;
`;

const Img = styled.img`
  max-width: 100%;
  max-height: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.04);
  object-fit: contain;
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
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const SkeletonRow = styled.div`
  height: 54px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  ${shimmer}
`;
