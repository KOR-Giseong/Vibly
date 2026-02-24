import * as SecureStore from 'expo-secure-store';
import { apiClient } from './api';
import type { AuthTokens, User } from '@/types';

export const authService = {
  async emailLogin(email: string, password: string): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthTokens>('/auth/email/login', { email, password });
    await saveTokens(data);
    return data;
  },

  async emailSignup(email: string, password: string, name: string): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthTokens>('/auth/email/signup', { email, password, name });
    await saveTokens(data);
    return data;
  },

  async socialLogin(provider: 'kakao' | 'google' | 'apple', idToken: string): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthTokens>(`/auth/${provider}`, { idToken });
    await saveTokens(data);
    return data;
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      await apiClient.post('/auth/logout', { refreshToken });
    } finally {
      await clearTokens();
    }
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get<User>('/users/me');
    return data;
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('accessToken');
    return Boolean(token);
  },
};

async function saveTokens(tokens: AuthTokens) {
  await SecureStore.setItemAsync('accessToken', tokens.accessToken);
  await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
}

async function clearTokens() {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
}
