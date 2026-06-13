// In-memory presence (online/last-seen) using globalThis — persistent across hot reloads
declare global {
  var __presenceMap: Map<string, number> | undefined;
}

const PRESENCE_TTL = 90_000; // 90 seconds — user is "online" within this window

function getMap(): Map<string, number> {
  if (!globalThis.__presenceMap) {
    globalThis.__presenceMap = new Map();
  }
  return globalThis.__presenceMap;
}

export function setOnline(userId: string): void {
  getMap().set(userId, Date.now());
}

export interface PresenceResult {
  online: boolean;
  lastSeen: number | null; // epoch ms
}

export function getPresence(userId: string): PresenceResult {
  const ts = getMap().get(userId);
  if (!ts) return { online: false, lastSeen: null };
  const online = Date.now() - ts < PRESENCE_TTL;
  return { online, lastSeen: ts };
}
