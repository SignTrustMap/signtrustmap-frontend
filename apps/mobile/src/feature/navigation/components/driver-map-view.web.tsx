import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Map, Marker, NavigationControl, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import {
  driverCurrentLocation,
  driverMapSignMarkers,
  type MapCoordinate,
  type PreviousLocation,
} from '@/data/driverLocations';
import { useTheme } from '@/hooks/use-theme';

type DriverMapViewProps = {
  destination?: PreviousLocation;
  routeCoordinates?: MapCoordinate[];
  routeStart?: MapCoordinate;
};

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

export function DriverMapView({ destination, routeCoordinates, routeStart }: DriverMapViewProps) {
  const theme = useTheme();
  const destinationMarkerRef = useRef<Marker | null>(null);
  const mapRef = useRef<Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const startMarkerRef = useRef<Marker | null>(null);

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
    mapRef.current = map;

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
      destinationMarkerRef.current?.remove();
      startMarkerRef.current?.remove();
      destinationMarkerRef.current = null;
      startMarkerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, [theme.tertiary]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    destinationMarkerRef.current?.remove();
    startMarkerRef.current?.remove();
    destinationMarkerRef.current = null;
    startMarkerRef.current = null;

    if (map.getLayer('selected-route-line')) {
      map.removeLayer('selected-route-line');
    }

    if (map.getSource('selected-route-source')) {
      map.removeSource('selected-route-source');
    }

    if (!destination) {
      map.flyTo({
        center: driverCurrentLocation.coordinate,
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
          'line-color': theme.tertiary,
          'line-width': 5,
        },
      });

      startMarkerRef.current = new Marker({
        element: createStartMarkerElement(),
      })
        .setLngLat(routeStart)
        .addTo(map);

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
  }, [destination, routeCoordinates, routeStart, theme.tertiary]);

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
