import { useState, useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import * as Location from 'expo-location';

// 위치 권한 없을 때 기본값: 서울 시청
const DEFAULT_COORDS = { lat: 37.5665, lng: 126.9780 };

interface LocationState {
  coords: { lat: number; lng: number };
  status: 'idle' | 'loading' | 'granted' | 'denied';
  canAskAgain: boolean;
  isLive: boolean; // watchPositionAsync 콜백에서만 true (캐시 위치 아님)
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    coords: DEFAULT_COORDS,
    status: 'idle',
    canAskAgain: true,
    isLive: false,
  });

  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const startWatching = async () => {
    // 기존 감시 중지
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }

    try {
      // 먼저 마지막으로 알려진 위치를 빠르게 가져옴 (즉시 응답, isLive=false)
      const last = await Location.getLastKnownPositionAsync({});
      if (last) {
        setState({
          coords: { lat: last.coords.latitude, lng: last.coords.longitude },
          status: 'granted',
          canAskAgain: false,
          isLive: false,
        });
      }

      // 실시간 위치 감시 시작 (정확한 GPS, isLive=true)
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 30, // 30m 이동 시 업데이트
          timeInterval: 5000,   // 최소 5초 간격
        },
        (location) => {
          setState({
            coords: { lat: location.coords.latitude, lng: location.coords.longitude },
            status: 'granted',
            canAskAgain: false,
            isLive: true,
          });
        },
      );
    } catch {
      setState((prev) => ({ ...prev, status: 'denied' }));
    }
  };

  const requestPermission = async () => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    try {
      // 이미 권한이 있으면 바로 감시 시작
      const current = await Location.getForegroundPermissionsAsync();
      if (current.status === 'granted') {
        await startWatching();
        return;
      }

      // 권한 요청
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({ coords: DEFAULT_COORDS, status: 'denied', canAskAgain, isLive: false });
        return;
      }

      await startWatching();
    } catch {
      setState({ coords: DEFAULT_COORDS, status: 'denied', canAskAgain: false, isLive: false });
    }
  };

  const openSettings = () => Linking.openSettings();

  useEffect(() => {
    requestPermission();
    return () => {
      // 언마운트 시 감시 정리
      watchRef.current?.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, requestPermission, openSettings };
}
