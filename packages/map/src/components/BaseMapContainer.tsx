import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { BaseMapContainerProps } from '../types'
import { setupLeafletDefaultIcons } from '../utils/leafletSetup'
import { createTileLayer } from '../utils/tileProviders'

/**
 * Standardized Leaflet Map Container for SignTrustMap applications (Web & Ops).
 * Handles map lifecycle, tile switching, resize invalidation, and boundary callbacks.
 */
export function BaseMapContainer({
  center = [10.7769, 106.7009],
  zoom = 15,
  minZoom = 5,
  maxZoom = 19,
  tileMode = 'osm',
  className = 'w-full h-full relative',
  zoomControlPosition = 'bottomright',
  onMapReady,
  onBoundsChange,
  children,
}: BaseMapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return

    setupLeafletDefaultIcons()

    const map = L.map(containerRef.current, {
      center,
      zoom,
      minZoom,
      maxZoom,
      zoomControl: false,
    })

    if (zoomControlPosition) {
      L.control.zoom({ position: zoomControlPosition }).addTo(map)
    }

    const tile = createTileLayer(tileMode).addTo(map)
    tileLayerRef.current = tile
    mapInstanceRef.current = map

    if (onMapReady) {
      onMapReady(map)
    }

    const handleBoundsUpdate = () => {
      if (!onBoundsChange) return
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        if (mapInstanceRef.current) {
          onBoundsChange(mapInstanceRef.current.getBounds(), mapInstanceRef.current.getZoom())
        }
      }, 300)
    }

    map.on('moveend', handleBoundsUpdate)
    map.on('zoomend', handleBoundsUpdate)

    const handleResize = () => {
      map.invalidateSize()
    }
    window.addEventListener('resize', handleResize)

    const invalidateTimer = setTimeout(() => {
      map.invalidateSize()
    }, 250)

    return () => {
      clearTimeout(invalidateTimer)
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      window.removeEventListener('resize', handleResize)
      map.off('moveend', handleBoundsUpdate)
      map.off('zoomend', handleBoundsUpdate)
      map.remove()
      mapInstanceRef.current = null
      tileLayerRef.current = null
    }
  }, []) // Mount once

  // Switch Tile Layer when tileMode changes
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
    }

    const newLayer = createTileLayer(tileMode).addTo(map)
    tileLayerRef.current = newLayer
  }, [tileMode])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}
