import { useTranslation } from 'react-i18next'
import { Crosshair, Minus, NavigationArrow, Plus, Stack } from '@phosphor-icons/react'

interface ProductMapFloatingControlsProps {
  tileMode: 'osm' | 'esri'
  onToggleTileMode: () => void
  onRecenter: () => void
  onCenterOnUser: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  hasUserLocation: boolean
  hasActiveRoute: boolean
  getTileModeLabel: (mode: 'osm' | 'esri') => string
  isLoadingGis?: boolean
  isDark: boolean
}

/**
 * Google Maps-styled floating controls:
 * - Top-Right: Map layer switcher (Esri Streets vs OSM)
 * - Bottom-Right: Floating control stack (My Location GPS button, Recenter Route button, Zoom In & Out card)
 */
export function ProductMapFloatingControls({
  tileMode,
  onToggleTileMode,
  onRecenter,
  onCenterOnUser,
  onZoomIn,
  onZoomOut,
  hasUserLocation,
  hasActiveRoute,
  getTileModeLabel,
  isLoadingGis = false,
  isDark,
}: ProductMapFloatingControlsProps) {
  const { t } = useTranslation('product')

  return (
    <>
      {/* ─── Top-Right: Map Layer Switcher (Pill Style) ──────────────────────── */}
      <div className="absolute top-4 right-4 z-[1000]">
        <button
          type="button"
          onClick={onToggleTileMode}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-bold shadow-md hover:shadow-lg backdrop-blur-md transition-all cursor-pointer active:scale-95 ${
            isDark
              ? 'bg-[#071317]/90 hover:bg-[#0c1e24] text-gray-100 border-white/10'
              : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200'
          }`}
          title={t('map_page.change_map_style')}
        >
          <Stack
            size={16}
            weight="bold"
            className={`text-[#007b8b] dark:text-[#00c4de] transition-transform ${
              isLoadingGis ? 'animate-spin' : ''
            }`}
          />
          <span>{getTileModeLabel(tileMode)}</span>
        </button>
      </div>

      {/* ─── Bottom-Right: Google Maps Control Stack ───────────────────────── */}
      <div className="absolute bottom-6 right-6 z-[1000] flex flex-col items-center gap-3 pointer-events-auto">
        {/* Button 1: My Location (GPS target button with active pulse) */}
        <button
          type="button"
          onClick={onCenterOnUser}
          className={`w-11 h-11 rounded-2xl border flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95 ${
            hasUserLocation
              ? isDark
                ? 'bg-[#071317] border-[#00c4de]/50 text-[#00c4de]'
                : 'bg-white border-teal-400 text-[#007b8b]'
              : isDark
                ? 'bg-[#071317] hover:bg-[#0c1e24] text-gray-300 border-white/10'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
          }`}
          title={t('map_page.my_location')}
        >
          <Crosshair
            size={20}
            weight={hasUserLocation ? 'fill' : 'bold'}
            className={
              hasUserLocation
                ? 'text-[#007b8b] dark:text-[#00c4de] animate-pulse'
                : 'text-gray-600 dark:text-gray-300'
            }
          />
        </button>

        {/* Button 2: Recenter / Fit Active Route (Shown only when route is planned) */}
        {hasActiveRoute && (
          <button
            type="button"
            onClick={onRecenter}
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95 text-[#007b8b] dark:text-[#00c4de] ${
              isDark
                ? 'bg-[#071317] hover:bg-[#0c1e24] border-white/10'
                : 'bg-white hover:bg-gray-50 border-gray-200'
            }`}
            title={t('map_page.recenter_route')}
          >
            <NavigationArrow size={18} weight="bold" />
          </button>
        )}

        {/* Button 3: Zoom In & Zoom Out Stack (Google Maps Style) */}
        <div
          className={`flex flex-col rounded-2xl border shadow-lg overflow-hidden ${
            isDark
              ? 'bg-[#071317] border-white/10 text-gray-100'
              : 'bg-white border-gray-200 text-gray-800'
          }`}
        >
          <button
            type="button"
            onClick={onZoomIn}
            className={`w-11 h-10 flex items-center justify-center transition-colors cursor-pointer active:bg-gray-200 dark:active:bg-white/20 ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
            title={t('map_page.floating_controls.zoom_in')}
          >
            <Plus size={18} weight="bold" />
          </button>

          <div
            className={`w-full h-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}
          />

          <button
            type="button"
            onClick={onZoomOut}
            className={`w-11 h-10 flex items-center justify-center transition-colors cursor-pointer active:bg-gray-200 dark:active:bg-white/20 ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
            title={t('map_page.floating_controls.zoom_out')}
          >
            <Minus size={18} weight="bold" />
          </button>
        </div>
      </div>
    </>
  )
}
