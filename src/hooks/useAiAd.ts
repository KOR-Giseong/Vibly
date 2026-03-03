import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { useCreditStore } from '@stores/credit.store';

// 웹에서는 네이티브 광고 모듈 사용 불가 → 조건부 import
let InterstitialAd: any = null;
let AdEventType: any = null;
let TestIds: any = null;

if (Platform.OS !== 'web') {
  const ads = require('react-native-google-mobile-ads');
  InterstitialAd = ads.InterstitialAd;
  AdEventType = ads.AdEventType;
  TestIds = ads.TestIds;
}

// ── 광고 단위 ID ────────────────────────────────────────────────────────────
// TODO: AdMob 콘솔에서 전면 광고(Interstitial) 단위 생성 후 실제 ID로 교체
const AD_UNIT_ID = Platform.OS === 'web'
  ? ''
  : __DEV__
    ? TestIds?.INTERSTITIAL ?? ''
    : Platform.select({
        ios: 'ca-app-pub-4793069997129951/4804031540',
        android: 'ca-app-pub-4793069997129951/2130096319',
      }) ?? '';

// AI 기능 사용 시 광고 노출 확률 (비프리미엄 유저)
const SHOW_PROBABILITY = 0.35; // 35%

/**
 * AI 기능 사용 시 랜덤으로 전면 광고를 노출하는 훅
 * - 프리미엄 구독자: 광고 없음
 * - 비프리미엄: 35% 확률로 전면 광고 노출
 * - 웹: 광고 없음 (네이티브 전용)
 *
 * 사용법:
 *   const { maybeShowAd } = useAiAd();
 *   // AI 호출 성공 후
 *   maybeShowAd();
 */
export function useAiAd() {
  const { isPremium } = useCreditStore();
  const adReadyRef = useRef(false);
  const adRef = useRef<any>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // 프리미엄이거나 웹이면 광고 로드하지 않음
    if (isPremium || Platform.OS === 'web' || !InterstitialAd || !AD_UNIT_ID) return;

    function setupAd() {
      if (!mountedRef.current) return;

      const ad = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: false,
      });
      adRef.current = ad;
      adReadyRef.current = false;

      const unsubs: (() => void)[] = [];

      unsubs.push(
        ad.addAdEventListener(AdEventType.LOADED, () => {
          adReadyRef.current = true;
        }),
      );

      unsubs.push(
        ad.addAdEventListener(AdEventType.CLOSED, () => {
          adReadyRef.current = false;
          unsubs.forEach((fn) => fn());
          setupAd(); // 다음 광고 미리 로드
        }),
      );

      unsubs.push(
        ad.addAdEventListener(AdEventType.ERROR, () => {
          adReadyRef.current = false;
        }),
      );

      ad.load();
    }

    setupAd();
  }, [isPremium]);

  /**
   * AI 결과 반환 후 호출 → 35% 확률로 전면 광고 노출
   * 프리미엄이거나 광고 미준비 상태면 아무것도 하지 않음
   */
  const maybeShowAd = useCallback(() => {
    if (isPremium) return;
    if (Platform.OS === 'web') return;
    if (!adReadyRef.current || !adRef.current) return;
    if (Math.random() > SHOW_PROBABILITY) return;

    adRef.current.show().catch(() => {
      // show 실패 시 조용히 무시
    });
  }, [isPremium]);

  return { maybeShowAd };
}
