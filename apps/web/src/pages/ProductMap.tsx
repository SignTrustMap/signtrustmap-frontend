import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MagnifyingGlass,
  MapPin,
  Compass,
  X,
  Stack,
  NavigationArrow,
  ShieldCheck,
  ArrowsClockwise,
  Database,
} from '@phosphor-icons/react'


// Fix Leaflet default marker icons
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
  status: 'verified' | 'pending' | 'revalidating'
  location: string
  verifiedAt: string
  imageUrl: string
  description: string
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
    status: 'verified',
    location: 'Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
    verifiedAt: '12/08/2026',
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
    description: 'Biển báo đặt tại đầu tuyến đường, áp dụng cho tất cả các loại phương tiện cơ giới và thô sơ.',
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
    status: 'verified',
    location: 'Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
    verifiedAt: '15/08/2026',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=80',
    description: 'Giới hạn tốc độ tối đa 50 km/h trong khu vực đông dân cư theo quy chuẩn QCVN 41:2019.',
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
    status: 'verified',
    location: 'Giao lộ Đồng Khởi - Lê Thánh Tôn, Quận 1, TP.HCM',
    verifiedAt: '18/08/2026',
    imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=500&auto=format&fit=crop&q=80',
    description: 'Bắt buộc các phương tiện chỉ được phép đi thẳng, không được rẽ trái hay rẽ phải.',
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
    status: 'verified',
    location: 'Đường Tôn Đức Thắng (đoạn vòng bờ sông), Quận 1, TP.HCM',
    verifiedAt: '20/08/2026',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
    description: 'Báo trước sắp đến một chỗ ngoặt nguy hiểm có bán kính cong nhỏ sang phía bên trái.',
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
    status: 'verified',
    location: 'Đường Hàm Nghi, Quận 1, TP.HCM',
    verifiedAt: '22/08/2026',
    imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=500&auto=format&fit=crop&q=80',
    description: 'Chỉ dẫn những đoạn đường chỉ cho phép phương tiện lưu thông theo một chiều nhất định.',
  },
]

