import { Platform, Share, NativeModules } from 'react-native';

/**
 * Vibly 카카오링크 공유 유틸리티
 *
 * ▸ 실제 빌드(iOS/Android, KakaoShareLink 네이티브 모듈 존재 시):
 *     카카오톡 앱 친구/채팅방 선택 → Vibly 카드 공유
 * ▸ Dev client / 웹 / 폴백:
 *     OS 기본 공유 시트 (텍스트)
 */

// 네이티브 모듈 로드 가능 여부 체크 (dev client에서는 false → OS Share 폴백)
const isKakaoShareAvailable = !!NativeModules.KakaoShareLink;

// ─── 상수 ──────────────────────────────────────────────────────────────────
export const VIBLY_LOGO_URL =
  'https://vibly-backend-jo12.onrender.com/public/vibly-logo.png';

const APP_STORE_URL = 'https://apps.apple.com/kr/app/vibly/id6743178559';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.vibly.app';
const MARKET_URL = Platform.OS === 'android' ? PLAY_STORE_URL : APP_STORE_URL;

// ─── 피드형 공유 (장소) ────────────────────────────────────────────────────
export interface SharePlaceParams {
  placeId: string;
  name: string;
  address: string;
  category?: string;
  rating?: number;
  imageUrl?: string;
}

export async function sharePlaceKakao(params: SharePlaceParams): Promise<void> {
  const { placeId, name, address, category, rating, imageUrl } = params;

  const description = [
    category,
    rating ? `⭐ ${rating.toFixed(1)}` : undefined,
    `📍 ${address}`,
  ]
    .filter(Boolean)
    .join('  ·  ');

  const fallbackMessage = `${name}\n${description}\n\nVibly 앱에서 확인하세요 🌟\n${MARKET_URL}`;

  // dev client 또는 웹: OS 기본 공유
  if (!isKakaoShareAvailable || Platform.OS === 'web') {
    await Share.share({ message: fallbackMessage, title: name });
    return;
  }

  try {
    const { sendFeed } = require('react-native-kakao-share-link');
    await sendFeed({
      content: {
        title: name,
        imageUrl: imageUrl ?? VIBLY_LOGO_URL,
        imageWidth: 800,
        imageHeight: 400,
        description,
        link: {
          webUrl: MARKET_URL,
          mobileWebUrl: MARKET_URL,
          iosExecutionParams: [{ key: 'placeId', value: placeId }],
          androidExecutionParams: [{ key: 'placeId', value: placeId }],
        },
      },
      buttons: [
        {
          title: 'Vibly에서 보기',
          link: {
            webUrl: MARKET_URL,
            mobileWebUrl: MARKET_URL,
            iosExecutionParams: [{ key: 'placeId', value: placeId }],
            androidExecutionParams: [{ key: 'placeId', value: placeId }],
          },
        },
        {
          title: '앱 다운로드',
          link: { webUrl: MARKET_URL, mobileWebUrl: MARKET_URL },
        },
      ],
    });
  } catch {
    // 카카오톡 미설치 등 → OS 기본 공유로 폴백
    await Share.share({ message: fallbackMessage, title: name });
  }
}

// ─── 피드형 공유 (바이브 리포트) ───────────────────────────────────────────
export interface ShareVibeReportParams {
  period: 'weekly' | 'monthly';
  dateRange: string;
  checkInCount: number;
  uniquePlacesCount: number;
  vibeScore?: number;
  topVibe?: string;
}

export async function shareVibeReportKakao(params: ShareVibeReportParams): Promise<void> {
  const { period, dateRange, checkInCount, uniquePlacesCount, vibeScore, topVibe } = params;

  const periodLabel = period === 'weekly' ? '주간' : '월간';
  const title = `${periodLabel} 바이브 리포트`;
  const desc = [
    `📅 ${dateRange}`,
    `✅ 체크인 ${checkInCount}회  ·  🗺️ 방문 ${uniquePlacesCount}곳`,
    vibeScore ? `⭐ 바이브 스코어 ${vibeScore}점` : undefined,
    topVibe ? `🏆 최다 방문 분위기: ${topVibe}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');

  const fallbackMessage = `📊 ${title}\n${desc}\n\n— Vibly 🌟\n${MARKET_URL}`;

  // dev client 또는 웹: OS 기본 공유
  if (!isKakaoShareAvailable || Platform.OS === 'web') {
    await Share.share({ message: fallbackMessage });
    return;
  }

  try {
    const { sendFeed } = require('react-native-kakao-share-link');
    await sendFeed({
      content: {
        title: `📊 ${title}`,
        imageUrl: VIBLY_LOGO_URL,
        imageWidth: 800,
        imageHeight: 400,
        description: desc,
        link: { webUrl: MARKET_URL, mobileWebUrl: MARKET_URL },
      },
      buttons: [
        {
          title: 'Vibly에서 기록 보기',
          link: { webUrl: MARKET_URL, mobileWebUrl: MARKET_URL },
        },
        {
          title: '앱 다운로드',
          link: { webUrl: MARKET_URL, mobileWebUrl: MARKET_URL },
        },
      ],
    });
  } catch {
    await Share.share({ message: fallbackMessage });
  }
}
