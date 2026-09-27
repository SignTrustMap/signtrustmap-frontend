import { useState } from 'react'
import type { NavigationRoute, RouteSign, VehicleModeId, ApiPlace } from '@shared/types'
import {
  Car,
  Bicycle,
  X,
  CaretDown,
  CaretUp,
  Signpost,
  ArrowBendUpRight,
  ArrowBendUpLeft,
  ArrowUp,
  ArrowUUpLeft,
  FlagCheckered,
  Clock,
  Compass,
  NavigationArrow,
} from '@phosphor-icons/react'

interface NavigationRoutePanelProps {
  route: NavigationRoute
  destination: ApiPlace
  routeSigns: RouteSign[]
  vehicleMode: VehicleModeId
  onChangeVehicleMode: (mode: VehicleModeId) => void
  onClearRoute: () => void
  onFocusSign?: (sign: RouteSign) => void
  isNavigating?: boolean
  onToggleNavigation?: () => void
  isDark: boolean
}

function getManeuverIcon(type?: string) {
  const t = (type || '').toLowerCase()
  if (t.includes('left')) return <ArrowBendUpLeft weight="bold" className="w-3.5 h-3.5 text-[#007b8b] dark:text-[#00c4de]" />
  if (t.includes('right')) return <ArrowBendUpRight weight="bold" className="w-3.5 h-3.5 text-[#007b8b] dark:text-[#00c4de]" />
  if (t.includes('u-turn') || t.includes('uturn')) return <ArrowUUpLeft weight="bold" className="w-3.5 h-3.5 text-[#007b8b] dark:text-[#00c4de]" />
  if (t.includes('arrive') || t.includes('destination')) return <FlagCheckered weight="bold" className="w-3.5 h-3.5 text-emerald-500" />
  return <ArrowUp weight="bold" className="w-3.5 h-3.5 text-[#007b8b] dark:text-[#00c4de]" />
}

