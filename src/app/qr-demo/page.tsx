"use client";

import React, { useState } from "react";
import QrScanner from "@/components/QrScanner";

export default function QrDemoPage() {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ height: "100svh", background: "#000", padding: 14 }}>
      {open ? (
        <QrScanner
          onClose={() => setOpen(false)}
          onClaimed={(res) => {
            // acá tu UI: navegar, abrir viewer, iniciar chat, etc
            if (res.effects?.open === "chat") {
              // setShowChat(true) o router.push(...)
            }
          }}
        />
      ) : null}
    </div>
  );
}
