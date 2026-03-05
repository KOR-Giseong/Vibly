import { create } from 'zustand';
import type { CoupleInfo, CoupleMessage } from '@types';

interface CoupleState {
  coupleInfo: CoupleInfo | null;
  isLoading: boolean;
  chatMessages: CoupleMessage[];
  /** 현재 커플 파트너의 표시명 (닉네임 우선, 없으면 이름) */
  partnerNickname: string | null;
  setCoupleInfo: (info: CoupleInfo | null) => void;
  setLoading: (v: boolean) => void;
  setChatMessages: (msgs: CoupleMessage[]) => void;
  prependChatMessage: (msg: CoupleMessage) => void;
  setPartnerNickname: (name: string | null) => void;
  reset: () => void;
}

export const useCoupleStore = create<CoupleState>((set) => ({
  coupleInfo: null,
  isLoading: false,
  chatMessages: [],
  partnerNickname: null,

  setCoupleInfo: (coupleInfo) => set({ coupleInfo }),
  setLoading: (isLoading) => set({ isLoading }),
  setChatMessages: (chatMessages) => set({ chatMessages }),
  prependChatMessage: (msg) => set((s) => ({ chatMessages: [msg, ...s.chatMessages] })),
  setPartnerNickname: (partnerNickname) => set({ partnerNickname }),
  reset: () => set({ coupleInfo: null, isLoading: false, chatMessages: [], partnerNickname: null }),
}));
