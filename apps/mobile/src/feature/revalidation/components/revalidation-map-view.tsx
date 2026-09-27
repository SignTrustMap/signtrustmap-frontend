import type { CameraRef, MapRef, StyleSpecification } from '@maplibre/maplibre-react-native';
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { RouteSign } from '@/api/navigation/navigation';
import type { MapCoordinate } from '@/types/navigationType';
import type { FindSignsInBoundsParams } from '@/types/signMapType';
import { useTheme } from '@/hooks/use-theme';
import { getMapLibre, type MapLibreModule } from '@/services/maplibre';
import { RevalidationSignMarker } from './revalidation-sign-marker';

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

function loadMapLibre(): MapLibreModule | null {
  return getMapLibre();
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
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);

  const reportBounds = ([minLon, minLat, maxLon, maxLat]: [number, number, number, number]) => {
    onBoundsChange?.({ minLon, minLat, maxLon, maxLat });
  };

  const mapLibre = loadMapLibre();

  if (!mapLibre) {
    return (
      <View style={[styles.fallback, { backgroundColor: theme.background }]}>
        <View style={[styles.fallbackPanel, { backgroundColor: theme.backgroundElement }]}>
          <Text style={[styles.fallbackTitle, { color: theme.text }]}>Interactive Map Client</Text>
          <Text style={[styles.fallbackCopy, { color: theme.textSecondary }]}>
            MapLibre native module is not registered in this binary environment.
            Please test on development client or web preview.
          </Text>
        </View>
      </View>
    );
  }

  const { Camera, Map, Marker } = mapLibre;

  return (
    <Map
      attribution
      attributionPosition={{ bottom: 8, right: 8 }}
      compass
      compassPosition={{ top: 120, right: 16 }}
      logo={false}
      mapStyle={openStreetMapStyle}
      onDidFinishLoadingMap={() => {
        void mapRef.current?.getBounds().then(reportBounds).catch(() => {});
      }}
      onRegionDidChange={(event: { nativeEvent: { bounds: [number, number, number, number] } }) =>
        reportBounds(event.nativeEvent.bounds)
      }
      ref={mapRef}
      style={styles.map}
      touchPitch={false}
      touchRotate
    >
      {focusCoordinate ? (
        <Camera
          center={focusCoordinate}
          duration={700}
          easing="fly"
          key={`reval-focus-${focusRequestId}`}
          maxZoom={19}
          minZoom={10}
          ref={cameraRef}
          zoom={16.5}
        />
      ) : userCoordinate ? (
        <Camera
          center={userCoordinate}
          duration={800}
          easing="fly"
          key="reval-user-center"
          maxZoom={19}
          minZoom={10}
          ref={cameraRef}
          zoom={15.5}
        />
      ) : (
        <Camera
          center={[106.6955, 10.7769]}
          duration={0}
          key="reval-default-center"
          maxZoom={19}
          minZoom={10}
          ref={cameraRef}
          zoom={14}
        />
      )}

      {/* Render Verified Signs with Freshness Indicators */}
      {signs.map((sign) => {
        const isSelected = selectedSignId === sign.id;
        return (
          <Marker
            anchor="center"
            id={`reval-sign-${sign.id}`}
            key={sign.id}
            lngLat={sign.coordinate}
            onPress={() => onSignPress?.(sign)}
          >
            <RevalidationSignMarker isSelected={isSelected} sign={sign} />
          </Marker>
        );
      })}

      {/* User Current Location Indicator */}
      {userCoordinate ? (
        <Marker anchor="center" id="reval-current-location" lngLat={userCoordinate}>
          <View style={styles.currentLocationHalo}>
            <View style={[styles.currentLocationDot, { backgroundColor: theme.primary }]} />
          </View>
        </Marker>
      ) : null}
    </Map>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  currentLocationHalo: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(6, 113, 235, 0.22)',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  currentLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fallbackPanel: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxWidth: 360,
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  fallbackCopy: {
    fontSize: 13,
    lineHeight: 18,
  },
});
