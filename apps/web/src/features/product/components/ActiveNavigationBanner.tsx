import { useState, useEffect } from 'react'
import type { NavigationRoute, RouteSign } from '@shared/types'
import {
  ArrowBendUpRight,
  ArrowBendUpLeft,
  ArrowUp,
  ArrowUUpLeft,
  FlagCheckered,
  CaretRight,
  CaretLeft,
  WarningCircle,
  Stop,
} from '@phosphor-icons/react'

interface ActiveNavigationBannerProps {
  route: NavigationRoute
  routeSigns: RouteSign[]
  onStopNavigation: () => void
  onFocusStepLocation?: (coord: [longitude: number, latitude: number]) => void
  isDark: boolean
}

function getManeuverIcon(type?: string) {
  const t = (type || '').toLowerCase()
  if (t.includes('left')) return <ArrowBendUpLeft weight="bold" className="w-6 h-6 text-white" />
  if (t.includes('right')) return <ArrowBendUpRight weight="bold" className="w-6 h-6 text-white" />
  if (t.includes('u-turn') || t.includes('uturn')) return <ArrowUUpLeft weight="bold" className="w-6 h-6 text-white" />
  if (t.includes('arrive') || t.includes('destination')) return <FlagCheckered weight="bold" className="w-6 h-6 text-white" />
  return <ArrowUp weight="bold" className="w-6 h-6 text-white" />
}

export function ActiveNavigationBanner({
  route,
  routeSigns,
  onStopNavigation,
  onFocusStepLocation,
  isDark,
}: ActiveNavigationBannerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const steps = route.steps
  const currentStep = steps[currentStepIndex] || steps[0]
  const isLastStep = currentStepIndex === steps.length - 1

  // Determine approaching sign for the current step (if any)
  const approachingSign = routeSigns[currentStepIndex % Math.max(1, routeSigns.length)]

  // When step changes, pan map to maneuver coordinate if available
  useEffect(() => {
    if (currentStep?.maneuver?.location) {
      onFocusStepLocation?.(currentStep.maneuver.location)
    }
  }, [currentStep, onFocusStepLocation])

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`
    return `${(meters / 1000).toFixed(1)} km`
  }

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1100] w-full max-w-xl px-4 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`rounded-2xl shadow-2xl border backdrop-blur-md overflow-hidden ${
          isDark
            ? 'bg-[#071317]/95 border-white/15 text-white shadow-black/70'
            : 'bg-white/95 border-[#E8E4E3] text-gray-900 shadow-slate-300/70'
        }`}
      >
        {/* Main Maneuver Bar */}
        <div className="p-3.5 flex items-center gap-3.5">
          {/* Big Maneuver Icon Box */}
          <div className="w-12 h-12 rounded-xl bg-[#0671eb] text-white flex items-center justify-center shrink-0 shadow-md">
            {getManeuverIcon(currentStep?.maneuver?.type)}
          </div>

          {/* Maneuver Description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#0671eb]">
                {formatDistance(currentStep?.distance || 0)} nữa
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                (Bước {currentStepIndex + 1}/{steps.length})
              </span>
            </div>
            <div className="text-sm font-bold truncate mt-0.5">
              {currentStep?.instruction || 'Tiếp tục di chuyển'}
            </div>
            {currentStep?.name && (
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
                Vào: {currentStep.name}
              </div>
            )}
          </div>

          {/* Stepper Controls & Stop */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              disabled={currentStepIndex === 0}
              onClick={handlePrevStep}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:pointer-events-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Bước trước"
            >
              <CaretLeft weight="bold" className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={isLastStep}
              onClick={handleNextStep}
              className="p-2 rounded-xl text-[#0671eb] hover:bg-[#0671eb]/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Bước tiếp theo"
            >
              <CaretRight weight="bold" className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onStopNavigation}
              className="ml-1 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Kết thúc điều hướng"
            >
              <Stop weight="fill" className="w-3 h-3" />
              <span>Dừng</span>
            </button>
          </div>
        </div>

        {/* Approaching Sign Proximity Warning Alert */}
        {approachingSign && (
          <div className="px-3.5 py-2 bg-amber-500/10 dark:bg-amber-500/15 border-t border-amber-500/20 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <WarningCircle weight="fill" className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-semibold text-amber-700 dark:text-amber-300 truncate">
                Biển báo trên tuyến: {approachingSign.name}
              </span>
              <span className="font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold shrink-0">
                {approachingSign.signCode}
              </span>
            </div>
            {approachingSign.imageUrl && (
              <img
                src={approachingSign.imageUrl}
                alt={approachingSign.name}
                className="w-5 h-5 object-contain shrink-0"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
