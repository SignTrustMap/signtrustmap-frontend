import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowSquareOut, Stack } from '@phosphor-icons/react'


// Fix Leaflet default icon paths in bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

import { mockSigns } from '@/data'


export function HomeMiniMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const [tileMode, setTileMode] = useState<'osm' | 'voyager'>('osm')

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [10.7769, 106.7009],
      zoom: 15,
      zoomControl: false,
      scrollWheelZoom: false,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    const tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    tileLayerRef.current = tile

    // Add interactive sign markers
    mockSigns.forEach((sign) => {
      let bgHex = '#ef4444' // P
      if (sign.category === 'R') bgHex = '#007b8b'
      if (sign.category === 'W') bgHex = '#f59e0b'
      if (sign.category === 'I') bgHex = '#00c4de'
      if (sign.category === 'S') bgHex = '#6b7280'

      const customIcon = L.divIcon({
        className: 'custom-home-marker',
        html: `
          <div style="
            background: ${bgHex};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 14px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 800;
            font-size: 11px;
            font-family: monospace;
            cursor: pointer;
            transition: transform 0.15s ease;
          ">
            ${sign.category}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const marker = L.marker([sign.lat, sign.lng], { icon: customIcon }).addTo(map)

      const popupContent = `
        <div style="font-family: 'Geist', sans-serif; padding: 2px; color: #111827; min-width: 170px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <strong style="background: #007b8b; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-family: monospace;">${sign.code}</strong>
            <span style="color: #059669; font-size: 11px; font-weight: bold; font-family: monospace;">${sign.trustScore}% Trust</span>
          </div>
          <p style="font-size: 12px; font-weight: 700; margin: 4px 0 2px 0; line-height: 1.3;">${sign.name}</p>
          <p style="font-size: 10px; color: #6b7280; margin: 0; font-family: monospace;">Hướng xe: ${sign.heading}°</p>
        </div>
      `

      marker.bindPopup(popupContent)
    })


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

  return (
    <div className="glass-panel rounded-[20px] overflow-hidden border border-white/15 shadow-2xl relative flex flex-col h-[420px] sm:h-[460px] bg-[#08171b]">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#040c0e] border-b border-white/10 text-xs shrink-0 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-gray-300 font-mono font-semibold">
            OPENSTREETMAP LIVE VIEW
          </span>
          <span className="text-gray-500 hidden sm:inline">•</span>
          <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">QCVN 41:2019</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTileMode((m) => (m === 'osm' ? 'voyager' : 'osm'))}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-[11px] text-gray-200 transition-colors cursor-pointer"
            title="Đổi lớp bản đồ"
          >
            <Stack size={13} className="text-[#00c4de]" />
            <span>{tileMode === 'osm' ? 'OSM Standard' : 'Voyager'}</span>
          </button>
          <Link
            to="/product/map"
            className="p-1.5 rounded-md bg-[#00c4de]/15 hover:bg-[#00c4de]/25 text-[#00c4de] transition-colors"
            title="Mở toàn màn hình"
          >
            <ArrowSquareOut size={14} />
          </Link>
        </div>
      </div>

      {/* Real Interactive Leaflet OpenStreetMap Canvas */}
      <div className="relative flex-1 w-full h-full">
        <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#071317]" />

        {/* Floating Quick Legend */}
        <div className="absolute bottom-3 left-3 z-10 bg-black/85 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-[10px] font-mono text-gray-300 flex items-center gap-3 shadow-lg pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Cấm (P)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#007b8b]" />
            <span>Hiệu lệnh (R)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Cảnh báo (W)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00c4de]" />
            <span>Chỉ dẫn (I)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
