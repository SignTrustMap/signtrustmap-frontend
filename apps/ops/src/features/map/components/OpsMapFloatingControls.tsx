import { useTranslation } from 'react-i18next'
import { CornersOut, Funnel, Minus, Plus, Stack } from '@phosphor-icons/react'

interface OpsMapFloatingControlsProps {
  tileMode: 'osm' | 'voyager'
  onToggleTileMode: () => void
  onFitBounds: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  isThinningEnabled: boolean
  onToggleThinning: () => void
  currentZoom?: number
  className?: string
}

/**
 * Modern floating controls stack for Ops GIS Map:
 * - Fit Bounds (overview all visible signs)
 * - Map Layer Switcher (Esri Streets vs OSM)
 * - Smart Thinning Toggle
 * - Zoom In & Zoom Out pill stack
 */
export function OpsMapFloatingControls({
  tileMode,
  onToggleTileMode,
  onFitBounds,
  onZoomIn,
  onZoomOut,
  isThinningEnabled,
  onToggleThinning,
  className = '',
}: OpsMapFloatingControlsProps) {
  const { t } = useTranslation('ops')

  return (
    <div className={`absolute z-20 flex flex-col items-center gap-2.5 pointer-events-auto select-none ${className || 'bottom-6 right-6'}`}>
      {/* Button 1: Smart Thinning Toggle */}
      <button
        type="button"
        onClick={onToggleThinning}
        className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95 ${
          isThinningEnabled
            ? 'bg-[#007b8b]/15 dark:bg-[#00c4de]/20 border-[#007b8b]/50 dark:border-[#00c4de]/50 text-[#007b8b] dark:text-[#00c4de]'
            : 'bg-white/95 dark:bg-[#071317]/95 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200/80 dark:border-white/10'
        }`}
        title={isThinningEnabled ? t('map.btn_thinning_on') : t('map.btn_thinning_off')}
      >
        <Funnel size={18} weight={isThinningEnabled ? 'fill' : 'bold'} />
      </button>

      {/* Button 2: Fit Bounds to all signs */}
      <button
        type="button"
        onClick={onFitBounds}
        className="w-10 h-10 rounded-xl border bg-white/95 dark:bg-[#071317]/95 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200/80 dark:border-white/10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95"
        title={t('map.btn_fit_bounds')}
      >
        <CornersOut size={18} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />
      </button>

      {/* Button 3: Tile Layer Switcher */}
      <button
        type="button"
        onClick={onToggleTileMode}
        className="w-10 h-10 rounded-xl border bg-white/95 dark:bg-[#071317]/95 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200/80 dark:border-white/10 flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95"
        title={`${t('map.tile_switch_title')} (${tileMode === 'voyager' ? t('map.tile_voyager') : t('map.tile_osm')})`}
      >
        <Stack size={18} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />
      </button>

      {/* Button 4: Zoom In & Zoom Out Stack */}
      <div className="flex flex-col rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/95 dark:bg-[#071317]/95 shadow-lg overflow-hidden backdrop-blur-md">
        <button
          type="button"
          onClick={onZoomIn}
          className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer active:scale-95"
          title="Zoom In"
        >
          <Plus size={16} weight="bold" />
        </button>
        <div className="w-full h-px bg-gray-200 dark:bg-white/10" />
        <button
          type="button"
          onClick={onZoomOut}
          className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer active:scale-95"
          title="Zoom Out"
        >
          <Minus size={16} weight="bold" />
        </button>
      </div>
    </div>
  )
}
