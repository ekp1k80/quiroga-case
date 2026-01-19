"use client";

import React from "react";
import styled, { keyframes, css } from "styled-components";

type Props = {
  text: string;
  sizePx?: number;
  pulseMs?: number;
  minOpacity?: number;
};

export default function PulsingText({
  text,
  sizePx = 42,
  pulseMs = 2200,
  minOpacity = 0.55,
}: Props) {
  return (
    <Wrap>
      <Text
        $sizePx={sizePx}
        $pulseMs={pulseMs}
        $minOpacity={minOpacity}
      >
        {text}
      </Text>
    </Wrap>
  );
}

/* ================= styles ================= */

const pulse = (minOpacity: number) => keyframes`
  0%   { opacity: 1; }
  50%  { opacity: ${minOpacity}; }
  100% { opacity: 1; }
`;

const Wrap = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none; /* no molesta a clicks */
`;

const Text = styled.div<{
  $sizePx: number;
  $pulseMs: number;
  $minOpacity: number;
}>`
  color: #ffffff;
  font-weight: 800;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, Helvetica, Arial, sans-serif;
  font-size: ${({ $sizePx }) => $sizePx}px;
  letter-spacing: 0.5px;
  text-align: center;
  white-space: nowrap;

  ${({ $pulseMs, $minOpacity }) =>
    css`
      animation: ${pulse($minOpacity)} ${$pulseMs}ms ease-in-out infinite;
    `}
`;
