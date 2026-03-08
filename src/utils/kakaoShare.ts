import { Platform, Share } from 'react-native';

/**
 * Vibly 카카오링크 공유 유틸리티
 *
 * ▸ 실제 기기(iOS/Android): KakaoTalk 앱 친구/채팅방 공유
 * ▸ 웹 / 폴백: 기본 OS 공유 시트
 *
 * [공개 이미지 URL 설정]
 * VIBLY_LOGO_URL 에 카카오 개발자 콘솔에 등록한
 * 로고 이미지의 공개 HTTPS URL을 입력하세요.
 */

// ─── 상수 ──────────────────────────────────────────────────────────────────
export const VIBLY_LOGO_URL =
  'https://vibly-backend-jo12.onrender.com/public/vibly-logo.png';

// 앱스토어 / 플레이스토어 랜딩 (없으면 마케팅 웹페이지 링크로 교체)
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
  imageUrl?: string; // 장소 대표 이미지 (없으면 로고 사용)
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

  if (Platform.OS === 'web') {
    await Share.share({ message: `${name}\n${description}\n\nVibly 앱에서 확인하세요 🌟` });
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
          link: {
            webUrl: MARKET_URL,
            mobileWebUrl: MARKET_URL,
          },
        },
      ],
    });
  } catch (e: any) {
    // 카카오톡 미설치 등 → OS 기본 공유로 폴백
    await Share.share({
      message: `${name}\n${description}\n\nVibly 앱에서 확인하세요 🌟\n${MARKET_URL}`,
      title: name,
    });
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

  if (Platform.OS === 'web') {
    await Share.share({ message: `📊 ${title}\n${desc}\n\n— Vibly 🌟` });
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
        link: {
          webUrl: MARKET_URL,
          mobileWebUrl: MARKET_URL,
        },
      },
      buttons: [
        {
          title: 'Vibly에서 기록 보기',
          link: {
            webUrl: MARKET_URL,
            mobileWebUrl: MARKET_URL,
          },
        },
        {
          title: '앱 다운로드',
          link: {
            webUrl: MARKET_URL,
            mobileWebUrl: MARKET_URL,
          },
        },
      ],
    });
  } catch {
    await Share.share({
      message: `📊 ${title}\n${desc}\n\n— Vibly 🌟\n${MARKET_URL}`,
    });
  }
}
