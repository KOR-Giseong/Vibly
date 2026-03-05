import { apiClient } from './api';
import type {
  Post,
  PostComment,
  PostsResponse,
  PostCategory,
  Notice,
  NoticesResponse,
} from '@/types';

// ─── 게시글 ───────────────────────────────────────────────────────────────────

export const communityApi = {
  /** 게시글 목록 */
  getPosts: (params?: { category?: PostCategory; page?: number; limit?: number }) =>
    apiClient
      .get<PostsResponse>('/community/posts', { params })
      .then((r) => r.data),

  /** 게시글 상세 (댓글 포함) */
  getPostById: (id: string) =>
    apiClient.get<Post>(`/community/posts/${id}`).then((r) => r.data),

  /** 게시글 작성 */
  createPost: (data: {
    category: PostCategory;
    title: string;
    body: string;
    imageUrl?: string;
  }) => apiClient.post<Post>('/community/posts', data).then((r) => r.data),

  /** 게시글 수정 */
  updatePost: (id: string, data: Partial<{ title: string; body: string; imageUrl?: string }>) =>
    apiClient.patch<Post>(`/community/posts/${id}`, data).then((r) => r.data),

  /** 게시글 삭제 */
  deletePost: (id: string) =>
    apiClient.delete(`/community/posts/${id}`).then((r) => r.data),

  /** 좋아요 토글 */
  toggleLike: (postId: string) =>
    apiClient
      .post<{ liked: boolean }>(`/community/posts/${postId}/like`)
      .then((r) => r.data),

  /** 댓글 작성 */
  addComment: (postId: string, body: string) =>
    apiClient
      .post<PostComment>(`/community/posts/${postId}/comments`, { body })
      .then((r) => r.data),

  /** 댓글 삭제 */
  deleteComment: (commentId: string) =>
    apiClient.delete(`/community/comments/${commentId}`).then((r) => r.data),

  /** 게시글 신고 */
  reportPost: (postId: string, reason: import('@/types').ReportReason, detail?: string, imageUrls?: string[]) =>
    apiClient
      .post<{ success: boolean; message: string }>(`/community/posts/${postId}/report`, { reason, detail, imageUrls })
      .then((r) => r.data),
};

// ─── 공지사항 ─────────────────────────────────────────────────────────────────

export const noticesApi = {
  /** 공지사항 목록 */
  getNotices: (params?: { page?: number; limit?: number }) =>
    apiClient
      .get<NoticesResponse>('/community/notices', { params })
      .then((r) => r.data),

  /** 공지사항 상세 */
  getNoticeById: (id: string) =>
    apiClient.get<Notice>(`/community/notices/${id}`).then((r) => r.data),
};