const categoryLabels: Record<string, { label: string; short: string; color: string; bg: string; border: string }> = {
  P: { label: 'Biển Cấm (P)', short: 'P', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40' },
  R: { label: 'Biển Hiệu Lệnh (R)', short: 'R', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/40' },
  W: { label: 'Biển Cảnh Báo (W)', short: 'W', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40' },
  I: { label: 'Biển Chỉ Dẫn (I)', short: 'I', color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/40' },
  S: { label: 'Biển Phụ (S)', short: 'S', color: 'text-gray-300', bg: 'bg-gray-500/20', border: 'border-gray-500/40' },
}

export default function ProductMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSign, setSelectedSign] = useState<SignItem | null>(mockSigns[0])
  const [tileMode, setTileMode] = useState<'dark' | 'osm'>('dark')
  const tileLayerRef = useRef<L.TileLayer | null>(null)

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    // Create Leaflet map centered at Ho Chi Minh City
    const map = L.map(mapContainerRef.current, {
      center: [10.7769, 106.7009],
      zoom: 15,
      zoomControl: false,
    })

    // Add Zoom Control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Initial Tile Layer: CartoDB Voyager / Dark
    const darkTile = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }
    ).addTo(map)

    tileLayerRef.current = darkTile

    // Markers Layer Group
    const markersLayer = L.layerGroup().addTo(map)
    markersLayerRef.current = markersLayer

    mapInstanceRef.current = map

    // Fix render size if container adjusts
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
      tileMode === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

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

      const isSelected = selectedSign?.id === sign.id

      const customIcon = L.divIcon({
        className: 'custom-sign-marker',
        html: `
          <div style="
            background: ${bgHex};
            width: ${isSelected ? '38px' : '32px'};
            height: ${isSelected ? '38px' : '32px'};
            border-radius: 50%;
            border: ${isSelected ? '3px solid #00c4de' : '2.5px solid #ffffff'};
            box-shadow: 0 4px 16px rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 800;
            font-size: ${isSelected ? '13px' : '11px'};
            font-family: monospace;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            ${sign.category}
          </div>
        `,
        iconSize: isSelected ? [38, 38] : [32, 32],
        iconAnchor: isSelected ? [19, 19] : [16, 16],
      })

      const marker = L.marker([sign.lat, sign.lng], { icon: customIcon })

      marker.on('click', () => {
        setSelectedSign(sign)
        mapInstanceRef.current?.flyTo([sign.lat, sign.lng], 17, { duration: 0.8 })
      })

      markersLayerRef.current?.addLayer(marker)
    })
  }, [selectedCategory, searchQuery, selectedSign])

  function handleSelectSign(sign: SignItem) {
    setSelectedSign(sign)
    mapInstanceRef.current?.flyTo([sign.lat, sign.lng], 17, { duration: 0.8 })
  }

  const filteredSigns = mockSigns.filter((sign) => {
    const matchCat = selectedCategory === 'ALL' || sign.category === selectedCategory
    const matchSearch =
      sign.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.location.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="bg-[#030708] text-white min-h-screen py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#007b8b]/20 border border-[#00c4de]/30 text-xs font-semibold text-[#00c4de] mb-3">
            <Compass size={16} weight="duotone" />
            <span>HẠ TẦNG BẢN ĐỒ GIS • CHUẨN QCVN 41:2019/BGTVT</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Khám Phá Dữ Liệu Biển Báo Không Gian GIS
          </h1>
          <p className="text-sm sm:text-base text-gray-300 mt-2 max-w-3xl leading-relaxed">
            Dữ liệu biển báo giao thông được trích xuất từ camera thực địa, chiếu tọa độ địa lý qua PostGIS và xác thực qua cơ chế Weighted Consensus.
          </p>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Explainer & Inspector Panel (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Search and Filters Card */}
            <div className="glass-panel rounded-[20px] p-5 border border-white/10 shadow-xl bg-[#061417]/90 backdrop-blur-xl">
              <div className="relative mb-3.5">
                <MagnifyingGlass
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo mã (P.102), tên hoặc tuyến đường..."
                  className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-gray-400 focus:outline-none focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === 'ALL'
                      ? 'bg-[#00c4de] text-black shadow-md shadow-[#00c4de]/25'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  Tất cả ({mockSigns.length})
                </button>
                {Object.entries(categoryLabels).map(([catKey, catMeta]) => {
                  const active = selectedCategory === catKey
                  return (
                    <button
                      key={catKey}
                      onClick={() => setSelectedCategory(catKey)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        active
                          ? `${catMeta.bg} ${catMeta.color} ${catMeta.border} font-bold shadow-sm`
                          : 'bg-white/5 text-gray-400 hover:text-gray-200 border-white/10'
                      }`}
                    >
                      {catMeta.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected Sign Detail Inspector Card */}
            {selectedSign ? (
              <div className="glass-panel rounded-[20px] p-5 border border-[#00c4de]/30 shadow-2xl bg-[#08191d]/95 backdrop-blur-xl relative overflow-hidden">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#00c4de] text-black">
                        {selectedSign.code}
                      </span>
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <ShieldCheck size={14} weight="fill" />
                        Đã duyệt ({selectedSign.trustScore}%)
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug">
                      {selectedSign.name}
                    </h3>
                  </div>
                </div>

                {/* AI Crop Image */}
                <div className="relative rounded-xl overflow-hidden aspect-video bg-black border border-white/10 mb-3.5">
                  <img
                    src={selectedSign.imageUrl}
                    alt={selectedSign.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/85 text-[10px] font-mono text-[#00c4de] border border-[#00c4de]/30">
                    BẰNG CHỨNG CAMERA & GPX
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed mb-4">
                  {selectedSign.description}
                </p>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-2.5 mb-3.5 font-mono text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-gray-400 uppercase">Hướng xe áp dụng</p>
                    <p className="text-sm font-bold text-[#00c4de] flex items-center gap-1 mt-0.5">
                      <NavigationArrow size={14} className="rotate-45" />
                      {selectedSign.heading}° (Bắc/Nam)
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-gray-400 uppercase">Tọa độ WGS 84</p>
                    <p className="text-xs font-bold text-white mt-1 truncate">
                      {selectedSign.lat.toFixed(4)}, {selectedSign.lng.toFixed(4)}
                    </p>
                  </div>
                </div>

                {/* Location string */}
                <div className="flex items-start gap-2 text-xs text-gray-300 mb-4">
                  <MapPin size={16} className="text-[#00c4de] shrink-0 mt-0.5" />
                  <span>{selectedSign.location}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-white/10">
                  <button
                    onClick={() => alert(`Yêu cầu tái thẩm định biển báo ${selectedSign.code} đã được gửi!`)}
                    className="flex-1 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowsClockwise size={14} />
                    <span>Tái thẩm định</span>
                  </button>
                  <a
                    href={`https://www.google.com/maps?q=${selectedSign.lat},${selectedSign.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 rounded-xl bg-[#00c4de] hover:bg-[#38dbf1] text-black text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#00c4de]/25"
                  >
                    <Compass size={14} weight="bold" />
                    <span>Xem thực địa</span>
                  </a>
                </div>
              </div>
            ) : null}

            {/* Quick List of Signs */}
            <div className="glass-panel rounded-[20px] p-5 border border-white/10 shadow-xl bg-[#061417]/90 backdrop-blur-xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center justify-between">
                <span>Danh sách biển báo ({filteredSigns.length})</span>
                <span className="text-[10px] text-[#00c4de] font-mono">CLICK ĐỂ XEM TRÊN MAP</span>
              </h4>

              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                {filteredSigns.map((sign) => {
                  const isSelected = selectedSign?.id === sign.id
                  return (
                    <button
                      key={sign.id}
                      onClick={() => handleSelectSign(sign)}
                      className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between border ${
                        isSelected
                          ? 'bg-[#007b8b]/30 border-[#00c4de]/50 shadow-sm'
                          : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/60 text-[#00c4de] border border-[#00c4de]/30 shrink-0">
                          {sign.code}
                        </span>
                        <span className="text-xs font-semibold text-gray-200 truncate">
                          {sign.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 shrink-0 ml-2">
                        {sign.trustScore}%
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Contained Leaflet OpenStreetMap (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Map Container Box */}
            <div className="glass-panel rounded-[24px] overflow-hidden border border-white/15 shadow-2xl relative h-[600px] lg:h-[720px] bg-[#071317]">
              {/* Map Top Bar */}
              <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-auto">
                {/* Live Telemetry Pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-white/15 text-[11px] text-gray-300 shadow-xl">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-emerald-400 font-bold">OSM LIVE</span>
                  <span className="text-gray-500">•</span>
                  <span>QCVN 41 GIS Viewer</span>
                </div>

                {/* Map Tile Switcher */}
                <button
                  onClick={() => setTileMode((m) => (m === 'dark' ? 'osm' : 'dark'))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-black/85 hover:bg-black border border-white/15 text-gray-200 hover:text-white transition-all shadow-xl backdrop-blur-md"
                  title="Đổi giao diện bản đồ"
                >
                  <Stack size={14} className="text-[#00c4de]" />
                  <span>{tileMode === 'dark' ? 'OSM Voyager' : 'OSM Standard'}</span>
                </button>
              </div>

              {/* Leaflet Canvas */}
              <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#071316]" />
            </div>

            {/* Bottom Info Bar below Map */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                <Database size={20} className="text-[#00c4de] shrink-0" />
                <div className="text-left">
                  <p className="text-[11px] text-gray-400">Hạ tầng không gian</p>
                  <p className="text-xs font-bold text-white">PostGIS + pgvector</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                <NavigationArrow size={20} className="text-[#00c4de] shrink-0" />
                <div className="text-left">
                  <p className="text-[11px] text-gray-400">Direction-Aware</p>
                  <p className="text-xs font-bold text-white">Góc hướng áp dụng</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
                <div className="text-left">
                  <p className="text-[11px] text-gray-400">Đồng thuận cộng đồng</p>
                  <p className="text-xs font-bold text-white">Weighted Consensus</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
