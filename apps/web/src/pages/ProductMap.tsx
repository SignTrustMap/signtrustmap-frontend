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

// Fix Leaflet default marker icons in bundler
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface SignItem {
  id: string
  code: string
  name: string
  category: 'P' | 'R' | 'W' | 'I' | 'S'
  lat: number
  lng: number
  heading: number
  trustScore: number
  location: string
  verifiedAt: string
}

const mockSigns: SignItem[] = [
  {
    id: 'sgn-01',
    code: 'P.102',
    name: 'Cấm đi ngược chiều',
    category: 'P',
    lat: 10.7769,
    lng: 106.7009,
    heading: 180,
    trustScore: 99.4,
    location: 'Đường Nguyễn Huệ, Quận 1, TP.HCM',
    verifiedAt: '12/08/2026',
  },
  {
    id: 'sgn-02',
    code: 'P.127',
    name: 'Tốc độ tối đa cho phép (50 km/h)',
    category: 'P',
    lat: 10.7725,
    lng: 106.698,
    heading: 90,
    trustScore: 98.7,
    location: 'Đường Lê Lợi, Quận 1, TP.HCM',
    verifiedAt: '15/08/2026',
  },
  {
    id: 'sgn-03',
    code: 'R.301a',
    name: 'Hướng đi phải theo (Đi thẳng)',
    category: 'R',
    lat: 10.7798,
    lng: 106.6995,
    heading: 0,
    trustScore: 97.5,
    location: 'Giao lộ Đồng Khởi - Lê Thánh Tôn, Quận 1, TP.HCM',
    verifiedAt: '18/08/2026',
  },
  {
    id: 'sgn-04',
    code: 'W.201a',
    name: 'Chỗ ngoặt nguy hiểm vòng bên trái',
    category: 'W',
    lat: 10.783,
    lng: 106.704,
    heading: 270,
    trustScore: 96.1,
    location: 'Đường Tôn Đức Thắng, Quận 1, TP.HCM',
    verifiedAt: '20/08/2026',
  },
  {
    id: 'sgn-05',
    code: 'I.407a',
    name: 'Đường một chiều',
    category: 'I',
    lat: 10.775,
    lng: 106.705,
    heading: 135,
    trustScore: 99.0,
    location: 'Đường Hàm Nghi, Quận 1, TP.HCM',
    verifiedAt: '22/08/2026',
  },
  {
    id: 'sgn-06',
    code: 'P.130',
    name: 'Cấm dừng xe và đỗ xe',
    category: 'P',
    lat: 10.7712,
    lng: 106.7035,
    heading: 45,
    trustScore: 99.2,
    location: 'Đường Pasteur, Quận 1, TP.HCM',
    verifiedAt: '24/08/2026',
  },
  {
    id: 'sgn-07',
    code: 'R.302b',
    name: 'Hướng phải đi vòng sang phải',
    category: 'R',
    lat: 10.7745,
    lng: 106.692,
    heading: 315,
    trustScore: 98.1,
    location: 'Vòng xoay Ngã Sáu Phù Đổng, Quận 1, TP.HCM',
    verifiedAt: '25/08/2026',
  },
]

const categoryList = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'P', label: 'Biển Cấm (P)', color: '#ef4444' },
  { id: 'R', label: 'Hiệu Lệnh (R)', color: '#007b8b' },
  { id: 'W', label: 'Cảnh Báo (W)', color: '#f59e0b' },
  { id: 'I', label: 'Chỉ Dẫn (I)', color: '#00c4de' },
  { id: 'S', label: 'Biển Phụ (S)', color: '#6b7280' },
]

export default function ProductMap() {
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
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
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
    <div className="w-full bg-[#030708] text-white min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#007b8b]/20 border border-[#00c4de]/30 text-xs font-semibold text-[#00c4de] mb-2.5">
            <Compass size={16} weight="duotone" />
            <span>HẠ TẦNG BẢN ĐỒ GIS • CHUẨN QCVN 41:2019/BGTVT</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Bản Đồ Không Gian Biển Báo Giao Thông
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-3xl leading-relaxed">
            Tra cứu, kiểm tra vị trí và dữ liệu góc hướng áp dụng của biển báo trên nền tảng OpenStreetMap.
          </p>
        </div>

        {/* ─── SEPARATED DEDICATED SEARCH & FILTER TOOLBAR ─────────────── */}
        <div className="glass-panel rounded-2xl p-3 sm:p-4 border border-white/15 shadow-xl bg-[#061418]/95 backdrop-blur-xl mb-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-left">
          {/* Search Field */}
          <div className="relative flex-1 min-w-[260px] max-w-xl">
            <MagnifyingGlass
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã biển báo (P.102, R.301...), tên biển hoặc tuyến đường..."
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-gray-400 focus:outline-none focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <div className="flex items-center gap-1 text-xs text-gray-400 mr-1 hidden sm:flex">
              <FunnelSimple size={14} className="text-[#00c4de]" />
              <span>Nhóm:</span>
            </div>
            {categoryList.map((cat) => {
              const active = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-[#00c4de] text-black shadow-md shadow-[#00c4de]/30'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Right Controls: Tile Switcher & Result Count */}
          <div className="flex items-center justify-between lg:justify-end gap-2 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-white/10">
            <span className="text-xs text-gray-400 font-mono">
              Hiển thị: <strong className="text-white font-bold">{filteredCount}</strong> biển
            </span>

            <button
              type="button"
              onClick={() => setTileMode((m) => (m === 'osm' ? 'voyager' : 'osm'))}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-gray-200 hover:text-white transition-all shadow-sm cursor-pointer"
              title="Đổi kiểu hiển thị bản đồ"
            >
              <Stack size={16} className="text-[#00c4de]" />
              <span>{tileMode === 'osm' ? 'OpenStreetMap' : 'OSM Voyager'}</span>
            </button>
          </div>
        </div>

        {/* ─── DEDICATED MAP BOX ───────────────────────────────────────── */}
        <div className="glass-panel rounded-[24px] overflow-hidden border border-white/15 shadow-2xl relative h-[70vh] min-h-[580px] w-full bg-[#071317]">
          {/* Leaflet OpenStreetMap Canvas */}
          <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#071317]" />

          {/* Floating Telemetry Badge Bottom Left */}
          <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/15 text-xs text-gray-300 shadow-xl pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-emerald-400 font-bold">OPENSTREETMAP LIVE</span>
            <span className="text-gray-600">•</span>
            <span className="font-mono text-[11px]">WGS 84 • QCVN 41:2019</span>
          </div>
        </div>
      </div>
    </div>
  )
}
