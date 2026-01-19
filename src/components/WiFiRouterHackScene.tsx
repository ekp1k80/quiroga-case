"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import ViewportWrapper from "./ViewportWrapper";

type Props = {
  fixedTime?: string; // "03:12"
  onAfter?: () => void; // callback final
};

type Net = { ssid: string; secure: boolean; hint?: string };

type Step =
  | "intro"
  | "wifi_list"
  | "wifi_password"
  | "browser_router_login"
  | "router_home"
  | "router_cameras"
  | "camera_detail";

const ADMIN_SSID = "Administración del edificio";
const ADMIN_PASS = "admin1234";
const ROUTER_IP = "192.168.0.1";

export default function WiFiRouterHackScene({ fixedTime = "03:12", onAfter }: Props) {
  const [shadeOpen, setShadeOpen] = useState(false);

  const [step, setStep] = useState<Step>("intro");
  const [scanning, setScanning] = useState(false);

  const [selectedSsid, setSelectedSsid] = useState<string | null>(null);
  const [pass, setPass] = useState("");
  const [passError, setPassError] = useState<string | null>(null);

  const [url, setUrl] = useState("");
  const [nav, setNav] = useState<"status" | "internet" | "lan" | "wifi" | "security" | "devices" | "cameras">("status");

  const networks: Net[] = useMemo(
    () => [
      { ssid: "Hector_2.4G", secure: true },
      { ssid: "Vecino-5G", secure: true },
      { ssid: ADMIN_SSID, secure: true, hint: "WPA2" },
      { ssid: "ImpresoraHP-Direct", secure: false },
    ],
    []
  );

  // Animación de "escaneo"
  const startScan = async () => {
    setScanning(true);
    setStep("wifi_list");
    setShadeOpen(false);
    // pequeño delay fake
    await new Promise((r) => setTimeout(r, 850));
    setScanning(false);
  };

  const openWifiFromShade = () => {
    setShadeOpen(true);
  };

  const pickNetwork = (ssid: string) => {
    setSelectedSsid(ssid);
    if (ssid === ADMIN_SSID) {
      setPass("");
      setPassError(null);
      setStep("wifi_password");
    }
  };

  const submitPassword = () => {
    if (selectedSsid !== ADMIN_SSID) return;
    if (pass.trim() !== ADMIN_PASS) {
      setPassError("Contraseña incorrecta.");
      return;
    }
    setPassError(null);
    // conectado -> navegador
    setStep("browser_router_login");
    setShadeOpen(false);
  };

  const goRouter = () => {
    // sólo permitimos entrar si url es 192.168.0.1 (simulado)
    if (url.trim() !== ROUTER_IP) return;
    setStep("router_home");
    setNav("status");
  };

  const goCameras = () => {
    setNav("cameras");
    setStep("router_cameras");
  };

  const openCamera = () => {
    setStep("camera_detail");
  };

  const finish = () => {
    onAfter?.();
  };

  return (
    <ViewportWrapper
      showStatusBar
      fixedTime={fixedTime}
      onToggleShade={(open) => setShadeOpen(open)}
    >
      <Root>
        {/* Shade desplegable */}
        <Shade open={shadeOpen}>
          <ShadeHeader>
            <Pill />
            <ShadeTitle>Panel rápido</ShadeTitle>
            <ShadeClose onClick={() => setShadeOpen(false)} aria-label="Cerrar">
              ✕
            </ShadeClose>
          </ShadeHeader>

          <QuickGrid>
            <QuickTile onClick={() => setStep("wifi_list")} aria-label="Wi-Fi">
              <TileIcon>📶</TileIcon>
              <TileText>Wi-Fi</TileText>
            </QuickTile>

            <QuickTile disabled aria-label="Bluetooth">
              <TileIcon>🟦</TileIcon>
              <TileText>Bluetooth</TileText>
            </QuickTile>

            <QuickTile disabled aria-label="Linterna">
              <TileIcon>🔦</TileIcon>
              <TileText>Linterna</TileText>
            </QuickTile>

            <QuickTile disabled aria-label="Sonido">
              <TileIcon>🔊</TileIcon>
              <TileText>Sonido</TileText>
            </QuickTile>
          </QuickGrid>

          <ShadeHint>
            Tip: tocá <b>Wi-Fi</b> o deslizá hacia arriba para cerrar.
          </ShadeHint>
        </Shade>

        {/* Contenido principal */}
        <Card>
          <HeaderRow>
            <Title>Conexiones</Title>
          </HeaderRow>

          {step === "intro" && (
            <Section>
              <Paragraph>
                Martín abre “Redes y conexión” en el teléfono de Héctor.
              </Paragraph>
            </Section>
          )}

          {(step === "wifi_list" || step === "wifi_password") && (
            <Section>
              <RowBetween>
                <H2>Wi-Fi</H2>
                <RightMuted>{scanning ? "Escaneando…" : "Redes disponibles"}</RightMuted>
              </RowBetween>

              <List>
                {networks.map((n) => (
                  <NetRow
                    key={n.ssid}
                    onClick={() => pickNetwork(n.ssid)}
                    $active={selectedSsid === n.ssid}
                  >
                    <NetLeft>
                      <NetName>{n.ssid}</NetName>
                      <NetMeta>{n.secure ? (n.hint ?? "Segura") : "Abierta"}</NetMeta>
                    </NetLeft>
                    <NetRight>{n.secure ? "🔒" : "✅"}</NetRight>
                  </NetRow>
                ))}
              </List>

              <FooterRow>
                <SmallBtn onClick={() => setStep("intro")}>Atrás</SmallBtn>
                <SmallBtn onClick={() => setShadeOpen(true)}>Bajar barra</SmallBtn>
              </FooterRow>

              {step === "wifi_password" && (
                <ModalOverlay onClick={() => setStep("wifi_list")}>
                  <Modal onClick={(e) => e.stopPropagation()}>
                    <ModalTitle>Ingresar contraseña</ModalTitle>
                    <ModalSubtitle>{selectedSsid}</ModalSubtitle>

                    <Input
                      type="password"
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      placeholder="Contraseña"
                      autoFocus
                    />

                    {passError && <ErrorText>{passError}</ErrorText>}

                    <ModalActions>
                      <SmallBtn onClick={() => setStep("wifi_list")}>Cancelar</SmallBtn>
                      <PrimaryBtn onClick={submitPassword}>Conectar</PrimaryBtn>
                    </ModalActions>

                    <TinyHint>WPA2 • Señal fuerte</TinyHint>
                  </Modal>
                </ModalOverlay>
              )}
            </Section>
          )}

          {step === "browser_router_login" && (
            <Section>
              <H2>Navegador</H2>
              <BrowserBar>
                <UrlBadge>🔒</UrlBadge>
                <UrlInput
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  spellCheck={false}
                />
                <GoBtn onClick={goRouter}>Ir</GoBtn>
              </BrowserBar>

              <BrowserBody>
                <Paragraph>
                  Debes ingresar al router. Si no sabes entrar al router preguntale a tu amigo/a futuro ingeniero informatico de confianza.
                </Paragraph>
                <PrimaryBtn onClick={goRouter} disabled={url.trim() !== ROUTER_IP}>
                  Abrir {url}
                </PrimaryBtn>
              </BrowserBody>

              <FooterRow>
                <SmallBtn onClick={() => setStep("wifi_list")}>Volver a Wi-Fi</SmallBtn>
              </FooterRow>
            </Section>
          )}

          {(step === "router_home" || step === "router_cameras" || step === "camera_detail") && (
            <RouterShell>
              <RouterTop>
                <RouterBrand>
                  <b>ACME Router</b>
                  <span>• {ROUTER_IP}</span>
                </RouterBrand>
                <RouterTopRight>admin</RouterTopRight>
              </RouterTop>

              <RouterMain>
                <RouterNav>
                  <NavItem $active={nav === "status"} onClick={() => { setNav("status"); setStep("router_home"); }}>
                    Estado
                  </NavItem>
                  <NavItem $active={nav === "internet"} onClick={() => setNav("internet")} disabled>
                    Internet
                  </NavItem>
                  <NavItem $active={nav === "lan"} onClick={() => setNav("lan")} disabled>
                    LAN
                  </NavItem>
                  <NavItem $active={nav === "wifi"} onClick={() => setNav("wifi")} disabled>
                    Wi-Fi
                  </NavItem>
                  <NavItem $active={nav === "devices"} onClick={() => setNav("devices")} disabled>
                    Dispositivos
                  </NavItem>

                  {/* LO QUE TE IMPORTA */}
                  <NavItem $active={nav === "cameras"} onClick={goCameras}>
                    Cámaras IP
                  </NavItem>

                  <NavItem $active={nav === "security"} onClick={() => setNav("security")} disabled>
                    Seguridad
                  </NavItem>
                </RouterNav>

                <RouterContent>
                  {step === "router_home" && (
                    <>
                      <H2>Estado</H2>
                      <RouterGrid>
                        <InfoBox>
                          <InfoLabel>Uptime</InfoLabel>
                          <InfoValue>12d 04h</InfoValue>
                        </InfoBox>
                        <InfoBox>
                          <InfoLabel>WAN</InfoLabel>
                          <InfoValue>Conectado</InfoValue>
                        </InfoBox>
                        <InfoBox>
                          <InfoLabel>LAN</InfoLabel>
                          <InfoValue>192.168.0.1</InfoValue>
                        </InfoBox>
                        <InfoBox>
                          <InfoLabel>Wi-Fi</InfoLabel>
                          <InfoValue>Activo</InfoValue>
                        </InfoBox>
                      </RouterGrid>

                      <Paragraph style={{ marginTop: 12, opacity: 0.8 }}>
                        Martín busca algo raro… un menú olvidado.
                      </Paragraph>

                      <PrimaryBtn onClick={goCameras}>Abrir “Cámaras IP”</PrimaryBtn>
                    </>
                  )}

                  {step === "router_cameras" && (
                    <>
                      <H2>Cámaras IP</H2>
                      <Paragraph style={{ opacity: 0.85 }}>
                        Dispositivos detectados en la red local:
                      </Paragraph>

                      <CameraRow onClick={openCamera}>
                        <CamLeft>
                          <CamName>Cámara IP — Pasillo 3er piso</CamName>
                          <CamMeta>RTSP • Grabación local • Señal OK</CamMeta>
                        </CamLeft>
                        <CamRight>▶</CamRight>
                      </CameraRow>

                      <FooterRow>
                        <SmallBtn onClick={() => { setStep("router_home"); setNav("status"); }}>
                          Volver
                        </SmallBtn>
                      </FooterRow>
                    </>
                  )}

                  {step === "camera_detail" && (
                    <>
                      <H2>Pasillo 3er piso</H2>
                      <FakePreview>
                        <Scanline />
                        <PreviewText>PREVIEW (simulado)</PreviewText>
                      </FakePreview>

                      <PrimaryBtn onClick={finish}>
                        Ver grabaciones guardadas
                      </PrimaryBtn>

                      <FooterRow>
                        <SmallBtn onClick={() => setStep("router_cameras")}>Atrás</SmallBtn>
                      </FooterRow>
                    </>
                  )}
                </RouterContent>
              </RouterMain>
            </RouterShell>
          )}
        </Card>
      </Root>
    </ViewportWrapper>
  );
}

