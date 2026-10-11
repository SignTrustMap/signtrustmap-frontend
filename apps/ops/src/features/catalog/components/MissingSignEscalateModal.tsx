import { useTranslation } from 'react-i18next'
import { ModalPortal } from '@/components/common/ModalPortal'
import { RocketLaunch, X } from '@phosphor-icons/react'
import type { MissingSignTypeReport } from '@/data'

interface MissingSignEscalateModalProps {
  isOpen: boolean
  selectedReport: MissingSignTypeReport | null
  escalateNote: string
  onClose: () => void
  onEscalateNoteChange: (note: string) => void
  onSubmit: () => void
}

export function MissingSignEscalateModal({
  isOpen,
  selectedReport,
  escalateNote,
  onClose,
  onEscalateNoteChange,
  onSubmit,
}: MissingSignEscalateModalProps) {
  const { t } = useTranslation('ops')

  if (!isOpen || !selectedReport) return null

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
        <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
            <h3 className="font-bold text-[#007b8b] dark:text-[#00c4de] text-base flex items-center gap-2">
              <RocketLaunch size={18} weight="bold" />
              <span>{t('missing_signs.modal_escalate_title')}</span>
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-gray-600 dark:text-gray-300">
              {t('missing_signs.modal_escalate_desc')}
            </p>
            <div>
              <label className="block text-gray-500 font-mono uppercase text-[11px] mb-1">
                {t('missing_signs.lbl_staff_notes')}
              </label>
              <textarea
                rows={3}
                value={escalateNote}
                onChange={(e) => onEscalateNoteChange(e.target.value)}
                placeholder={t('missing_signs.lbl_staff_notes')}
                className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
            >
              {t('missing_signs.btn_cancel')}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="px-4 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              {t('missing_signs.btn_confirm_escalate')}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
export default MissingSignEscalateModal
