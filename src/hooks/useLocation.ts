import { useState, useEffect } from 'react';
import { Linking } from 'react-native';
import * as Location from 'expo-location';

// 위치 권한 없을 때 기본값: 서울 시청
const DEFAULT_COORDS = { lat: 37.5665, lng: 126.9780 };

interface LocationState {
  coords: { lat: number; lng: number };
  status: 'idle' | 'loading' | 'granted' | 'denied';
  canAskAgain: boolean;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    coords: DEFAULT_COORDS,
    status: 'idle',
    canAskAgain: true,
  });

  const fetchLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setState({
        coords: { lat: location.coords.latitude, lng: location.coords.longitude },
        status: 'granted',
        canAskAgain: false,
      });
    } catch {
      setState((prev) => ({ ...prev, status: 'denied' }));
    }
  };

  const requestPermission = async () => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    try {
      // 이미 권한이 있으면 바로 위치 가져오기
      const current = await Location.getForegroundPermissionsAsync();
      if (current.status === 'granted') {
        await fetchLocation();
        return;
      }

      // 권한 요청
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({ coords: DEFAULT_COORDS, status: 'denied', canAskAgain });
        return;
      }

      await fetchLocation();
    } catch {
      // expo-location 미지원 환경(웹 등) 폴백
      setState({ coords: DEFAULT_COORDS, status: 'denied', canAskAgain: false });
    }
  };

  // 앱 설정으로 이동 (canAskAgain=false 일 때)
  const openSettings = () => Linking.openSettings();

  useEffect(() => {
    requestPermission();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, requestPermission, openSettings };
}
