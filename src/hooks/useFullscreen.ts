"use client";

export function useFullscreen() {
  const enter = async (el?: HTMLElement) => {
    if (typeof document === "undefined") return false; // SSR-safe
    try {
      const target = el ?? document.documentElement;

      if (target.requestFullscreen) {
        await target.requestFullscreen();
        return true;
      }

      // Safari iOS viejo (muy limitado)
      const anyTarget = target as any;
      if (anyTarget.webkitRequestFullscreen) {
        await anyTarget.webkitRequestFullscreen();
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  const exit = async () => {
    if (typeof document === "undefined") return false; // SSR-safe
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return true;
      }
      const anyDoc = document as any;
      if (anyDoc.webkitExitFullscreen) {
        await anyDoc.webkitExitFullscreen();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const isFullscreen = () => {
    if (typeof document === "undefined") return false; // SSR-safe
    return Boolean(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement
    );
  }
  return { enter, exit, isFullscreen };
}
