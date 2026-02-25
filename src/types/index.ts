// ─── Auth ────────────────────────────────────────────────────────────────────

export type AuthProvider = 'kakao' | 'google' | 'apple' | 'email';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_DELETION';

export interface User {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  preferredVibes?: string[];
  isProfileComplete: boolean;
  avatarUrl?: string;
  status: UserStatus;
  isPremium: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── Place ───────────────────────────────────────────────────────────────────

export type PlaceCategory =
  | '카페'
  | '레스토랑'
  | '바'
  | '공원'
  | '문화공간'
  | '서점'
  | '기타';

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  categoryLabel?: string;   // 한글 카테고리 (카카오 API에서 제공)
  address: string;
  lat: number;
  lng: number;
  vibeScore?: number;
  // Vibly 평점 (우리 DB의 리뷰 기반)
  rating: number;
  reviewCount: number;
  // Google Places 평점 (Google API 기반)
  googleRating?: number;
  googleReviewCount?: number;
  distance?: string;
  imageUrl?: string;
  tags: string[];
  isBookmarked?: boolean;
  isSponsored?: boolean;
}

export interface PlaceReview {
  id: string;
  user: { id: string; name: string };
  rating: number;
  body: string;
  createdAt: string;
}

export interface PlaceDetail extends Place {
  phone?: string;
  hours?: string;
  description?: string;
  aiReasons?: AIReason[];
  emotionMatch?: EmotionMatch;
  reviews?: PlaceReview[];       // Vibly 리뷰 (우리 DB)
  myCheckInCount?: number;
  myReview?: PlaceReview | null;
}

// ─── Mood / AI ───────────────────────────────────────────────────────────────

export interface Mood {
  emoji: string;
  label: string;
  value: string;
}

export interface AISearchResult {
  query: string;
  summary: string;
  keywords: string[];
  places: Place[];
}

export interface AIReason {
  icon: string;
  title: string;
  description: string;
}

export type EmotionMatch = { label: string; value: number }[];

// ─── Notification ────────────────────────────────────────────────────────────

export type NotificationType = 'recommendation' | 'like' | 'nearby' | 'promo' | 'report';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Subscription ────────────────────────────────────────────────────────────

export type SubscriptionPlan = 'monthly' | 'yearly';
export type SubscriptionPlatform = 'ios' | 'android';

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  platform: SubscriptionPlatform;
  expiresAt: string;
  isActive: boolean;
}

// ─── Vibe Report ─────────────────────────────────────────────────────────────

export interface DailyMood {
  day: string;
  emoji: string;
  mood: string;
}

export interface TopVibe {
  vibe: string;
  count: number;
  color: string;
}

export interface VibeReportData {
  dateRange: string;
  checkIns: number;
  newPlaces: number;
  reviews: number;
  dailyMoods: DailyMood[];
  topVibes: TopVibe[];
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}
