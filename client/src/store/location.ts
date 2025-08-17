import { useSyncExternalStore } from 'react';

export type Province = { key: string; label: string; lat: number; lon: number };

export const PROVINCES: Province[] = [
  { key: 'udon', label: 'อุดรธานี', lat: 17.413, lon: 102.787 },
  { key: 'khonkaen', label: 'ขอนแก่น', lat: 16.4419, lon: 102.8350 },
  { key: 'nongkhai', label: 'หนองคาย', lat: 17.8783, lon: 102.7418 },
  { key: 'sakon', label: 'สกลนคร', lat: 17.1545, lon: 104.1475 },
];

export const DEFAULT: Province = PROVINCES[0];

function readInitial(): Province {
  try {
    const key = typeof window !== 'undefined' ? localStorage.getItem('tmd:meteogram:province') : null;
    const found = PROVINCES.find(p => p.key === key);
    return found || DEFAULT;
  } catch {
    return DEFAULT;
  }
}

type Listener = () => void;
let state: { province: Province } = { province: readInitial() };
const listeners = new Set<Listener>();

function setProvince(p: Province) {
  state = { province: p };
  try { localStorage.setItem('tmd:meteogram:province', p.key); } catch {}
  listeners.forEach(l => l());
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return { province: DEFAULT };
}

export function useLocation() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    province: snap.province,
    setProvince,
  };
}
