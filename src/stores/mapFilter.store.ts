import { create } from 'zustand';

// ─── Constants ────────────────────────────────────────────────────────────────

export const LIMIT_OPTIONS = [10, 20, 30, 40, 50] as const;
export const RADIUS_OPTIONS = [1000, 2000, 3000] as const; // meters

export type LimitOption = typeof LIMIT_OPTIONS[number];
export type RadiusOption = typeof RADIUS_OPTIONS[number];

export function radiusLabel(meters: number): string {
  return `${meters / 1000}km`;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface MapFilterState {
  /** 최대 표시 장소 수 (10~50) */
  limit: LimitOption;
  /** 검색 반경 (미터) 1000~3000 */
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
