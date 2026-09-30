import { useState } from 'react'
import { X, BookOpen, WarningCircle } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/common/Modal'
import { Button } from '@shared/ui'

export type DeclineReasonKey =
  | 'incorrect_sign_type'
  | 'sign_not_found'
  | 'poor_quality'
  | 'duplicate'
  | 'other'

interface DeclineCandidateModalProps {
  isOpen: boolean
  onClose: () => void
  candidateId: string
  signCode: string
  isDark: boolean
  onConfirmDecline: (reason: string, detail?: string) => void
  onOpenCatalog: () => void
}

export function DeclineCandidateModal({
  isOpen,
  onClose,
  candidateId,
  signCode,
  isDark,
  onConfirmDecline,
  onOpenCatalog,
}: DeclineCandidateModalProps) {
  const { t } = useTranslation('common')
  const [selectedReason, setSelectedReason] = useState<DeclineReasonKey>('incorrect_sign_type')
  const [detail, setDetail] = useState('')

  if (!isOpen) return null

  const reasons: Array<{ key: DeclineReasonKey; label: string; desc: string }> = [
    {
      key: 'incorrect_sign_type',
      label: t('reviewer.decline_incorrect_type', 'Sai loại biển báo (Incorrect Sign Type)'),
      desc: t('reviewer.decline_incorrect_type_desc', 'AI phân loại nhầm mã hiệu. Bạn có thể chọn lại từ danh mục QCVN 41.'),
    },
    {
      key: 'sign_not_found',
      label: t('reviewer.decline_not_found', 'Không tìm thấy biển (Sign Not Found)'),
      desc: t('reviewer.decline_not_found_desc', 'Khung hình không chứa biển báo giao thông hợp lệ.'),
    },
    {
      key: 'poor_quality',
      label: t('reviewer.decline_poor_quality', 'Chất lượng ảnh quá kém (Too Poor Image Quality)'),
      desc: t('reviewer.decline_poor_quality_desc', 'Ảnh quá mờ, tối, chói sáng hoặc bị che khuất không thể nhận dạng.'),
    },
    {
      key: 'duplicate',
      label: t('reviewer.decline_duplicate', 'Trùng lặp chuyến khảo sát (Duplicate Submission)'),
      desc: t('reviewer.decline_duplicate_desc', 'Biển báo này đã được nộp và thẩm định trước đó ở cùng toạ độ.'),
    },
    {
      key: 'other',
      label: t('reviewer.decline_other', 'Lý do khác (Other)'),
      desc: t('reviewer.decline_other_desc', 'Vui lòng cung cấp giải thích chi tiết.'),
    },
  ]

  const isOther = selectedReason === 'other'
  const canConfirm = !isOther || detail.trim().length > 0

  const handleConfirm = () => {
    if (!canConfirm) return
    const reasonObj = reasons.find((r) => r.key === selectedReason)
    onConfirmDecline(reasonObj?.label || selectedReason, detail.trim() || undefined)
    setDetail('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg" topSpacing="pt-10 sm:pt-16">
      <div
        className={`rounded-2xl border p-6 space-y-5 shadow-2xl transition-colors ${
          isDark ? 'bg-[#071317] border-white/10 text-gray-100' : 'bg-white border-[#E8E4E3] text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-gray-100 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
                <WarningCircle size={18} weight="fill" />
              </span>
              <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                {t('reviewer.decline_modal_title', 'Lý do từ chối (Decline Reason)')}
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              #{candidateId} • {signCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Reason options */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            {t('reviewer.decline_prompt', 'Chọn lý do từ chối ứng viên biển báo này:')}
          </p>

          <div className="space-y-2">
            {reasons.map((r) => {
              const isSelected = selectedReason === r.key
              return (
                <div
                  key={r.key}
                  onClick={() => setSelectedReason(r.key)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-rose-500/15 border-rose-500/50 text-white ring-1 ring-rose-500/30'
                        : 'bg-rose-50 border-rose-300 text-rose-950 ring-1 ring-rose-300'
                      : isDark
                      ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
                      : 'bg-gray-50/70 border-gray-200 hover:bg-gray-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{r.label}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-rose-500 bg-rose-500'
                          : 'border-gray-400 dark:border-gray-600'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{r.desc}</p>

                  {/* If incorrect sign type is selected, show direct button to catalog */}
                  {isSelected && r.key === 'incorrect_sign_type' && (
                    <div className="mt-2.5 pt-2 border-t border-rose-200/40 dark:border-rose-500/20">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onClose()
                          onOpenCatalog()
                        }}
                        leftIcon={<BookOpen size={14} weight="bold" />}
                      >
                        {t('reviewer.btn_pick_from_catalog', 'Chọn mã biển đúng từ Danh mục QCVN 41')}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Details input for 'other' */}
          {isOther && (
            <div className="pt-1 space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {t('reviewer.decline_detail_label', 'Mô tả chi tiết lý do')} <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={3}
                placeholder={t('reviewer.decline_detail_placeholder', 'Nhập lý do cụ thể để giúp cải thiện pipeline AI...')}
                className={`w-full p-2.5 text-xs rounded-xl border outline-none transition-all ${
                  isDark
                    ? 'bg-black/40 border-white/15 text-white placeholder-gray-500 focus:border-rose-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-rose-600'
                }`}
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-white/10">
          <Button variant="outline" size="md" onClick={onClose}>
            {t('common.cancel', 'Hủy bỏ')}
          </Button>
          <Button
            variant="danger"
            size="md"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {t('reviewer.btn_confirm_decline', 'Xác nhận từ chối')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
