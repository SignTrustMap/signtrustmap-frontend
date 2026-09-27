import { useTranslation } from 'react-i18next'
import { NavigationArrow, Stack } from '@phosphor-icons/react'

interface ProductMapFloatingControlsProps {
  tileMode: 'osm' | 'esri'
  onToggleTileMode: () => void
  onRecenter: () => void
  getTileModeLabel: (mode: 'osm' | 'esri') => string
  isLoadingGis: boolean
  isDark: boolean
}

export function ProductMapFloatingControls({
  tileMode,
  onToggleTileMode,
  onRecenter,
  getTileModeLabel,
  isLoadingGis,
  isDark,
}: ProductMapFloatingControlsProps) {
  const { t } = useTranslation('product')

  return (
    <>
      {/* Floating Top Controls (Recenter & Tile Mode Switcher) */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={onRecenter}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold backdrop-blur-md shadow-md transition-all cursor-pointer ${
            isDark
              ? 'bg-[#071317]/90 hover:bg-[#0c1e24] text-gray-100 border-white/15'
              : 'bg-white/95 hover:bg-gray-100 text-gray-800 border-gray-200'
          }`}
          title={t('map_page.recenter_map')}
        >
          <NavigationArrow size={14} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />
          <span className="hidden sm:inline">
            {t('map_page.recenter_map')}
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleTileMode}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold backdrop-blur-md shadow-md transition-all cursor-pointer ${
            isDark
              ? 'bg-[#071317]/90 hover:bg-[#0c1e24] text-gray-100 border-white/15'
              : 'bg-white/95 hover:bg-gray-100 text-gray-800 border-gray-200'
          }`}
          title={t('map_page.change_map_style')}
        >
          <Stack size={14} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />
          <span>{getTileModeLabel(tileMode)}</span>
        </button>
      </div>

      {/* Floating Telemetry Badge (Bottom Left) */}
      <div
        className={`absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md shadow-md pointer-events-none ${
          isDark
            ? 'bg-black/80 border-white/15 text-gray-300'
            : 'bg-white/90 border-gray-200 text-gray-800'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isLoadingGis ? 'bg-amber-400 animate-ping' : 'bg-emerald-500 animate-pulse'
          }`}
        />
        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
          {isLoadingGis ? 'GIS Syncing...' : t('map_page.telemetry_live')}
        </span>
        <span className="text-gray-400">•</span>
        <span className="font-mono text-[11px] text-gray-700 dark:text-gray-300">
          {t('map_page.telemetry_standard')}
        </span>
      </div>
    </>
  )
}
