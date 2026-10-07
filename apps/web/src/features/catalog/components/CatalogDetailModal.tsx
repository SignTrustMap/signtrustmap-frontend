import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X,
  BookOpen,
  Sparkle,
  Copy,
  Check,
  SquaresFour,
  Car,
  Motorcycle,
  Truck,
  Bus,
  Bicycle,
  PersonSimpleWalk,
  ShieldCheck,
  Tag,
  FileText,
  Shapes,
  Palette,
} from '@phosphor-icons/react'
import { useToast } from '@/context/ToastContext'
import { Modal } from '@/components/common/Modal'
import type { BackendCatalogSignType } from '@/api/services/catalog.service'
import { TrafficSignGraphic } from './TrafficSignGraphic'

export interface CategoryMeta {
  label: string
  badgeClass: string
  dot: string
}

export interface CatalogDetailModalProps {
  /** Selected sign to inspect, or null if modal is closed. */
  sign: BackendCatalogSignType | null
  /** Callback fired to close modal. */
  onClose: () => void
  /** Theme mode indicator for dark/light styling. */
  isDark: boolean
  /** Resolves category visual styling and text. */
  getCategoryMeta: (catCode?: string) => CategoryMeta
}

/**
 * Inspection modal displaying only real fields returned from the Catalog API.
 * No fabricated shapes, color swatches, or synthetic translations.
 */
