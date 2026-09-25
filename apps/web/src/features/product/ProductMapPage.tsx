import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MagnifyingGlass,
  X,
  Stack,
  FunnelSimple,
  MapPin,
  CheckCircle,
  ShieldCheck,
  Copy,
  Check,
  NavigationArrow,
  Flag,
  Camera,
  Sparkle,
  WarningCircle,
  FileArrowUp,
  TrafficSignal,
  ChatText,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Modal } from '@/components/common/Modal'
import { CustomSelect } from '@/components/common/CustomSelect'
import { mockSigns, signCategories, type SignItem } from '@/data'

import { signsService } from '@/api/services/signs.service'

// Fix Leaflet default marker icons in bundler
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function ProductMap() {
  const { isDark } = useTheme()
  const { user, isAuthenticated } = useAuth()
  const toast = useToast()
  const { t } = useTranslation('product')
  const isDriver = isAuthenticated && user?.role?.trim().toLowerCase() === 'driver'

  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportSignId, setReportSignId] = useState<string | null>(null)
  const [issueType, setIssueType] = useState('damaged')
  const [issueDesc, setIssueDesc] = useState('')
  const [issuePhotoPreview, setIssuePhotoPreview] = useState<string | null>(null)
  const [isReporting, setIsReporting] = useState(false)

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
  const activeReportSign =
    mockSigns.find((s) => s.id === reportSignId) ||
    selectedSign ||
    filteredSigns[0] ||
    mockSigns[0] ||
    null

  const handleOpenReport = (signId?: string) => {
    const targetId = signId || selectedSignId || filteredSigns[0]?.id || mockSigns[0]?.id
    if (targetId) {
      setReportSignId(targetId)
      setSelectedSignId(targetId)
    }
    setIsReportModalOpen(true)
  }

  // Delegated click listener for popup actions
  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    const handleContainerClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-report-sign-id]')
      if (target) {
        const signId = target.getAttribute('data-report-sign-id')
        if (signId) {
          handleOpenReport(signId)
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
          ${
            isDriver
              ? `
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid ${borderColor};">
              <button
                type="button"
                data-report-sign-id="${sign.id}"
                style="
                  width: 100%;
                  padding: 6px 10px;
                  border-radius: 8px;
                  background: #f59e0b;
                  color: #000000;
                  border: none;
                  font-size: 11px;
                  font-weight: 800;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 5px;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
                "
              >
                🚩 ${t('map_page.btn_report_issue')}
              </button>
            </div>
          `
              : ''
          }
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
  }, [filteredSigns, selectedSignId, isDark, isDriver, t])

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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('map_page.title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
              {t('map_page.subtitle')}
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {isDriver ? (
              <button
                type="button"
                onClick={() => handleOpenReport()}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/15'
                    : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200'
                }`}
                title={t('map_page.btn_report_general')}
              >
                <WarningCircle size={17} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />
                <span>{t('map_page.btn_report_general')}</span>
              </button>
            ) : !isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-semibold">
                <span>💡 {t('map_page.login_driver_hint')}</span>
              </div>
            ) : null}

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
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                            {t('map_page.status_verified')}
                          </span>

                          {isDriver && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenReport(sign.id)
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                              title={t('map_page.btn_report_issue')}
                            >
                              <Flag size={11} weight="bold" />
                              <span>{t('map_page.btn_report_quick')}</span>
                            </button>
                          )}
                        </div>
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

                {/* Driver-exclusive Report Sign Issue Button */}
                {isDriver ? (
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="w-full mt-3 py-2 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Flag size={14} weight="bold" />
                    <span>{t('map_page.btn_report_issue')}</span>
                  </button>
                ) : !isAuthenticated ? (
                  <div className="mt-2.5 pt-2 border-t border-gray-200 dark:border-white/10 text-center">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      💡 {t('map_page.login_driver_hint')}
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Driver Report Sign Issue Modal (Aligned with NewSignTypeModal) ── */}
      {activeReportSign && (
        <Modal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          maxWidth="max-w-2xl"
          topSpacing="pt-6 sm:pt-10 pb-8 sm:pb-12"
        >
          <div
            className={`rounded-2xl border p-6 sm:p-8 space-y-6 shadow-2xl transition-colors text-left ${
              isDark
                ? 'bg-[#071317] border-white/10 text-gray-100 shadow-black/80'
                : 'bg-white border-[#E8E4E3] text-gray-900 shadow-xl'
            }`}
          >
            {/* ─── Modal Header (Identical to NewSignTypeModal) ──────────────── */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                    #ISSUE_REPORT
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    QCVN 41:2019 Standard
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    • Driver Field Feedback
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                  {t('map_page.report_modal.modal_title')}
                </h2>

                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1.5 font-medium">
                  <Sparkle size={15} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                  <span>{t('map_page.report_modal.modal_subtitle')}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
                    isDark
                      ? 'bg-amber-900/30 text-amber-300 border-amber-500/40'
                      : 'bg-amber-100 text-amber-950 border-amber-300'
                  }`}
                >
                  <WarningCircle size={13} weight="bold" />
                  <span>{t('map_page.report_modal.subtitle')}</span>
                </span>

                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    isDark
                      ? 'border-white/10 hover:bg-white/10 text-gray-400 hover:text-white'
                      : 'border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ─── Form Container with Scroll (Identical to NewSignTypeModal) ── */}
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setIsReporting(true)
                try {
                  await signsService.reportIssue(activeReportSign.id, {
                    issueType,
                    description: issueDesc,
                    imageUrl: issuePhotoPreview || undefined,
                  })
                } catch {
                  // Fallback simulation for mock dev
                  await new Promise((r) => setTimeout(r, 600))
                } finally {
                  setIsReporting(false)
                  setIsReportModalOpen(false)
                  setIssueDesc('')
                  setIssuePhotoPreview(null)
                  toast.success(
                    t('map_page.report_modal.toast_success', { code: activeReportSign.code })
                  )
                }
              }}
              className="space-y-5 max-h-[calc(85vh-200px)] overflow-y-auto pr-1"
            >
              {/* Section 1: Thông tin biển báo cần phản ánh */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/70 border-gray-200'
                }`}
              >
                <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 tracking-wider flex items-center gap-1.5">
                  <TrafficSignal size={15} className="text-[#007b8b] dark:text-[#00c4de]" />
                  <span>{t('map_page.report_modal.target_sign_preview')}</span>
                </h4>

                {/* Sign Selector Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('map_page.report_modal.select_sign_label')} <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={activeReportSign.id}
                    onChange={(val) => {
                      setReportSignId(val)
                      setSelectedSignId(val)
                    }}
                    className="w-full"
                    options={mockSigns.map((s) => ({
                      value: s.id,
                      label: `[${s.code}] ${s.name} — ${s.location.split(',')[0]}`,
                    }))}
                  />
                </div>

                {/* Visual Sign Identity Strip */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-extrabold text-white text-xs shrink-0 shadow-xs"
                      style={{ background: getCategoryMeta(activeReportSign.category).bgHex }}
                    >
                      {activeReportSign.category}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                        [{activeReportSign.code}] {activeReportSign.name}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                        <MapPin size={12} className="shrink-0 text-[#007b8b] dark:text-[#00c4de]" />
                        <span className="truncate">{activeReportSign.location}</span>
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 shrink-0">
                    <CheckCircle size={12} weight="bold" />
                    {activeReportSign.trustScore}%
                  </span>
                </div>

                {/* Issue Category Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('map_page.report_modal.type_label')} <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'damaged', label: t('map_page.report_modal.type_damaged') },
                      { value: 'obstructed', label: t('map_page.report_modal.type_obstructed') },
                      { value: 'missing', label: t('map_page.report_modal.type_missing') },
                      { value: 'wrong_location', label: t('map_page.report_modal.type_wrong_location') },
                      { value: 'wrong_type', label: t('map_page.report_modal.type_wrong_type') },
                      { value: 'other', label: t('map_page.report_modal.type_other') },
                    ]}
                    value={issueType}
                    onChange={(val) => setIssueType(val)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Section 2: Ảnh chụp thực tế minh chứng (Photographic Evidence) */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/70 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 tracking-wider flex items-center gap-1.5">
                    <Camera size={15} className="text-[#007b8b] dark:text-[#00c4de]" />
                    <span>{t('map_page.report_modal.photo_label')}</span>
                  </h4>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {t('map_page.report_modal.photo_hint')}
                  </span>
                </div>

                {issuePhotoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 max-h-52 flex items-center justify-center bg-black/40 p-2">
                    <img src={issuePhotoPreview} alt="Preview" className="max-h-48 object-contain rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setIssuePhotoPreview(null)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/70 text-white hover:bg-black/90 cursor-pointer"
                    >
                      <X size={15} weight="bold" />
                    </button>
                  </div>
                ) : (
                  <label
                    className={`p-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                      isDark
                        ? 'border-white/15 bg-black/30 hover:border-white/30 text-white'
                        : 'border-gray-300 bg-white hover:border-gray-400 text-gray-900'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-2 text-gray-400">
                      <Camera size={22} />
                    </div>
                    <span className="text-xs font-bold">{t('map_page.report_modal.photo_cta')}</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {t('map_page.report_modal.photo_hint')}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) {
                          const reader = new FileReader()
                          reader.onloadend = () => setIssuePhotoPreview(reader.result as string)
                          reader.readAsDataURL(f)
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Section 3: Vị trí & Tọa độ thực địa */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/70 border-gray-200'
                }`}
              >
                <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 tracking-wider flex items-center gap-1.5">
                  <MapPin size={15} className="text-[#007b8b] dark:text-[#00c4de]" />
                  <span>{t('map_page.report_modal.telemetry_badge')}</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('map_page.report_modal.target_sign_preview')}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={activeReportSign.location}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border outline-none transition-all ${
                      isDark
                        ? 'bg-black/50 border-white/15 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-mono">
                      Vĩ độ (Lat)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={activeReportSign.lat.toFixed(6)}
                      className={`w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border outline-none ${
                        isDark ? 'bg-black/50 border-white/15 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-mono">
                      Kinh độ (Lng)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={activeReportSign.lng.toFixed(6)}
                      className={`w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border outline-none ${
                        isDark ? 'bg-black/50 border-white/15 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Mô tả chi tiết sự cố thực địa */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border space-y-2 ${
                  isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/70 border-gray-200'
                }`}
              >
                <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 tracking-wider flex items-center gap-1.5">
                  <ChatText size={15} className="text-[#007b8b] dark:text-[#00c4de]" />
                  <span>{t('map_page.report_modal.desc_label')} <span className="text-red-500">*</span></span>
                </h4>

                <textarea
                  required
                  rows={3}
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  placeholder={t('map_page.report_modal.desc_placeholder')}
                  className={`w-full px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl border outline-none resize-none transition-all ${
                    isDark
                      ? 'bg-black/50 border-white/15 text-white placeholder:text-gray-500 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                  }`}
                />
              </div>

              {/* ─── Footer Action Buttons (Identical to NewSignTypeModal) ── */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border transition-colors cursor-pointer ${
                    isDark
                      ? 'border-white/10 hover:bg-white/5 text-gray-300'
                      : 'border-gray-200 hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {t('map_page.report_modal.btn_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isReporting || !issueDesc.trim()}
                  className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                    isDark
                      ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black shadow-[#00c4de]/25'
                      : 'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-[#007b8b]/25'
                  }`}
                >
                  <FileArrowUp size={16} weight="bold" />
                  <span>
                    {isReporting
                      ? t('map_page.report_modal.btn_submitting')
                      : t('map_page.report_modal.btn_submit')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  )
}
