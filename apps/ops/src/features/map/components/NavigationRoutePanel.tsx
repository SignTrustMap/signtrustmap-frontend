import { useState } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import type { NavigationRoute, RouteSign, VehicleModeId, ApiPlace } from '@shared/types'
import {
  Car,
  Bicycle,
  X,
  Signpost,
  ArrowBendUpRight,
  ArrowBendUpLeft,
  ArrowUp,
  ArrowUUpLeft,
  FlagCheckered,
  Clock,
  Warning,
  ShieldCheck,
  Copy,
  Check,
  MapPin,
  ArrowLeft,
} from '@phosphor-icons/react'
import { detectCategory } from '../utils/productMapHelpers'

interface NavigationRoutePanelProps {
  route: NavigationRoute
  destination: ApiPlace
  routeSigns: RouteSign[]
  vehicleMode: VehicleModeId
  onChangeVehicleMode: (mode: VehicleModeId) => void
  onClearRoute: () => void
  onBackToPlace?: () => void
  onFocusSign?: (sign: RouteSign) => void
  onFocusStep?: (coord: [longitude: number, latitude: number]) => void
  isDark: boolean
}

function getManeuverIcon(type?: string) {
  const t = (type || '').toLowerCase()
  if (t.includes('left'))
    return <ArrowBendUpLeft weight="bold" className="w-3.5 h-3.5 text-[#007b8b] dark:text-[#00c4de]" />
  if (t.includes('right'))
    return <ArrowBendUpRight weight="bold" className="w-3.5 h-3.5 text-[#007b8b] dark:text-[#00c4de]" />
  if (t.includes('u-turn') || t.includes('uturn'))
    return <ArrowUUpLeft weight="bold" className="w-3.5 h-3.5 text-[#007b8b] dark:text-[#00c4de]" />
  if (t.includes('arrive') || t.includes('destination'))
    return <FlagCheckered weight="bold" className="w-3.5 h-3.5 text-emerald-500" />
  return <ArrowUp weight="bold" className="w-3.5 h-3.5 text-[#007b8b] dark:text-[#00c4de]" />
}

