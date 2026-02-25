import { forwardRef } from 'react';

export interface MapHandle {
  animateTo: (lat: number, lng: number) => void;
}

export interface MapContainerProps {
  places: unknown[];
  selectedId: string | null;
  coords: { lat: number; lng: number };
  onMarkerPress: (place: unknown) => void;
  onMapPress: () => void;
}

// Web에서는 react-native-maps를 지원하지 않으므로 null 반환
const MapContainer = forwardRef<MapHandle, MapContainerProps>((_props, _ref) => null);
MapContainer.displayName = 'MapContainer';
export default MapContainer;
