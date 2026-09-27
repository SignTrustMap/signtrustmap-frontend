import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Map, Marker, NavigationControl, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { RouteSign } from '@/api/navigation/navigation';
import type { MapCoordinate } from '@/types/navigationType';
import type { FindSignsInBoundsParams } from '@/types/signMapType';
import { useTheme } from '@/hooks/use-theme';
import { getFreshnessInfo } from './revalidation-sign-marker';

export type RevalidationMapViewProps = {
  signs?: RouteSign[];
  selectedSignId?: string | null;
  onSignPress?: (sign: RouteSign) => void;
  onBoundsChange?: (bounds: FindSignsInBoundsParams) => void;
  userCoordinate?: MapCoordinate;
  focusCoordinate?: MapCoordinate;
  focusRequestId?: number;
};

const mapTileUrl =
  process.env.EXPO_PUBLIC_MAP_TILE_URL?.trim() ||
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

const openStreetMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: [mapTileUrl],
      tileSize: 256,
      attribution: 'Esri, HERE, Garmin, USGS, OpenStreetMap contributors, GIS user community',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
};

function createWebSignMarkerElement(sign: RouteSign, isSelected: boolean, onClick: () => void) {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.width = '42px';
  container.style.height = '42px';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.cursor = 'pointer';

  const { scorePercent, isStale, isModerate, isFresh } = getFreshnessInfo(sign);

  const bubble = document.createElement('div');
  bubble.style.width = '36px';
  bubble.style.height = '36px';
  bubble.style.borderRadius = '50%';
  bubble.style.background = '#FFFFFF';
  bubble.style.display = 'flex';
  bubble.style.alignItems = 'center';
  bubble.style.justifyContent = 'center';
  bubble.style.boxShadow = '0 3px 6px rgba(9, 35, 60, 0.28)';
  bubble.style.border = isSelected
    ? '3px solid #2563EB'
    : isStale
      ? '2.5px solid #EF4444'
      : isModerate
        ? '2px solid #F59E0B'
        : '2px solid #0671eb';
  bubble.style.transition = 'transform 0.15s ease';
  if (isSelected) {
    bubble.style.transform = 'scale(1.15)';
  }

  const img = document.createElement('img');
  img.src = sign.imageUrl || '';
  img.alt = sign.name || sign.signCode;
  img.style.width = '24px';
  img.style.height = '24px';
  img.style.objectFit = 'contain';
  img.onerror = () => {
    img.style.display = 'none';
  };
  bubble.appendChild(img);
  container.appendChild(bubble);

  // Freshness Indicator Badge
  if (isStale || isModerate || isFresh) {
    const badge = document.createElement('div');
    badge.style.position = 'absolute';
    badge.style.top = '0px';
    badge.style.right = '0px';
    badge.style.height = '16px';
    badge.style.minWidth = '16px';
    badge.style.borderRadius = '8px';
    badge.style.border = '1.5px solid #FFFFFF';
    badge.style.display = 'flex';
    badge.style.alignItems = 'center';
    badge.style.justifyContent = 'center';
    badge.style.fontSize = '8px';
    badge.style.fontWeight = 'bold';
    badge.style.color = '#FFFFFF';
    badge.style.padding = '0 2px';

    if (isStale) {
      badge.style.background = '#EF4444';
      badge.textContent = '!';
    } else if (isModerate) {
      badge.style.background = '#F59E0B';
      badge.textContent = `${scorePercent}%`;
    } else {
      badge.style.background = '#10B981';
      badge.textContent = '✓';
    }
    container.appendChild(badge);
  }

  container.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });

  return container;
}

function createUserLocationMarkerElement(primaryColor: string) {
  const marker = document.createElement('div');
  marker.style.width = '26px';
  marker.style.height = '26px';
  marker.style.borderRadius = '13px';
  marker.style.background = 'rgba(6, 113, 235, 0.22)';
  marker.style.border = '1.5px solid #FFFFFF';
  marker.style.display = 'flex';
  marker.style.alignItems = 'center';
  marker.style.justifyContent = 'center';

  const dot = document.createElement('div');
  dot.style.width = '12px';
  dot.style.height = '12px';
  dot.style.borderRadius = '6px';
  dot.style.background = primaryColor;
  dot.style.border = '2px solid #FFFFFF';
  marker.appendChild(dot);

  return marker;
}

export function RevalidationMapView({
  signs = [],
  selectedSignId,
  onSignPress,
  onBoundsChange,
  userCoordinate,
  focusCoordinate,
  focusRequestId = 0,
}: RevalidationMapViewProps) {
  const theme = useTheme();
  const mapRef = useRef<Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const signMarkersRef = useRef<Marker[]>([]);
  const userMarkerRef = useRef<Marker | null>(null);

  const initialCenter = userCoordinate ?? focusCoordinate ?? [106.6955, 10.7769];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new Map({
      attributionControl: { compact: true },
      center: initialCenter,
      container: mapContainerRef.current,
      doubleClickZoom: true,
      maxZoom: 19,
      minZoom: 10,
      pitchWithRotate: false,
      style: openStreetMapStyle,
      zoom: 15,
    });
    mapRef.current = map;

    map.addControl(new NavigationControl({ showCompass: true }), 'top-right');

    return () => {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      signMarkersRef.current.forEach((m) => m.remove());
      signMarkersRef.current = [];
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onBoundsChange) return;

    const reportBounds = () => {
      const bounds = map.getBounds();
      onBoundsChange({
        minLat: bounds.getSouth(),
        minLon: bounds.getWest(),
        maxLat: bounds.getNorth(),
        maxLon: bounds.getEast(),
      });
    };

    map.on('load', reportBounds);
    map.on('moveend', reportBounds);
    if (map.loaded()) reportBounds();

    return () => {
      map.off('load', reportBounds);
      map.off('moveend', reportBounds);
    };
  }, [onBoundsChange]);

  // Update Sign Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    signMarkersRef.current.forEach((m) => m.remove());

    const markers = signs.map((sign) => {
      const isSelected = selectedSignId === sign.id;
      const el = createWebSignMarkerElement(sign, isSelected, () => {
        onSignPress?.(sign);
      });
      return new Marker({ element: el })
        .setLngLat(sign.coordinate)
        .addTo(map);
    });

    signMarkersRef.current = markers;

    return () => {
      markers.forEach((m) => m.remove());
      signMarkersRef.current = [];
    };
  }, [signs, selectedSignId, onSignPress]);

  // Update User Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!userCoordinate) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }

    if (!userMarkerRef.current) {
      userMarkerRef.current = new Marker({
        element: createUserLocationMarkerElement(theme.primary),
      })
        .setLngLat(userCoordinate)
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat(userCoordinate);
    }
  }, [userCoordinate, theme.primary]);

  // Focus Coordinate FlyTo
  useEffect(() => {
    if (!focusCoordinate || !mapRef.current) return;
    mapRef.current.flyTo({ center: focusCoordinate, duration: 700, zoom: 16.5 });
  }, [focusCoordinate, focusRequestId]);

  return <View ref={mapContainerRef as any} style={styles.map} />;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
