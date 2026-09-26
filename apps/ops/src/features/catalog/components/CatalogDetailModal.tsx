import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X,
  BookOpen,
  Sparkle,
  Copy,
  Check,
  Compass,
  Shapes,
  Palette,
  SquaresFour,
} from '@phosphor-icons/react'
import { useToast } from '@/context/ToastContext'
import { ModalPortal } from '@/components/common/ModalPortal'
import type { CatalogEntry } from '@/data/catalogData'
import { TrafficSignGraphic } from './TrafficSignGraphic'

export interface CategoryMeta {
  label: string
  badgeClass: string
  dot: string
}

export interface CatalogDetailModalProps {
  /** The selected traffic sign catalog record to inspect, or null when modal is closed. */
  sign: CatalogEntry | null
  /** Callback fired when user closes modal via Escape key, close button, or backdrop click. */
  onClose: () => void
  /** Toggles sign status between Active and Deprecated. */
  onToggleStatus: (signId: string) => void
  /** Returns category visual metadata (badge style, label, dot indicator). */
  getCategoryMeta: (cat: string) => CategoryMeta
  /** Resolves primary localized sign name based on current language. */
  getSignPrimaryName: (sign: CatalogEntry) => string
  /** Resolves secondary/subtitle sign name in alternate language. */
  getSignSecondaryName: (sign: CatalogEntry) => string
  /** Resolves primary localized sign description. */
  getSignPrimaryDesc: (sign: CatalogEntry) => string
  /** Resolves secondary sign description. */
  getSignSecondaryDesc: (sign: CatalogEntry) => string
  /** Localizes geometric shape name. */
  getShapeLabel: (shape: string) => string
  /** Renders visual color pill indicator for technical specs grid. */
  renderColorPill: (color: string) => React.ReactNode
}

/**
 * Inspection modal presenting full technical specifications of a traffic sign
 * according to QCVN 41:2019/BGTVT standards, AI CLIP prompt vectors, and OSM mapping rules.
 */
