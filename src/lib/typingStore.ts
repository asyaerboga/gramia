// In-memory typing state using globalThis for persistence across hot reloads
declare global {
  // eslint-disable-next-line no-var
  var typingStore: Map<string, number> | undefined;
}

// Key format: `${userId}_${partnerId}` -> timestamp
const store = globalThis.typingStore || new Map<string, number>();
if (!globalThis.typingStore) {
  globalThis.typingStore = store;
}

const TYPING_TTL = 3000; // 3 seconds

export function setTyping(userId: string, partnerId: string): void {
  store.set(`${userId}_${partnerId}`, Date.now());
}

export function isTyping(userId: string, partnerId: string): boolean {
  const ts = store.get(`${userId}_${partnerId}`);
  if (!ts) return false;
  if (Date.now() - ts > TYPING_TTL) {
    store.delete(`${userId}_${partnerId}`);
    return false;
  }
  return true;
}
