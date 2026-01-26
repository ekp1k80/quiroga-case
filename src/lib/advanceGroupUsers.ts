import { db } from "@/lib/firebaseAdmin";

export async function advanceUsersStoryNode(params: {
  userIds: string[];
  to: string;
}) {
  const { userIds, to } = params;

  const fs = db();
  const batch = fs.batch();

  for (const uid of userIds) {
    const ref = fs.collection("users").doc(uid);
    batch.update(ref, {
      storyNode: to,
      updatedAt: Date.now(),
    });
  }

  await batch.commit();
}