export const CatalogDetailModal: React.FC<CatalogDetailModalProps> = ({
  sign,
  onClose,
  onToggleStatus,
  getCategoryMeta,
  getSignPrimaryName,
  getSignSecondaryName,
  getSignPrimaryDesc,
  getSignSecondaryDesc,
  getShapeLabel,
  renderColorPill,
}) => {
  const { t } = useTranslation('ops')
  const toast = useToast()
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedOsm, setCopiedOsm] = useState(false)

  if (!sign) return null

  const catMeta = getCategoryMeta(sign.category)

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedPrompt(true)
    toast.success(t('catalog.copied'))
    setTimeout(() => setCopiedPrompt(false), 2000)
  }

  const handleCopyOsm = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedOsm(true)
    toast.success(t('catalog.toast_copied_osm'))
    setTimeout(() => setCopiedOsm(false), 2000)
  }

  return (
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl relative my-8 animate-in zoom-in-95 duration-200"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-300 transition-colors cursor-pointer"
            title={t('catalog.btn_close_esc')}
          >
            <X size={18} weight="bold" />
          </button>

          {/* Modal Header: Sign Plate + Titles + Categories */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-5 border-b border-gray-200 dark:border-white/10 pr-8 sm:pr-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl p-2 border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] flex items-center justify-center shadow-xs">
              <TrafficSignGraphic sign={sign} className="w-full h-full drop-shadow-md" />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`font-mono text-xs sm:text-sm font-extrabold px-2.5 py-1 rounded-md border ${catMeta.badgeClass}`}>
                  {sign.code}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 ${catMeta.badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${catMeta.dot}`} />
                  {catMeta.label}
                </span>
                <span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200 dark:border-white/10">
                  {sign.standardRef || 'QCVN 41:2019/BGTVT'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-snug">
                {getSignPrimaryName(sign)}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                {getSignSecondaryName(sign)}
              </p>
            </div>
          </div>

          {/* Modal Body */}
          <div className="space-y-4 text-xs">
            {/* Description & Meaning */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                <BookOpen size={16} className="text-[#007b8b] dark:text-[#00c4de]" weight="bold" />
                <span>{t('catalog.desc_and_meaning')}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 leading-relaxed font-medium">
                {getSignPrimaryDesc(sign)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-white/10 italic leading-relaxed">
                {getSignSecondaryDesc(sign)}
              </p>
            </div>

            {/* AI CLIP Visual Prompt Vector */}
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-mono font-extrabold uppercase tracking-wider">
                  <Sparkle size={16} className="text-amber-600 dark:text-amber-400" weight="fill" />
                  <span>{t('catalog.clip_vector')}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyPrompt(sign.aiPrompt || sign.clipPrompt || '')}
                  className="px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-amber-300 dark:border-amber-500/40 bg-white dark:bg-amber-500/20 text-amber-950 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-500/30 transition-all cursor-pointer shadow-xs"
                >
                  {copiedPrompt ? (
                    <>
                      <Check size={14} className="text-emerald-500" weight="bold" />
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">{t('catalog.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} weight="bold" />
                      <span>{t('catalog.copy_prompt')}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-500/20 bg-white dark:bg-black/40 text-amber-950 dark:text-amber-200 font-mono text-xs leading-relaxed select-all break-words shadow-xs">
                "{sign.aiPrompt || sign.clipPrompt}"
              </div>

              <p className="text-[11px] text-amber-900 dark:text-amber-300/80 font-medium">
                💡 {t('catalog.clip_hint')}
              </p>
            </div>

            {/* OSM Mapping Rule */}
            <div className="p-4 rounded-xl border border-cyan-200 dark:border-cyan-500/30 bg-cyan-50/60 dark:bg-cyan-500/10 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-cyan-900 dark:text-cyan-300 font-mono font-extrabold uppercase tracking-wider">
                  <Compass size={16} className="text-[#007b8b] dark:text-[#00c4de]" weight="bold" />
                  <span>{t('catalog.osm_title')}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyOsm(sign.osmMapping || '')}
                  className="px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-cyan-300 dark:border-cyan-500/40 bg-white dark:bg-cyan-500/20 text-cyan-950 dark:text-cyan-200 hover:bg-cyan-100 dark:hover:bg-cyan-500/30 transition-all cursor-pointer shadow-xs"
                >
                  {copiedOsm ? (
                    <>
                      <Check size={14} className="text-emerald-500" weight="bold" />
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">{t('catalog.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} weight="bold" />
                      <span>{t('catalog.copy_osm')}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-2.5 rounded-lg border border-cyan-200 dark:border-cyan-500/20 bg-white dark:bg-black/40 text-cyan-950 dark:text-cyan-200 font-mono text-xs leading-relaxed select-all break-words shadow-xs">
                {sign.osmMapping}
              </div>
            </div>

            {/* 4 Technical Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                  <Shapes size={14} weight="bold" />
                  <span>{t('catalog.geometry')}</span>
                </div>
                <div className="font-extrabold text-xs text-gray-900 dark:text-white truncate">
                  {getShapeLabel(sign.shape)}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                  <Palette size={14} weight="bold" />
                  <span>{t('catalog.colors')}</span>
                </div>
                <div className="flex items-center gap-1.5 font-extrabold text-xs text-gray-900 dark:text-white mt-0.5">
                  {renderColorPill(sign.color)}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                  <SquaresFour size={14} weight="bold" />
                  <span>{t('catalog.category_lbl')}</span>
                </div>
                <div className="font-extrabold text-xs text-gray-900 dark:text-white truncate">
                  {catMeta.label}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">
                  <span className="text-xs font-mono font-bold text-[#007b8b] dark:text-[#00c4de]">v</span>
                  <span>{t('catalog.version_lbl')}</span>
                </div>
                <div className="font-extrabold text-xs font-mono text-gray-900 dark:text-white truncate">
                  {sign.version || 'v2.5'}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => onToggleStatus(sign.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                sign.status === 'Active'
                  ? 'border-amber-300 text-amber-800 dark:border-amber-500/30 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                  : 'border-emerald-300 text-emerald-800 dark:border-emerald-500/30 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
              }`}
            >
              <span>{t('catalog.btn_toggle_status')}</span>
              <span className="font-mono">({sign.status})</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#007b8b] hover:bg-[#00606d] text-white shadow-xs transition-colors cursor-pointer"
            >
              {t('users.btn_close')}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
