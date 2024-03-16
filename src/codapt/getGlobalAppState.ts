import { GlobalAppState } from "@prisma/client";

import { db } from "@/server/db";

export default async function getGlobalAppState(): Promise<GlobalAppState> {
  let state = await db.globalAppState.findFirst();
  if (!state) {
    state = await db.globalAppState.create({
      data: {
        id: 1,
      },
    });
  }
  return state;
}
