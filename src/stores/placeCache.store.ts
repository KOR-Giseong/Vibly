import { create } from 'zustand';
import type { Place } from '@/types';

interface PlaceCacheState {
  places: Record<string, Place>;
  setPlace: (place: Place) => void;
}

export const usePlaceCacheStore = create<PlaceCacheState>((set) => ({
  places: {},
  setPlace: (place) =>
    set((s) => ({ places: { ...s.places, [place.id]: place } })),
}));
