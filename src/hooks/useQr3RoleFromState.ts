import { useMemo } from "react";

export const QR3_ROLES = ["ANTES", "PRESENTE", "DESPUES"] as const;
export const QR3_ROLES_PACK = ["qr3_antes", "qr3_presente", "qr3_despues"] as const;
export type Qr3Role = typeof QR3_ROLES[number];
export type Qr3RolePack = typeof QR3_ROLES_PACK[number];

type Qr3Group = {
  idx?: number;
  playerIds?: string[];
  status?: "active" | "done";
  score?: number;
  rank?: number;
};

type Qr3State = {
  groups?: Record<string, Qr3Group>;
};


export type UseQr3RoleResult =
  | {
      ready: boolean;
      groupId?: string;
      group?: Qr3Group;
      index?: number;
      role?: Qr3Role;
      pack?: Qr3RolePack;
      reason?: "no-qr3" | "no-groups" | "not-assigned" | "no-userId";
    }

export function useQr3RoleFromState(
  qr3: Qr3State | null | undefined,
  userId: string | undefined
): UseQr3RoleResult {
  return useMemo((): UseQr3RoleResult => {
    if (!userId) return { ready: false, reason: "no-userId" };
    if (!qr3) return { ready: false, reason: "no-qr3" };
    if (!qr3.groups) return { ready: false, reason: "no-groups" };

    for (const [groupId, group] of Object.entries(qr3.groups)) {
      const ids = group.playerIds;
      if (!ids) continue;

      const index = ids.indexOf(userId);
      if (index === -1) continue;

      return {
        ready: true,
        groupId,
        group,
        index,
        role: QR3_ROLES[index % QR3_ROLES.length],
        pack: QR3_ROLES_PACK[index % QR3_ROLES.length],
      };
    }

    return { ready: false, reason: "not-assigned" };
  }, [qr3, userId]);
}
