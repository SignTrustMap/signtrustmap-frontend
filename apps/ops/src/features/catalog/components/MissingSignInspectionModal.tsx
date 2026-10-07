import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import { ModalPortal } from '@/components/common/ModalPortal'
import {
  Sparkle,
  X,
  Copy,
  MapPin,
  ArrowsMerge,
  RocketLaunch,
  Prohibit,
} from '@phosphor-icons/react'
import { mockCatalogData } from '@/data/catalogData'
import { TrafficSignGraphic } from '@/features/catalog/components/TrafficSignGraphic'
import { CategoryBadge, StatusBadge } from './MissingSignsBadges'
import type { MissingSignTypeReport } from '@/data'

interface MissingSignInspectionModalProps {
  report: MissingSignTypeReport
  onClose: () => void
  onOpenMerge: () => void
  onOpenEscalate: () => void
  onOpenReject: () => void
}

export function MissingSignInspectionModal({
  report,
  onClose,
  onOpenMerge,
  onOpenEscalate,
  onOpenReject,
}: MissingSignInspectionModalProps) {
  const { t } = useTranslation('ops')
  const { success } = useToast()

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#007b8b]/10 dark:bg-[#00c4de]/20 flex items-center justify-center text-[#007b8b] dark:text-[#00c4de] shrink-0">
                <Sparkle size={22} weight="bold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10">
                    {report.id}
                  </span>
                  <StatusBadge status={report.status} />
                  <CategoryBadge category={report.category} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {t('missing_signs.modal_details_title')}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Evidence Photo & AI Suggestions */}
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                    {t('missing_signs.lbl_evidence_photo')}
                  </span>
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/40 group">
                    <img
                      src={report.sampleImageUrl}
                      alt={report.tempLabel}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono">
                      {report.id}
                    </div>
                  </div>
                </div>

                {/* AI CLIP Suggestion */}
                {report.clipPrompt && (
                  <div className="p-3.5 rounded-xl border border-[#007b8b]/25 dark:border-[#00c4de]/30 bg-[#007b8b]/5 dark:bg-[#00c4de]/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-[#007b8b] dark:text-[#00c4de] uppercase tracking-wider">
                        {t('missing_signs.lbl_ai_suggestion')}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(report.clipPrompt || '')
                          success(t('catalog.copied'))
                        }}
                        className="inline-flex items-center gap-1 text-[10px] text-[#007b8b] dark:text-[#00c4de] hover:underline cursor-pointer"
                      >
                        <Copy size={12} />
                        <span>{t('catalog.copy_prompt')}</span>
                      </button>
                    </div>
                    <p className="font-mono text-[11px] text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-black/30 p-2 rounded-lg border border-gray-200 dark:border-white/10 break-words">
                      {report.clipPrompt}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Information & Comparison */}
              <div className="space-y-4">
                {/* Proposed Label */}
                <div className="p-3.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                    {t('missing_signs.lbl_proposed_label')}
                  </span>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                    {report.tempLabel}
                  </h4>
                </div>

                {/* Location & GPS */}
                <div className="p-3.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                    {t('missing_signs.lbl_road_location')}
                  </span>
                  <div className="flex items-start gap-2 text-gray-900 dark:text-white font-medium text-xs">
                    <MapPin size={15} className="text-[#007b8b] dark:text-[#00c4de] shrink-0 mt-0.5" />
                    <span>{report.roadAddress || `${report.lat}° N, ${report.lng}° E`}</span>
                  </div>
                  <div className="text-[11px] font-mono text-gray-500 pl-6">
                    WGS84: {report.lat.toFixed(5)}, {report.lng.toFixed(5)}
                  </div>
                </div>

                {/* Reporter Note */}
                <div>
                  <span className="text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                    {t('missing_signs.lbl_reporter_notes')}
                  </span>
                  <div className="p-3 rounded-xl border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 text-gray-800 dark:text-gray-200 leading-relaxed italic text-xs">
                    &ldquo;{report.reporterNote}&rdquo;
                  </div>
                </div>

                {/* Closest Catalog Matches */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                    {t('missing_signs.lbl_closest_catalog')}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {report.similarCatalogEntries.map((code) => {
                      const catalogEntry = mockCatalogData.find(
                        (c) => c.code.toLowerCase() === code.toLowerCase()
                      )
                      return (
                        <div
                          key={code}
                          className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center gap-2"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 p-0.5 flex items-center justify-center shrink-0">
                            {catalogEntry ? (
                              <TrafficSignGraphic sign={catalogEntry} className="w-full h-full object-contain" />
                            ) : (
                              <span className="font-mono text-[10px] font-bold">{code}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-mono font-bold text-[#007b8b] dark:text-[#00c4de] text-[11px] block">
                              {code}
                            </span>
                            <span className="text-[11px] text-gray-700 dark:text-gray-300 truncate block">
                              {catalogEntry?.nameVi || code}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Submission metadata */}
                <div className="flex items-center justify-between text-xs text-gray-400 font-mono pt-2 border-t border-gray-100 dark:border-white/10">
                  <span>{t('missing_signs.lbl_reported_by')} {report.reportedBy}</span>
                  <span>{report.reportedAt}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Quick Actions */}
          <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              {report.status === 'Open' ? (
                <>
                  <button
                    type="button"
                    onClick={onOpenMerge}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <ArrowsMerge size={15} weight="bold" />
                    <span>{t('missing_signs.btn_merge_catalog')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenEscalate}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <RocketLaunch size={15} weight="bold" />
                    <span>{t('missing_signs.btn_escalate_admin')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenReject}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 text-red-700 dark:text-red-400 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    <Prohibit size={15} />
                    <span>{t('missing_signs.btn_reject')}</span>
                  </button>
                </>
              ) : (
                <span className="text-xs font-semibold text-gray-500">
                  {t('missing_signs.tab_processed')}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              {t('missing_signs.btn_cancel')}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
export default MissingSignInspectionModal