export const CatalogDetailModal: React.FC<CatalogDetailModalProps> = ({
  sign,
  onClose,
  isDark,
  getCategoryMeta,
}) => {
  const { t, i18n } = useTranslation('common')
  const toast = useToast()
  const [copiedPrompt, setCopiedPrompt] = useState(false)

  if (!sign) return null

  const isEnglish = i18n.language.startsWith('en')
  const primaryName = isEnglish ? sign.nameEn : sign.nameVi
  const secondaryName = isEnglish ? sign.nameVi : sign.nameEn
  const meta = getCategoryMeta(sign.category?.code)

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedPrompt(true)
    toast.success(t('catalog.copied'))
    setTimeout(() => setCopiedPrompt(false), 2000)
  }

  return (
    <Modal isOpen={!!sign} onClose={onClose} maxWidth="max-w-2xl">
      <div
        className={`w-full rounded-2xl border p-6 sm:p-7 relative overflow-hidden transition-all text-left ${
          isDark
            ? 'bg-[#071317] border-white/15 text-white shadow-2xl shadow-black/80'
            : 'bg-white border-[#E8E4E3] text-gray-900 shadow-xl'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('catalog.btn_close')}
          className={`absolute top-4 right-4 p-2 rounded-xl transition-all cursor-pointer z-10 ${
            isDark
              ? 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'
          }`}
        >
          <X size={18} weight="bold" />
        </button>

        {/* Header: Image & Names */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-5 pb-5 border-b border-gray-200 dark:border-white/10">
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl flex items-center justify-center p-2 border shadow-inner ${
              isDark
                ? 'bg-black/40 border-white/10 shadow-black/50'
                : 'bg-gray-50 border-gray-200 shadow-gray-200/50'
            }`}
          >
            <TrafficSignGraphic
              sign={{
                code: sign.signCode,
                imageUrl: sign.representativeImageKey || undefined,
                nameVi: sign.nameVi,
                name: sign.nameEn,
              }}
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>

          <div className="flex-1 pr-6 sm:pr-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`font-mono text-xs sm:text-sm font-extrabold px-2.5 py-1 rounded-md border ${meta.badgeClass}`}>
                {sign.signCode}
              </span>

              {sign.category && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 ${meta.badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  {isEnglish ? sign.category.nameEn : sign.category.nameVi}
                </span>
              )}

              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded border font-mono ${
                  sign.isActive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30'
                }`}
              >
                {sign.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-snug">
              {primaryName}
            </h2>
            {secondaryName && (
              <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mt-0.5">
                {secondaryName}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Real API Description */}
          {sign.description && (
            <div
              className={`p-4 rounded-xl border transition-colors ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                <BookOpen size={16} className={isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'} weight="bold" />
                <span>{t('catalog.desc_and_meaning')}</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-gray-900 dark:text-gray-100 font-medium">
                {sign.description}
              </p>
            </div>
          )}

          {/* Real AI CLIP Prompt */}
          {sign.aiLabelPrompt && (
            <div
              className={`p-4 rounded-xl border ${
                isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50/90 border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Sparkle size={16} className="text-amber-600 dark:text-amber-400" weight="fill" />
                  <span
                    className={`text-xs font-mono font-extrabold uppercase tracking-wider ${
                      isDark ? 'text-amber-300' : 'text-amber-950'
                    }`}
                  >
                    {t('catalog.clip_vector')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyPrompt(sign.aiLabelPrompt || '')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isDark
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                      : 'bg-white hover:bg-amber-100 text-amber-950 border-amber-300 shadow-xs'
                  }`}
                >
                  {copiedPrompt ? (
                    <>
                      <Check size={14} className="text-emerald-500" weight="bold" />
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        {t('catalog.copied')}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} weight="bold" />
                      <span>{t('catalog.copy_prompt')}</span>
                    </>
                  )}
                </button>
              </div>

              <div
                className={`p-2.5 rounded-lg border font-mono text-xs leading-relaxed select-all break-words ${
                  isDark
                    ? 'bg-black/40 border-amber-500/20 text-amber-200'
                    : 'bg-white border-amber-200 text-amber-950 shadow-xs'
                }`}
              >
                "{sign.aiLabelPrompt}"
              </div>
            </div>
          )}

          {/* Real Applicable Vehicles */}
          {sign.allowedVehicles && sign.allowedVehicles.length > 0 && (
            <div
              className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                <ShieldCheck size={16} className={isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'} weight="bold" />
                <span>{t('catalog.allowed_vehicles')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sign.allowedVehicles.map((vehicle) => {
                  const vUpper = vehicle.toUpperCase()
                  let icon = <Car size={14} weight="bold" />
                  let label = vehicle
                  if (vUpper === 'CAR') {
                    icon = <Car size={14} weight="bold" />
                    label = t('catalog.vehicles.car')
                  } else if (vUpper === 'MOTORCYCLE') {
                    icon = <Motorcycle size={14} weight="bold" />
                    label = t('catalog.vehicles.motorcycle')
                  } else if (vUpper === 'TRUCK') {
                    icon = <Truck size={14} weight="bold" />
                    label = t('catalog.vehicles.truck')
                  } else if (vUpper === 'BUS') {
                    icon = <Bus size={14} weight="bold" />
                    label = t('catalog.vehicles.bus')
                  } else if (vUpper === 'BICYCLE') {
                    icon = <Bicycle size={14} weight="bold" />
                    label = t('catalog.vehicles.bicycle')
                  } else if (vUpper === 'PEDESTRIAN') {
                    icon = <PersonSimpleWalk size={14} weight="bold" />
                    label = t('catalog.vehicles.pedestrian')
                  }

                  return (
                    <span
                      key={vehicle}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        isDark
                          ? 'bg-[#00c4de]/10 text-[#00c4de] border-[#00c4de]/30'
                          : 'bg-[#007b8b]/10 text-[#007b8b] border-[#007b8b]/25'
                      }`}
                    >
                      {icon}
                      <span>{label}</span>
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Labeling Guidelines (rendered only if present in API response) */}
          {sign.labelingGuidelines && (
            <div
              className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-sky-500/10 border-sky-500/30' : 'bg-sky-50 border-sky-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-300 mb-1">
                <FileText size={16} weight="bold" />
                <span>Hướng dẫn gán nhãn</span>
              </div>
              <p className="text-xs text-sky-950 dark:text-sky-100 leading-relaxed font-medium">
                {sign.labelingGuidelines}
              </p>
            </div>
          )}

          {/* Real Metadata Grid (Category info, OSM Mapping, Shape, Color if provided by API) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {sign.category && (
              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                  <SquaresFour size={14} weight="bold" />
                  <span>{t('catalog.category_lbl')}</span>
                </div>
                <div className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">
                  {isEnglish ? sign.category.nameEn : sign.category.nameVi} ({sign.category.code})
                </div>
                {sign.category.description && (
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                    {sign.category.description}
                  </p>
                )}
              </div>
            )}

            {/* OSM Mapping Tag (rendered only if present in API response) */}
            {sign.osmMapping && (
              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                  <Tag size={14} weight="bold" />
                  <span>OpenStreetMap Tag</span>
                </div>
                <div className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 truncate">
                  {sign.osmMapping}
                </div>
              </div>
            )}

            {/* Shape (rendered only if present in API response) */}
            {sign.shape && (
              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                  <Shapes size={14} weight="bold" />
                  <span>{t('catalog.geometry')}</span>
                </div>
                <div className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">
                  {sign.shape}
                </div>
              </div>
            )}

            {/* Color Scheme (rendered only if present in API response) */}
            {sign.colorScheme && (
              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                  <Palette size={14} weight="bold" />
                  <span>{t('catalog.colors')}</span>
                </div>
                <div className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">
                  {sign.colorScheme}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
