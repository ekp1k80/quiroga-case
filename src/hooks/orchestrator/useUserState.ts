"use client";

import { useUserStore } from "@/providers/UserStateProvider";

export type { UserPayload } from "@/providers/UserStateProvider";

export function useUserState() {
  return useUserStore();
}
