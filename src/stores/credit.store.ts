import { create } from 'zustand';
import { creditService } from '@services/credit.service';

interface CreditState {
  credits: number;
  isPremium: boolean;
  isLoading: boolean;

  setCredits: (credits: number) => void;
  setPremium: (isPremium: boolean) => void;
  spendCredits: (amount: number) => void;
  earnCredits: (amount: number) => void;
  /** 서버에서 최신 잔액 동기화 */
  syncBalance: () => Promise<void>;
  reset: () => void;
}

export const useCreditStore = create<CreditState>((set) => ({
  credits: 0,
  isPremium: false,
  isLoading: false,

  setCredits: (credits) => set({ credits }),
  setPremium: (isPremium) => set({ isPremium }),
  spendCredits: (amount) => set((s) => ({ credits: Math.max(0, s.credits - amount) })),
  earnCredits: (amount) => set((s) => ({ credits: s.credits + amount })),

  syncBalance: async () => {
    set({ isLoading: true });
    try {
      const { credits, isPremium } = await creditService.getBalance();
      set({ credits, isPremium });
    } catch {
      // 네트워크 오류 시 기존 값 유지
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => set({ credits: 0, isPremium: false, isLoading: false }),
}));