/* ===================== styles ===================== */

const Root = styled.div`
  width: 100%;
  height: 100%;
  padding: 18px 14px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Card = styled.div`
  width: 100%;
  max-width: 380px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 18px;
  padding: 14px;
  color: #fff;
  position: relative;
  z-index: 1;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const Title = styled.div`
  font-weight: 700;
  font-size: 18px;
`;

const Section = styled.div`
  margin-top: 12px;
`;

const Paragraph = styled.p`
  margin: 10px 0 14px;
  opacity: 0.9;
  line-height: 1.35;
`;

const H2 = styled.div`
  font-weight: 700;
  font-size: 16px;
`;

const RightMuted = styled.div`
  opacity: 0.7;
  font-size: 12px;
`;

const RowBetween = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
`;

const PrimaryBtn = styled.button`
  width: 100%;
  padding: 12px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.14);
  color: #fff;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const SmallBtn = styled.button`
  padding: 9px 10px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.07);
  color: #fff;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const List = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NetRow = styled.button<{ $active?: boolean }>`
  text-align: left;
  width: 100%;
  border-radius: 14px;
  padding: 10px 12px;
  border: 1px solid rgba(255,255,255,0.12);
  background: ${({ $active }) => ($active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)")};
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  color: #fff;
`;

const NetLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const NetName = styled.div`
  font-weight: 700;
  font-size: 13px;
`;

const NetMeta = styled.div`
  font-size: 11px;
  opacity: 0.7;
`;

const NetRight = styled.div`
  opacity: 0.9;
`;

const FooterRow = styled.div`
  margin-top: 12px;
  display: flex;
  gap: 10px;
  justify-content: space-between;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  z-index: 1000;
`;

const Modal = styled.div`
  width: 100%;
  max-width: 340px;
  border-radius: 18px;
  background: #101010;
  border: 1px solid rgba(255,255,255,0.12);
  padding: 14px;
  color: #fff;
`;

const ModalTitle = styled.div`
  font-weight: 800;
  font-size: 16px;
`;

const ModalSubtitle = styled.div`
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.75;
`;

const Input = styled.input`
  margin-top: 12px;
  width: 100%;
  padding: 12px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  color: #fff;
  outline: none;
`;

const ErrorText = styled.div`
  margin-top: 8px;
  color: #ffb3b3;
  font-size: 12px;
`;

const ModalActions = styled.div`
  margin-top: 12px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const TinyHint = styled.div`
  margin-top: 10px;
  font-size: 11px;
  opacity: 0.65;

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 11px;
  }
`;

/* ===== Shade ===== */

const Shade = styled.div<{ open: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 55%;
  transform: translateY(${(p) => (p.open ? "0%" : "-102%")});
  transition: transform 220ms ease;
  background: rgba(10,10,10,0.92);
  border-bottom: 1px solid rgba(255,255,255,0.10);
  z-index: 50;
  padding: 10px 12px;
  backdrop-filter: blur(10px);
`;

const ShadeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
`;

const Pill = styled.div`
  width: 44px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255,255,255,0.25);
`;

const ShadeTitle = styled.div`
  font-weight: 800;
  font-size: 13px;
  opacity: 0.95;
`;

const ShadeClose = styled.button`
  border: 0;
  background: transparent;
  color: #fff;
  opacity: 0.8;
  cursor: pointer;
  font-size: 16px;
`;

const QuickGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
`;

const QuickTile = styled.button<{ disabled?: boolean }>`
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  padding: 10px 8px;
  color: #fff;
  cursor: pointer;
  opacity: ${(p) => (p.disabled ? 0.45 : 1)};
  pointer-events: ${(p) => (p.disabled ? "none" : "auto")};
`;

const TileIcon = styled.div`
  font-size: 18px;
`;

const TileText = styled.div`
  margin-top: 6px;
  font-size: 11px;
  font-weight: 700;
  opacity: 0.9;
`;

const ShadeHint = styled.div`
  margin-top: 12px;
  font-size: 11px;
  opacity: 0.7;
`;

/* ===== Browser ===== */

const BrowserBar = styled.div`
  margin-top: 10px;
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
`;

const UrlBadge = styled.div`
  opacity: 0.9;
`;

const UrlInput = styled.input`
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: #fff;
  font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
`;

const GoBtn = styled.button`
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.12);
  color: #fff;
  font-weight: 800;
  cursor: pointer;
`;

const BrowserBody = styled.div`
  margin-top: 12px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.22);
