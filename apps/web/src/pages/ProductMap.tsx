import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MagnifyingGlass,
  Compass,
  X,
  Stack,
  FunnelSimple,
  MapPin,
  CheckCircle,
  ShieldCheck,
  Copy,
  Check,
  NavigationArrow,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { mockSigns, signCategories, type SignItem } from '@/data'

// Fix Leaflet default marker icons in bundler
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function ProductMap() {
  const { isDark } = useTheme()
  const { t } = useTranslation('product')
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const markersMapRef = useRef<Record<string, L.Marker>>({})

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSignId, setSelectedSignId] = useState<string | null>(null)
  const [tileMode, setTileMode] = useState<'osm' | 'esri'>('osm')
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map')
  const [copiedCoords, setCopiedCoords] = useState(false)
  const tileLayerRef = useRef<L.TileLayer | null>(null)

  // Category styling helper with high-contrast light & dark modes
  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'P':
        return {
          code: 'P',
          name: t('map_page.groups.P'),
          bgHex: '#ef4444',
          badgeClass:
            'bg-red-100 text-red-950 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
        }
      case 'R':
        return {
          code: 'R',
          name: t('map_page.groups.R'),
          bgHex: '#007b8b',
          badgeClass:
            'bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30',
        }
      case 'W':
        return {
          code: 'W',
          name: t('map_page.groups.W'),
          bgHex: '#f59e0b',
          badgeClass:
            'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
        }
      case 'I':
        return {
          code: 'I',
          name: t('map_page.groups.I'),
          bgHex: '#00c4de',
          badgeClass:
            'bg-cyan-100 text-cyan-950 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30',
        }
      case 'S':
        return {
          code: 'S',
          name: t('map_page.groups.S'),
          bgHex: '#6b7280',
          badgeClass:
            'bg-gray-200 text-gray-900 border-gray-300 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600',
        }
      default:
        return {
          code: 'ALL',
          name: t('map_page.groups.ALL'),
          bgHex: '#007b8b',
          badgeClass:
            'bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30',
        }
    }
  }

  const getTileModeLabel = (mode: 'osm' | 'esri') => {
    if (mode === 'osm') {
      return t('map_page.tile_osm')
    }
    return t('map_page.tile_voyager')
  }

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
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    tileLayerRef.current = osmTile

    const markersLayer = L.layerGroup().addTo(map)
    markersLayerRef.current = markersLayer

    mapInstanceRef.current = map

    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 250)

    return () => {
      clearTimeout(timer)
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

  // Filter Signs
  const filteredSigns = mockSigns.filter((sign) => {
    const matchCat = selectedCategory === 'ALL' || sign.category === selectedCategory
    const q = searchQuery.toLowerCase().trim()
    const matchSearch =
      !q ||
      sign.code.toLowerCase().includes(q) ||
      sign.name.toLowerCase().includes(q) ||
      sign.location.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  // Currently selected sign object
  const selectedSign = mockSigns.find((s) => s.id === selectedSignId) || null

  // Render Markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return

    markersLayerRef.current.clearLayers()
    markersMapRef.current = {}

    filteredSigns.forEach((sign) => {
      const meta = getCategoryMeta(sign.category)
      const isSelected = sign.id === selectedSignId

      const customIcon = L.divIcon({
        className: 'custom-sign-marker',
        html: `
          <div style="
            background: ${meta.bgHex};
            width: ${isSelected ? '38px' : '32px'};
            height: ${isSelected ? '38px' : '32px'};
            border-radius: 50%;
            border: ${isSelected ? '3px solid #ffffff' : '2px solid #ffffff'};
            box-shadow: ${
              isSelected
                ? '0 0 0 4px ' + meta.bgHex + ', 0 8px 20px rgba(0,0,0,0.5)'
                : '0 4px 12px rgba(0,0,0,0.35)'
            };
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 800;
            font-size: ${isSelected ? '13px' : '11px'};
            font-family: monospace;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          ">
            ${sign.category}
          </div>
        `,
        iconSize: [isSelected ? 38 : 32, isSelected ? 38 : 32],
        iconAnchor: [isSelected ? 19 : 16, isSelected ? 19 : 16],
      })

      const marker = L.marker([sign.lat, sign.lng], { icon: customIcon })

      const popupBg = isDark ? '#081215' : '#ffffff'
      const textColor = isDark ? '#f8fafc' : '#0f172a'
      const subTextColor = isDark ? '#94a3b8' : '#475569'
      const borderColor = isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'
      const specColor = isDark ? '#cbd5e1' : '#334155'

      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px; background: ${popupBg}; color: ${textColor}; min-width: 230px; border-radius: 12px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; gap: 8px;">
            <span style="background: ${meta.bgHex}; color: #ffffff; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; font-family: monospace;">${sign.code}</span>
            <span style="color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 7px; border-radius: 6px; font-size: 10.5px; font-weight: 800;">✓ ${sign.trustScore}% ${t('mini_map.popup_trust')}</span>
          </div>
          <p style="font-size: 13px; font-weight: 800; margin: 4px 0 3px 0; line-height: 1.35; color: ${textColor};">${sign.name}</p>
          <p style="font-size: 11.5px; color: ${subTextColor}; margin: 0 0 8px 0; font-weight: 500;">${sign.location}</p>
          <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: ${specColor}; font-family: monospace; font-weight: 600; border-top: 1px solid ${borderColor}; padding-top: 6px;">
            <span>${t('mini_map.popup_heading')} ${sign.heading}°</span>
            <span>GPS: ${sign.lat.toFixed(4)}, ${sign.lng.toFixed(4)}</span>
          </div>
        </div>
      `

      marker.bindPopup(popupContent, {
        closeButton: true,
        className: isDark ? 'dark-leaflet-popup' : 'light-leaflet-popup',
      })

      marker.on('click', () => {
        setSelectedSignId(sign.id)
      })

      markersLayerRef.current?.addLayer(marker)
      markersMapRef.current[sign.id] = marker
    })
  }, [filteredSigns, selectedSignId, isDark, t])

  // Select a sign: fly map to position and open popup
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

  // Recenter map to downtown HCMC
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([10.7769, 106.7009], 15, { duration: 0.8 })
    }
  }

  // Copy coordinates helper
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
        {/* ─── Page Header (Strictly styled like ProfilePage.tsx) ───────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10 text-left">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                  isDark
                    ? 'bg-[#007b8b]/20 border-[#00c4de]/30 text-[#00c4de]'
                    : 'bg-teal-50 border-teal-200 text-[#007b8b]'
                }`}
              >
                <Compass size={14} weight="bold" />
                <span>{t('map_page.standards_qcvn')}</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('map_page.title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
              {t('map_page.subtitle')}
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-[#071317] border-white/10 shadow-md shadow-black/40'
                  : 'bg-white border-[#E8E4E3] shadow-xs'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('map_page.showing_count')}
                </span>
                <span className="text-sm font-extrabold text-gray-900 dark:text-white font-mono">
                  {filteredSigns.length} / {mockSigns.length}{' '}
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {t('map_page.signs_unit')}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

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
          <div
            className={`lg:col-span-4 rounded-2xl border p-5 flex flex-col h-[700px] transition-colors ${
              mobileTab === 'list' ? 'flex' : 'hidden lg:flex'
            } ${
              isDark
                ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
                : 'bg-white border-[#E8E4E3] shadow-xs'
            }`}
          >
            {/* Search Input Box */}
            <div className="space-y-3">
              <div className="relative">
                <MagnifyingGlass
                  size={18}
                  weight="bold"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('map_page.search_placeholder')}
                  className={`w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm font-medium rounded-xl border focus:outline-none transition-all ${
                    isDark
                      ? 'bg-black/50 border-white/15 text-white placeholder:text-gray-400 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer transition-colors"
                    title={t('map_page.clear_search')}
                  >
                    <X size={15} weight="bold" />
                  </button>
                )}
              </div>

              {/* Category Pills Filter */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {t('map_page.group_label')}
                  </span>
                  {(selectedCategory !== 'ALL' || searchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('ALL')
                        setSearchQuery('')
                      }}
                      className="text-xs font-bold text-[#007b8b] dark:text-[#00c4de] hover:underline cursor-pointer"
                    >
                      {t('map_page.reset_filter')}
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {signCategories.map((cat) => {
                    const active = selectedCategory === cat.id
                    const localizedLabel = t(`map_page.groups.${cat.id}`)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          active
                            ? isDark
                              ? 'bg-[#00c4de] text-black shadow-md shadow-[#00c4de]/25'
                              : 'bg-[#007b8b] text-white shadow-md shadow-[#007b8b]/20'
                            : isDark
                              ? 'bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'
                        }`}
                      >
                        {localizedLabel}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Directory Header Bar */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-left">
              <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                {t('map_page.sign_list_title')}
              </span>
              <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-400">
                {filteredSigns.length} {t('map_page.signs_unit')}
              </span>
            </div>

            {/* Scrollable Sign Items List */}
            <div className="flex-1 overflow-y-auto mt-2.5 space-y-2.5 pr-1 text-left">
              {filteredSigns.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto text-gray-400">
                    <FunnelSimple size={24} />
                  </div>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {t('map_page.no_results')}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('ALL')
                      setSearchQuery('')
                    }}
                    className="px-3.5 py-1.5 rounded-xl border text-xs font-bold bg-[#007b8b] text-white dark:bg-[#00c4de] dark:text-black transition-opacity hover:opacity-90 cursor-pointer"
                  >
                    {t('map_page.reset_filter')}
                  </button>
                </div>
              ) : (
                filteredSigns.map((sign) => {
                  const isSelected = sign.id === selectedSignId
                  const meta = getCategoryMeta(sign.category)
                  return (
                    <div
                      key={sign.id}
                      onClick={() => handleSelectSign(sign)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? isDark
                            ? 'bg-[#00c4de]/10 border-[#00c4de] shadow-sm'
                            : 'bg-teal-50 border-[#007b8b] shadow-sm'
                          : isDark
                            ? 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-gray-200'
                            : 'bg-gray-50/80 hover:bg-gray-100/90 border-gray-200 text-gray-900'
                      }`}
                    >
                      {/* Top Code & Trust Badges */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded-md border ${meta.badgeClass}`}
                          >
                            {sign.code}
                          </span>
                          <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                            {meta.name}
                          </span>
                        </div>

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
                          <CheckCircle size={12} weight="bold" />
                          {sign.trustScore}%
                        </span>
                      </div>

                      {/* Sign Title */}
                      <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white line-clamp-1">
                        {sign.name}
                      </h3>

                      {/* Location text */}
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1 truncate">
                        <MapPin size={13} className="shrink-0 text-gray-500 dark:text-gray-400" />
                        <span className="truncate">{sign.location}</span>
                      </p>

                      {/* Direction & Status metadata */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/70 dark:border-white/5 text-[11px]">
                        <span className="font-mono font-bold text-gray-700 dark:text-gray-300">
                          {t('mini_map.popup_heading')} {sign.heading}°
                        </span>
                        <span className="font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                          {t('map_page.status_verified')}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

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
            {/* Leaflet OpenStreetMap Canvas */}
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Floating Top Controls (Recenter & Tile Mode Switcher) */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={handleRecenter}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold backdrop-blur-md shadow-md transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#071317]/90 hover:bg-[#0c1e24] text-gray-100 border-white/15'
                    : 'bg-white/95 hover:bg-gray-100 text-gray-800 border-gray-200'
                }`}
                title={t('map_page.recenter_map')}
              >
                <NavigationArrow size={14} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />
                <span className="hidden sm:inline">
                  {t('map_page.recenter_map')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTileMode((m) => (m === 'osm' ? 'esri' : 'osm'))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold backdrop-blur-md shadow-md transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#071317]/90 hover:bg-[#0c1e24] text-gray-100 border-white/15'
                    : 'bg-white/95 hover:bg-gray-100 text-gray-800 border-gray-200'
                }`}
                title={t('map_page.change_map_style')}
              >
                <Stack size={14} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />
                <span>{getTileModeLabel(tileMode)}</span>
              </button>
            </div>

            {/* Floating Telemetry Badge (Bottom Left) */}
            <div
              className={`absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md shadow-md pointer-events-none ${
                isDark
                  ? 'bg-black/80 border-white/15 text-gray-300'
                  : 'bg-white/90 border-gray-200 text-gray-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {t('map_page.telemetry_live')}
              </span>
              <span className="text-gray-400">•</span>
              <span className="font-mono text-[11px] text-gray-700 dark:text-gray-300">
                {t('map_page.telemetry_standard')}
              </span>
            </div>

            {/* ──── Floating Sign Inspector Card Overlay (When a sign is selected) ─ */}
            {selectedSign && (
              <div
                className={`absolute bottom-4 right-4 left-4 sm:left-auto sm:w-[420px] z-20 rounded-2xl border p-4 sm:p-5 backdrop-blur-md shadow-2xl transition-all animate-scaleIn text-left ${
                  isDark
                    ? 'bg-[#081317]/95 border-white/20 text-white'
                    : 'bg-white/95 border-gray-300 text-gray-900'
                }`}
              >
                {/* Header row with Close button */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-mono font-extrabold text-xs px-2.5 py-1 rounded-md border ${
                        getCategoryMeta(selectedSign.category).badgeClass
                      }`}
                    >
                      {selectedSign.code}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
                      <CheckCircle size={13} weight="bold" />
                      {selectedSign.trustScore}% Trust
                    </span>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                      {getCategoryMeta(selectedSign.category).name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedSignId(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer transition-colors"
                    title={t('map_page.close_details')}
                  >
                    <X size={16} weight="bold" />
                  </button>
                </div>

                {/* Sign Name */}
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white leading-snug">
                  {selectedSign.name}
                </h2>

                {/* Location with Pin */}
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mt-1.5">
                  <MapPin size={15} className="shrink-0 text-[#007b8b] dark:text-[#00c4de]" />
                  <span>{selectedSign.location}</span>
                </p>

                {/* Description Box */}
                {selectedSign.description && (
                  <div
                    className={`mt-3 p-2.5 rounded-xl border text-xs leading-relaxed ${
                      isDark
                        ? 'bg-black/40 border-white/10 text-gray-300'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    {selectedSign.description}
                  </div>
                )}

                {/* Telemetry Details Grid */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-white/10 text-xs">
                  <div
                    className={`p-2 rounded-xl border ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                      {t('map_page.heading_bearing')}
                    </span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white text-xs mt-0.5 block">
                      {selectedSign.heading}° ({t('map_page.compass_bearing')})
                    </span>
                  </div>

                  <div
                    className={`p-2 rounded-xl border ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                      {t('map_page.verified_at')}
                    </span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white text-xs mt-0.5 block">
                      {selectedSign.verifiedAt}
                    </span>
                  </div>
                </div>

                {/* GPS Coordinates with Quick Copy */}
                <div className="mt-2.5 flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                    GPS: {selectedSign.lat.toFixed(5)}, {selectedSign.lng.toFixed(5)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCoords(selectedSign.lat, selectedSign.lng)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-white/10 hover:bg-white/20 text-gray-200 border-white/15'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200'
                    }`}
                    title={t('map_page.copy_coords')}
                  >
                    {copiedCoords ? (
                      <>
                        <Check size={13} className="text-emerald-500 font-bold" />
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {t('map_page.copied')}
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} className="text-gray-500 dark:text-gray-400" />
                        <span>{t('map_page.copy_coords')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
