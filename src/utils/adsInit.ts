import { Platform } from 'react-native';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import mobileAds from 'react-native-google-mobile-ads';

// AdMob 초기화 Promise - 앱 전체에서 한 번만 실행, 광고 로드 전에 await
let _adsInitialized: Promise<void> | null = null;

export function getAdsInitialized(): Promise<void> {
  if (_adsInitialized) return _adsInitialized;

  if (Platform.OS === 'ios') {
    _adsInitialized = requestTrackingPermissionsAsync()
      .catch(() => {})
      .then(() => mobileAds().initialize())
      .then(() => {})
      .catch(() => {});
  } else {
    _adsInitialized = mobileAds()
      .initialize()
      .then(() => {})
      .catch(() => {});
  }

  return _adsInitialized;
}
