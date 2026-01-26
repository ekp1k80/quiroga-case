"use client";

import React from "react";
import styled from "styled-components";

export type SocialCounts = { likes: number; comments: number; shares: number };
export type SocialKind = "tweet";

export type SocialPost = {
  id: string;
  kind: SocialKind;
  author: string;
  handle: string;
  verified?: boolean;
  text?: string;
  timeLabel?: string;

  counts: SocialCounts;

    linkLabel?: string;

  // layout
  x: number; // 0..1
  y: number; // 0..1
  rot: number; // deg
  scale: number;
  z: number;
};

export function formatCount(n: number) {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${Math.round(n / 100) / 10}K`;
  return `${Math.round(n / 100_000) / 10}M`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const s = parts.map((p) => p[0]?.toUpperCase()).join("");
  return s || "U";
}

export default function PostCard({
  post,
  isEarly,
}: {
  post: SocialPost;
  isEarly?: boolean;
}) {
  const rot = isEarly ? Math.max(-3, Math.min(3, post.rot)) : post.rot;
  const scale = isEarly ? Math.max(post.scale, 1.04) : post.scale;

  return (
    <Card
      $early={!!isEarly}
      style={{
        transform: `rotate(${rot}deg) scale(${scale})`,
      }}
    >
      <Header>
        <Avatar aria-hidden $early={!!isEarly}>
          {initials(post.author)}
        </Avatar>

        <HeaderText>
          <NameRow>
            <Name>{post.author}</Name>
            {post.verified ? <VerifiedDot title="Verified" /> : null}
            <Handle>{post.handle}</Handle>
            {post.timeLabel ? <Dot>·</Dot> : null}
            {post.timeLabel ? <Time>{post.timeLabel}</Time> : null}
          </NameRow>
        </HeaderText>

        <More aria-hidden>•••</More>
      </Header>

      {post.text ? <Body $early={!!isEarly}>{post.text}</Body> : <BodyMuted />}
      {post.linkLabel ? (
        <LinkRow>
            <PlayIcon aria-hidden>▶</PlayIcon>
            <LinkText>{post.linkLabel}</LinkText>
        </LinkRow>
        ) : null}
      <Footer>
        <Metric>
          <Icon aria-hidden>💬</Icon>
          <span>{formatCount(post.counts.comments)}</span>
        </Metric>
        <Metric>
          <Icon aria-hidden>🔁</Icon>
          <span>{formatCount(post.counts.shares)}</span>
        </Metric>
        <Metric>
          <Icon aria-hidden>♥</Icon>
          <span>{formatCount(post.counts.likes)}</span>
        </Metric>
      </Footer>
    </Card>
  );
}

const Card = styled.div<{ $early: boolean }>`
  width: min(92vw, 360px);
  border-radius: 16px;
  background: rgba(18, 18, 20, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.42);
  padding: 12px 12px 10px 12px;
  backdrop-filter: blur(10px);
  color: rgba(255, 255, 255, 0.92);

  /* ✅ Early: más legible/“importante” */
  ${(p) =>
    p.$early
      ? `
    border: 1px solid rgba(255,255,255,0.16);
    box-shadow: 0 22px 70px rgba(0,0,0,0.58);
  `
      : ``}
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
`;

const Avatar = styled.div<{ $early: boolean }>`
  width: 38px;
  height: 38px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.12);
  font-weight: 700;
  letter-spacing: 0.5px;
  user-select: none;

  ${(p) => (p.$early ? `background: rgba(255,255,255,0.16);` : ``)}
`;

const HeaderText = styled.div`
  min-width: 0;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

const Name = styled.span`
  font-weight: 750;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const VerifiedDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(29, 155, 240, 0.95);
  display: inline-block;
  box-shadow: 0 0 0 2px rgba(29, 155, 240, 0.18);
`;

const Handle = styled.span`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  white-space: nowrap;
`;

const Dot = styled.span`
  color: rgba(255, 255, 255, 0.35);
`;

const Time = styled.span`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  white-space: nowrap;
`;

const More = styled.div`
  color: rgba(255, 255, 255, 0.55);
  font-weight: 700;
  letter-spacing: 1px;
`;

const Body = styled.div<{ $early: boolean }>`
  margin-top: 10px;
  font-size: 15px;
  line-height: 1.25;
  letter-spacing: 0.1px;

  ${(p) => (p.$early ? `font-size: 15.5px;` : ``)}
`;

const BodyMuted = styled.div`
  margin-top: 10px;
  height: 18px;
`;

const Footer = styled.div`
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: rgba(255, 255, 255, 0.62);
`;

const Metric = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
`;

const Icon = styled.span`
  opacity: 0.85;
`;

const LinkRow = styled.div`
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.92);
  font-weight: 700;
  font-size: 14px;
  user-select: none;
`;

const PlayIcon = styled.span`
  display: inline-block;
  transform: translateY(-0.5px);
  opacity: 0.95;
`;

const LinkText = styled.span`
  opacity: 0.95;
`;