import type { MapRef, StyleSpecification } from '@maplibre/maplibre-react-native';
import { useRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import {
  currentLocation,
  type MapCoordinate,
  type PreviousLocation,
} from '@/feature/navigation/data/navigation-locations';
import type { RouteSign } from '@/api/navigation/navigation';
import type { FindSignsInBoundsParams } from '@/types/sign-map/signMapType';
import { useTheme } from '@/hooks/use-theme';
import { getMapLibre, type MapLibreModule } from '@/services/maplibre';

type NavigationMapViewProps = {
  onBoundsChange?: (bounds: FindSignsInBoundsParams) => void;
  destination?: PreviousLocation;
  focusCoordinate?: MapCoordinate;
  focusRequestId?: number;
  navigationActive?: boolean;
  routeCoordinates?: MapCoordinate[];
  routeStart?: MapCoordinate;
  routeSigns?: RouteSign[];
  showCurrentLocation?: boolean;
  isNavigatingFeature?: boolean;
};

const stopSignImage = require('@/assets/images/smaple_signs/stop_sign.webp');
const mapTileUrl = process.env.EXPO_PUBLIC_MAP_TILE_URL?.trim()
  || 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

function getRouteBounds(start: MapCoordinate, destination: MapCoordinate) {
  return [
    Math.min(start[0], destination[0]),
    Math.min(start[1], destination[1]),
    Math.max(start[0], destination[0]),
    Math.max(start[1], destination[1]),
  ] as [west: number, south: number, east: number, north: number];
}

function loadMapLibre(): MapLibreModule | null {
  return getMapLibre();
}

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

export function NavigationMapView({
  onBoundsChange,
  destination,
  focusCoordinate,
  focusRequestId = 0,
  navigationActive = false,
  routeCoordinates,
  routeStart,
  routeSigns = [],
  showCurrentLocation = true,
  isNavigatingFeature = false,
}: NavigationMapViewProps) {
  const theme = useTheme();
  const mapRef = useRef<MapRef>(null);
  const reportBounds = ([minLon, minLat, maxLon, maxLat]: [number, number, number, number]) => {
    onBoundsChange?.({ minLon, minLat, maxLon, maxLat });
  };
  const mapLibre = loadMapLibre();
  const cameraCenter = destination?.coordinate ?? currentLocation.coordinate;
  const routeBounds = destination && routeStart ? getRouteBounds(routeStart, destination.coordinate) : null;
  const routeGeoJson = routeCoordinates?.length
    ? ({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: routeCoordinates,
      },
    } as GeoJSON.Feature<GeoJSON.LineString>)
    : null;
  if (!mapLibre) {
    return (
      <View style={[styles.fallback, { backgroundColor: theme.background }]}>
        <View style={[styles.fallbackPanel, { backgroundColor: theme.backgroundElement }]}>
          <Text style={[styles.fallbackTitle, { color: theme.text }]}>Map build required</Text>
          <Text style={[styles.fallbackCopy, { color: theme.textSecondary }]}>
            MapLibre is installed, but this app binary does not include its native module yet.
            Rebuild the Expo development client to enable the interactive map.
          </Text>
        </View>
      </View>
    );
  }

  const { Camera, GeoJSONSource, Layer, Map, Marker, UserLocation } = mapLibre;

  return (
    <Map
      ref={mapRef}
      onRegionDidChange={(event) => reportBounds(event.nativeEvent.bounds)}
      onDidFinishLoadingMap={() => {
        void mapRef.current?.getBounds().then(reportBounds).catch(() => {
          // The next region change reports bounds if the map is not ready yet.
        });
      }}
      attribution
      attributionPosition={{ bottom: 8, right: 8 }}
      compass
      compassPosition={{ top: 112, right: 16 }}
      logo={false}
      mapStyle={openStreetMapStyle}
      style={styles.map}
      touchPitch={false}
      touchRotate={false}
    >
      {navigationActive ? (
        <Camera
          duration={900}
          easing="fly"
          maxZoom={19}
          minZoom={11}
          padding={{
            bottom: 320,
            left: 24,
            right: 24,
            top: 80,
          }}
          trackUserLocation="heading"
          zoom={18}
          pitch={20}
        />
      ) : focusCoordinate ? (
        <Camera
          center={focusCoordinate}
          duration={700}
          easing="fly"
          key={`focus-${focusRequestId}`}
          maxZoom={19}
          minZoom={11}
          zoom={16}
        />
      ) : routeBounds ? (
        <Camera
          bounds={routeBounds}
          duration={900}
          easing="fly"
          maxZoom={19}
          minZoom={11}
          padding={{ bottom: 160, left: 44, right: 44, top: 100 }}
        />
      ) : (
        <Camera
          center={cameraCenter}
          duration={900}
          easing="fly"
          maxZoom={19}
          minZoom={11}
          zoom={destination ? 14 : 15}
        />
      )}

      {routeGeoJson ? (
        <GeoJSONSource data={routeGeoJson} id="selected-route-source">
          <Layer
            id="selected-route-line"
            type="line"
            style={{
              lineCap: 'round',
              lineColor: theme.primary,
              lineJoin: 'round',
              lineWidth: 5,
            }}
          />
        </GeoJSONSource>
      ) : null}

      {routeSigns.map((sign) => (
        <Marker anchor="center" id={`route-sign-${sign.id}`} key={sign.id} lngLat={sign.coordinate}>
          <View style={styles.stopSignMarker}>
            <Image
              accessibilityLabel={sign.name || sign.signCode}
              source={sign.imageUrl ? { uri: sign.imageUrl } : stopSignImage}
              resizeMode="contain"
              style={styles.stopSignImage}
            />
          </View>
        </Marker>
      ))}

      {navigationActive ? (
        <UserLocation accuracy animated heading minDisplacement={1} />
      ) : showCurrentLocation ? (
        <Marker
          anchor="center"
          id="current-location"
          lngLat={focusCoordinate ?? currentLocation.coordinate}
        >
          <>
            <View style={styles.currentLocationHalo}>
              <View style={[styles.currentLocationDot, { backgroundColor: theme.primary }]} />
            </View>
          </>
        </Marker>
      ) : null}

      {routeStart ? (
        <Marker anchor="center" id="route-start-location" lngLat={routeStart}>
          <View style={styles.startMarker}>
            <Text style={styles.startMarkerText}>S</Text>
          </View>
        </Marker>
      ) : null}

      {destination ? (
        <Marker anchor="bottom" id="destination-location" lngLat={destination.coordinate}>
          <View style={styles.destinationMarker}>
            <Text style={styles.destinationMarkerText}>D</Text>
          </View>
        </Marker>
      ) : null}
    </Map>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  fallbackPanel: {
    gap: Spacing.one,
    borderRadius: Rounded.lg,
    padding: Spacing.four,
  },
  fallbackTitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    fontWeight: 900,
  },
  fallbackCopy: {
    fontFamily: Fonts.body,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 19,
  },
  stopSignMarker: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#09233C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.24,
    shadowRadius: 3,
    elevation: 4,
  },
  stopSignImage: {
    width: 36,
    height: 36,
  },
  currentLocationHalo: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(0, 123, 139, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  destinationMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#148594',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationMarkerText: {
    color: '#FFFFFF',
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 900,
  },
  startMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#1767D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startMarkerText: {
    color: '#FFFFFF',
    fontFamily: Fonts.body,
    fontSize: 11,
    fontWeight: 900,
  },
});
