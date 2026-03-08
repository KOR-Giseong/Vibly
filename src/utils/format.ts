export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1)  return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export function formatPrice(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

/**
 * Google Places API 실제 이미지인지 여부 판단
 * - googleusercontent.com / googleapis.com 도메인 → 실제 이미지
 * - unsplash 등 나머지 → Vibly 기본 이미지
 */
export function isGoogleImage(url?: string | null): boolean {
  if (!url) return false;
  return url.includes('googleusercontent.com') || url.includes('googleapis.com');
}
