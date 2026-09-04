import { useEffect, useRef } from 'react';
import { Image as ReactNativeImage, StyleSheet, View } from 'react-native';
import { Map, Marker, NavigationControl, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import {
  currentLocation,
  type MapCoordinate,
  type PreviousLocation,
} from '@/feature/navigation/data/navigation-locations';
import { useTheme } from '@/hooks/use-theme';

type NavigationMapViewProps = {
  destination?: PreviousLocation;
  focusCoordinate?: MapCoordinate;
  focusRequestId?: number;
  routeCoordinates?: MapCoordinate[];
  routeStart?: MapCoordinate;
  routeStopCoordinates?: MapCoordinate[];
};

const stopSignImage = require('@/assets/images/smaple_signs/stop_sign.webp');
const stopSignImageUri = ReactNativeImage.resolveAssetSource(stopSignImage).uri;

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

function createStopSignMarkerElement() {
  const marker = document.createElement('img');
  marker.src = stopSignImageUri;
  marker.alt = 'Stop sign';
  marker.style.width = '36px';
  marker.style.height = '36px';
  marker.style.objectFit = 'contain';
  marker.style.filter = 'drop-shadow(0 2px 3px rgba(9, 35, 60, 0.24))';

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

function createDestinationMarkerElement() {
  const marker = document.createElement('div');
  marker.style.width = '28px';
  marker.style.height = '28px';
  marker.style.border = '2px solid #FFFFFF';
  marker.style.borderRadius = '14px';
  marker.style.background = '#148594';
  marker.style.color = '#FFFFFF';
  marker.style.display = 'flex';
  marker.style.alignItems = 'center';
  marker.style.justifyContent = 'center';
  marker.style.fontSize = '12px';
  marker.style.fontWeight = '900';
  marker.textContent = 'D';

  return marker;
}

function createStartMarkerElement() {
  const marker = document.createElement('div');
  marker.style.width = '24px';
  marker.style.height = '24px';
  marker.style.border = '2px solid #FFFFFF';
  marker.style.borderRadius = '12px';
  marker.style.background = '#1767D2';
  marker.style.color = '#FFFFFF';
  marker.style.display = 'flex';
  marker.style.alignItems = 'center';
  marker.style.justifyContent = 'center';
  marker.style.fontSize = '11px';
  marker.style.fontWeight = '900';
  marker.textContent = 'S';

  return marker;
}

export function NavigationMapView({
  destination,
  focusCoordinate,
  focusRequestId = 0,
  routeCoordinates,
  routeStart,
  routeStopCoordinates = [],
}: NavigationMapViewProps) {
  const theme = useTheme();
  const destinationMarkerRef = useRef<Marker | null>(null);
  const currentLocationMarkerRef = useRef<Marker | null>(null);
  const mapRef = useRef<Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const startMarkerRef = useRef<Marker | null>(null);
  const stopSignMarkersRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new Map({
      attributionControl: {
        compact: true,
      },
      center: currentLocation.coordinate,
      container: mapContainerRef.current,
      doubleClickZoom: true,
      maxZoom: 19,
      minZoom: 11,
      pitchWithRotate: false,
      style: openStreetMapStyle,
      zoom: 15,
    });
    mapRef.current = map;

    map.addControl(new NavigationControl({ showCompass: true }), 'top-right');

    currentLocationMarkerRef.current = new Marker({ element: createDriverMarkerElement(theme.primary) })
      .setLngLat(currentLocation.coordinate)
      .addTo(map);

    return () => {
      destinationMarkerRef.current?.remove();
      currentLocationMarkerRef.current?.remove();
      startMarkerRef.current?.remove();
      stopSignMarkersRef.current.forEach((marker) => marker.remove());
      stopSignMarkersRef.current = [];
      destinationMarkerRef.current = null;
      currentLocationMarkerRef.current = null;
      startMarkerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, [theme.primary]);

  useEffect(() => {
    if (!focusCoordinate || !mapRef.current) return;

    currentLocationMarkerRef.current?.setLngLat(focusCoordinate);
    mapRef.current.flyTo({ center: focusCoordinate, duration: 700, zoom: 16 });
  }, [focusCoordinate, focusRequestId]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    destinationMarkerRef.current?.remove();
    startMarkerRef.current?.remove();
    stopSignMarkersRef.current.forEach((marker) => marker.remove());
    destinationMarkerRef.current = null;
    startMarkerRef.current = null;
    stopSignMarkersRef.current = [];

    if (map.getLayer('selected-route-line')) {
      map.removeLayer('selected-route-line');
    }

    if (map.getSource('selected-route-source')) {
      map.removeSource('selected-route-source');
    }

    if (!destination) {
      map.flyTo({
        center: currentLocation.coordinate,
        duration: 900,
        zoom: 15,
      });
      return;
    }

    destinationMarkerRef.current = new Marker({
      anchor: 'bottom',
      element: createDestinationMarkerElement(),
    })
      .setLngLat(destination.coordinate)
      .addTo(map);

    const renderRoute = () => {
      if (!routeStart || !routeCoordinates?.length) return;

      map.addSource('selected-route-source', {
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates,
          },
        },
        type: 'geojson',
      });
      map.addLayer({
        id: 'selected-route-line',
        source: 'selected-route-source',
        type: 'line',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': theme.primary,
          'line-width': 5,
        },
      });

      startMarkerRef.current = new Marker({
        element: createStartMarkerElement(),
      })
        .setLngLat(routeStart)
        .addTo(map);

      if (routeStopCoordinates.length > 0) {
        stopSignMarkersRef.current = routeStopCoordinates.map((coordinate) => (
          new Marker({ element: createStopSignMarkerElement() })
            .setLngLat(coordinate)
            .addTo(map)
        ));
      }

      map.fitBounds([routeStart, destination.coordinate], {
        duration: 900,
        padding: { bottom: 160, left: 44, right: 44, top: 100 },
      });
    };

    if (routeStart) {
      if (map.isStyleLoaded()) {
        renderRoute();
      } else {
        map.once('load', renderRoute);
      }
      return;
    }

    map.flyTo({
      center: destination.coordinate,
      duration: 900,
      zoom: 14,
    });
  }, [destination, routeCoordinates, routeStart, routeStopCoordinates, theme.primary]);

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
