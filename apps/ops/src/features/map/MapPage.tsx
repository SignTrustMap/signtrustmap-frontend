import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MagnifyingGlass,
  MapPin,
  X,
  Stack,
  NavigationArrow,
  ShieldCheck,
  ArrowsClockwise,
  Check,
} from '@phosphor-icons/react'

// Fix Leaflet default icon paths in bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface OpsSignItem {
  id: string
  code: string
  name: string
  category: 'P' | 'R' | 'W' | 'I' | 'S'
  lat: number
  lng: number
  heading: number
  trustScore: number
  status: 'verified' | 'pending' | 'flagged' | 'revalidating'
  location: string
  reviewerVotes: { approve: number; reject: number; modify: number }
  aiConfidence: number
  verifiedAt: string
  imageUrl: string
  detectedBy: string
}

const mockOpsSigns: OpsSignItem[] = [
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
    reviewerVotes: { approve: 8, reject: 0, modify: 0 },
    aiConfidence: 98.2,
    verifiedAt: '12/08/2026',
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
    detectedBy: 'YOLO12 + BoT-SORT (Survey #482)',
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
    reviewerVotes: { approve: 6, reject: 0, modify: 1 },
    aiConfidence: 96.5,
    verifiedAt: '15/08/2026',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=80',
    detectedBy: 'YOLO12 + CLIP (Survey #510)',
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
    reviewerVotes: { approve: 5, reject: 0, modify: 0 },
    aiConfidence: 95.1,
    verifiedAt: '18/08/2026',
    imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=500&auto=format&fit=crop&q=80',
    detectedBy: 'YOLO12 + BoT-SORT (Survey #523)',
  },
  {
    id: 'sgn-04',
    code: 'W.201a',
    name: 'Chỗ ngoặt nguy hiểm vòng bên trái',
    category: 'W',
    lat: 10.783,
    lng: 106.704,
    heading: 270,
    trustScore: 78.4,
    status: 'pending',
    location: 'Đường Tôn Đức Thắng (đoạn vòng bờ sông), Quận 1, TP.HCM',
    reviewerVotes: { approve: 2, reject: 1, modify: 0 },
    aiConfidence: 81.3,
    verifiedAt: 'Đang chờ đồng thuận',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
    detectedBy: 'YOLO12 + BoT-SORT (Survey #540)',
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
    reviewerVotes: { approve: 9, reject: 0, modify: 0 },
    aiConfidence: 99.1,
    verifiedAt: '22/08/2026',
    imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=500&auto=format&fit=crop&q=80',
    detectedBy: 'YOLO12 + CLIP (Survey #555)',
  },
]

