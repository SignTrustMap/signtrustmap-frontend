import { useTranslation } from 'react-i18next'
import {
  Megaphone,
  X,
  MapPin,
  Phone,
  User,
  RocketLaunch,
  ArrowsClockwise,
  CheckCircle,
} from '@phosphor-icons/react'
import type { SignReportItem, ReportStatus } from '@/data'
import { mockCatalogData } from '@/data/catalogData'
import { ModalPortal } from '@/components/common/ModalPortal'
import { TrafficSignGraphic } from '@/features/catalog/components/TrafficSignGraphic'
import { IssueTypeBadge, PriorityBadge, ReportStatusBadge } from './ReportsBadges'

interface ReportDetailModalProps {
  report: SignReportItem | null
  onClose: () => void
  onUpdateStatus: (reportId: string, newStatus: ReportStatus) => void
  onDispatchSurvey: (report: SignReportItem) => void
}

export function ReportDetailModal({
  report,
  onClose,
  onUpdateStatus,
  onDispatchSurvey,
}: ReportDetailModalProps) {
  const { t } = useTranslation('ops')

  if (!report) return null

  const catalogEntry = mockCatalogData.find(
    (c) => c.code.toLowerCase() === report.signCode.toLowerCase()
  ) || {
    code: report.signCode,
    nameVi: report.signName,
    shape: 'Circle',
    color: 'Red-White',
  }

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
                <Megaphone size={22} weight="bold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10">
                    {report.id}
                  </span>
                  <ReportStatusBadge status={report.status} />
                  <PriorityBadge priority={report.priority} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {t('reports.modal_details_title')}
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
              {/* Left Column: Photos & Sign Reference */}
              <div className="space-y-4">
                {/* Photo Evidence */}
                <div>
                  <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
                    {t('reports.lbl_evidence_photo')}
                  </span>
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/40 group">
                    <img
                      src={report.photoUrl}
                      alt="Incident Evidence"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono">
                      {report.id}
                    </div>
                  </div>
                </div>

                {/* Standard Sign Reference */}
                <div className="p-3.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 space-y-2">
                  <span className="text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                    {t('reports.lbl_sign_reference')}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 flex items-center justify-center p-1 shrink-0 shadow-xs">
                      <TrafficSignGraphic sign={catalogEntry} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#007b8b] dark:text-[#00c4de] text-xs">
                          {report.signCode}
                        </span>
                        <IssueTypeBadge type={report.issueType} />
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm truncate">
                        {report.signName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Citizen Description & Incident Telemetry */}
              <div className="space-y-4">
                {/* Location */}
                <div className="p-3.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5">
                  <span className="text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                    {t('reports.th_location')}
                  </span>
                  <div className="flex items-start gap-2 text-gray-900 dark:text-white font-medium">
                    <MapPin size={16} className="text-[#007b8b] dark:text-[#00c4de] shrink-0 mt-0.5" />
                    <span>{report.location}</span>
                  </div>
                </div>

                {/* Citizen Description */}
                <div>
                  <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1.5">
                    {t('reports.lbl_description')}
                  </span>
                  <div className="p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 text-gray-800 dark:text-gray-200 leading-relaxed italic">
                    &ldquo;{report.description}&rdquo;
                  </div>
                </div>

                {/* Reporter & Staff Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Reporter Info */}
                  <div className="p-3 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                      {t('reports.lbl_reporter_info')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${report.reporter.avatarBg}`}
                      >
                        {report.reporter.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-xs truncate">
                          {report.reporter.name}
                        </p>
                        {report.reporter.phone && (
                          <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                            <Phone size={11} />
                            <span>{report.reporter.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Assigned Staff */}
                  <div className="p-3 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                      {t('reports.lbl_assigned_staff')}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#007b8b]/10 dark:bg-[#00c4de]/20 flex items-center justify-center text-[#007b8b] dark:text-[#00c4de]">
                        <User size={12} weight="bold" />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white text-xs">
                        {report.assignedStaff || t('reports.status_pending')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submission date & resolved date */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1 pt-1 font-mono">
                  <span>{t('reports.th_date')}: {report.dateSubmitted}</span>
                  {report.resolvedDate && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {t('reports.tab_resolved')}: {report.resolvedDate}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              {report.status !== 'Resolved' && (
                <button
                  type="button"
                  onClick={() => onDispatchSurvey(report)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <RocketLaunch size={15} weight="bold" />
                  <span>{t('reports.btn_dispatch_survey')}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {report.status !== 'Investigating' && report.status !== 'Resolved' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(report.id, 'Investigating')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cyan-300 dark:border-cyan-500/40 bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 text-cyan-800 dark:text-[#00c4de] text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                  <ArrowsClockwise size={14} weight="bold" />
                  <span>{t('reports.btn_mark_investigating')}</span>
                </button>
              )}

              {report.status !== 'Resolved' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(report.id, 'Resolved')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle size={14} weight="bold" />
                  <span>{t('reports.btn_mark_resolved')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                {t('catalog.btn_cancel')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
