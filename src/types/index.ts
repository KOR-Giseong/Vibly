// ─── Auth ────────────────────────────────────────────────────────────────────

export type AuthProvider = 'kakao' | 'google' | 'apple' | 'email';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_DELETION';

export interface CoupleInfo {
  coupleId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatarUrl?: string | null;
  creditShareEnabled: boolean;
  anniversaryDate?: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  preferredVibes?: string[];
  isProfileComplete: boolean;
  avatarUrl?: string;
  status: UserStatus;
  suspendedUntil?: string | null;
  suspendReason?: string | null;
  isPremium: boolean;
  isAdmin?: boolean;
  credits: number;
  createdAt: string;
  couple?: CoupleInfo | null;
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
  savedAt?: string;  // 북마크 저장 시각
}

export interface PlaceReview {
  id: string;
  user: { id: string; name: string };
  rating: number;
  body: string;
  createdAt: string;
  likesCount: number;
  isLiked: boolean;
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

export type NotificationType =
  | 'RECOMMEND'
  | 'LIKE'
  | 'NEARBY'
  | 'PROMO'
  | 'REPORT'
  | 'COUPLE_INVITE'
  | 'COUPLE_ACCEPT'
  | 'COMMENT'
  | 'CREDIT'
  | 'SUPPORT';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  payload?: Record<string, unknown>;
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

export interface DailyMoodEntry {
  /** ISO 날짜 문자열 */
  date: string;
  /** '월' | '화' | … | '일' */
  dayLabel: string;
  /** 'happy' | 'peaceful' | … | null (체크인 없는 날) */
  mood: string | null;
  /** 이모지 문자열 또는 null */
  emoji: string | null;
  /** 해당 날 체크인 수 */
  checkInCount: number;
}

export interface EmotionDistributionEntry {
  mood: string;
  label: string;
  emoji: string;
  color: string;
  count: number;
  percentage: number;
}

export interface TopCategoryEntry {
  category: string;
  label: string;
  color: string;
  count: number;
  percentage: number;
}

export interface VibeInsight {
  emoji: string;
  title: string;
  desc: string;
}

export interface VibeReportResponse {
  period: 'weekly' | 'monthly';
  dateRange: string;
  checkInCount: number;
  uniquePlacesCount: number;
  reviewCount: number;
  vibeScore: number;
  emotionDistribution: EmotionDistributionEntry[];
  dailyMoods: DailyMoodEntry[];
  topCategories: TopCategoryEntry[];
  insights: VibeInsight[];
}

// ─── Support ─────────────────────────────────────────────────────────────────

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface SupportTicket {
  id: string;
  title: string;
  body: string;
  status: TicketStatus;
  adminReply?: string;
  repliedAt?: string;
  createdAt: string;
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

// ─── Community ────────────────────────────────────────────────────────────────

export type PostCategory = 'FREE' | 'INFO' | 'QUESTION' | 'REVIEW';

export const POST_CATEGORY_LABEL: Record<PostCategory, string> = {
  FREE: '자유게시판',
  INFO: '정보공유',
  QUESTION: '질문/도움',
  REVIEW: '장소후기',
};
export type ReportReason = 'SPAM' | 'ABUSE' | 'ILLEGAL' | 'ADULT' | 'PRIVACY' | 'OTHER';

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  SPAM: '스팸/광고',
  ABUSE: '욕설/협오',
  ILLEGAL: '불법 정보',
  ADULT: '성인/음란물',
  PRIVACY: '개인정보 침해',
  OTHER: '기타',
};
export interface PostAuthor {
  id: string;
  nickname?: string;
  name: string;
  avatarUrl?: string;
}

export interface PostComment {
  id: string;
  body: string;
  createdAt: string;
  user: PostAuthor;
}

export interface Post {
  id: string;
  category: PostCategory;
  title: string;
  body: string;
  imageUrl?: string;
  isPinned: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
  user: PostAuthor;
  comments?: PostComment[];
}

export interface PostsResponse {
  items: Post[];
  total: number;
  page: number;
  hasNext: boolean;
}

// ─── Couple ───────────────────────────────────────────────────────────────────

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
export type DatePlanStatus = 'PLANNED' | 'COMPLETED' | 'CANCELLED';

export interface CoupleInvitation {
  id: string;
  senderId: string;
  receiverId: string;
  status: InvitationStatus;
  message?: string;
  createdAt: string;
  respondedAt?: string;
  sender?: Pick<User, 'id' | 'name' | 'nickname' | 'avatarUrl'>;
  receiver?: Pick<User, 'id' | 'name' | 'nickname' | 'avatarUrl'>;
}

export interface DatePlan {
  id: string;
  coupleId: string;
  title: string;
  dateAt: string;
  memo?: string;
  status: DatePlanStatus;
  placeIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CoupleMemory {
  id: string;
  coupleId: string;
  uploaderId: string;
  imageUrl: string;
  caption?: string;
  takenAt?: string;
  createdAt: string;
}

export interface PartnerProfile {
  id: string;
  name: string;
  nickname?: string;
  avatarUrl?: string;
  gender?: string;
  preferredVibes: string[];
  credits: number;
  stats: {
    checkinCount: number;
    bookmarkCount: number;
    reviewCount: number;
  };
}

// ─── Couple Chat ──────────────────────────────────────────────────────────────

export type MessageType = 'TEXT' | 'IMAGE' | 'EMOJI';

export interface CoupleMessage {
  id: string;
  coupleId: string;
  senderId: string;
  type: MessageType;
  text?: string | null;
  imageUrl?: string | null;
  emoji?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface CoupleCreditHistory {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  amount: number;
  createdAt: string;
  isMine: boolean;
}

// ─── Notice ───────────────────────────────────────────────────────────────────

export interface Notice {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoticesResponse {
  items: Notice[];
  total: number;
  page: number;
  hasNext: boolean;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export type SubscriptionType = 'MONTHLY' | 'YEARLY' | 'TRIAL' | 'ADMIN_GRANT';

// ─── AI Review Summary ────────────────────────────────────────────────────────

export interface ReviewSummary {
  placeId: string;
  summary: string;
  pros: string[];
  cons: string[];
  targetAudience?: string | null;
  reviewCount: number;
  generatedAt: string;
}

// ─── Smart Recommend ─────────────────────────────────────────────────────────

export interface SmartRecommendResult {
  message: string;
  weather: string;
  timeOfDay: string;
  keywords: string[];
  places: Place[];
}

// ─── AI Date Chat ─────────────────────────────────────────────────────────────

export interface AiChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AiChatResponse {
  text: string;
  places?: Place[];
}
