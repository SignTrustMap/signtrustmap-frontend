import type L from 'leaflet'
import type { ReactNode } from 'react'

/** Supported raster tile provider types */
export type TileProviderType = 'osm' | 'voyager' | 'carto'

/** Configuration for a map raster tile provider */
export interface TileProviderConfig {
  id: TileProviderType
  name: string
  url: string
  attribution: string
  maxZoom: number
  subdomains?: string[]
}

/** Generic coordinate interface compatible with [lat, lng] or [lng, lat] */
export type LatLngTuple = [latitude: number, longitude: number]

/** Interface for any sign or point of interest evaluated by collision thinning */
export interface CollisionCandidate {
  id: string | number
  /** [lng, lat] GeoJSON format or object with lat/lng */
  coordinate?: [number, number]
  lat?: number
  lng?: number
  signCode?: string
  code?: string
  category?: string
  name?: string
  status?: string
}

/** Options for dynamic screen collision thinning */
export interface CollisionThinningOptions {
  /** Optional custom padding factor for map bounds (default: 0.08) */
  boundPadding?: number
  /** Custom fallback collision radius in pixels (default: zoom-based 32px-70px) */
  baseRadius?: number
  /** If true, completely bypass thinning and return all valid candidate signs */
  disabled?: boolean
  /** Statuses of signs that must always be preserved on map without culling (e.g. ['flagged', 'revalidating']) */
  preserveStatuses?: string[]
}

/** Options to create an SVG/HTML directional marker icon */
export interface DirectionalMarkerIconOptions {
  category?: string
  code?: string
  mainColor?: string
  ringColor?: string
  bearing?: number
  isSelected?: boolean
  size?: number
  pulse?: boolean
  label?: string
}

/** Props for the BaseMapContainer wrapper component */
export interface BaseMapContainerProps {
  center?: LatLngTuple
  zoom?: number
  minZoom?: number
  maxZoom?: number
  tileMode?: TileProviderType
  className?: string
  zoomControlPosition?: L.ControlPosition
  onMapReady?: (map: L.Map) => void
  onBoundsChange?: (bounds: L.LatLngBounds, zoom: number) => void
  children?: ReactNode
}
