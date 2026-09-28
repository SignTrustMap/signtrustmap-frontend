import { useTranslation } from 'react-i18next'
import {
  CheckCircle,
  X,
  MapPin,
  Check,
  Copy,
  Flag,
} from '@phosphor-icons/react'
import type { SignItem } from '@/data'
import type { CategoryMeta } from './ProductMapSidebar'

interface SignInspectorCardProps {
  selectedSign: SignItem
  categoryMeta: CategoryMeta
  onClose: () => void
  onOpenReport: () => void
  onCopyCoords: (lat: number, lng: number) => void
  copiedCoords: boolean
  isDark: boolean
  isDriver: boolean
}

export function SignInspectorCard({
  selectedSign,
  categoryMeta,
  onClose,
  onOpenReport,
  onCopyCoords,
  copiedCoords,
  isDark,
  isDriver,
}: SignInspectorCardProps) {
  const { t } = useTranslation('product')

  return (
    <div
      className={`absolute bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-20 rounded-2xl border p-4 sm:p-5 backdrop-blur-md shadow-2xl transition-all animate-scaleIn text-left ${
        isDark
          ? 'bg-[#081317]/95 border-white/20 text-white'
          : 'bg-white/95 border-gray-300 text-gray-900'
      }`}
    >
      {/* Header row with Close button */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-mono font-extrabold text-xs px-2.5 py-1 rounded-md border ${categoryMeta.badgeClass}`}
          >
            {selectedSign.code}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
            <CheckCircle size={13} weight="bold" />
            {selectedSign.trustScore}% {t('mini_map.popup_trust')}
          </span>
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
            {categoryMeta.name}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer transition-colors"
          title={t('map_page.close_details')}
        >
          <X size={16} weight="bold" />
        </button>
      </div>

      {/* Sign Name */}
      <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white leading-snug">
        {selectedSign.name}
      </h2>

      {/* Location with Pin */}
      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mt-1.5">
        <MapPin size={15} className="shrink-0 text-[#007b8b] dark:text-[#00c4de]" />
        <span>{selectedSign.location}</span>
      </p>

      {/* Description Box */}
      {selectedSign.description && (
        <div
          className={`mt-3 p-2.5 rounded-xl border text-xs leading-relaxed ${
            isDark
              ? 'bg-black/40 border-white/10 text-gray-300'
              : 'bg-gray-50 border-gray-200 text-gray-700'
          }`}
        >
          {selectedSign.description}
        </div>
      )}

      {/* Telemetry Details Grid */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-white/10 text-xs">
        <div
          className={`p-2 rounded-xl border ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
            {t('map_page.heading_bearing')}
          </span>
          <span className="font-mono font-bold text-gray-900 dark:text-white text-xs mt-0.5 block">
            {selectedSign.heading}° ({t('map_page.compass_bearing')})
          </span>
        </div>

        <div
          className={`p-2 rounded-xl border ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
            {t('map_page.verified_at')}
          </span>
          <span className="font-mono font-bold text-gray-900 dark:text-white text-xs mt-0.5 block">
            {selectedSign.verifiedAt}
          </span>
        </div>
      </div>

      {/* GPS Coordinates with Quick Copy */}
      <div className="mt-2.5 flex items-center justify-between gap-2 pt-1">
        <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
          GPS: {selectedSign.lat.toFixed(5)}, {selectedSign.lng.toFixed(5)}
        </span>
        <button
          type="button"
          onClick={() => onCopyCoords(selectedSign.lat, selectedSign.lng)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
            isDark
              ? 'bg-white/10 hover:bg-white/20 text-gray-200 border-white/15'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200'
          }`}
          title={t('map_page.copy_coords')}
        >
          {copiedCoords ? (
            <>
              <Check size={13} className="text-emerald-500 font-bold" />
              <span className="text-emerald-600 dark:text-emerald-400">
                {t('map_page.copied')}
              </span>
            </>
          ) : (
            <>
              <Copy size={13} className="text-gray-500 dark:text-gray-400" />
              <span>{t('map_page.copy_coords')}</span>
            </>
          )}
        </button>
      </div>

      {/* Driver-exclusive Report Sign Issue Button */}
      {isDriver && (
        <button
          type="button"
          onClick={onOpenReport}
          className="w-full mt-3 py-2 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Flag size={14} weight="bold" />
          <span>{t('map_page.btn_report_issue')}</span>
        </button>
      )}
    </div>
  )
}
