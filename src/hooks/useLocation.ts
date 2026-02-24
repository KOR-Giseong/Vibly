import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  coords: { lat: number; lng: number } | null;
  status: 'idle' | 'loading' | 'granted' | 'denied';
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({ coords: null, status: 'idle' });

  const requestPermission = async () => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      setState({ coords: null, status: 'denied' });
      return;
    }

    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setState({
      coords: { lat: location.coords.latitude, lng: location.coords.longitude },
      status: 'granted',
    });
  };

  useEffect(() => {
    requestPermission();
  }, []);

  return { ...state, requestPermission };
}
