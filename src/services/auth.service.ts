import { apiClient } from './api';
import { storage } from '@utils/storage';
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

  async socialLogin(
    provider: 'kakao' | 'google' | 'apple',
    idToken: string,
    redirectUri?: string,
  ): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthTokens>(`/auth/${provider}`, { idToken, redirectUri });
    await saveTokens(data);
    return data;
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = await storage.getItem('refreshToken');
      await apiClient.post('/auth/logout', { refreshToken });
    } finally {
      await clearTokens();
    }
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },

  async checkNickname(nickname: string): Promise<{ available: boolean }> {
    const { data } = await apiClient.get<{ available: boolean }>('/auth/check-nickname', {
      params: { nickname },
    });
    return data;
  },

  async updateProfile(nickname: string, preferredVibes: string[]): Promise<User> {
    const { data } = await apiClient.patch<User>('/auth/profile', { nickname, preferredVibes });
    return data;
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getItem('accessToken');
    return Boolean(token);
  },
};

async function saveTokens(tokens: AuthTokens) {
  await storage.setItem('accessToken', tokens.accessToken);
  await storage.setItem('refreshToken', tokens.refreshToken);
}

async function clearTokens() {
  await storage.deleteItem('accessToken');
  await storage.deleteItem('refreshToken');
}
