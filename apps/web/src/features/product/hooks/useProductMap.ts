import { useCallback, useEffect, useRef, useState } from 'react'
import type { TFunction } from 'i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { signsService } from '@/api/services/signs.service'
import { navigationService } from '@/api/services/navigation.service'
import type { ApiPlace, NavigationRoute, RouteSign, VehicleModeId } from '@shared/types'
import {
  setupLeafletDefaultIcons,
  createRouteSignMarker,
  createCurrentLocationMarker,
} from '../utils/productMapHelpers'

// Fix Leaflet default marker icons using localized assets
setupLeafletDefaultIcons()

const ESRI_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

interface UseProductMapProps {
  isDark: boolean
  t: TFunction<'product'>
}

/**
 * Custom hook encapsulating Leaflet map lifecycle, live GIS signs fetching,
 * real-time device geolocation tracking (pulsing driver marker),
 * Esri/OSM tile switching, and vehicle navigation state.
 */
export function useProductMap({ isDark, t }: UseProductMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const markersMapRef = useRef<Record<string, L.Marker>>({})
  const routeLayerRef = useRef<L.LayerGroup | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const userLocationLayerRef = useRef<L.LayerGroup | null>(null)
  const selectedDestinationRef = useRef<ApiPlace | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasAutoCenteredRef = useRef(false)

  // Map state — default to 'esri' matching mobile app
  const [tileMode, setTileMode] = useState<'osm' | 'esri'>('esri')
  const [isLoadingGis, setIsLoadingGis] = useState(false)
  const [mapSigns, setMapSigns] = useState<RouteSign[]>([])

  // Live GPS user location state
  const [userCoordinate, setUserCoordinate] = useState<[latitude: number, longitude: number] | null>(null)

  // Navigation state
  const [selectedDestination, setSelectedDestination] = useState<ApiPlace | null>(null)
  const [activeRoute, setActiveRoute] = useState<NavigationRoute | null>(null)
  const [routeSigns, setRouteSigns] = useState<RouteSign[]>([])
  const [vehicleMode, setVehicleMode] = useState<VehicleModeId>('DRIVING')
  const [isNavigating, setIsNavigating] = useState(false)
  const [previewCropUrl, setPreviewCropUrl] = useState<string | null>(null)

  // Keep ref synchronized without causing map re-initialization
  useEffect(() => {
    selectedDestinationRef.current = selectedDestination
  }, [selectedDestination])

  const getTileModeLabel = (mode: 'osm' | 'esri') => {
    return mode === 'esri'
      ? t('map_page.tile_voyager', 'Bản đồ đường phố (Esri)')
      : t('map_page.tile_osm', 'Bản đồ OSM')
  }

  // ─── Fetch Signs in Current Viewport Bounds (/signs) ──────────────────────
  const fetchViewportSigns = useCallback(async (targetMap: L.Map) => {
    try {
      setIsLoadingGis(true)
      const bounds = targetMap.getBounds()
      const signs = await signsService.getSignsInBounds({
        minLat: bounds.getSouth(),
        minLon: bounds.getWest(),
        maxLat: bounds.getNorth(),
        maxLon: bounds.getEast(),
        limit: 120,
      })

      if (signs && signs.length > 0) {
        setMapSigns((prev) => {
          const signMap = new Map<string, RouteSign>()
          signs.forEach((s) => signMap.set(s.id, s))
          prev.forEach((s) => {
            if (!signMap.has(s.id)) signMap.set(s.id, s)
          })
          return Array.from(signMap.values())
        })
      }
    } catch (err) {
      console.warn('[MapGIS] Live signs in bounds fetch failed:', err)
    } finally {
      setIsLoadingGis(false)
    }
  }, [])

  // ─── Initialize Leaflet Map (Runs once on mount) ───────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    // Center initially on HCMC center; will smoothly pan to user GPS when fixed
    const map = L.map(mapContainerRef.current, {
      center: [10.7769, 106.7009],
      zoom: 15,
      zoomControl: false,
    })

    // Esri World Street Map is the default tile layer (identical to mobile)
    const initialTile = L.tileLayer(ESRI_TILE_URL, {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS',
      maxZoom: 19,
    }).addTo(map)
    tileLayerRef.current = initialTile

    const routeLayer = L.layerGroup().addTo(map)
    routeLayerRef.current = routeLayer

    const markersLayer = L.layerGroup().addTo(map)
    markersLayerRef.current = markersLayer

    const userLocationLayer = L.layerGroup().addTo(map)
    userLocationLayerRef.current = userLocationLayer

    mapInstanceRef.current = map

    const onMoveEnd = () => {
      // Don't auto-fetch viewport bounds if actively viewing a planned route
      if (selectedDestinationRef.current) return

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        fetchViewportSigns(map)
      }, 400)
    }

    map.on('moveend', onMoveEnd)
    fetchViewportSigns(map)

    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 250)

    return () => {
      clearTimeout(timer)
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      map.off('moveend', onMoveEnd)
      map.remove()
      mapInstanceRef.current = null
      tileLayerRef.current = null
      routeLayerRef.current = null
      markersLayerRef.current = null
      userLocationLayerRef.current = null
    }
  }, [fetchViewportSigns])

  // ─── Continuous Device Geolocation Tracking ───────────────────────────────
  useEffect(() => {
    if (!('geolocation' in navigator)) return

    // Quick initial position query
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setUserCoordinate(coords)
        if (!hasAutoCenteredRef.current && mapInstanceRef.current && !selectedDestinationRef.current) {
          hasAutoCenteredRef.current = true
          mapInstanceRef.current.flyTo(coords, 15, { duration: 1.2 })
        }
      },
      (err) => {
        console.warn('[GPS] Initial geolocation fix note:', err.message)
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }
    )

    // Continuous watch for movement updates
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserCoordinate([pos.coords.latitude, pos.coords.longitude])
      },
      (err) => {
        console.warn('[GPS] Geolocation watch error:', err.message)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 4000 }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  // ─── Render Live User Location Marker (Pulsing Dot like Mobile) ───────────
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocationLayerRef.current) return

    userLocationLayerRef.current.clearLayers()

    if (userCoordinate) {
      const [lat, lng] = userCoordinate
      const marker = createCurrentLocationMarker(lat, lng, isDark)
      userLocationLayerRef.current.addLayer(marker)
    }
  }, [userCoordinate, isDark])

  // ─── Switch Tile Layer (Esri vs OSM) ───────────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return

    mapInstanceRef.current.removeLayer(tileLayerRef.current)

    const newUrl = tileMode === 'osm' ? OSM_TILE_URL : ESRI_TILE_URL
    const newAttribution =
      tileMode === 'osm'
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        : 'Tiles &copy; Esri &mdash; Source: Esri, USGS'

    const newLayer = L.tileLayer(newUrl, {
      attribution: newAttribution,
      maxZoom: 19,
    }).addTo(mapInstanceRef.current)

    tileLayerRef.current = newLayer
  }, [tileMode])

  // ─── Listen to Crop Preview Click in Leaflet Popups ────────────────────────
  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    const handleContainerClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-crop-preview]')
      if (target) {
        const cropUrl = target.getAttribute('data-crop-preview')
        if (cropUrl) {
          setPreviewCropUrl(cropUrl)
        }
      }
    }

    container.addEventListener('click', handleContainerClick)
    return () => container.removeEventListener('click', handleContainerClick)
  }, [])

  // ─── Render Traffic Sign Markers on Map ────────────────────────────────────
  const visibleSigns = activeRoute ? routeSigns : mapSigns

  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return

    markersLayerRef.current.clearLayers()
    markersMapRef.current = {}

    visibleSigns.forEach((sign) => {
      const marker = createRouteSignMarker({
        sign,
        isDark,
        onSelect: (selected) => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo([selected.coordinate[1], selected.coordinate[0]], {
              animate: true,
              duration: 0.5,
            })
          }
        },
      })

      markersLayerRef.current?.addLayer(marker)
      markersMapRef.current[sign.id] = marker
    })
  }, [visibleSigns, isDark, activeRoute])

  // ─── Draw Route Polyline, Start & Destination Markers ──────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current) return

    routeLayerRef.current.clearLayers()

    if (
      !activeRoute ||
      !selectedDestination ||
      !selectedDestination.latitude ||
      !selectedDestination.longitude
    ) {
      return
    }

    // Convert route coordinates to Leaflet [lat, lng] format
    const latLngs = activeRoute.coordinates.map(
      (coord): [number, number] => [coord[1], coord[0]]
    )

    // Route Polyline
    const polyline = L.polyline(latLngs, {
      color: isDark ? '#00c4de' : '#007b8b',
      weight: 6,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    })
    routeLayerRef.current.addLayer(polyline)

    // Start Marker (S)
    const startCoord = latLngs[0]
    if (startCoord) {
      const startIcon = L.divIcon({
        className: 'route-start-marker',
        html: `
          <div style="
            width: 26px; height: 26px; border-radius: 50%;
            background: #1767D2; color: #ffffff;
            display: flex; align-items: center; justify-content: center;
            font-weight: 900; font-size: 11px; font-family: monospace;
            border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          ">S</div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      })
      const startMarker = L.marker(startCoord, { icon: startIcon })
      routeLayerRef.current.addLayer(startMarker)
    }

    // Destination Marker (D)
    const destCoord: [number, number] = [
      selectedDestination.latitude,
      selectedDestination.longitude,
    ]
    const destIcon = L.divIcon({
      className: 'route-dest-marker',
      html: `
        <div style="
          width: 28px; height: 28px; border-radius: 50%;
          background: #148594; color: #ffffff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 12px; font-family: monospace;
          border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        ">D</div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })
    const destMarker = L.marker(destCoord, { icon: destIcon })
    routeLayerRef.current.addLayer(destMarker)

    // Fit map bounds to show entire route with padding
    mapInstanceRef.current.fitBounds(polyline.getBounds(), {
      padding: [80, 80],
      maxZoom: 17,
      duration: 0.8,
    })
  }, [activeRoute, selectedDestination, isDark])

  // ─── Destination Selection & Route Planning ────────────────────────────────
  const calculateRoute = useCallback(
    async (place: ApiPlace, mode: VehicleModeId = vehicleMode) => {
      setSelectedDestination(place)
      if (place.latitude == null || place.longitude == null) return

      try {
        setIsLoadingGis(true)

        // Use live user location if available, otherwise prompt GPS or fallback to center
        let userOrigin: [number, number]
        if (userCoordinate) {
          userOrigin = [userCoordinate[1], userCoordinate[0]] // [lon, lat]
        } else {
          userOrigin = await new Promise((resolve) => {
            if ('geolocation' in navigator) {
              navigator.geolocation.getCurrentPosition(
                (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
                () => resolve([106.7009, 10.7769]),
                { timeout: 3500 }
              )
            } else {
              resolve([106.7009, 10.7769])
            }
          })
        }

        const destCoord: [number, number] = [place.longitude, place.latitude]

        // Fetch route directions for selected vehicle mode
        const route = await navigationService.getDirections(userOrigin, destCoord, mode)
        setActiveRoute(route)

        // Fetch signs along route
        const signs = await navigationService.getSignsAlongRoute(route.geometry)
        setRouteSigns(signs)
      } catch (err) {
        console.warn('[Navigation] Route calculation failed:', err)
      } finally {
        setIsLoadingGis(false)
      }
    },
    [vehicleMode, userCoordinate]
  )

  const handleSelectDestination = (place: ApiPlace) => {
    calculateRoute(place, vehicleMode)
  }

  const handleChangeVehicleMode = (newMode: VehicleModeId) => {
    setVehicleMode(newMode)
    if (selectedDestination) {
      calculateRoute(selectedDestination, newMode)
    }
  }

  const handleClearRoute = () => {
    setActiveRoute(null)
    setSelectedDestination(null)
    setRouteSigns([])
    setIsNavigating(false)
    if (mapInstanceRef.current) {
      fetchViewportSigns(mapInstanceRef.current)
    }
  }

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      if (
        activeRoute &&
        selectedDestination &&
        selectedDestination.latitude &&
        selectedDestination.longitude
      ) {
        const destCoord: [number, number] = [
          selectedDestination.latitude,
          selectedDestination.longitude,
        ]
        mapInstanceRef.current.flyTo(destCoord, 16, { duration: 0.8 })
      } else if (userCoordinate) {
        mapInstanceRef.current.flyTo(userCoordinate, 16, { duration: 0.8 })
      } else {
        mapInstanceRef.current.flyTo([10.7769, 106.7009], 15, { duration: 0.8 })
      }
    }
  }

  const handleCenterOnUser = () => {
    if (userCoordinate && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(userCoordinate, 16, { duration: 0.8 })
      if (userLocationLayerRef.current) {
        userLocationLayerRef.current.clearLayers()
        userLocationLayerRef.current.addLayer(
          createCurrentLocationMarker(userCoordinate[0], userCoordinate[1], isDark)
        )
      }
    } else if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
          setUserCoordinate(coords)
          mapInstanceRef.current?.flyTo(coords, 16, { duration: 0.8 })
          if (userLocationLayerRef.current) {
            userLocationLayerRef.current.clearLayers()
            userLocationLayerRef.current.addLayer(
              createCurrentLocationMarker(coords[0], coords[1], isDark)
            )
          }
        },
        () => {
          mapInstanceRef.current?.flyTo([10.7769, 106.7009], 15, { duration: 0.8 })
        },
        { enableHighAccuracy: true, timeout: 6000 }
      )
    }
  }

  const handleFocusSign = (sign: RouteSign) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([sign.coordinate[1], sign.coordinate[0]], 17, {
        duration: 0.6,
      })
      const marker = markersMapRef.current[sign.id]
      if (marker) {
        setTimeout(() => marker.openPopup(), 650)
      }
    }
  }

  const handleFocusStep = (coord: [longitude: number, latitude: number]) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([coord[1], coord[0]], 18, { duration: 0.8 })
    }
  }

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn(1)
  }

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut(1)
  }

  return {
    mapContainerRef,
    tileMode,
    setTileMode,
    getTileModeLabel,
    isLoadingGis,
    userCoordinate,
    selectedDestination,
    activeRoute,
    routeSigns,
    vehicleMode,
    isNavigating,
    setIsNavigating,
    previewCropUrl,
    setPreviewCropUrl,
    handleSelectDestination,
    handleChangeVehicleMode,
    handleClearRoute,
    handleRecenter,
    handleCenterOnUser,
    handleZoomIn,
    handleZoomOut,
    handleFocusSign,
    handleFocusStep,
  }
}
