import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MagnifyingGlass,
  Compass,
  X,
  Stack,
  FunnelSimple,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { mockSigns, signCategories } from '@/data'

// Fix Leaflet default marker icons in bundler
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function ProductMap() {
  const { isDark } = useTheme()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [tileMode, setTileMode] = useState<'osm' | 'voyager'>('osm')
  const tileLayerRef = useRef<L.TileLayer | null>(null)

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

    setTimeout(() => {
      map.invalidateSize()
    }, 200)

    return () => {
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
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

    const newLayer = L.tileLayer(newUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current)

    tileLayerRef.current = newLayer
  }, [tileMode])

  // Filter & Render Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return

    markersLayerRef.current.clearLayers()

    const filtered = mockSigns.filter((sign) => {
      const matchCat = selectedCategory === 'ALL' || sign.category === selectedCategory
      const matchSearch =
        sign.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sign.location.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCat && matchSearch
    })

    filtered.forEach((sign) => {
      let bgHex = '#ef4444' // P
      if (sign.category === 'R') bgHex = '#007b8b'
      if (sign.category === 'W') bgHex = '#f59e0b'
      if (sign.category === 'I') bgHex = '#00c4de'
      if (sign.category === 'S') bgHex = '#6b7280'

      const customIcon = L.divIcon({
        className: 'custom-sign-marker',
        html: `
          <div style="
            background: ${bgHex};
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 2.5px solid #ffffff;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 800;
            font-size: 12px;
            font-family: monospace;
            cursor: pointer;
            transition: transform 0.15s ease;
          ">
            ${sign.category}
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      })

      const marker = L.marker([sign.lat, sign.lng], { icon: customIcon })

      const popupContent = `
        <div style="font-family: 'Geist', sans-serif; padding: 4px; color: #111827; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="background: ${bgHex}; color: white; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-family: monospace;">${sign.code}</strong>
            <span style="color: #059669; font-size: 11px; font-weight: bold; font-family: monospace;">✓ ${sign.trustScore}% Trust</span>
          </div>
          <p style="font-size: 13px; font-weight: 700; margin: 4px 0 3px 0; line-height: 1.3;">${sign.name}</p>
          <p style="font-size: 11px; color: #4b5563; margin: 0 0 6px 0;">${sign.location}</p>
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #6b7280; font-family: monospace; border-top: 1px solid #e5e7eb; padding-top: 5px;">
            <span>Hướng xe: ${sign.heading}°</span>
            <span>GPS: ${sign.lat.toFixed(4)}, ${sign.lng.toFixed(4)}</span>
          </div>
        </div>
      `

      marker.bindPopup(popupContent)
      markersLayerRef.current?.addLayer(marker)
    })
  }, [selectedCategory, searchQuery])

  const filteredCount = mockSigns.filter((sign) => {
    const matchCat = selectedCategory === 'ALL' || sign.category === selectedCategory
    const matchSearch =
      sign.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.location.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  }).length

  return (
    <div
      className={`w-full min-h-screen py-8 sm:py-12 transition-colors ${
        isDark ? 'bg-[#030708] text-white' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6 text-left">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-2.5 transition-colors ${
              isDark
                ? 'bg-[#007b8b]/20 border border-[#00c4de]/30 text-[#00c4de]'
                : 'bg-teal-50 border border-[#007b8b]/30 text-[#007b8b]'
            }`}
          >
            <Compass size={16} weight="duotone" />
            <span>HẠ TẦNG BẢN ĐỒ GIS • CHUẨN QCVN 41:2019/BGTVT</span>
          </div>
          <h1
            className={`text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            Bản Đồ Không Gian Biển Báo Giao Thông
          </h1>
          <p
            className={`text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Tra cứu, kiểm tra vị trí và dữ liệu góc hướng áp dụng của biển báo trên nền tảng OpenStreetMap.
          </p>
        </div>

        {/* ─── SEPARATED DEDICATED SEARCH & FILTER TOOLBAR ─────────────── */}
        <div
          className={`rounded-2xl p-3 sm:p-4 border shadow-xl mb-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-left transition-colors ${
            isDark
              ? 'glass-panel border-white/15 bg-[#061418]/95'
              : 'bg-white border-[#E8E4E3] shadow-gray-200/70'
          }`}
        >
          {/* Search Field */}
          <div className="relative flex-1 min-w-[260px] max-w-xl">
            <MagnifyingGlass
              size={17}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã biển báo (P.102, R.301...), tên biển hoặc tuyến đường..."
              className={`w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border focus:outline-none transition-all ${
                isDark
                  ? 'bg-black/60 border-white/10 text-white placeholder:text-gray-400 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'
                }`}
                title="Xóa tìm kiếm"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <div
              className={`flex items-center gap-1 text-xs mr-1 hidden sm:flex ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <FunnelSimple size={14} className={isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'} />
              <span>Nhóm:</span>
            </div>
            {signCategories.map((cat) => {
              const active = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? isDark
                        ? 'bg-[#00c4de] text-black shadow-md shadow-[#00c4de]/30'
                        : 'bg-[#007b8b] text-white shadow-md shadow-[#007b8b]/25'
                      : isDark
                        ? 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Right Controls: Tile Switcher & Result Count */}
          <div
            className={`flex items-center justify-between lg:justify-end gap-2 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 ${
              isDark ? 'border-white/10' : 'border-gray-200'
            }`}
          >
            <span
              className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Hiển thị:{' '}
              <strong className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {filteredCount}
              </strong>{' '}
              biển
            </span>

            <button
              type="button"
              onClick={() => setTileMode((m) => (m === 'osm' ? 'voyager' : 'osm'))}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/15 text-gray-200 hover:text-white'
                  : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-900'
              }`}
              title="Đổi kiểu hiển thị bản đồ"
            >
              <Stack size={16} className={isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'} />
              <span>{tileMode === 'osm' ? 'OpenStreetMap' : 'OSM Voyager'}</span>
            </button>
          </div>
        </div>

        {/* ─── DEDICATED MAP BOX ───────────────────────────────────────── */}
        <div
          className={`rounded-[24px] overflow-hidden border shadow-2xl relative h-[70vh] min-h-[580px] w-full transition-colors ${
            isDark ? 'glass-panel border-white/15 bg-[#071317]' : 'bg-white border-[#E8E4E3]'
          }`}
        >
          {/* Leaflet OpenStreetMap Canvas */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Telemetry Badge Bottom Left */}
          <div
            className={`absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shadow-xl pointer-events-none ${
              isDark
                ? 'bg-black/85 backdrop-blur-md border-white/15 text-gray-300'
                : 'bg-white/90 backdrop-blur-md border-gray-200 text-gray-700 shadow-gray-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-emerald-600 font-bold">OPENSTREETMAP LIVE</span>
            <span className="text-gray-400">•</span>
            <span className="font-mono text-[11px]">WGS 84 • QCVN 41:2019</span>
          </div>
        </div>
      </div>
    </div>
  )
}
