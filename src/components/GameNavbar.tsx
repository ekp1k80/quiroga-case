// src/components/GameNavbar.tsx
"use client";

import React from "react";
import styled from "styled-components";

type Tab = "chat" | "files" | "qr";

type Props = {
  tabs: Tab[];
  active: Tab;
  onSelect: (t: Tab) => void;
};

export default function GameNavbar({ tabs, active, onSelect }: Props) {
  return (
    <Bar>
      <Inner>
        {tabs.includes("chat") ? (
          <Btn $active={active === "chat"} onClick={() => onSelect("chat")}>
            Chat
          </Btn>
        ) : null}
        {tabs.includes("files") ? (
          <Btn $active={active === "files"} onClick={() => onSelect("files")}>
            Archivos
          </Btn>
        ) : null}
        {tabs.includes("qr") ? (
          <Btn $active={active === "qr"} onClick={() => onSelect("qr")}>
            QR
          </Btn>
        ) : null}
      </Inner>
    </Bar>
  );
}

const Bar = styled.div`
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.92);
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
`;

const Inner = styled.div`
  width: min(1100px, 100%);
  margin: 0 auto;
  padding: 10px 12px;
  display: flex;
  gap: 10px;
  justify-content: center;
`;

const Btn = styled.button<{ $active: boolean }>`
  border-radius: 999px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, ${(p) => (p.$active ? 0.22 : 0.14)});
  background: rgba(255, 255, 255, ${(p) => (p.$active ? 0.14 : 0.08)});
  color: #fff;
  font-weight: 900;
  font-size: 12px;
  cursor: pointer;
`;
