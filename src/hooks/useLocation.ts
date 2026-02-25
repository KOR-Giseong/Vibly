import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

// 위치 권한 없을 때 기본값: 서울 시청
const DEFAULT_COORDS = { lat: 37.5665, lng: 126.9780 };

interface LocationState {
  coords: { lat: number; lng: number };
  status: 'idle' | 'loading' | 'granted' | 'denied';
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({ coords: DEFAULT_COORDS, status: 'idle' });

  const requestPermission = async () => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        // 권한 거부 시 서울 시청 기본값으로 폴백 (웹·권한거부 모두 대응)
        setState({ coords: DEFAULT_COORDS, status: 'denied' });
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setState({
        coords: { lat: location.coords.latitude, lng: location.coords.longitude },
        status: 'granted',
      });
    } catch {
      // expo-location 미지원 환경(웹 등) 폴백
      setState({ coords: DEFAULT_COORDS, status: 'denied' });
    }
  };

  useEffect(() => {
    requestPermission();
  }, []);

  return { ...state, requestPermission };
}
