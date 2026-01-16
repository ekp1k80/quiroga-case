"use client";

import { useEffect, useMemo } from "react";
import styled from "styled-components";

type AndroidScreenProps = {
	black?: boolean;
	showStatusBard?: boolean,
  fixedTime?: string; // "03:12"
	onStart?: () => void;
  onEnd?: () => void;
  timerEnd?: number;
	children?: React.ReactElement;
};

export default function ViewportWrapper({
	showStatusBard,
  fixedTime = "03:12",
	onEnd,
	onStart,
	timerEnd,
	black,
	children
}: AndroidScreenProps) {
  const timeParts = useMemo(() => {
    const [hh, mm] = fixedTime.split(":");
    return { hh: hh ?? "03", mm: mm ?? "12" };
  }, [fixedTime]);

  useEffect(() => {
    if(onStart) onStart()
    if(onEnd && timerEnd) setTimeout(() => { onEnd() }, timerEnd)
  },[])

	if(black) return (
		<Viewport>
      <PhoneFrameBlack></PhoneFrameBlack>
		</Viewport>
	)

  return (
    <Viewport>
      <PhoneFrame>
				{
					showStatusBard && (
						<StatusBar>
							<TimeSmall>
								{timeParts.hh}:{timeParts.mm}
							</TimeSmall>
							<Icons>
								<span>📶</span>
								<span>📡</span>
								<span>🔋</span>
							</Icons>
						</StatusBar>
					)
				}
        

        <LockContent>
					{children}
        </LockContent>
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
  z-index: 3;
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

const BigTime = styled.div`
  font-size: 64px;
  font-weight: 700;
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
  color: #fff;
`;

const DayText = styled.div`
  margin-top: 8px;
  font-size: 14px;
  opacity: 0.75;
  color: #fff;
`;

const GestureBar = styled.div`
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  height: 6px;
  width: 120px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
`;