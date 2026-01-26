"use client"
import GameOrchestrator from "@/components/GameOrchestrator";
import { AssetsProvider } from "@/providers/AssetsProvider";

export default function GamePage() {
  return (
    <AssetsProvider>
      <div style={{ height: "100svh", background: "#000" }}>
        <GameOrchestrator />
      </div>
    </AssetsProvider>
    
  );
}
