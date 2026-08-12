import type { StyleSpecification } from '@maplibre/maplibre-react-native';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import {
  driverCurrentLocation,
  type MapCoordinate,
  type PreviousLocation,
} from '@/data/driverLocations';
import { useTheme } from '@/hooks/use-theme';

type MapLibreModule = typeof import('@maplibre/maplibre-react-native');

type DriverMapViewProps = {
  destination?: PreviousLocation;
  navigationActive?: boolean;
  routeCoordinates?: MapCoordinate[];
  routeStart?: MapCoordinate;
  routeStopCoordinates?: MapCoordinate[];
};

const stopSignImage = require('@/assets/images/smaple_signs/stop_sign.webp');

function getRouteBounds(start: MapCoordinate, destination: MapCoordinate) {
  return [
    Math.min(start[0], destination[0]),
    Math.min(start[1], destination[1]),
    Math.max(start[0], destination[0]),
    Math.max(start[1], destination[1]),
  ] as [west: number, south: number, east: number, north: number];
}

function loadMapLibre(): MapLibreModule | null {
  try {
    // Guarded require prevents Expo Go or stale native builds from crashing on import.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@maplibre/maplibre-react-native') as MapLibreModule;
  } catch {
    return null;
  }
}

const openStreetMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: 'OpenStreetMap contributors',
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

export function DriverMapView({
  destination,
  navigationActive = false,
  routeCoordinates,
  routeStart,
  routeStopCoordinates = [],
}: DriverMapViewProps) {
  const theme = useTheme();
  const mapLibre = loadMapLibre();
  const cameraCenter = destination?.coordinate ?? driverCurrentLocation.coordinate;
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
          padding={{ bottom: 210, left: 24, right: 24, top: 120 }}
          trackUserLocation="heading"
          zoom={17}
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
              lineColor: theme.tertiary,
              lineJoin: 'round',
              lineWidth: 5,
            }}
          />
        </GeoJSONSource>
      ) : null}

      {routeStopCoordinates.map((coordinate, index) => (
        <Marker anchor="center" id={`route-stop-sign-${index + 1}`} key={index} lngLat={coordinate}>
          <View style={styles.stopSignMarker}>
            <Image
              accessibilityLabel="Stop sign"
              source={stopSignImage}
              resizeMode="contain"
              style={styles.stopSignImage}
            />
          </View>
        </Marker>
      ))}

      {navigationActive ? (
        <UserLocation accuracy animated heading minDisplacement={1} />
      ) : (
        <Marker anchor="center" id="driver-location" lngLat={driverCurrentLocation.coordinate}>
          <View style={styles.currentLocationHalo}>
            <View style={[styles.currentLocationDot, { backgroundColor: theme.tertiary }]} />
          </View>
        </Marker>
      )}

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