export function NavigationRoutePanel({
  route,
  destination,
  routeSigns,
  vehicleMode,
  onChangeVehicleMode,
  onClearRoute,
  onFocusSign,
  isNavigating = false,
  onToggleNavigation,
  isDark,
}: NavigationRoutePanelProps) {
  const [isStepsExpanded, setIsStepsExpanded] = useState(false)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL')

  // Calculate ETA based on vehicle mode
  const baseMinutes = Math.round(route.duration / 60)
  const carMinutes = baseMinutes
  const bikeMinutes = Math.max(1, Math.round(baseMinutes * 0.85))
  const displayMinutes = vehicleMode === 'DRIVING' ? carMinutes : bikeMinutes

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} phút`
    const hours = Math.floor(mins / 60)
    const rem = mins % 60
    return `${hours} giờ ${rem > 0 ? `${rem} phút` : ''}`
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`
    return `${(meters / 1000).toFixed(1)} km`
  }

  // Filter signs along route
  const filteredSigns = routeSigns.filter((sign) => {
    if (selectedCategoryFilter === 'ALL') return true
    return sign.category === selectedCategoryFilter
  })

  return (
    <aside
      aria-label="Thông tin điều hướng lộ trình"
      className={`absolute top-20 left-4 z-[1000] w-[calc(100%-32px)] sm:w-96 max-h-[calc(100%-96px)] rounded-2xl shadow-2xl border backdrop-blur-md overflow-y-auto flex flex-col transition-all animate-in fade-in slide-in-from-top-3 duration-300 ${
        isDark
          ? 'bg-[#071317]/95 border-white/10 text-white shadow-black/60'
          : 'bg-white/95 border-[#E8E4E3] text-gray-900 shadow-slate-300/60'
      }`}
    >
      {/* Header with Destination & Close */}
      <div className="p-4 border-b border-inherit flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#007b8b] dark:text-[#00c4de]">
            <Compass weight="bold" className="w-3.5 h-3.5" />
            <span>Lộ trình đến</span>
          </div>
          <h3 className="text-sm font-bold truncate mt-0.5">{destination.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {destination.address}
          </p>
        </div>
        <button
          type="button"
          onClick={onClearRoute}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          title="Hủy lộ trình"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Metrics (ETA, Distance, Mode Toggle) */}
      <div className="p-4 flex items-center justify-between gap-4 border-b border-inherit">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#007b8b] dark:text-[#00c4de]">
              {formatDuration(displayMinutes)}
            </span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              ({formatDistance(route.distance)})
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
            <Clock className="w-3 h-3" />
            <span>Tuyến đường tối ưu nhất</span>
          </div>
        </div>

        {/* Vehicle Mode Toggle */}
        <div className="flex rounded-xl p-1 bg-gray-100 dark:bg-white/10 shrink-0">
          <button
            type="button"
            onClick={() => onChangeVehicleMode('DRIVING')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              vehicleMode === 'DRIVING'
                ? 'bg-white dark:bg-[#007b8b] text-[#007b8b] dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-300'
            }`}
          >
            <Car weight="bold" className="w-3.5 h-3.5" />
            <span>Ô tô</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeVehicleMode('BIKE')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              vehicleMode === 'BIKE'
                ? 'bg-white dark:bg-[#007b8b] text-[#007b8b] dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-300'
            }`}
          >
            <Bicycle weight="bold" className="w-3.5 h-3.5" />
            <span>Xe máy</span>
          </button>
        </div>
      </div>

      {/* Start Navigation Action Button */}
      <div className="p-3 border-b border-inherit">
        <button
          type="button"
          onClick={onToggleNavigation}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer ${
            isNavigating
              ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/25'
              : 'bg-gradient-to-r from-[#007b8b] to-[#00c4de] hover:from-[#00606d] hover:to-[#00b0c7] text-white shadow-[#007b8b]/20'
          }`}
        >
          <NavigationArrow weight="fill" className={`w-4 h-4 ${isNavigating ? 'animate-pulse' : ''}`} />
          <span>{isNavigating ? 'Đang điều hướng (Nhấn để dừng)' : 'Bắt đầu điều hướng'}</span>
        </button>
      </div>

      {/* Traffic Signs along route */}
      <div className="p-3 border-b border-inherit">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <div className="flex items-center gap-1.5 text-amber-500">
            <Signpost weight="bold" className="w-4 h-4" />
            <span>Biển báo dọc tuyến ({routeSigns.length})</span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-none text-[10.5px]">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'WARNING', label: 'Cảnh báo' },
            { id: 'PROHIBITORY', label: 'Cấm' },
            { id: 'MANDATORY', label: 'Hiệu lệnh' },
            { id: 'INFORMATION', label: 'Chỉ dẫn' },
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

        {/* Signs horizontal list */}
        {filteredSigns.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none">
            {filteredSigns.map((sign) => (
              <button
                key={sign.id}
                type="button"
                onClick={() => onFocusSign?.(sign)}
                className={`flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border shrink-0 max-w-[190px] text-left transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white/5 border-white/10 hover:border-[#00c4de]'
                    : 'bg-white border-[#E8E4E3] hover:border-[#007b8b]'
                }`}
              >
                <img
                  src={sign.imageUrl}
                  alt={sign.name}
                  className="w-7 h-7 object-contain shrink-0"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold truncate">{sign.name}</div>
                  <div className="text-[9.5px] font-mono text-gray-500 dark:text-gray-400">
                    {sign.signCode}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-gray-400 py-1 italic">
            Không có biển báo nào trong phân loại này trên tuyến đường.
          </div>
        )}
      </div>

      {/* Collapsible Turn-by-Turn Steps */}
      <div className="px-4 py-2.5">
        <button
          type="button"
          onClick={() => setIsStepsExpanded(!isStepsExpanded)}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <ArrowBendUpRight weight="bold" className="w-4 h-4 text-[#007b8b] dark:text-[#00c4de]" />
            <span>Chi tiết từng bước chuyển hướng ({route.steps.length})</span>
          </div>
          {isStepsExpanded ? <CaretUp className="w-3.5 h-3.5" /> : <CaretDown className="w-3.5 h-3.5" />}
        </button>

        {isStepsExpanded && (
          <div className="mt-2.5 space-y-2 max-h-48 overflow-y-auto pr-1">
            {route.steps.map((st, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 text-xs py-1.5 border-b border-gray-100 dark:border-white/5 last:border-0"
              >
                <div className="w-6 h-6 rounded-lg bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center shrink-0 mt-0.5">
                  {getManeuverIcon(st.maneuver?.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 dark:text-gray-200">
                    {st.instruction}
                  </div>
                  <div className="text-[10.5px] text-gray-400 font-mono mt-0.5">
                    {formatDistance(st.distance)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
