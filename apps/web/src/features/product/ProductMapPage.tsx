import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { mockSigns, type SignItem } from '@/data'
import { signsService } from '@/api/services/signs.service'
import { ErrorBoundary, PageHeader } from '@shared/ui'
import {
  ProductMapSidebar,
  SignInspectorCard,
  ProductMapFloatingControls,
  ProductMapHeaderActions,
  ReportIssueModal,
} from './components'
import {
  setupLeafletDefaultIcons,
  getCategoryMeta,
  createSignMarker,
} from './utils/productMapHelpers'

// Fix Leaflet default marker icons using localized assets
setupLeafletDefaultIcons()

export default function ProductMap() {
  const { isDark } = useTheme()
  const { user, isAuthenticated } = useAuth()
  const { t } = useTranslation('product')
  const isDriver = isAuthenticated && user?.role?.trim().toLowerCase() === 'driver'

  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportSignId, setReportSignId] = useState<string | null>(null)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const markersMapRef = useRef<Record<string, L.Marker>>({})

  const [signs, setSigns] = useState<SignItem[]>(mockSigns)
  const [isLoadingGis, setIsLoadingGis] = useState(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSignId, setSelectedSignId] = useState<string | null>(null)
  const [tileMode, setTileMode] = useState<'osm' | 'esri'>('osm')
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map')
  const [copiedCoords, setCopiedCoords] = useState(false)
  const tileLayerRef = useRef<L.TileLayer | null>(null)

  const getCategoryMetaWrapper = useCallback(
    (cat: string) => getCategoryMeta(cat, t),
    [t]
  )

  const getTileModeLabel = (mode: 'osm' | 'esri') => {
    return mode === 'osm' ? t('map_page.tile_osm') : t('map_page.tile_voyager')
  }

  // Initialize Map & fetch dynamic viewport GIS signs
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [10.7769, 106.7009],
      zoom: 15,
      zoomControl: false,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    const osmTile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    tileLayerRef.current = osmTile

    const markersLayer = L.layerGroup().addTo(map)
    markersLayerRef.current = markersLayer
    mapInstanceRef.current = map

    const fetchViewportSigns = async (targetMap: L.Map) => {
      try {
        setIsLoadingGis(true)
        const bounds = targetMap.getBounds()
        const params = {
          min_lat: bounds.getSouth(),
          min_lon: bounds.getWest(),
          max_lat: bounds.getNorth(),
          max_lon: bounds.getEast(),
        }
        const liveSigns = await signsService.getSpatialSigns(params)
        if (liveSigns && liveSigns.length > 0) {
          setSigns((prev) => {
            const mapById = new Map<string, SignItem>()
            liveSigns.forEach((s) => mapById.set(s.id, s))
            prev.forEach((s) => {
              if (!mapById.has(s.id)) {
                mapById.set(s.id, s)
              }
            })
            return Array.from(mapById.values())
          })
        }
      } catch (err) {
        console.warn('[MapGIS] Live GIS fetch failed, keeping local dataset:', err)
      } finally {
        setIsLoadingGis(false)
      }
    }

    const onMoveEnd = () => {
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
    }
  }, [])

  // Switch Tile Layer (OSM standard vs Voyager clean)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return

    mapInstanceRef.current.removeLayer(tileLayerRef.current)

    const newUrl =
      tileMode === 'osm'
        ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'

    const newLayer = L.tileLayer(newUrl, {
      attribution:
        tileMode === 'osm'
          ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          : 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, USGS',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current)

    tileLayerRef.current = newLayer
  }, [tileMode])

  // Filter Signs from dynamic state
  const filteredSigns = signs.filter((sign) => {
    const matchCat = selectedCategory === 'ALL' || sign.category === selectedCategory
    const q = searchQuery.toLowerCase().trim()
    const matchSearch =
      !q ||
      sign.code.toLowerCase().includes(q) ||
      sign.name.toLowerCase().includes(q) ||
      (sign.location ? sign.location.toLowerCase().includes(q) : false)
    return matchCat && matchSearch
  })

  // Currently selected sign object
  const selectedSign = signs.find((s) => s.id === selectedSignId) || null
  const activeReportSign =
    signs.find((s) => s.id === reportSignId) ||
    selectedSign ||
    filteredSigns[0] ||
    signs[0] ||
    null

  const handleOpenReport = (signId?: string) => {
    const targetId = signId || selectedSignId || filteredSigns[0]?.id || signs[0]?.id
    if (targetId) {
      setReportSignId(targetId)
      setSelectedSignId(targetId)
    }
    setIsReportModalOpen(true)
  }

  const handleOpenReportRef = useRef(handleOpenReport)
  handleOpenReportRef.current = handleOpenReport

  // Delegated click listener for popup actions
  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    const handleContainerClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-report-sign-id]')
      if (target) {
        const signId = target.getAttribute('data-report-sign-id')
        if (signId) {
          handleOpenReportRef.current(signId)
        }
      }
    }

    container.addEventListener('click', handleContainerClick)
    return () => {
      container.removeEventListener('click', handleContainerClick)
    }
  }, [])

  // Render Markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return

    markersLayerRef.current.clearLayers()
    markersMapRef.current = {}

    filteredSigns.forEach((sign) => {
      const meta = getCategoryMetaWrapper(sign.category)
      const isSelected = sign.id === selectedSignId

      const marker = createSignMarker({
        sign,
        meta,
        isSelected,
        isDark,
        isDriver,
        t,
        onSelect: (signId) => setSelectedSignId(signId),
      })

      markersLayerRef.current?.addLayer(marker)
      markersMapRef.current[sign.id] = marker
    })
  }, [filteredSigns, selectedSignId, isDark, isDriver, t, getCategoryMetaWrapper])

  const handleSelectSign = (sign: SignItem) => {
    setSelectedSignId(sign.id)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([sign.lat, sign.lng], 17, { duration: 0.8 })
      const marker = markersMapRef.current[sign.id]
      if (marker) {
        setTimeout(() => {
          marker.openPopup()
        }, 850)
      }
    }
  }

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([10.7769, 106.7009], 15, { duration: 0.8 })
    }
  }

  const handleCopyCoords = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    setCopiedCoords(true)
    setTimeout(() => setCopiedCoords(false), 2000)
  }

  return (
    <div
      className={`w-full min-h-[calc(100vh-80px)] py-6 sm:py-8 transition-colors ${
        isDark ? 'bg-[#030708] text-gray-100' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* ─── Page Header (Standardized via PageHeader) ───────────────── */}
        <PageHeader
          title={t('map_page.title')}
          subtitle={t('map_page.subtitle')}
          bordered
          actions={
            <ProductMapHeaderActions
              isDriver={Boolean(isDriver)}
              isDark={isDark}
              onOpenReport={handleOpenReport}
              filteredCount={filteredSigns.length}
              totalCount={signs.length}
            />
          }
        />

        {/* ─── Mobile Tab Switcher (List vs Map) ────────────────────────── */}
        <div className="flex lg:hidden rounded-xl p-1 bg-gray-200/80 dark:bg-white/10">
          <button
            type="button"
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'map'
                ? 'bg-white dark:bg-[#071317] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {t('map_page.tab_map')}
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('list')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'list'
                ? 'bg-white dark:bg-[#071317] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {t('map_page.tab_list')} ({filteredSigns.length})
          </button>
        </div>

        {/* ─── Main Workspace Grid (Left: Directory & Filters, Right: Interactive Map) ─ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ──── LEFT COLUMN: Directory & Filter Card (4 cols) ─────────── */}
          <ProductMapSidebar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            filteredSigns={filteredSigns}
            selectedSignId={selectedSignId}
            onSelectSign={handleSelectSign}
            onOpenReport={handleOpenReport}
            isDark={isDark}
            isDriver={isDriver}
            mobileTab={mobileTab}
            getCategoryMeta={getCategoryMetaWrapper}
          />

          {/* ──── RIGHT COLUMN: Interactive Map Box (8 cols) ────────────── */}
          <div
            className={`lg:col-span-8 rounded-2xl border overflow-hidden h-[700px] relative flex flex-col transition-colors ${
              mobileTab === 'map' ? 'flex' : 'hidden lg:flex'
            } ${
              isDark
                ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
                : 'bg-white border-[#E8E4E3] shadow-xs'
            }`}
          >
            <ErrorBoundary
              variant="card"
              title="Không thể khởi tạo bản đồ GIS"
              description="Bản đồ gặp sự cố khi dựng khung vẽ. Vui lòng nhấn thử lại để tải lại module bản đồ."
            >
              {/* Leaflet OpenStreetMap Canvas */}
              <div ref={mapContainerRef} className="w-full h-full z-0" />

              {/* Floating Top Controls & Live Telemetry Badge */}
              <ProductMapFloatingControls
                tileMode={tileMode}
                onToggleTileMode={() => setTileMode((m) => (m === 'osm' ? 'esri' : 'osm'))}
                onRecenter={handleRecenter}
                getTileModeLabel={getTileModeLabel}
                isLoadingGis={isLoadingGis}
                isDark={isDark}
              />

              {/* Floating Sign Inspector Card Overlay */}
              {selectedSign && (
                <SignInspectorCard
                  selectedSign={selectedSign}
                  categoryMeta={getCategoryMetaWrapper(selectedSign.category)}
                  onClose={() => setSelectedSignId(null)}
                  onOpenReport={() => setIsReportModalOpen(true)}
                  onCopyCoords={handleCopyCoords}
                  copiedCoords={copiedCoords}
                  isDark={isDark}
                  isDriver={isDriver}
                />
              )}
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* ─── Driver Report Sign Issue Modal ──────────────────────────────── */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        activeReportSign={activeReportSign}
        onSelectSignId={(val) => {
          setReportSignId(val)
          setSelectedSignId(val)
        }}
        allSigns={signs}
        getCategoryMeta={getCategoryMetaWrapper}
      />
    </div>
  )
}
