import { useState } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
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
import { calculateHaversineDistance, formatDistance } from '@shared/map'
import { detectCategory, type PlaceCategoryType } from '../utils/productMapHelpers'

interface PlaceDetailCardProps {
  place: ApiPlace
  userCoordinate: [number, number] | null
  onRequestDirections: () => void
  onClose: () => void
  onCenterMap?: () => void
  isLoadingRoute?: boolean
  isDark: boolean
}

function getCategoryIcon(type: PlaceCategoryType) {
  switch (type) {
    case 'mall':
      return Storefront
    case 'hospital':
      return FirstAid
    case 'education':
      return GraduationCap
    case 'dining':
      return ForkKnife
    case 'building':
      return Buildings
    default:
      return MapPin
  }
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
  const { t } = useTranslation('product')
  const [copied, setCopied] = useState(false)

  const category = detectCategory(place.title, place.address, t)
  const CategoryIcon = getCategoryIcon(category.type)

  // Calculate approximate distance from current GPS using @shared/map
  let distanceText: string | null = null
  if (userCoordinate && place.latitude != null && place.longitude != null) {
    const meters = calculateHaversineDistance(
      userCoordinate[0],
      userCoordinate[1],
      place.latitude,
      place.longitude
    )
    distanceText = `~${formatDistance(meters)}`
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
    <motion.aside
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      aria-label={t('map_page.place_detail.aria_label')}
      className={`absolute top-20 left-4 z-[1000] w-[calc(100%-32px)] sm:w-96 max-h-[calc(100%-6rem)] rounded-2xl shadow-2xl border backdrop-blur-md overflow-hidden flex flex-col ${
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
            title={t('map_page.place_detail.close_tooltip')}
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
          {place.address || t('map_page.place_detail.default_address')}
        </p>

        {/* Metadata Strip: Distance & Coordinates */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-gray-500 dark:text-gray-400 font-medium">
          {distanceText && (
            <div className="flex items-center gap-1 text-[#007b8b] dark:text-[#00c4de] font-semibold">
              <Compass weight="bold" className="w-3.5 h-3.5" />
              <span>
                {t('map_page.place_detail.distance_away', {
                  distance: distanceText,
                })}
              </span>
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
              <span>{t('map_page.place_detail.calculating_route')}</span>
            </>
          ) : (
            <>
              <NavigationArrow weight="fill" className="w-4 h-4" />
              <span>{t('map_page.place_detail.directions')}</span>
            </>
          )}
        </button>

        {/* Secondary Action: Center on Map */}
        {onCenterMap && (
          <button
            type="button"
            onClick={onCenterMap}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            title={t('map_page.place_detail.center_map')}
          >
            <Crosshair weight="bold" className="w-4 h-4" />
          </button>
        )}

        {/* Tertiary Action: Copy Address */}
        <button
          type="button"
          onClick={handleCopyAddress}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
          title={
            copied
              ? t('map_page.place_detail.copied_address')
              : t('map_page.place_detail.copy_address')
          }
        >
          {copied ? (
            <Check weight="bold" className="w-4 h-4 text-emerald-500" />
          ) : (
            <Copy weight="bold" className="w-4 h-4" />
          )}
        </button>
      </div>
    </motion.aside>
  )
}