`;

/* ===== Router ===== */

const RouterShell = styled.div`
  margin-top: 10px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.20);
`;

const RouterTop = styled.div`
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255,255,255,0.06);
  border-bottom: 1px solid rgba(255,255,255,0.08);
`;

const RouterBrand = styled.div`
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 12px;
  opacity: 0.9;

  span {
    opacity: 0.7;
    font-size: 11px;
  }
`;

const RouterTopRight = styled.div`
  font-size: 11px;
  opacity: 0.75;
`;

const RouterMain = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  min-height: 260px;
`;

const RouterNav = styled.div`
  padding: 10px;
  border-right: 1px solid rgba(255,255,255,0.08);
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const NavItem = styled.button<{ $active?: boolean; disabled?: boolean }>`
  text-align: left;
  width: 100%;
  border-radius: 12px;
  padding: 8px 10px;
  border: 1px solid rgba(255,255,255,0.10);
  background: ${({ $active }) => ($active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)")};
  color: #fff;
  cursor: pointer;

  opacity: ${({ disabled }) => (disabled ? 0.45 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
  font-weight: 700;
  font-size: 12px;
`;

const RouterContent = styled.div`
  padding: 12px;
`;

const RouterGrid = styled.div`
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const InfoBox = styled.div`
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.06);
  padding: 10px;
`;

const InfoLabel = styled.div`
  font-size: 11px;
  opacity: 0.7;
`;

const InfoValue = styled.div`
  margin-top: 4px;
  font-weight: 800;
  font-size: 13px;
`;

/* ===== Cameras ===== */

const CameraRow = styled.button`
  margin-top: 10px;
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.06);
  padding: 10px 12px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
`;

const CamLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CamName = styled.div`
  font-weight: 800;
  font-size: 13px;
`;

const CamMeta = styled.div`
  font-size: 11px;
  opacity: 0.7;
`;

const CamRight = styled.div`
  opacity: 0.8;
`;

/* ===== Fake preview ===== */

const FakePreview = styled.div`
  margin: 10px 0 12px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.35);
  height: 150px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const scan = keyframes`
  0% { transform: translateY(-120%); opacity: 0; }
  10% { opacity: 0.9; }
  100% { transform: translateY(220%); opacity: 0; }
`;

const Scanline = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255,255,255,0.25);
  animation: ${scan} 1.6s linear infinite;
`;

const PreviewText = styled.div`
  font-size: 12px;
  opacity: 0.7;
`;
