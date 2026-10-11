import L from 'leaflet'
import type { TileProviderConfig, TileProviderType } from '../types'

/**
 * Standard raster tile providers configured for SignTrustMap apps.
 */
export const TILE_PROVIDERS: Record<TileProviderType, TileProviderConfig> = {
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  voyager: {
    id: 'voyager',
    name: 'Esri World Street Map',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, USGS',
    maxZoom: 19,
  },
  carto: {
    id: 'carto',
    name: 'CartoDB Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 20,
    subdomains: ['a', 'b', 'c', 'd'],
  },
}

/**
 * Factory to instantiate a Leaflet TileLayer based on provider key.
 */
export function createTileLayer(
  type: TileProviderType,
  options?: L.TileLayerOptions
): L.TileLayer {
  const config = TILE_PROVIDERS[type] ?? TILE_PROVIDERS.osm
  return L.tileLayer(config.url, {
    attribution: config.attribution,
    maxZoom: config.maxZoom,
    subdomains: config.subdomains ?? 'abc',
    ...options,
  })
}
