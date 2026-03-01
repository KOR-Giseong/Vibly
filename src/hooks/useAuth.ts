import { useCallback } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@stores/auth.store';
import { useCreditStore } from '@stores/credit.store';
import { authService } from '@services/auth.service';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, reset: resetAuth } = useAuthStore();
  const { setCredits, setPremium, reset: resetCredit, syncBalance } = useCreditStore();

  const logout = useCallback(async () => {
    await authService.logout();
    resetAuth();
    resetCredit();
    router.replace('/(auth)/login');
  }, [resetAuth, resetCredit]);

  const refreshUser = useCallback(async () => {
    const me = await authService.getMe();
    setUser(me);
    // getMe 응답에 credits 포함 → 스토어 동기화
    if (me && typeof me.credits === 'number') {
      setCredits(me.credits);
      setPremium(me.isPremium);
    } else {
      // 없으면 별도 API로 조회
      syncBalance();
    }
  }, [setUser, setCredits, setPremium, syncBalance]);

  const reset = useCallback(() => {
    resetAuth();
    resetCredit();
  }, [resetAuth, resetCredit]);

  return { user, isAuthenticated, isLoading, logout, refreshUser, reset };
}
