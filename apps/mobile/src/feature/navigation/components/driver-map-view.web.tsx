import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Map, Marker, NavigationControl, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { driverCurrentLocation, driverMapSignMarkers } from '@/data/driverLocations';
import { useTheme } from '@/hooks/use-theme';

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

function createSignMarkerElement() {
  const marker = document.createElement('div');
  marker.style.width = '22px';
  marker.style.height = '22px';
  marker.style.border = '2px solid #FFFFFF';
  marker.style.borderRadius = '11px';
  marker.style.background = '#E1382D';
  marker.style.color = '#FFFFFF';
  marker.style.display = 'flex';
  marker.style.alignItems = 'center';
  marker.style.justifyContent = 'center';
  marker.style.fontSize = '12px';
  marker.style.fontWeight = '900';
  marker.textContent = '!';

  return marker;
}

function createDriverMarkerElement(color: string) {
  const halo = document.createElement('div');
  halo.style.width = '58px';
  halo.style.height = '58px';
  halo.style.borderRadius = '29px';
  halo.style.background = 'rgba(0, 123, 139, 0.14)';
  halo.style.display = 'flex';
  halo.style.alignItems = 'center';
  halo.style.justifyContent = 'center';

  const dot = document.createElement('div');
  dot.style.width = '12px';
  dot.style.height = '12px';
  dot.style.border = '2px solid #FFFFFF';
  dot.style.borderRadius = '6px';
  dot.style.background = color;

  halo.appendChild(dot);

  return halo;
}

export function DriverMapView() {
  const theme = useTheme();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new Map({
      attributionControl: {
        compact: true,
      },
      center: driverCurrentLocation.coordinate,
      container: mapContainerRef.current,
      doubleClickZoom: true,
      maxZoom: 19,
      minZoom: 11,
      pitchWithRotate: false,
      style: openStreetMapStyle,
      zoom: 15,
    });

    map.addControl(new NavigationControl({ showCompass: true }), 'top-right');

    driverMapSignMarkers.forEach((marker) => {
      new Marker({ element: createSignMarkerElement() })
        .setLngLat(marker.coordinate)
        .addTo(map);
    });

    new Marker({ element: createDriverMarkerElement(theme.tertiary) })
      .setLngLat(driverCurrentLocation.coordinate)
      .addTo(map);

    return () => {
      map.remove();
    };
  }, [theme.tertiary]);

  return (
    <View style={styles.container}>
      <div ref={mapContainerRef} style={styles.webMap} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webMap: {
    height: '100%',
    width: '100%',
  },
});
