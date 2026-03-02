import { create } from 'zustand';

// ─── Constants ────────────────────────────────────────────────────────────────

export const FREE_LIMIT_OPTIONS = [10, 20, 30] as const;
export const PREMIUM_LIMIT_OPTIONS = [40, 50] as const;
export const LIMIT_OPTIONS = [...FREE_LIMIT_OPTIONS, ...PREMIUM_LIMIT_OPTIONS] as const;

export const FREE_RADIUS_OPTIONS = [1000, 2000, 3000] as const;
export const PREMIUM_RADIUS_OPTIONS = [5000, 10000] as const;
export const RADIUS_OPTIONS = [...FREE_RADIUS_OPTIONS, ...PREMIUM_RADIUS_OPTIONS] as const;

export type LimitOption = typeof LIMIT_OPTIONS[number];
export type RadiusOption = typeof RADIUS_OPTIONS[number];

export function radiusLabel(meters: number): string {
  return `${meters / 1000}km`;
}

export function isPremiumLimit(limit: LimitOption): boolean {
  return (PREMIUM_LIMIT_OPTIONS as readonly number[]).includes(limit);
}

export function isPremiumRadius(radius: RadiusOption): boolean {
  return (PREMIUM_RADIUS_OPTIONS as readonly number[]).includes(radius);
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface MapFilterState {
  /** 최대 표시 장소 수 (무료: 10~30, 프리미엄: 40~50) */
  limit: LimitOption;
  /** 검색 반경 (무료: 1~3km, 프리미엄: 5~10km) */
  radius: RadiusOption;
  setLimit: (limit: LimitOption) => void;
  setRadius: (radius: RadiusOption) => void;
}

export const useMapFilterStore = create<MapFilterState>((set) => ({
  limit: 20,
  radius: 2000,
  setLimit: (limit) => set({ limit }),
  setRadius: (radius) => set({ radius }),
}));
