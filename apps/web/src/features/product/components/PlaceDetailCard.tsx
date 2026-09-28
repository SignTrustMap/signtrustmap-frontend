import { useState } from 'react'
import type { ApiPlace } from '@shared/types'
import {
  MapPin,
  X,
  NavigationArrow,
  Copy,
  Check,
  Compass,
  Buildings,
  FirstAid,
  GraduationCap,
  Storefront,
  ForkKnife,
  Crosshair,
  CircleNotch,
} from '@phosphor-icons/react'

interface PlaceDetailCardProps {
  place: ApiPlace
  userCoordinate: [number, number] | null
  onRequestDirections: () => void
  onClose: () => void
  onCenterMap?: () => void
  isLoadingRoute?: boolean
  isDark: boolean
}

interface CategoryInfo {
  label: string
  icon: typeof Buildings
  colorClass: string
}

function detectCategory(title: string, address?: string | null): CategoryInfo {
  const text = `${title || ''} ${address || ''}`.toLowerCase()

  if (
    text.includes('mall') ||
    text.includes('takashimaya') ||
    text.includes('vincom') ||
    text.includes('aeon') ||
    text.includes('plaza') ||
    text.includes('trung tâm thương mại') ||
    text.includes('tttm')
  ) {
    return {
      label: 'Trung tâm thương mại',
      icon: Storefront,
      colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    }
  }

  if (
    text.includes('bệnh viện') ||
    text.includes('phòng khám') ||
    text.includes('viện y') ||
    text.includes('trạm y tế') ||
    text.includes('hospital')
  ) {
    return {
      label: 'Y tế & Bệnh viện',
      icon: FirstAid,
      colorClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    }
  }

  if (
    text.includes('trường') ||
    text.includes('đại học') ||
    text.includes('cao đẳng') ||
    text.includes('thpt') ||
    text.includes('tiểu học') ||
    text.includes('mầm non') ||
    text.includes('học viện')
  ) {
    return {
      label: 'Giáo dục & Đào tạo',
      icon: GraduationCap,
      colorClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    }
  }

  if (
    text.includes('quán') ||
    text.includes('cà phê') ||
    text.includes('cafe') ||
    text.includes('coffee') ||
    text.includes('nhà hàng') ||
    text.includes('bún') ||
    text.includes('phở') ||
    text.includes('trà')
  ) {
    return {
      label: 'Ẩm thực & Dịch vụ',
      icon: ForkKnife,
      colorClass: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    }
  }

  if (
    text.includes('tòa nhà') ||
    text.includes('tower') ||
    text.includes('building') ||
    text.includes('công ty') ||
    text.includes('văn phòng')
  ) {
    return {
      label: 'Tòa nhà & Cơ quan',
      icon: Buildings,
      colorClass: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    }
  }

  return {
    label: 'Địa điểm & Địa chỉ',
    icon: MapPin,
    colorClass: 'text-[#007b8b] dark:text-[#00c4de] bg-[#007b8b]/10 dark:bg-[#00c4de]/10 border-[#007b8b]/20 dark:border-[#00c4de]/20',
  }
}

/**
 * Calculates straight-line distance in km between two [lat, lng] points using Haversine formula
 */
function calculateDistanceKm(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lat1, lon1] = coord1
  const [lat2, lon2] = coord2
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function PlaceDetailCard({
  place,
  userCoordinate,
  onRequestDirections,
  onClose,
  onCenterMap,
  isLoadingRoute = false,
  isDark,
}: PlaceDetailCardProps) {
  const [copied, setCopied] = useState(false)

  const category = detectCategory(place.title, place.address)
  const CategoryIcon = category.icon

  // Calculate approximate distance from current GPS
  let distanceText: string | null = null
  if (userCoordinate && place.latitude != null && place.longitude != null) {
    const km = calculateDistanceKm(userCoordinate, [place.latitude, place.longitude])
    distanceText = km < 1 ? `~${Math.round(km * 1000)} m` : `~${km.toFixed(1)} km`
  }

  const handleCopyAddress = async () => {
    try {
      const fullText = [place.title, place.address].filter(Boolean).join(' - ')
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback if clipboard API is restricted
    }
  }

  return (
    <aside
      aria-label="Thông tin chi tiết địa điểm"
      className={`absolute top-20 left-4 z-[1000] w-[calc(100%-32px)] sm:w-96 max-h-[calc(100%-6rem)] rounded-2xl shadow-2xl border backdrop-blur-md overflow-hidden flex flex-col transition-all animate-in fade-in slide-in-from-top-3 duration-300 ${
        isDark
          ? 'bg-[#071317]/95 border-white/10 text-white shadow-black/60'
          : 'bg-white/95 border-[#E8E4E3] text-gray-900 shadow-slate-300/60'
      }`}
    >
      {/* Top Banner Accent (Solid Brand Color) */}
      <div className="h-1.5 w-full bg-[#007b8b] dark:bg-[#00c4de]" />

      {/* Main Info Header */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Category Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border tracking-wide uppercase ${category.colorClass}`}
          >
            <CategoryIcon weight="bold" className="w-3.5 h-3.5" />
            <span>{category.label}</span>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Đóng thông tin địa điểm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Place Title */}
        <h2 className="text-base sm:text-lg font-extrabold tracking-tight mt-2.5 leading-snug">
          {place.title}
        </h2>

        {/* Full Address */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
          {place.address || 'Địa chỉ đang cập nhật'}
        </p>

        {/* Metadata Strip: Distance & Coordinates */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-gray-500 dark:text-gray-400 font-medium">
          {distanceText && (
            <div className="flex items-center gap-1 text-[#007b8b] dark:text-[#00c4de] font-semibold">
              <Compass weight="bold" className="w-3.5 h-3.5" />
              <span>Cách bạn {distanceText}</span>
            </div>
          )}

          {place.latitude != null && place.longitude != null && (
            <div className="flex items-center gap-1 font-mono text-[11px] text-gray-400">
              <MapPin weight="fill" className="w-3 h-3 text-red-500" />
              <span>
                {place.latitude.toFixed(4)}°, {place.longitude.toFixed(4)}°
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 pt-1 bg-gray-50/60 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5 flex items-center gap-2">
        {/* Primary Action: Get Directions */}
        <button
          type="button"
          onClick={onRequestDirections}
          disabled={isLoadingRoute}
          className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer bg-[#007b8b] hover:bg-[#00606d] text-white shadow-[#007b8b]/25 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoadingRoute ? (
            <>
              <CircleNotch weight="bold" className="w-4 h-4 animate-spin" />
              <span>Đang tính đường...</span>
            </>
          ) : (
            <>
              <NavigationArrow weight="fill" className="w-4 h-4" />
              <span>Chỉ đường</span>
            </>
          )}
        </button>

        {/* Secondary Action: Center on Map */}
        {onCenterMap && (
          <button
            type="button"
            onClick={onCenterMap}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            title="Đưa vào trung tâm bản đồ"
          >
            <Crosshair weight="bold" className="w-4 h-4" />
          </button>
        )}

        {/* Tertiary Action: Copy Address */}
        <button
          type="button"
          onClick={handleCopyAddress}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
          title={copied ? 'Đã sao chép địa chỉ!' : 'Sao chép địa chỉ'}
        >
          {copied ? (
            <Check weight="bold" className="w-4 h-4 text-emerald-500" />
          ) : (
            <Copy weight="bold" className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  )
}
