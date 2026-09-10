import { useEffect, useRef, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { SearchBar } from '@/components/common/SearchBar'
import { useToast } from '@/context/ToastContext'
import {
  MapPin,
  X,
  Stack,
  NavigationArrow,
  ShieldCheck,
  ArrowsClockwise,
  Check,
  CornersOut,
  SidebarSimple,
  Copy,
  Compass,
  Tag,
  Funnel,
} from '@phosphor-icons/react'
import { mockOpsSigns, type OpsSignItem } from '@/data'
import { mockCatalogData } from '@/data/catalogData'
import { TrafficSignGraphic } from '@/features/catalog/components/TrafficSignGraphic'

// Fix Leaflet default icon paths in bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function MapPage() {
  const { t } = useTranslation('ops')
  const { success } = useToast()

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)

  // Filters & State
  const [activeGroup, setActiveGroup] = useState('ALL')
  const [activeStatus, setActiveStatus] = useState<'ALL' | 'verified' | 'flagged' | 'revalidating'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSign, setSelectedSign] = useState<OpsSignItem | null>(null)
  const [tileMode, setTileMode] = useState<'osm' | 'voyager'>('osm')
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [copiedSignId, setCopiedSignId] = useState<string | null>(null)

  const signGroups = useMemo(
    () => [
      { id: 'ALL', label: t('map.group_all') },
      { id: 'P', label: t('map.group_p') },
      { id: 'R', label: t('map.group_r') },
      { id: 'W', label: t('map.group_w') },
      { id: 'I', label: t('map.group_i') },
      { id: 'S', label: t('map.group_s') },
    ],
    [t]
  )

  // Counts for status tabs
  const statusCounts = useMemo(() => {
    return {
      all: mockOpsSigns.length,
      verified: mockOpsSigns.filter((s) => s.status === 'verified').length,
      flagged: mockOpsSigns.filter((s) => s.status === 'flagged').length,
      revalidating: mockOpsSigns.filter((s) => s.status === 'revalidating').length,
    }
  }, [])

  // Filtered signs
  const filteredSigns = useMemo(() => {
    return mockOpsSigns.filter((sign) => {
      const matchCat = activeGroup === 'ALL' || sign.category === activeGroup
      const matchStatus = activeStatus === 'ALL' || sign.status === activeStatus
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        sign.code.toLowerCase().includes(q) ||
        sign.name.toLowerCase().includes(q) ||
        sign.location.toLowerCase().includes(q)
      return matchCat && matchStatus && matchSearch
    })
  }, [activeGroup, activeStatus, searchQuery])

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [10.7769, 106.7009],
      zoom: 15,
      zoomControl: false,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    const osmTile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    tileLayerRef.current = osmTile

    const markersLayer = L.layerGroup().addTo(map)
    markersLayerRef.current = markersLayer

    mapInstanceRef.current = map

    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 250)

    const handleResize = () => map.invalidateSize()
    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Switch Tile Layer
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

  // Invalidate map size when sidebar / left panel toggles
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize()
    }, 300)
    return () => clearTimeout(timer)
  }, [isPanelOpen])

  // Render Directional Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return

    markersLayerRef.current.clearLayers()

    filteredSigns.forEach((sign) => {
      const isSelected = selectedSign?.id === sign.id

      // Color scheme based on status and category
      let mainColor = '#007b8b' // default verified teal
      let ringColor = 'rgba(0, 123, 139, 0.4)'
      if (sign.status === 'flagged') {
        mainColor = '#dc2626' // red
        ringColor = 'rgba(220, 38, 38, 0.4)'
      } else if (sign.status === 'revalidating') {
        mainColor = '#8b5cf6' // purple
        ringColor = 'rgba(139, 92, 246, 0.4)'
      }

      // Directional Marker HTML with rotated pointer cone (bearing arrow)
      const customIcon = L.divIcon({
        className: 'custom-directional-marker',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <!-- Directional Bearing Cone rotated to sign.heading -->
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              width: 0;
              height: 0;
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-bottom: 12px solid ${mainColor};
              transform-origin: 50% 100%;
              transform: translate(-50%, -100%) rotate(${sign.heading}deg) translate(0, -14px);
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
              pointer-events: none;
            "></div>

            <!-- Pulsing outer ring when selected or flagged -->
            ${
              isSelected || sign.status === 'flagged'
                ? `<div style="
                    position: absolute;
                    inset: ${isSelected ? '-4px' : '-2px'};
                    border-radius: 50%;
                    background: ${ringColor};
                    animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                    pointer-events: none;
                  "></div>`
                : ''
            }

            <!-- Center Circular Pin Badge -->
            <div style="
              position: relative;
              background: ${mainColor};
              width: ${isSelected ? '34px' : '28px'};
              height: ${isSelected ? '34px' : '28px'};
              border-radius: 50%;
              border: ${isSelected ? '3px solid #00c4de' : '2px solid #ffffff'};
              box-shadow: 0 4px 12px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-weight: 800;
              font-size: ${isSelected ? '11px' : '10px'};
              font-family: monospace;
              cursor: pointer;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            ">
              ${sign.code.split('.')[0] || sign.category}
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      })

      const marker = L.marker([sign.lat, sign.lng], { icon: customIcon })

      marker.bindTooltip(
        `
        <div style="font-family: sans-serif; font-size: 11px; padding: 2px 4px; line-height: 1.3;">
          <b style="color: ${mainColor}; font-family: monospace;">${sign.code}</b> - ${sign.name}<br/>
          <span style="color: #64748b;">${sign.location.split(',')[0]} • ${sign.heading}°</span>
        </div>
      `,
        { direction: 'top', offset: [0, -16] }
      )

      marker.on('click', () => {
        setSelectedSign(sign)
        mapInstanceRef.current?.flyTo([sign.lat, sign.lng], 17, { duration: 0.8 })
      })

      markersLayerRef.current?.addLayer(marker)
    })
  }, [filteredSigns, selectedSign])

  // Fit all visible signs on the map
  const handleFitBounds = () => {
    if (!mapInstanceRef.current || filteredSigns.length === 0) return
    const group = L.featureGroup(filteredSigns.map((s) => L.marker([s.lat, s.lng])))
    mapInstanceRef.current.fitBounds(group.getBounds().pad(0.15), { maxZoom: 16 })
  }

  // Handle Copy GPS Coords
  const handleCopyCoords = (sign: OpsSignItem) => {
    const coordsStr = `${sign.lat.toFixed(5)}, ${sign.lng.toFixed(5)}`
    navigator.clipboard.writeText(coordsStr)
    setCopiedSignId(sign.id)
    success(t('map.toast_copied_coords'))
    setTimeout(() => setCopiedSignId(null), 2000)
  }

  // Selected sign catalog entry for vector graphic
  const selectedCatalogEntry = useMemo(() => {
    if (!selectedSign) return null
    return (
      mockCatalogData.find((c) => c.code.toLowerCase() === selectedSign.code.toLowerCase()) || {
        code: selectedSign.code,
        shape: 'Circle' as const,
        color: 'Red-White' as const,
        nameVi: selectedSign.name,
      }
    )
  }, [selectedSign])

  return (
    <div className="flex flex-col flex-1 h-full min-h-[500px] w-full bg-[#F8F7F7] dark:bg-[#030708] font-sans relative overflow-hidden">
      {/* ─── TOP TOOLBAR ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 bg-white dark:bg-[#071317] border-b border-[#E8E4E3] dark:border-white/10 shrink-0 z-20 shadow-2xs">
        {/* Left: Inventory toggle + Search Bar */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px] max-w-md">
          <button
            type="button"
            onClick={() => setIsPanelOpen((prev) => !prev)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isPanelOpen
                ? 'bg-[#007b8b]/10 dark:bg-[#00c4de]/15 border-[#007b8b]/30 dark:border-[#00c4de]/30 text-[#007b8b] dark:text-[#00c4de]'
                : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
            }`}
            title={isPanelOpen ? t('map.panel_collapse') : t('map.panel_expand')}
          >
            <SidebarSimple size={18} weight={isPanelOpen ? 'fill' : 'regular'} />
          </button>

          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('map.search_placeholder')}
              size="sm"
            />
          </div>
        </div>

        {/* Center: Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
          {signGroups.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGroup(g.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                activeGroup === g.id
                  ? 'bg-[#007b8b] dark:bg-[#00c4de] text-white dark:text-black border-[#007b8b] dark:border-[#00c4de] shadow-2xs font-bold'
                  : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-[#E8E4E3] dark:border-white/10 hover:border-[#00c4de] hover:text-[#00c4de]'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Right: Map Actions (Fit bounds, Tile mode, Live counter) */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden xl:inline text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10">
            {t('map.showing_signs_count', { count: filteredSigns.length })}
          </span>

          <button
            type="button"
            onClick={handleFitBounds}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 border border-[#E8E4E3] dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-2xs cursor-pointer"
            title={t('map.btn_fit_bounds')}
          >
            <CornersOut size={14} className="text-[#007b8b] dark:text-[#00c4de]" />
            <span className="hidden sm:inline">{t('map.btn_fit_bounds')}</span>
          </button>

          <button
            type="button"
            onClick={() => setTileMode((m) => (m === 'osm' ? 'voyager' : 'osm'))}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 border border-[#E8E4E3] dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-2xs cursor-pointer"
            title={t('map.tile_switch_title')}
          >
            <Stack size={14} className="text-[#007b8b] dark:text-[#00c4de]" />
            <span className="hidden sm:inline">{tileMode === 'osm' ? t('map.tile_osm') : t('map.tile_voyager')}</span>
          </button>
        </div>
      </div>

      {/* ─── MAIN MAP & SPLIT WORKSPACE ────────────────────────────── */}
      <div className="flex-1 relative isolate z-0 w-full h-full min-h-0 overflow-hidden flex">
        {/* ─── COLLAPSIBLE LEFT SIGN INVENTORY PANEL ────────────────── */}
        <aside
          className={`shrink-0 bg-white dark:bg-[#071317] border-r border-[#E8E4E3] dark:border-white/10 flex flex-col transition-all duration-300 ease-in-out z-10 shadow-lg ${
            isPanelOpen ? 'w-84 md:w-90 translate-x-0' : 'w-0 -translate-x-full border-r-0 overflow-hidden'
          }`}
        >
          {/* Panel Header */}
          <div className="p-3.5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider font-mono">
                {t('map.panel_title')}
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-full bg-[#007b8b]/10 dark:bg-[#00c4de]/20 text-[#007b8b] dark:text-[#00c4de]">
                {filteredSigns.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPanelOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
              title={t('map.panel_collapse')}
            >
              <X size={15} />
            </button>
          </div>

          {/* Status Filter Tabs */}
          <div className="p-2 border-b border-gray-100 dark:border-white/10 shrink-0 bg-gray-50/70 dark:bg-white/5">
            <div className="grid grid-cols-4 gap-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveStatus('ALL')}
                className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  activeStatus === 'ALL'
                    ? 'bg-white dark:bg-[#007b8b] text-gray-900 dark:text-white font-bold shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {t('map.tab_status_all')} ({statusCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setActiveStatus('verified')}
                className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  activeStatus === 'verified'
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-emerald-600'
                }`}
              >
                {t('map.tab_status_verified')} ({statusCounts.verified})
              </button>
              <button
                type="button"
                onClick={() => setActiveStatus('flagged')}
                className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  activeStatus === 'flagged'
                    ? 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-300 font-bold shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-red-600'
                }`}
              >
                {t('map.tab_status_flagged')} ({statusCounts.flagged})
              </button>
              <button
                type="button"
                onClick={() => setActiveStatus('revalidating')}
                className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  activeStatus === 'revalidating'
                    ? 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-purple-600'
                }`}
              >
                {t('map.tab_status_revalidating')} ({statusCounts.revalidating})
              </button>
            </div>
          </div>

          {/* Signs List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
            {filteredSigns.length === 0 ? (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500 space-y-2">
                <Funnel size={28} className="mx-auto opacity-40" />
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('map.card_empty_title')}</p>
                <p className="text-[11px] leading-relaxed">{t('map.card_empty_desc')}</p>
              </div>
            ) : (
              filteredSigns.map((sign) => {
                const isSelected = selectedSign?.id === sign.id
                const catalogEntry = mockCatalogData.find(
                  (c) => c.code.toLowerCase() === sign.code.toLowerCase()
                )

                let statusBadgeBg = 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                let statusLabel = t('map.badge_status_verified')
                if (sign.status === 'flagged') {
                  statusBadgeBg = 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30'
                  statusLabel = t('map.badge_status_flagged')
                } else if (sign.status === 'revalidating') {
                  statusBadgeBg = 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30'
                  statusLabel = t('map.badge_status_revalidating')
                }

                return (
                  <div
                    key={sign.id}
                    onClick={() => {
                      setSelectedSign(sign)
                      mapInstanceRef.current?.flyTo([sign.lat, sign.lng], 17, { duration: 0.8 })
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer select-none space-y-2 ${
                      isSelected
                        ? 'bg-[#007b8b]/10 dark:bg-[#00c4de]/15 border-[#007b8b] dark:border-[#00c4de] shadow-sm'
                        : 'border-gray-200/80 dark:border-white/10 bg-white dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50/50 dark:hover:bg-white/10'
                    }`}
                  >
                    {/* Header: Code + Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-gray-900 dark:bg-white text-white dark:text-black shrink-0">
                          {sign.code}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusBadgeBg}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400 shrink-0">
                        {sign.trustScore}%
                      </span>
                    </div>

                    {/* Middle: Sign graphic & Name */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center p-0.5 shrink-0">
                        {catalogEntry ? (
                          <TrafficSignGraphic sign={catalogEntry} className="w-full h-full object-contain" />
                        ) : (
                          <Tag size={16} className="text-[#007b8b] dark:text-[#00c4de]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {sign.name}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="shrink-0 text-gray-400" />
                          <span>{sign.location.split(',')[0]}</span>
                        </p>
                      </div>
                    </div>

                    {/* Footer: Heading & Coords */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 dark:text-gray-500 pt-1 border-t border-gray-100 dark:border-white/5">
                      <span className="flex items-center gap-1 text-[#007b8b] dark:text-[#00c4de] font-semibold">
                        <Compass size={12} weight="bold" />
                        {sign.heading}° ({t('map.dir_north_south')})
                      </span>
                      <span>
                        {sign.lat.toFixed(4)}, {sign.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </aside>

        {/* ─── LEAFLET CANVAS ────────────────────────────────────────── */}
        <div className="flex-1 relative isolate z-0 h-full w-full overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#061014]" />

          {/* Floating Telemetry & Mode Badge */}
          <div className="absolute top-3 left-3 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-[#081317]/90 backdrop-blur-md border border-[#E8E4E3] dark:border-white/10 text-xs text-gray-700 dark:text-gray-300 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono font-bold text-[#007b8b] dark:text-[#00c4de]">OPENSTREETMAP GIS</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span className="font-sans text-[11px]">{t('map.telemetry')}</span>
          </div>

          {/* ─── SELECTED SIGN INSPECTOR DRAWER (RIGHT PANEL) ──────────── */}
          {selectedSign && (
            <div className="absolute top-3 right-3 z-20 w-full max-w-sm bg-white/95 dark:bg-[#0A171C]/95 backdrop-blur-md rounded-2xl border border-[#E8E4E3] dark:border-white/15 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right duration-200 text-gray-900 dark:text-white flex flex-col max-h-[calc(100%-24px)]">
              {/* Header */}
              <div className="p-3.5 bg-gradient-to-r from-[#007b8b]/10 via-transparent to-transparent border-b border-[#E8E4E3] dark:border-white/10 flex items-start justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#007b8b] text-white">
                      {selectedSign.code}
                    </span>
                    <span
                      className={`text-xs font-semibold flex items-center gap-1 font-mono ${
                        selectedSign.status === 'verified'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : selectedSign.status === 'flagged'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-purple-600 dark:text-purple-400'
                      }`}
                    >
                      <ShieldCheck size={14} weight="fill" />
                      {selectedSign.status === 'verified'
                        ? t('map.drawer_verified', { score: selectedSign.trustScore })
                        : selectedSign.status === 'flagged'
                        ? t('map.badge_status_flagged')
                        : t('map.drawer_pending')}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                    {selectedSign.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSign(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-3.5 space-y-3.5 text-xs text-left overflow-y-auto scrollbar-thin">
                {/* Visual Evidence Grid: Catalog Graphic vs Camera Crop */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Standard Sign Vector */}
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-mono text-gray-400 uppercase mb-1.5 block">
                      {t('map.sec_standard_sign')}
                    </span>
                    <div className="w-14 h-14 flex items-center justify-center">
                      {selectedCatalogEntry ? (
                        <TrafficSignGraphic sign={selectedCatalogEntry} className="w-full h-full object-contain" />
                      ) : (
                        <Tag size={28} className="text-[#007b8b]" />
                      )}
                    </div>
                  </div>

                  {/* Dashcam Camera Evidence Crop */}
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex flex-col">
                    <span className="text-[10px] font-mono text-gray-400 uppercase mb-1.5 block truncate">
                      {t('map.sec_camera_crop')}
                    </span>
                    <div className="relative rounded-lg overflow-hidden flex-1 min-h-[56px] bg-black border border-gray-200 dark:border-white/10">
                      <img
                        src={selectedSign.imageUrl}
                        alt={selectedSign.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-[#00c4de] border border-[#00c4de]/30">
                        {selectedSign.aiConfidence}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Spatial Coordinates & One-Click Copy */}
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 uppercase font-mono">{t('map.drawer_coords')}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCoords(selectedSign)}
                      className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#007b8b] dark:text-[#00c4de] hover:underline cursor-pointer"
                    >
                      {copiedSignId === selectedSign.id ? (
                        <>
                          <Check size={12} weight="bold" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>{t('map.btn_copy_coords')}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-mono font-bold text-gray-900 dark:text-white">
                    {selectedSign.lat.toFixed(5)}, {selectedSign.lng.toFixed(5)}
                  </p>
                </div>

                {/* Technical Telemetry Grid (Heading & AI Model) */}
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                    <p className="text-[10px] text-gray-400 uppercase">{t('map.drawer_heading')}</p>
                    <p className="text-xs font-bold text-[#007b8b] dark:text-[#00c4de] flex items-center gap-1 mt-0.5">
                      <NavigationArrow size={13} className="rotate-45" />
                      {selectedSign.heading}° ({t('map.dir_north_south')})
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                    <p className="text-[10px] text-gray-400 uppercase">{t('map.lbl_detected_model')}</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5 truncate" title={selectedSign.detectedBy}>
                      {selectedSign.detectedBy.split(' (')[0]}
                    </p>
                  </div>
                </div>

                {/* Reviewer Consensus Stats */}
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-700 dark:text-gray-300">
                  <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">
                    {t('map.drawer_consensus')}
                  </p>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      ✓ {t('map.stat_votes_approve')}: {selectedSign.reviewerVotes.approve}
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      ✎ {t('map.stat_votes_modify')}: {selectedSign.reviewerVotes.modify}
                    </span>
                    <span className="text-red-600 dark:text-red-400 font-bold">
                      ✕ {t('map.stat_votes_reject')}: {selectedSign.reviewerVotes.reject}
                    </span>
                  </div>
                </div>

                {/* Road Location Address */}
                <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                  <MapPin size={15} className="text-[#007b8b] dark:text-[#00c4de] shrink-0 mt-0.5" />
                  <span className="text-xs leading-relaxed">{selectedSign.location}</span>
                </div>

                {/* Operational Actions */}
                <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex gap-2">
                  <button
                    type="button"
                    onClick={() => success(t('map.toast_approved', { code: selectedSign.code }))}
                    className="flex-1 py-2 rounded-xl bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                  >
                    <Check size={14} weight="bold" />
                    <span>{t('map.btn_quick_approve')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => success(t('map.toast_resurvey_created', { code: selectedSign.code }))}
                    className="py-2 px-3 rounded-xl border border-gray-300 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    title={t('map.btn_revalidate_title')}
                  >
                    <ArrowsClockwise size={14} />
                    <span>{t('map.tab_status_revalidating')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