export default function MapPage() {
  const { t } = useTranslation('ops')
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)

  const [activeGroup, setActiveGroup] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSign, setSelectedSign] = useState<OpsSignItem | null>(null)
  const [tileMode, setTileMode] = useState<'osm' | 'voyager'>('osm')
  const tileLayerRef = useRef<L.TileLayer | null>(null)

  const signGroups = [
    { id: 'ALL', label: t('map.group_all') },
    { id: 'P', label: t('map.group_p') },
    { id: 'R', label: t('map.group_r') },
    { id: 'W', label: t('map.group_w') },
    { id: 'I', label: t('map.group_i') },
    { id: 'S', label: t('map.group_s') },
  ]

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [10.7769, 106.7009],
      zoom: 15,
      zoomControl: false,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Standard OpenStreetMap Tile Layer
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

    const filtered = mockOpsSigns.filter((sign) => {
      const matchCat = activeGroup === 'ALL' || sign.category === activeGroup
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
        className: 'custom-ops-marker',
        html: `
          <div style="
            background: ${bgHex};
            width: ${isSelected ? '36px' : '30px'};
            height: ${isSelected ? '36px' : '30px'};
            border-radius: 50%;
            border: ${isSelected ? '3px solid #00c4de' : '2px solid #ffffff'};
            box-shadow: 0 4px 14px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 800;
            font-size: ${isSelected ? '12px' : '11px'};
            font-family: monospace;
            cursor: pointer;
            transition: all 0.15s ease;
          ">
            ${sign.category}
          </div>
        `,
        iconSize: isSelected ? [36, 36] : [30, 30],
        iconAnchor: isSelected ? [18, 18] : [15, 15],
      })

      const marker = L.marker([sign.lat, sign.lng], { icon: customIcon })

      marker.on('click', () => {
        setSelectedSign(sign)
        mapInstanceRef.current?.flyTo([sign.lat, sign.lng], 17, { duration: 0.8 })
      })

      markersLayerRef.current?.addLayer(marker)
    })
  }, [activeGroup, searchQuery, selectedSign])

  return (
    <div className="flex flex-col flex-1 h-full min-h-[500px] w-full bg-[#F8F7F7] dark:bg-[#030708] font-sans relative overflow-hidden">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-[#071317] border-b border-[#E8E4E3] dark:border-white/10 shrink-0 z-10">
        {/* Left: Search input */}
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-sm">
          <div className="relative w-full">
            <MagnifyingGlass
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('map.search_placeholder')}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-[#E8E4E3] dark:border-white/15 bg-gray-50 dark:bg-[#061115] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#00c4de] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Center: Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {signGroups.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGroup(g.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                activeGroup === g.id
                  ? 'bg-[#007b8b] dark:bg-[#00c4de] text-white dark:text-black border-[#007b8b] dark:border-[#00c4de] shadow-sm font-bold'
                  : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-[#E8E4E3] dark:border-white/10 hover:border-[#00c4de] hover:text-[#00c4de]'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Right: Controls & Tile mode */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setTileMode((m) => (m === 'osm' ? 'voyager' : 'osm'))}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 border border-[#E8E4E3] dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm cursor-pointer"
            title="Đổi kiểu bản đồ"
          >
            <Stack size={14} className="text-[#007b8b] dark:text-[#00c4de]" />
            <span>{tileMode === 'osm' ? t('map.tile_osm') : t('map.tile_voyager')}</span>
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 relative w-full h-full min-h-0 overflow-hidden">
        {/* Leaflet OpenStreetMap canvas */}
        <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#061014]" />

        {/* Floating Telemetry Badge */}
        <div className="absolute top-3 left-3 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/95 dark:bg-[#081317]/90 backdrop-blur-md border border-[#E8E4E3] dark:border-white/10 text-xs text-gray-700 dark:text-gray-300 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono font-bold text-[#007b8b] dark:text-[#00c4de]">OPENSTREETMAP LIVE</span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span>{t('map.telemetry')}</span>
        </div>

        {/* Selected Sign Inspector Drawer */}
        {selectedSign && (
          <div className="absolute top-3 right-3 z-20 w-full max-w-sm bg-white dark:bg-[#0A171C] rounded-[16px] border border-[#E8E4E3] dark:border-white/15 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right duration-200 text-gray-900 dark:text-white">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#007b8b]/10 via-transparent to-transparent border-b border-[#E8E4E3] dark:border-white/10 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#007b8b] text-white">
                    {selectedSign.code}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                    <ShieldCheck size={14} weight="fill" />
                    {selectedSign.status === 'verified'
                      ? t('map.drawer_verified', { score: selectedSign.trustScore })
                      : t('map.drawer_pending')}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{selectedSign.name}</h3>
              </div>
              <button
                onClick={() => setSelectedSign(null)}
                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3.5 text-xs text-left">
              {/* Camera Evidence Crop */}
              <div className="relative rounded-lg overflow-hidden aspect-video bg-black border border-gray-200 dark:border-white/10">
                <img
                  src={selectedSign.imageUrl}
                  alt={selectedSign.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-[#00c4de] border border-[#00c4de]/30">
                  {selectedSign.detectedBy}
                </span>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                  <p className="text-[10px] text-gray-400 uppercase">{t('map.drawer_heading')}</p>
                  <p className="text-xs font-bold text-[#007b8b] dark:text-[#00c4de] flex items-center gap-1 mt-0.5">
                    <NavigationArrow size={13} className="rotate-45" />
                    {selectedSign.heading}° (Bắc/Nam)
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                  <p className="text-[10px] text-gray-400 uppercase">{t('map.drawer_coords')}</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5 truncate">
                    {selectedSign.lat.toFixed(4)}, {selectedSign.lng.toFixed(4)}
                  </p>
                </div>
              </div>

              {/* Reviewer Consensus Stats */}
              <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-700 dark:text-gray-300">
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">
                  {t('map.drawer_consensus')}
                </p>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Duyệt: {selectedSign.reviewerVotes.approve}</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">✎ Sửa: {selectedSign.reviewerVotes.modify}</span>
                  <span className="text-red-600 dark:text-red-400 font-bold">✕ Từ chối: {selectedSign.reviewerVotes.reject}</span>
                </div>
              </div>

              {/* Location string */}
              <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                <MapPin size={15} className="text-[#007b8b] dark:text-[#00c4de] shrink-0 mt-0.5" />
                <span className="text-xs">{selectedSign.location}</span>
              </div>

              {/* Moderator Actions */}
              <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex gap-2">
                <button
                  onClick={() => alert(`Đã phê duyệt biển báo ${selectedSign.code} xuất bản!`)}
                  className="flex-1 py-2 rounded-lg bg-[#007b8b] hover:bg-[#006272] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                >
                  <Check size={13} weight="bold" />
                  <span>{t('map.btn_quick_approve')}</span>
                </button>
                <button
                  onClick={() => alert(`Đã tạo nhiệm vụ tái thẩm định cho biển báo ${selectedSign.code}!`)}
                  className="py-2 px-3 rounded-lg border border-gray-300 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title={t('map.btn_revalidate_title')}
                >
                  <ArrowsClockwise size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
