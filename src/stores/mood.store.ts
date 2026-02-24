import { create } from 'zustand';
import type { AISearchResult, Mood } from '@/types';

interface MoodState {
  selectedMood: Mood | null;
  searchQuery: string;
  searchResult: AISearchResult | null;
  isSearching: boolean;
  rateLimitRemaining: number;

  setSelectedMood: (mood: Mood | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchResult: (result: AISearchResult | null) => void;
  setSearching: (value: boolean) => void;
  decrementRateLimit: () => void;
  resetRateLimit: () => void;
}

export const useMoodStore = create<MoodState>((set) => ({
  selectedMood: null,
  searchQuery: '',
  searchResult: null,
  isSearching: false,
  rateLimitRemaining: 20,

  setSelectedMood: (mood) => set({ selectedMood: mood }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResult: (result) => set({ searchResult: result }),
  setSearching: (value) => set({ isSearching: value }),
  decrementRateLimit: () => set((state) => ({
    rateLimitRemaining: Math.max(0, state.rateLimitRemaining - 1),
  })),
  resetRateLimit: () => set({ rateLimitRemaining: 20 }),
}));
