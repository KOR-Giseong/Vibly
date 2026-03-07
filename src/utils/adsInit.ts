import { Platform } from 'react-native';
import { requestTrackingPermissionsAsync, PermissionStatus } from 'expo-tracking-transparency';
import mobileAds from 'react-native-google-mobile-ads';

// AdMob 초기화 Promise - 앱 전체에서 한 번만 실행, 광고 로드 전에 await
let _adsInitialized: Promise<void> | null = null;

// ATT 승인 여부 (iOS 전용)
let _attGranted: boolean = false;

/** ATT 동의 여부 반환 (광고 개인화 여부 결정용) */
export function isAttGranted(): boolean {
  return _attGranted;
}

export function getAdsInitialized(): Promise<void> {
  if (_adsInitialized) return _adsInitialized;

  if (Platform.OS === 'ios') {
    _adsInitialized = requestTrackingPermissionsAsync()
      .then((result) => {
        _attGranted = result.status === PermissionStatus.GRANTED;
      })
      .catch(() => {
        _attGranted = false;
      })
      .then(() => mobileAds().initialize())
      .then(() => {
        console.log('[AdMob] SDK initialized, ATT granted:', _attGranted);
      })
      .catch((e) => {
        console.error('[AdMob] SDK init failed:', e);
      });
  } else {
    _adsInitialized = mobileAds()
      .initialize()
      .then(() => {
        console.log('[AdMob] SDK initialized (Android)');
      })
      .catch((e) => {
        console.error('[AdMob] SDK init failed:', e);
      });
  }

  return _adsInitialized;
}
