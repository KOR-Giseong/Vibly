import { useCallback } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@stores/auth.store';
import { authService } from '@services/auth.service';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, reset } = useAuthStore();

  const logout = useCallback(async () => {
    await authService.logout();
    reset();
    router.replace('/(auth)/login');
  }, [reset]);

  const refreshUser = useCallback(async () => {
    const me = await authService.getMe();
    setUser(me);
  }, [setUser]);

  return { user, isAuthenticated, isLoading, logout, refreshUser, reset };
}
