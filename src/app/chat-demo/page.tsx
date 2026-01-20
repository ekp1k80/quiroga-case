"use client";

import React from "react";
import GameChatConsole from "@/components/GameChatConsole";
import { useChatFlow } from "@/hooks/useChatFlow";

export default function ChatDemoPage() {
  const flow = useChatFlow({
    packId: "ACT2_FINAL", puzzleId: "router-flow",
    onDone: ({ response }) => {
        // if (response.effects?.open === "router") setShowRouter(true);
    },
  });


  return (
    <div style={{ height: "100svh", background: "#000", padding: 14, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "min(980px, 100%)", height: "100%" }}>
        <GameChatConsole
            title="Terminal"
            messages={flow.messages}
            sending={flow.sending}
            systemTyping={flow.systemTyping}
            disabled={flow.disabled}
            onSend={flow.send}
        />
      </div>
    </div>
  );
}
