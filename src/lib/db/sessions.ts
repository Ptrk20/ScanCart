import { ACTIVE_SESSION_KEY, STORES, withTransaction, type StoredSession } from "./database.ts";
import { assertSession } from "./validation.ts";

export async function getActiveSession(): Promise<StoredSession | undefined> {
  return withTransaction("readonly", async (tx) => {
    const session = await tx.objectStore(STORES.sessions).get(ACTIVE_SESSION_KEY);
    if (session) assertSession(session);
    return session;
  });
}
export async function saveActiveSession(session: StoredSession): Promise<void> {
  assertSession(session);
  const { id, store, budget, startedAt, status, completedAt } = session;
  await withTransaction("readwrite", async (tx) => {
    const previous = await tx.objectStore(STORES.sessions).get(ACTIVE_SESSION_KEY);
    if (previous && previous.id !== id) throw new Error("End the active session before replacing it.");
    await tx.objectStore(STORES.sessions).put({ id, store, budget, startedAt, status, completedAt }, ACTIVE_SESSION_KEY);
  });
}
export async function clearActiveSession(): Promise<void> {
  await withTransaction("readwrite", async (tx) => {
    await tx.objectStore(STORES.sessions).delete(ACTIVE_SESSION_KEY);
    await tx.objectStore(STORES.basket).clear();
  });
}
