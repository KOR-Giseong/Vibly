// ─── Auth ────────────────────────────────────────────────────────────────────

export type AuthProvider = 'kakao' | 'google' | 'apple' | 'email';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_DELETION';

export interface User {
  id: string;
  email: string;
  name: string;
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
  address: string;
  lat: number;
  lng: number;
  vibeScore?: number;
  rating: number;
  reviewCount: number;
  distance?: string;
  imageUrl?: string;
  tags: string[];
  isBookmarked?: boolean;
}

export interface PlaceDetail extends Place {
  phone?: string;
  hours?: string;
  description?: string;
  aiReasons?: AIReason[];
  emotionMatch?: EmotionMatch;
}

// ─── Mood / AI ───────────────────────────────────────────────────────────────

export interface Mood {
  emoji: string;
  label: string;
  value: string;
}

export interface AISearchResult {
  query: string;
  analysisText: string;
  tags: string[];
  places: Place[];
}

export interface AIReason {
  icon: string;
  title: string;
  description: string;
}

export interface EmotionMatch {
  happy: number;
  peaceful: number;
  cozy: number;
}

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