export function NavigationRoutePanel({
  route,
  destination,
  routeSigns,
  vehicleMode,
  onChangeVehicleMode,
  onClearRoute,
  onBackToPlace,
  onFocusSign,
  onFocusStep,
  isDark,
}: NavigationRoutePanelProps) {
  const { t } = useTranslation('product')
  const [activeTab, setActiveTab] = useState<'SIGNS' | 'STEPS'>('SIGNS')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL')
  const [copied, setCopied] = useState(false)

  // Calculate ETA based on vehicle mode
  const baseMinutes = Math.round(route.duration / 60)
  const carMinutes = baseMinutes
  const bikeMinutes = Math.max(1, Math.round(baseMinutes * 0.85))
  const displayMinutes = vehicleMode === 'DRIVING' ? carMinutes : bikeMinutes

  const formatDuration = (mins: number) => {
    if (mins < 60) {
      return t('map_page.route_panel.duration_mins', { mins })
    }
    const hours = Math.floor(mins / 60)
    const rem = mins % 60
    if (rem > 0) {
      return t('map_page.route_panel.duration_hours_mins', {
        hours,
        rem,
      })
    }
    return t('map_page.route_panel.duration_hours', { hours })
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`
    return `${(meters / 1000).toFixed(1)} km`
  }

  const handleCopyAddress = async () => {
    try {
      const fullText = [destination.title, destination.address].filter(Boolean).join(' - ')
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const category = detectCategory(destination.title, destination.address, t)

  // Filter signs along route
  const filteredSigns = routeSigns.filter((sign) => {
    if (selectedCategoryFilter === 'ALL') return true
    return sign.category === selectedCategoryFilter
  })

  // Sign stats
  const prohibitoryCount = routeSigns.filter((s) => s.category === 'PROHIBITORY').length
  const warningCount = routeSigns.filter((s) => s.category === 'WARNING').length

  return (
    <motion.aside
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      aria-label={t('map_page.route_panel.aria_label')}
      className={`absolute top-20 left-4 z-[1000] w-[calc(100%-32px)] sm:w-96 max-h-[calc(100%-6rem)] rounded-2xl shadow-2xl border backdrop-blur-md overflow-hidden flex flex-col ${
        isDark
          ? 'bg-[#071317]/95 border-white/10 text-white shadow-black/60'
          : 'bg-white/95 border-[#E8E4E3] text-gray-900 shadow-slate-300/60'
      }`}
    >
      {/* Top Banner Accent (Solid Brand Color) */}
      <div className="h-1.5 w-full bg-[#007b8b] dark:bg-[#00c4de]" />

      {/* Top Bar: Vehicle Selector & Close */}
      <div className="p-3 px-4 border-b border-inherit flex items-center justify-between gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            {t('map_page.route_panel.vehicle')}
          </span>
          <div className="flex rounded-xl p-0.5 bg-gray-200/70 dark:bg-white/10">
            <button
              type="button"
              onClick={() => onChangeVehicleMode('DRIVING')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                vehicleMode === 'DRIVING'
                  ? 'bg-white dark:bg-[#007b8b] text-[#007b8b] dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Car weight="bold" className="w-3.5 h-3.5" />
              <span>{t('map_page.route_panel.car')}</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeVehicleMode('BIKE')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                vehicleMode === 'BIKE'
                  ? 'bg-white dark:bg-[#007b8b] text-[#007b8b] dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Bicycle weight="bold" className="w-3.5 h-3.5" />
              <span>{t('map_page.route_panel.bike')}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onBackToPlace && (
            <button
              type="button"
              onClick={onBackToPlace}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title={t('map_page.route_panel.back_to_place')}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClearRoute}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title={t('map_page.route_panel.clear_route')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Destination Place Info Header (Google Maps Style) */}
      <div className="p-4 pb-3 border-b border-inherit">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wide uppercase ${category.colorClass}`}
            >
              <MapPin weight="bold" className="w-3 h-3" />
              <span>{category.label}</span>
            </div>
            <h2 className="text-base font-extrabold tracking-tight mt-1 truncate">
              {destination.title}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
              {destination.address || t('map_page.place_detail.default_address')}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyAddress}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors shrink-0 cursor-pointer"
            title={
              copied
                ? t('map_page.place_detail.copied_address')
                : t('map_page.place_detail.copy_address')
            }
          >
            {copied ? (
              <Check weight="bold" className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy weight="bold" className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Primary Metrics Strip (Large ETA, Distance, Route badge, Start CTA) */}
      <div className="p-4 py-3 flex items-center justify-between gap-3 border-b border-inherit bg-gray-50/30 dark:bg-white/[0.01]">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-[#007b8b] dark:text-[#00c4de]">
              {formatDuration(displayMinutes)}
            </span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              ({formatDistance(route.distance)})
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
            <Clock className="w-3 h-3" />
            <span>{t('map_page.route_panel.optimal_route')}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#007b8b]/10 dark:bg-[#00c4de]/10 text-[#007b8b] dark:text-[#00c4de] text-xs font-bold shrink-0">
          <span>
            {vehicleMode === 'DRIVING'
              ? t('map_page.route_panel.car_route')
              : t('map_page.route_panel.bike_route')}
          </span>
        </div>
      </div>

      {/* Tabs Header: Biển báo (Count) vs Chi tiết bước rẽ (Count) */}
      <div className="flex border-b border-inherit bg-gray-50/50 dark:bg-white/[0.02]">
        <button
          type="button"
          onClick={() => setActiveTab('SIGNS')}
          className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'SIGNS'
              ? 'border-[#007b8b] dark:border-[#00c4de] text-[#007b8b] dark:text-[#00c4de] bg-white/40 dark:bg-white/5'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Signpost weight="bold" className="w-3.5 h-3.5" />
          <span>
            {t('map_page.route_panel.signs_tab', {
              count: routeSigns.length,
            })}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('STEPS')}
          className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'STEPS'
              ? 'border-[#007b8b] dark:border-[#00c4de] text-[#007b8b] dark:text-[#00c4de] bg-white/40 dark:bg-white/5'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <ArrowBendUpRight weight="bold" className="w-3.5 h-3.5" />
          <span>
            {t('map_page.route_panel.steps_tab', {
              count: route.steps.length,
            })}
          </span>
        </button>
      </div>

      {/* Tab 1 Content: Traffic Signs */}
      {activeTab === 'SIGNS' && (
        <div className="p-3 flex flex-col">
          {/* Quick Sign Summary Pills */}
          {(prohibitoryCount > 0 || warningCount > 0) && (
            <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold">
              {prohibitoryCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                  <Warning weight="bold" className="w-3 h-3" />
                  {t('map_page.route_panel.prohibitory_count', {
                    count: prohibitoryCount,
                  })}
                </span>
              )}
              {warningCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <ShieldCheck weight="bold" className="w-3 h-3" />
                  {t('map_page.route_panel.warning_count', {
                    count: warningCount,
                  })}
                </span>
              )}
            </div>
          )}

          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-none text-[10.5px]">
            {[
              { id: 'ALL', label: t('map_page.groups.ALL') },
              { id: 'WARNING', label: t('map_page.groups.W') },
              { id: 'PROHIBITORY', label: t('map_page.groups.P') },
              { id: 'MANDATORY', label: t('map_page.groups.R') },
              { id: 'INFORMATION', label: t('map_page.groups.I') },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategoryFilter === cat.id
                    ? 'bg-[#007b8b] text-white dark:bg-[#00c4de] dark:text-gray-950 font-bold'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Signs list */}
          <div className="max-h-36 sm:max-h-40 overflow-y-auto space-y-1.5 pr-1 mt-1">
            {filteredSigns.length > 0 ? (
              filteredSigns.map((sign) => (
                <button
                  key={sign.id}
                  type="button"
                  onClick={() => onFocusSign?.(sign)}
                  className={`w-full flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isDark
                      ? 'bg-white/[0.03] border-white/5 hover:border-[#00c4de] hover:bg-white/[0.06]'
                      : 'bg-white border-gray-100 hover:border-[#007b8b] hover:bg-gray-50'
                  }`}
                >
                  <img
                    src={sign.imageUrl}
                    alt={sign.name}
                    className="w-7 h-7 object-contain shrink-0"
                    onError={(e) => {
                      ;(e.target as HTMLElement).style.display = 'none'
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11.5px] font-bold truncate leading-tight">{sign.name}</div>
                    <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400 mt-0.5">
                      {sign.signCode}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-xs text-gray-400 py-3 text-center italic">
                {t('map_page.route_panel.no_signs_in_category')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2 Content: Turn-by-Turn Steps */}
      {activeTab === 'STEPS' && (
        <div className="p-3">
          <div className="max-h-40 sm:max-h-44 overflow-y-auto space-y-1 pr-1">
            {route.steps.map((st, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (st.maneuver?.location) {
                    onFocusStep?.(st.maneuver.location)
                  }
                }}
                className={`w-full text-left flex items-start gap-2.5 p-2 rounded-xl border border-transparent transition-all cursor-pointer ${
                  isDark
                    ? 'hover:bg-white/5 hover:border-white/10 active:bg-white/10'
                    : 'hover:bg-gray-50 hover:border-gray-200 active:bg-gray-100'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center shrink-0 mt-0.5">
                  {getManeuverIcon(st.maneuver?.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11.5px] font-medium text-gray-800 dark:text-gray-200 leading-snug">
                    {st.instruction}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {formatDistance(st.distance)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.aside>
  )
}
