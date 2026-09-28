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
  filterSignsByCollision,
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
  const focusedSignIdRef = useRef<string | null>(null)
  const [viewportRevision, setViewportRevision] = useState(0)

  // Map state — default to 'esri' matching mobile app
  const [tileMode, setTileMode] = useState<'osm' | 'esri'>('esri')
  const [isLoadingGis, setIsLoadingGis] = useState(false)
  const [mapSigns, setMapSigns] = useState<RouteSign[]>([])

  // Live GPS user location state
  const [userCoordinate, setUserCoordinate] = useState<[latitude: number, longitude: number] | null>(null)

  // Navigation state
  const [selectedDestination, setSelectedDestination] = useState<ApiPlace | null>(null)
  const [isPlaceDetailOpen, setIsPlaceDetailOpen] = useState(false)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [activeRoute, setActiveRoute] = useState<NavigationRoute | null>(null)
  const [routeSigns, setRouteSigns] = useState<RouteSign[]>([])
  const [vehicleMode, setVehicleMode] = useState<VehicleModeId>('DRIVING')
  const [previewCropUrl, setPreviewCropUrl] = useState<string | null>(null)

  const activeRouteRef = useRef<NavigationRoute | null>(null)
  useEffect(() => {
    activeRouteRef.current = activeRoute
  }, [activeRoute])

  // Keep ref synchronized without causing map re-initialization
  useEffect(() => {
    selectedDestinationRef.current = selectedDestination
  }, [selectedDestination])

  const getTileModeLabel = (mode: 'osm' | 'esri') => {
    return mode === 'esri'
      ? t('map_page.tile_voyager')
      : t('map_page.tile_osm')
  }

  // ─── Fetch Signs in Current Viewport Bounds (/signs) ──────────────────────
  const fetchViewportSigns = useCallback(async (targetMap: L.Map) => {
    try {
      setIsLoadingGis(true)
      const bounds = targetMap.getBounds().pad(0.1)
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

  // ─── Fetch Signs Directly Around Coordinates (/signs) ──────────────────────
  const fetchSignsAroundCoordinate = useCallback(async (lat: number, lon: number) => {
    try {
      setIsLoadingGis(true)
      const delta = 0.02 // ~2km bounding box
      const signs = await signsService.getSignsInBounds({
        minLat: lat - delta,
        minLon: lon - delta,
        maxLat: lat + delta,
        maxLon: lon + delta,
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
      console.warn('[MapGIS] Signs around coordinate fetch failed:', err)
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
      // Re-evaluate collision thinning when map stops moving or zooming
      setViewportRevision((v) => v + 1)

      // Don't auto-fetch viewport bounds if actively viewing a planned route corridor
      if (activeRouteRef.current) return

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        fetchViewportSigns(map)
      }, 350)
    }

    const onZoomEnd = () => {
      setViewportRevision((v) => v + 1)
    }

    const onPopupClose = () => {
      focusedSignIdRef.current = null
    }

    map.on('moveend', onMoveEnd)
    map.on('zoomend', onZoomEnd)
    map.on('popupclose', onPopupClose)
    fetchViewportSigns(map)

    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 250)

    return () => {
      clearTimeout(timer)
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      map.off('moveend', onMoveEnd)
      map.off('zoomend', onZoomEnd)
      map.off('popupclose', onPopupClose)
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

  // ─── Render Traffic Sign Markers on Map (With Smart Reconciliation) ────────
  const visibleSigns = activeRoute ? routeSigns : mapSigns
  const prevIsDarkRef = useRef(isDark)
  const prevActiveRouteRef = useRef(activeRoute)

  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return

    const currentLayer = markersLayerRef.current
    const currentMarkers = markersMapRef.current

    // If theme changed or switching in/out of a route, do a full reset
    const themeChanged = prevIsDarkRef.current !== isDark
    const routeChanged = Boolean(prevActiveRouteRef.current) !== Boolean(activeRoute)

    if (themeChanged || routeChanged) {
      prevIsDarkRef.current = isDark
      prevActiveRouteRef.current = activeRoute
      focusedSignIdRef.current = null
      currentLayer.clearLayers()
      for (const key in currentMarkers) {
        delete currentMarkers[key]
      }
    }

    // ─── Marker Rendering (Collision Thinning in Explore mode, 100% in Route mode) ──
    // When navigating a route (activeRoute is active), preserve and display 100% of the
    // corridor signs returned by the backend for traffic safety.
    // In free exploration mode, dynamically cull overlapping signs via Collision Thinning.
    const signsToRender = activeRoute
      ? visibleSigns
      : filterSignsByCollision(
          visibleSigns,
          mapInstanceRef.current,
          currentMarkers,
          focusedSignIdRef.current
        )

    const newSignIds = new Set(signsToRender.map((s) => s.id))

    // 1. Remove markers no longer in signsToRender (unless popup is actively open on it)
    for (const [id, marker] of Object.entries(currentMarkers)) {
      if (!newSignIds.has(id)) {
        if (!marker.isPopupOpen()) {
          currentLayer.removeLayer(marker)
          delete currentMarkers[id]
        }
      }
    }

    // 2. Add new signs without re-creating existing markers
    signsToRender.forEach((sign) => {
      if (currentMarkers[sign.id]) {
        // Marker already exists on map; keep its instance and active popup intact!
        return
      }

      const marker = createRouteSignMarker({
        sign,
        isDark,
        t,
      })

      currentLayer.addLayer(marker)
      currentMarkers[sign.id] = marker
    })
  }, [visibleSigns, isDark, activeRoute, viewportRevision, t])

  // ─── Draw Route Polyline, Start & Destination Markers ──────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current) return

    routeLayerRef.current.clearLayers()

    if (!selectedDestination || selectedDestination.latitude == null || selectedDestination.longitude == null) {
      return
    }

    // Always render Destination Marker (Google Maps Style Pin) when a destination is chosen
    const destCoord: [number, number] = [
      selectedDestination.latitude,
      selectedDestination.longitude,
    ]
    const destIcon = L.divIcon({
      className: 'route-dest-pin-marker',
      html: `
        <div style="
          width: 32px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          animation: mapPinDrop 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        ">
          <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.38)); overflow: visible;">
            <ellipse cx="16" cy="41" rx="7" ry="2.5" fill="rgba(0,0,0,0.25)"/>
            <path d="M16 0C7.163 0 0 7.163 0 16c0 11.4 14.2 24.3 15.3 25.4.38.36 1.02.36 1.4 0C17.8 40.3 32 27.4 32 16 32 7.163 24.837 0 16 0z" fill="#EA4335"/>
            <path d="M16 1C7.716 1 1 7.716 1 16c0 10.8 13.5 23.2 14.7 24.3.17.16.43.16.6 0C17.5 39.2 31 26.8 31 16 31 7.716 24.284 1 16 1z" stroke="#B31412" stroke-width="1.2" fill="none"/>
            <circle cx="16" cy="15.5" r="5.5" fill="#7A0000"/>
          </svg>
        </div>
      `,
      iconSize: [32, 42],
      iconAnchor: [16, 42],
      popupAnchor: [0, -42],
    })
    const destMarker = L.marker(destCoord, { icon: destIcon })
    if (selectedDestination.title) {
      destMarker.bindTooltip(selectedDestination.title, {
        direction: 'top',
        offset: [0, -42],
      })
    }
    routeLayerRef.current.addLayer(destMarker)

    // If an active route is calculated, also render start marker, polyline, and fit bounds
    if (activeRoute && activeRoute.coordinates.length > 0) {
      const latLngs = activeRoute.coordinates.map(
        (coord): [number, number] => [coord[1], coord[0]]
      )

      const polyline = L.polyline(latLngs, {
        color: isDark ? '#00c4de' : '#007b8b',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      })
      routeLayerRef.current.addLayer(polyline)

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
    }
  }, [activeRoute, selectedDestination, isDark])

  // ─── Destination Selection & Route Planning ────────────────────────────────
  const calculateRoute = useCallback(
    async (
      place: ApiPlace,
      mode: VehicleModeId = vehicleMode,
      animateCameraTransition = true
    ) => {
      setSelectedDestination(place)
      if (place.latitude == null || place.longitude == null) return

      try {
        setIsLoadingGis(true)
        setIsLoadingRoute(true)

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
        setIsPlaceDetailOpen(false)

        // Google Maps Camera Motion:
        // 1. Dời camera qua vị trí hiện tại của người dùng (User GPS)
        // 2. Sau đó zoom out mở rộng tầm nhìn để thấy toàn bộ tuyến đường (fitBounds)
        if (mapInstanceRef.current) {
          const map = mapInstanceRef.current
          const originLat = userOrigin[1]
          const originLng = userOrigin[0]

          if (animateCameraTransition) {
            // Bước 1: Lướt camera qua vị trí hiện tại
            map.flyTo([originLat, originLng], 15, {
              duration: 0.8,
              easeLinearity: 0.3,
            })

            // Bước 2: Sau khi lướt về vị trí hiện tại, zoom out bao quát toàn bộ lộ trình
            setTimeout(() => {
              if (mapInstanceRef.current) {
                const latLngs = route.coordinates.map(
                  (c): [number, number] => [c[1], c[0]]
                )
                mapInstanceRef.current.fitBounds(L.latLngBounds(latLngs), {
                  padding: [80, 80],
                  maxZoom: 17,
                  duration: 1.2,
                })
              }
            }, 650)
          } else {
            // Khi đổi phương tiện: chỉ fitBounds trực tiếp
            const latLngs = route.coordinates.map(
              (c): [number, number] => [c[1], c[0]]
            )
            map.fitBounds(L.latLngBounds(latLngs), {
              padding: [80, 80],
              maxZoom: 17,
              duration: 0.8,
            })
          }
        }

        // Fetch signs along route (safely catch if backend endpoint is unavailable)
        try {
          const signs = await navigationService.getSignsAlongRoute(route.geometry)
          setRouteSigns(signs)
        } catch (signErr) {
          console.warn('[Navigation] Signs along route note:', signErr)
          setRouteSigns([])
        }
      } catch (err) {
        console.warn('[Navigation] Route calculation failed:', err)
      } finally {
        setIsLoadingGis(false)
        setIsLoadingRoute(false)
      }
    },
    [vehicleMode, userCoordinate]
  )

  const handleSelectDestination = (place: ApiPlace) => {
    setSelectedDestination(place)
    setIsPlaceDetailOpen(true)
    setActiveRoute(null)
    setRouteSigns([])
    if (mapInstanceRef.current && place.latitude != null && place.longitude != null) {
      const map = mapInstanceRef.current
      const currentCenter = map.getCenter()
      const currentZoom = map.getZoom()
      const distance = currentCenter.distanceTo([place.latitude, place.longitude]) // in meters

      if (distance < 25 && currentZoom >= 16) {
        // Camera is already centered directly at the destination; stay steady without triggering flyTo micro-jitter
      } else if (distance < 400 && currentZoom === 16) {
        // Small pan distance: use smooth panTo without aerial zoom-out/in
        map.panTo([place.latitude, place.longitude], {
          duration: 0.5,
          easeLinearity: 0.25,
        })
      } else {
        // Long distance or different zoom: smooth flyTo
        map.flyTo([place.latitude, place.longitude], 16, {
          duration: 1.0,
          easeLinearity: 0.25,
        })
      }
      fetchSignsAroundCoordinate(place.latitude, place.longitude)
    }
  }

  const handleRequestDirections = () => {
    if (selectedDestination) {
      calculateRoute(selectedDestination, vehicleMode, true)
    }
  }

  const handleClosePlaceDetail = () => {
    focusedSignIdRef.current = null
    setIsPlaceDetailOpen(false)
    setSelectedDestination(null)
    setActiveRoute(null)
    setRouteSigns([])
    if (mapInstanceRef.current) {
      fetchViewportSigns(mapInstanceRef.current)
    }
  }

  const handleBackToPlaceDetail = () => {
    focusedSignIdRef.current = null
    setActiveRoute(null)
    setRouteSigns([])
    setIsPlaceDetailOpen(true)
    if (
      mapInstanceRef.current &&
      selectedDestination?.latitude != null &&
      selectedDestination?.longitude != null
    ) {
      const map = mapInstanceRef.current
      const currentCenter = map.getCenter()
      const currentZoom = map.getZoom()
      const distance = currentCenter.distanceTo([
        selectedDestination.latitude,
        selectedDestination.longitude,
      ])

      if (distance < 25 && currentZoom >= 16) {
        // Already at place
      } else if (distance < 400 && currentZoom === 16) {
        map.panTo([selectedDestination.latitude, selectedDestination.longitude], {
          duration: 0.5,
          easeLinearity: 0.25,
        })
      } else {
        map.flyTo(
          [selectedDestination.latitude, selectedDestination.longitude],
          16,
          { duration: 0.8 }
        )
      }
      fetchSignsAroundCoordinate(selectedDestination.latitude, selectedDestination.longitude)
    }
  }

  const handleChangeVehicleMode = (newMode: VehicleModeId) => {
    setVehicleMode(newMode)
    if (selectedDestination && activeRoute) {
      calculateRoute(selectedDestination, newMode, false)
    }
  }

  const handleClearRoute = () => {
    focusedSignIdRef.current = null
    setActiveRoute(null)
    setSelectedDestination(null)
    setRouteSigns([])
    setIsPlaceDetailOpen(false)
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
    focusedSignIdRef.current = sign.id
    setViewportRevision((v) => v + 1)
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
    isPlaceDetailOpen,
    isLoadingRoute,
    activeRoute,
    routeSigns,
    vehicleMode,
    previewCropUrl,
    setPreviewCropUrl,
    handleSelectDestination,
    handleRequestDirections,
    handleClosePlaceDetail,
    handleBackToPlaceDetail,
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
