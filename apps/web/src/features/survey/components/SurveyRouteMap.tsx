import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '@/context/ThemeContext'
import type { ExtractedCandidateItem } from '@/data'

interface SurveyRouteMapProps {
  routePoints?: [number, number][]
  candidates?: ExtractedCandidateItem[]
  selectedCandidateId?: string
  onSelectCandidate?: (candidate: ExtractedCandidateItem) => void
  height?: string
}

export function SurveyRouteMap({
  routePoints = [],
  candidates = [],
  selectedCandidateId,
  onSelectCandidate,
  height = '360px',
}: SurveyRouteMapProps) {
  const { t } = useTranslation('common')
  const { isDark } = useTheme()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map())

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const initialCenter: L.LatLngTuple =
      routePoints.length > 0 ? [routePoints[0][0], routePoints[0][1]] : [10.7685, 106.692]
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
    })

    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map)

    const layerGroup = L.layerGroup().addTo(map)
    layerGroupRef.current = layerGroup
    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
      layerGroupRef.current = null
    }
  }, [isDark])

  // Update Route Polyline & Candidate Markers
  useEffect(() => {
    const map = mapInstanceRef.current
    const layerGroup = layerGroupRef.current
    if (!map || !layerGroup) return

    layerGroup.clearLayers()
    markersMapRef.current.clear()

    const bounds = L.latLngBounds([])

    // Draw GPX route line if available
    if (routePoints.length > 1) {
      const polyline = L.polyline(routePoints, {
        color: isDark ? '#00c4de' : '#007b8b',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '8, 8',
      }).addTo(layerGroup)

      bounds.extend(polyline.getBounds())

      // Add Start & End dots
      const startPoint = routePoints[0]
      const endPoint = routePoints[routePoints.length - 1]

      const startIcon = L.divIcon({
        className: 'route-start-marker',
        html: `<div style="background:#10b981;width:14px;height:14px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 0 10px rgba(16,185,129,0.7);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
      L.marker(startPoint, { icon: startIcon, title: t('survey.start_of_trip') }).addTo(layerGroup)

      const endIcon = L.divIcon({
        className: 'route-end-marker',
        html: `<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 0 10px rgba(239,68,68,0.7);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
      L.marker(endPoint, { icon: endIcon, title: t('survey.end_of_trip') }).addTo(layerGroup)
    }

    // Add Candidate Markers
    candidates.forEach((cand) => {
      const isSelected = cand.id === selectedCandidateId

      let bgHex = '#ef4444' // P - Cấm
      if (cand.category === 'W') bgHex = '#f59e0b' // Cảnh báo
      if (cand.category === 'R') bgHex = '#007b8b' // Hiệu lệnh
      if (cand.category === 'I') bgHex = '#00c4de' // Chỉ dẫn
      if (cand.category === 'S') bgHex = '#6b7280' // Phụ

      const size = isSelected ? 34 : 28
      const borderWidth = isSelected ? 3 : 2
      const borderColor = '#ffffff'
      const shadow = isSelected
        ? '0 0 18px rgba(0, 196, 222, 0.9), 0 4px 10px rgba(0,0,0,0.5)'
        : '0 3px 8px rgba(0,0,0,0.35)'

      const iconHtml = `
        <div style="
          background: ${bgHex};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: ${borderWidth}px solid ${borderColor};
          box-shadow: ${shadow};
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 800;
          font-size: ${isSelected ? '11px' : '9.5px'};
          font-family: monospace;
          cursor: pointer;
          transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
          transition: all 0.2s ease;
        ">
          ${cand.signCode.split('.')[0] || 'S'}
        </div>
      `

      const markerIcon = L.divIcon({
        className: `candidate-sign-marker-${cand.id}`,
        html: iconHtml,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      })

      const marker = L.marker([cand.lat, cand.lng], { icon: markerIcon })

      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 170px; padding: 2px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 4px;">
            <span style="font-weight: 800; font-size: 13px; color: ${bgHex}; font-family: monospace;">${cand.signCode}</span>
            <span style="font-size: 10px; background: rgba(0,0,0,0.08); padding: 1px 6px; border-radius: 6px; font-weight: 700;">
              ${Math.round(cand.confidence * 100)}% CLIP
            </span>
          </div>
          <div style="font-weight: 600; font-size: 12px; margin-bottom: 4px; color: #1e293b;">
            ${cand.signName}
          </div>
          <div style="font-size: 11px; color: #64748b; line-height: 1.4;">
            <span>⏱️ Frame: ${cand.timestampStr}</span><br/>
            <span>🧭 ${t('survey.candidate_direction')}: ${cand.trafficDirection}</span><br/>
            <span>📏 ${t('survey.candidate_distance')}: ${cand.distanceMeters}m</span>
          </div>
        </div>
      `)

      marker.on('click', () => {
        onSelectCandidate?.(cand)
      })

      marker.addTo(layerGroup)
      markersMapRef.current.set(cand.id, marker)
      bounds.extend([cand.lat, cand.lng])
    })

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 })
    }
  }, [routePoints, candidates, selectedCandidateId, isDark, onSelectCandidate, t])

  // Center on selected candidate if changed
  useEffect(() => {
    if (!selectedCandidateId || !mapInstanceRef.current) return
    const marker = markersMapRef.current.get(selectedCandidateId)
    if (marker) {
      marker.openPopup()
    }
  }, [selectedCandidateId])

  return (
    <div className="relative isolate z-0 w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-lg">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Mini Legend Overlay */}
      <div
        className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-xl border text-[11px] font-medium backdrop-blur-md z-10 flex items-center gap-3 shadow-md ${
          isDark ? 'bg-black/75 border-white/10 text-gray-300' : 'bg-white/85 border-gray-200 text-gray-700'
        }`}
      >
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> {t('survey.legend_prohibitory')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> {t('survey.legend_warning')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#007b8b] inline-block" /> {t('survey.legend_mandatory')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00c4de] inline-block" /> {t('survey.legend_guide')}
        </span>
      </div>
    </div>
  )
}
