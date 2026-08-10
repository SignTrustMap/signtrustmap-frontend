import type { StyleSpecification } from '@maplibre/maplibre-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Rounded, Spacing } from '@/constants/theme';
import { driverCurrentLocation, driverMapSignMarkers } from '@/data/driverLocations';
import { useTheme } from '@/hooks/use-theme';

type MapLibreModule = typeof import('@maplibre/maplibre-react-native');

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

export function DriverMapView() {
  const theme = useTheme();
  const mapLibre = loadMapLibre();

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

  const { Camera, Map, Marker } = mapLibre;

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
      <Camera
        center={driverCurrentLocation.coordinate}
        maxZoom={19}
        minZoom={11}
        zoom={15}
      />

      {driverMapSignMarkers.map((marker) => (
        <Marker anchor="center" id={marker.id} key={marker.id} lngLat={marker.coordinate}>
          <View style={styles.signMarker}>
            <Text style={styles.signMarkerText}>!</Text>
          </View>
        </Marker>
      ))}

      <Marker anchor="center" id="driver-location" lngLat={driverCurrentLocation.coordinate}>
        <View style={styles.currentLocationHalo}>
          <View style={[styles.currentLocationDot, { backgroundColor: theme.tertiary }]} />
        </View>
      </Marker>
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
  signMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#E1382D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signMarkerText: {
    color: '#FFFFFF',
    fontFamily: Fonts.body,
    fontSize: 12,
    fontWeight: 900,
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
});
