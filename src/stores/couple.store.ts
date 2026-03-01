import { create } from 'zustand';
import type { CoupleInfo, CoupleMessage } from '@types';

interface CoupleState {
  coupleInfo: CoupleInfo | null;
  isLoading: boolean;
  chatMessages: CoupleMessage[];
  setCoupleInfo: (info: CoupleInfo | null) => void;
  setLoading: (v: boolean) => void;
  setChatMessages: (msgs: CoupleMessage[]) => void;
  prependChatMessage: (msg: CoupleMessage) => void;
  reset: () => void;
}

export const useCoupleStore = create<CoupleState>((set) => ({
  coupleInfo: null,
  isLoading: false,
  chatMessages: [],

  setCoupleInfo: (coupleInfo) => set({ coupleInfo }),
  setLoading: (isLoading) => set({ isLoading }),
  setChatMessages: (chatMessages) => set({ chatMessages }),
  prependChatMessage: (msg) => set((s) => ({ chatMessages: [msg, ...s.chatMessages] })),
  reset: () => set({ coupleInfo: null, isLoading: false, chatMessages: [] }),
}));
