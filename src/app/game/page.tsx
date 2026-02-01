"use client"
import GameOrchestrator from "@/components/GameOrchestrator";
import { AssetsProvider } from "@/providers/AssetsProvider";
import { UserStateProvider } from "@/providers/UserStateProvider";

export default function GamePage() {
  return (
    <AssetsProvider>
      <UserStateProvider>
        <div style={{ height: "100svh", background: "#000" }}>
          <GameOrchestrator />
        </div>
      </UserStateProvider>
    </AssetsProvider>
    
  );
}
