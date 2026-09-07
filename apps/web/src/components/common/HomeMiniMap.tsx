import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowSquareOut, Stack } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { mockSigns } from '@/data'

// Fix Leaflet default marker icons in bundler
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export function HomeMiniMap() {
  const { isDark } = useTheme()
  const { t } = useTranslation('product')
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const [tileMode, setTileMode] = useState<'osm' | 'voyager'>('osm')

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [10.7769, 106.7009],
      zoom: 15,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    })

    const osmTile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    tileLayerRef.current = osmTile

    // Add Mock Sign Markers
    mockSigns.forEach((sign) => {
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
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 800;
            font-size: 11px;
            font-family: monospace;
            cursor: pointer;
          ">
            ${sign.category}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })

      const marker = L.marker([sign.lat, sign.lng], { icon: customIcon }).addTo(map)

      const popupContent = `
        <div style="font-family: 'Geist', sans-serif; padding: 2px; color: #111827; min-width: 200px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <strong style="background: ${bgHex}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-family: monospace;">${sign.code}</strong>
            <span style="color: #059669; font-size: 10px; font-weight: bold; font-family: monospace;">✓ ${sign.trustScore}% ${t('mini_map.popup_trust', { defaultValue: 'Trust' })}</span>
          </div>
          <p style="font-size: 12px; font-weight: 700; margin: 3px 0 2px 0; line-height: 1.3;">${sign.name}</p>
          <p style="font-size: 10px; color: #4b5563; margin: 0 0 4px 0;">${sign.location}</p>
          <div style="font-size: 9px; color: #6b7280; font-family: monospace; border-top: 1px solid #e5e7eb; padding-top: 4px;">
            ${t('mini_map.popup_heading', { defaultValue: 'Hướng xe:' })} ${sign.heading}° • QCVN 41
          </div>
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
  }, [t])

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
    <div
      className={`rounded-[20px] overflow-hidden border shadow-2xl relative flex flex-col h-[420px] sm:h-[460px] transition-colors ${
        isDark
          ? 'glass-panel border-white/15 bg-[#08171b]'
          : 'bg-white border-[#E8E4E3] shadow-gray-200/80'
      }`}
    >
      {/* Top Header Bar */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b text-xs shrink-0 z-10 transition-colors ${
          isDark
            ? 'bg-[#040c0e] border-white/10 text-gray-300'
            : 'bg-white/95 border-[#E8E4E3] text-gray-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className={`text-xs font-mono font-semibold ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
            {t('mini_map.live_view')}
          </span>
          <span className={`hidden sm:inline ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
          <span className={`text-[11px] font-mono hidden sm:inline ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            QCVN 41:2019
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTileMode((m) => (m === 'osm' ? 'voyager' : 'osm'))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/10 hover:bg-white/15 text-gray-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
            }`}
            title="Đổi lớp bản đồ"
          >
            <Stack size={13} className={isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'} />
            <span>{tileMode === 'osm' ? t('mini_map.osm_standard') : t('mini_map.voyager')}</span>
          </button>
          <Link
            to="/product/map"
            className={`p-1.5 rounded-md transition-colors ${
              isDark
                ? 'bg-[#00c4de]/15 hover:bg-[#00c4de]/25 text-[#00c4de]'
                : 'bg-teal-50 hover:bg-teal-100 text-[#007b8b]'
            }`}
            title="Mở toàn màn hình"
          >
            <ArrowSquareOut size={14} />
          </Link>
        </div>
      </div>

      {/* Real Interactive Leaflet OpenStreetMap Canvas */}
      <div className="relative flex-1 w-full h-full">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Quick Legend */}
        <div
          className={`absolute bottom-3 left-3 z-10 px-3 py-2 rounded-xl text-[10px] font-mono flex items-center gap-3 shadow-lg pointer-events-none border transition-colors ${
            isDark
              ? 'bg-black/85 backdrop-blur-md border-white/10 text-gray-300'
              : 'bg-white/95 backdrop-blur-md border-gray-200 text-gray-700 shadow-gray-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>{t('mini_map.legend_p')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#007b8b]" />
            <span>{t('mini_map.legend_r')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{t('mini_map.legend_w')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00c4de]" />
            <span>{t('mini_map.legend_i')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
