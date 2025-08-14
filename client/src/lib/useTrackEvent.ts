import { useCallback } from 'react';

interface TrackOptions {
  cooldownMs?: number; // prevent duplicate within period
  dedupeKey?: string; // custom key; default derived from name+id
}

export function useTrackEvent() {
  const track = useCallback(
    async (name: string, payload?: Record<string, any>, options?: TrackOptions) => {
      try {
        const keyBase = `${name}:${payload?.newsId ?? ''}`;
        const key = options?.dedupeKey || `event:${keyBase}`;
        const now = Date.now();
        const cooldown = options?.cooldownMs ?? 0;
        if (cooldown > 0) {
          const last = Number(localStorage.getItem(key) || 0);
          if (now - last < cooldown) return; // skip duplicate
          localStorage.setItem(key, String(now));
        }
        await fetch('/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, payload, ts: new Date().toISOString() }),
        });
      } catch (err) {
        // fail quietly
      }
    },
    []
  );

  return { track };
}
