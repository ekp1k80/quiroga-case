"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";

type AndroidScreenProps = {
  black?: boolean;
  showStatusBar?: boolean;
  fixedTime?: string; // "03:12"
  onStart?: () => void;
  onEnd?: () => void;
  timerEnd?: number;
  children?: React.ReactNode;

  // NUEVO:
  onToggleShade?: (open: boolean) => void;
};

export default function ViewportWrapper({
  showStatusBar,
  fixedTime = "03:12",
  onEnd,
  onStart,
  timerEnd,
  black,
  children,
  onToggleShade,
}: AndroidScreenProps) {
  const timeParts = useMemo(() => {
    const [hh, mm] = fixedTime.split(":");
    return { hh: hh ?? "03", mm: mm ?? "12" };
  }, [fixedTime]);

  useEffect(() => {
    onStart?.();
    let t: any;
    if (onEnd && typeof timerEnd === "number") {
      t = setTimeout(() => onEnd(), timerEnd);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [onStart, onEnd, timerEnd]);

  // swipe-down simple desde la parte superior
  const startY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const y = e.touches[0]?.clientY ?? 0;
    if (y <= 60) startY.current = y;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current == null) return;
    const y = e.touches[0]?.clientY ?? 0;
    if (y - startY.current > 35) {
      onToggleShade?.(true);
      startY.current = null;
    }
  };

  const handleTouchEnd = () => {
    startY.current = null;
  };

  if (black)
    return (
      <Viewport>
        <PhoneFrameBlack />
      </Viewport>
    );

  return (
    <Viewport onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <PhoneFrame>
        {showStatusBar && (
          <StatusBar
            role="button"
            aria-label="Status bar"
            onClick={() => onToggleShade?.(true)}
          >
            <TimeSmall>
              {timeParts.hh}:{timeParts.mm}
            </TimeSmall>
            <Icons>
              <span>📶</span>
              <span>📡</span>
              <span>🔋</span>
            </Icons>
          </StatusBar>
        )}

        <LockContent>{children}</LockContent>
      </PhoneFrame>
    </Viewport>
  );
}

/* ===================== styled-components ===================== */

const Viewport = styled.div`
  height: 100svh;
  width: 100%;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: stretch;
`;

const PhoneFrame = styled.div`
  position: relative;
  width: 100%;
  max-width: 420px;
  height: 100svh;
  background: #0b0b0b;
  overflow: hidden;
`;

const PhoneFrameBlack = styled.div`
  position: relative;
  width: 100%;
  max-width: 420px;
  height: 100svh;
  background: #000;
  overflow: hidden;
`;

const StatusBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
  z-index: 30;
  cursor: pointer;
  user-select: none;
`;

const TimeSmall = styled.div`
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #fff;
`;

const Icons = styled.div`
  display: flex;
  gap: 8px;
  font-size: 12px;
  opacity: 0.9;
  color: #fff;
`;

const LockContent = styled.div`
  position: absolute;
  inset: 0;
  padding-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
