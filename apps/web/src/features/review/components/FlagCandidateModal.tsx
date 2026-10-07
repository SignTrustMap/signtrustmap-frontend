import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flag, X } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { Modal } from '@/components/common/Modal'
import { Button } from '@shared/ui'
import type { FlagReasonCode } from '@/data'

interface FlagCandidateModalProps {
  isOpen: boolean
  onClose: () => void
  candidateId: string
  signCode: string
  isDark?: boolean
  onConfirmFlag: (reason: FlagReasonCode, notes: string) => void
  isSubmitting?: boolean
}

interface ReasonOption {
  code: FlagReasonCode
  labelKey: string
  defaultLabel: string
  descKey: string
  defaultDesc: string
}

export function FlagCandidateModal({
  isOpen,
  onClose,
  candidateId,
  signCode,
  isDark: propIsDark,
  onConfirmFlag,
  isSubmitting = false,
}: FlagCandidateModalProps) {
  const { t } = useTranslation('common')
  const { isDark: themeDark } = useTheme()
  const isDark = propIsDark !== undefined ? propIsDark : themeDark

  const [selectedReason, setSelectedReason] = useState<FlagReasonCode>('blurry_lighting')
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const reasons: ReasonOption[] = [
    {
      code: 'blurry_lighting',
      labelKey: 'reviewer.flag_reason_blurry',
      defaultLabel: 'Ảnh mờ / Thiếu sáng / Chói',
      descKey: 'reviewer.flag_reason_blurry_desc',
      defaultDesc: 'Ảnh chụp không đủ độ nét hoặc tối để nhận dạng biển',
    },
    {
      code: 'obstructed',
      labelKey: 'reviewer.flag_reason_obstructed',
      defaultLabel: 'Biển bị che khuất',
      descKey: 'reviewer.flag_reason_obstructed_desc',
      defaultDesc: 'Bị cây cối, xe cộ hoặc chướng ngại vật chắn một phần',
    },
    {
      code: 'gps_spoofing',
      labelKey: 'reviewer.flag_reason_gps',
      defaultLabel: 'Sai lệch tọa độ GPS',
      descKey: 'reviewer.flag_reason_gps_desc',
      defaultDesc: 'Vị trí ghi nhận không khớp với đoạn đường thực tế',
    },
    {
      code: 'duplicate',
      labelKey: 'reviewer.flag_reason_duplicate',
      defaultLabel: 'Trùng lặp với biển lân cận',
      descKey: 'reviewer.flag_reason_duplicate_desc',
      defaultDesc: 'Đã có biển tương tự được duyệt cách đây vài mét',
    },
    {
      code: 'qcvn_non_compliant',
      labelKey: 'reviewer.flag_reason_qcvn',
      defaultLabel: 'Không đạt chuẩn QCVN 41',
      descKey: 'reviewer.flag_reason_qcvn_desc',
      defaultDesc: 'Biển tự chế, sai quy cách màu sắc hoặc kích thước',
    },
    {
      code: 'fraud_suspicious',
      labelKey: 'reviewer.flag_reason_fraud',
      defaultLabel: 'Nghi vấn gian lận dữ liệu',
      descKey: 'reviewer.flag_reason_fraud_desc',
      defaultDesc: 'Hành trình bất thường hoặc ảnh chụp từ màn hình khác',
    },
  ]

  const handleSubmit = () => {
    if (isSubmitting) return
    onConfirmFlag(selectedReason, notes.trim())
    setNotes('')
    if (isSubmitting === undefined) {
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg" topSpacing="pt-10 sm:pt-16">
      <div
        className={`rounded-2xl border p-6 space-y-5 shadow-2xl transition-colors text-left ${
          isDark ? 'bg-[#071317] border-white/10 text-gray-100' : 'bg-white border-[#E8E4E3] text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-gray-100 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 dark:bg-amber-400/15 dark:text-amber-400">
                <Flag size={18} weight="fill" />
              </span>
              <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                {t('reviewer.flag_modal_title', 'Báo lỗi biển báo')}
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              #{candidateId.length > 12 ? candidateId.slice(0, 8) : candidateId} • {signCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Reason options */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            {t('reviewer.flag_prompt', 'Chọn lý do báo lỗi ứng viên biển báo này:')}
          </p>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
            {reasons.map((r) => {
              const isSelected = selectedReason === r.code

              return (
                <div
                  key={r.code}
                  onClick={() => setSelectedReason(r.code)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-[#00c4de]/10 border-[#00c4de] text-white ring-1 ring-[#00c4de]/30'
                        : 'bg-teal-50/70 border-[#007b8b] text-gray-900 ring-1 ring-[#007b8b]/30'
                      : isDark
                      ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-gray-300'
                      : 'bg-gray-50/70 border-gray-200 hover:bg-gray-100/70 text-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold">{t(r.labelKey, r.defaultLabel)}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? isDark
                            ? 'border-[#00c4de] bg-[#00c4de]'
                            : 'border-[#007b8b] bg-[#007b8b]'
                          : 'border-gray-400 dark:border-gray-600'
                      }`}
                    >
                      {isSelected && (
                        <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-black' : 'bg-white'}`} />
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{t(r.descKey, r.defaultDesc)}</p>
                </div>
              )
            })}
          </div>

          {/* Details input */}
          <div className="pt-1 space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {t('reviewer.flag_notes_label', 'Ghi chú thêm (Tùy chọn)')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={t('reviewer.flag_notes_placeholder', 'Nhập thêm thông tin mô tả chi tiết nếu cần...')}
              className={`w-full p-2.5 text-xs rounded-xl border outline-none transition-all ${
                isDark
                  ? 'bg-black/40 border-white/15 text-white placeholder-gray-500 focus:border-[#00c4de]'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#007b8b]'
              }`}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-white/10">
          <Button variant="outline" size="md" disabled={isSubmitting} onClick={onClose}>
            {t('common.cancel', 'Hủy bỏ')}
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting
              ? t('reviewer.btn_flagging', 'Đang báo lỗi...')
              : t('reviewer.btn_confirm_flag', 'Xác nhận báo lỗi')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
