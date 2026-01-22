// src/components/FullScreenLoader.tsx
"use client";

import React from "react";
import styled from "styled-components";

export default function FullScreenLoader({ label }: { label?: string }) {
  return (
    <FullScreen>
      <SpinnerCard>
        <Spin />
        <div style={{ marginTop: 10, fontWeight: 900 }}>{label ?? "Cargando…"}</div>
      </SpinnerCard>
    </FullScreen>
  );
}

const FullScreen = styled.div`
  position: fixed;
  inset: 0;
  background: #000;
  display: grid;
  place-items: center;
`;

const SpinnerCard = styled.div`
  width: min(420px, 92vw);
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  border-radius: 18px;
  padding: 18px;
  text-align: center;
`;

const Spin = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 3px solid rgba(255, 255, 255, 0.18);
  border-top-color: rgba(255, 255, 255, 0.85);
  margin: 0 auto;
  animation: s 900ms linear infinite;

  @keyframes s {
    to {
      transform: rotate(360deg);
    }
  }
`;
