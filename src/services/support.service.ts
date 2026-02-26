import { apiClient } from './api';
import type { SupportTicket } from '@/types';

const SERVER_BASE = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api').replace(/\/api$/, '');

export const supportService = {
  async submitTicket(title: string, body: string, type: 'FAQ' | 'CHAT' = 'CHAT'): Promise<SupportTicket> {
    const { data } = await apiClient.post<SupportTicket>('/support/tickets', { title, body, type });
    return data;
  },

  async getMyTickets(): Promise<SupportTicket[]> {
    const { data } = await apiClient.get<SupportTicket[]>('/support/tickets/mine');
    return data;
  },

  async getMessages(ticketId: string): Promise<any[]> {
    const { data } = await apiClient.get<any[]>(`/support/tickets/${ticketId}/messages`);
    return data;
  },

  async uploadImage(localUri: string): Promise<string> {
    const filename = localUri.split('/').pop() ?? 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    const formData = new FormData();
    formData.append('image', { uri: localUri, name: filename, type } as any);
    const { data } = await apiClient.post<{ imageUrl: string }>('/support/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // 상대경로 → 절대 URL 변환
    return SERVER_BASE + data.imageUrl;
  },

  async sendMessage(ticketId: string, body: string, imageUrl?: string): Promise<any> {
    const { data } = await apiClient.post<any>(`/support/tickets/${ticketId}/messages`, { body, imageUrl });
    return data;
  },

  async getFaqCategories(): Promise<any[]> {
    const { data } = await apiClient.get<any[]>('/support/faq-categories');
    return data;
  },
};
