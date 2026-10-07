import { useTranslation } from 'react-i18next'
import { ModalPortal } from '@/components/common/ModalPortal'
import CustomSelect from '@/components/common/CustomSelect'
import { Prohibit, X } from '@phosphor-icons/react'
import type { MissingSignTypeReport } from '@/data'

export type MissingRejectReasonKey = 'reason_not_sign' | 'reason_blurred' | 'reason_duplicate'

interface MissingSignRejectModalProps {
  isOpen: boolean
  selectedReport: MissingSignTypeReport | null
  rejectReasonKey: MissingRejectReasonKey
  onClose: () => void
  onRejectReasonChange: (key: MissingRejectReasonKey) => void
  onSubmit: () => void
}

export function MissingSignRejectModal({
  isOpen,
  selectedReport,
  rejectReasonKey,
  onClose,
  onRejectReasonChange,
  onSubmit,
}: MissingSignRejectModalProps) {
  const { t } = useTranslation('ops')

  if (!isOpen || !selectedReport) return null

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
        <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
            <h3 className="font-bold text-red-600 dark:text-red-400 text-base flex items-center gap-2">
              <Prohibit size={18} />
              <span>{t('missing_signs.modal_reject_title')}</span>
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
            <div>
              <label className="block text-gray-500 font-mono uppercase text-[11px] mb-1">
                {t('missing_signs.lbl_reject_reason')}
              </label>
              <CustomSelect
                value={rejectReasonKey}
                onChange={(val) => onRejectReasonChange(val as MissingRejectReasonKey)}
                className="w-full"
                buttonClassName="w-full bg-gray-50 dark:bg-black/40"
                options={[
                  {
                    value: 'reason_not_sign',
                    label: t('missing_signs.reason_not_sign'),
                  },
                  {
                    value: 'reason_blurred',
                    label: t('missing_signs.reason_blurred'),
                  },
                  {
                    value: 'reason_duplicate',
                    label: t('missing_signs.reason_duplicate'),
                  },
                ]}
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
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              {t('missing_signs.btn_confirm_reject')}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
export default MissingSignRejectModal
