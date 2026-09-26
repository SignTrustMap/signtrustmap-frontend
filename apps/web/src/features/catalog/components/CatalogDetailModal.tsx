import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X,
  BookOpen,
  Sparkle,
  Copy,
  Check,
  Shapes,
  Palette,
  SquaresFour,
  Certificate,
} from '@phosphor-icons/react'
import { useToast } from '@/context/ToastContext'
import { Modal } from '@/components/common/Modal'
import type { TrafficCatalogSign } from '@/data'
import { TrafficSignGraphic } from './TrafficSignGraphic'

export interface CategoryMeta {
  label: string
  badgeClass: string
  dot: string
}

export interface CatalogDetailModalProps {
  /** Selected sign to inspect, or null if modal is closed. */
  sign: TrafficCatalogSign | null
  /** Callback fired to close modal. */
  onClose: () => void
  /** Theme mode indicator for dark/light styling. */
  isDark: boolean
  /** Resolves category visual styling and text. */
  getCategoryMeta: (cat: string) => CategoryMeta
  /** Resolves primary localized title. */
  getSignPrimaryName: (sign: TrafficCatalogSign) => string
  /** Resolves secondary subtitle in alternate language. */
  getSignSecondaryName: (sign: TrafficCatalogSign) => string
  /** Resolves primary localized description. */
  getSignPrimaryDesc: (sign: TrafficCatalogSign) => string
  /** Resolves secondary description. */
  getSignSecondaryDesc: (sign: TrafficCatalogSign) => string
  /** Localizes geometric shape text. */
  getShapeLabel: (shape: string) => string
  /** Renders color swatch dots indicator. */
  renderColorDots: (color: string) => React.ReactNode
}

/**
 * Inspection modal presenting full technical specifications of a traffic sign
 * according to QCVN 41:2019/BGTVT standards and AI CLIP prompt vectors.
 */
export const CatalogDetailModal: React.FC<CatalogDetailModalProps> = ({
  sign,
  onClose,
  isDark,
  getCategoryMeta,
  getSignPrimaryName,
  getSignSecondaryName,
  getSignPrimaryDesc,
  getSignSecondaryDesc,
  getShapeLabel,
  renderColorDots,
}) => {
  const { t } = useTranslation('common')
  const toast = useToast()
  const [copiedPrompt, setCopiedPrompt] = useState(false)

  if (!sign) return null

  const meta = getCategoryMeta(sign.category)

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

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-5 pb-5 border-b border-gray-200 dark:border-white/10">
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl flex items-center justify-center p-2 border shadow-inner ${
              isDark
                ? 'bg-black/40 border-white/10 shadow-black/50'
                : 'bg-gray-50 border-gray-200 shadow-gray-200/50'
            }`}
          >
            <TrafficSignGraphic sign={sign} className="w-full h-full drop-shadow-md" />
          </div>

          <div className="flex-1 pr-6 sm:pr-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`font-mono text-xs sm:text-sm font-extrabold px-2.5 py-1 rounded-md border ${meta.badgeClass}`}>
                {sign.code}
              </span>

              <span className={`text-xs font-bold px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 ${meta.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-snug">
              {getSignPrimaryName(sign)}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mt-0.5">
              {getSignSecondaryName(sign)}
            </p>
          </div>
        </div>

        <div className="space-y-4">
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
              {getSignPrimaryDesc(sign)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-white/10 italic leading-relaxed">
              {getSignSecondaryDesc(sign)}
            </p>
          </div>

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
                onClick={() => handleCopyPrompt(sign.clipPrompt)}
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
              "{sign.clipPrompt}"
            </div>

            <p
              className={`text-[11px] mt-1.5 font-semibold ${
                isDark ? 'text-amber-300/80' : 'text-amber-900'
              }`}
            >
              💡 {t('catalog.clip_hint')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                <Shapes size={14} weight="bold" />
                <span>{t('catalog.geometry')}</span>
              </div>
              <div className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                {getShapeLabel(sign.shape)}
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                <Palette size={14} weight="bold" />
                <span>{t('catalog.colors')}</span>
              </div>
              <div>{renderColorDots(sign.color)}</div>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                <SquaresFour size={14} weight="bold" />
                <span>{t('catalog.category_lbl')}</span>
              </div>
              <div className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                {meta.label}
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                <Certificate size={14} weight="bold" />
                <span>{t('catalog.standard_ref')}</span>
              </div>
              <div
                className="font-mono font-bold text-xs text-gray-900 dark:text-white truncate"
                title={sign.standardRef}
              >
                {sign.standardRef.split(' - ')[0]}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
