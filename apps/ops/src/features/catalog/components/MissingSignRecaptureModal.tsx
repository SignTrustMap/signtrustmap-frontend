import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalPortal } from '@/components/common/ModalPortal'
import CustomSelect from '@/components/common/CustomSelect'
import { Camera, X, WarningCircle, CircleNotch } from '@phosphor-icons/react'
import type { MissingSignTypeReport } from '@/data'

export type RecaptureReasonCode =
  | 'BLURRY'
  | 'POOR_LIGHTING'
  | 'WRONG_ANGLE'
  | 'OCCLUDED'
  | 'MISSING_CONTEXT'
  | 'OTHER'

interface MissingSignRecaptureModalProps {
  isOpen: boolean
  selectedReport: MissingSignTypeReport | null
  onClose: () => void
  onSubmit: (reason: RecaptureReasonCode, note: string) => Promise<void>
  isSubmitting?: boolean
}

const REASON_OPTIONS = [
  { value: 'BLURRY', label: 'Ảnh mờ hoặc rung tay' },
  { value: 'POOR_LIGHTING', label: 'Ngược sáng hoặc thiếu sáng' },
  { value: 'WRONG_ANGLE', label: 'Góc chụp quá nghiêng' },
  { value: 'OCCLUDED', label: 'Bị vật cản che khuất' },
  { value: 'MISSING_CONTEXT', label: 'Thiếu ảnh toàn cảnh' },
  { value: 'OTHER', label: 'Lý do khác' },
]

export function MissingSignRecaptureModal({
  isOpen,
  selectedReport,
  onClose,
  onSubmit,
  isSubmitting = false,
}: MissingSignRecaptureModalProps) {
  const { t } = useTranslation('ops')

  const [reason, setReason] = useState<RecaptureReasonCode>('BLURRY')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (isOpen) {
      setReason('BLURRY')
      setNote('Ảnh biển báo bị mờ hoặc rung tay, vui lòng chụp thẳng góc và rõ nét hơn tại vị trí này.')
    }
  }, [isOpen])

  if (!isOpen || !selectedReport) return null

  const handleReasonChange = (val: string) => {
    const code = val as RecaptureReasonCode
    setReason(code)
    switch (code) {
      case 'BLURRY':
        setNote('Ảnh biển báo bị mờ hoặc rung tay, vui lòng chụp thẳng góc và rõ nét hơn tại vị trí này.')
        break
      case 'POOR_LIGHTING':
        setNote('Ảnh bị ngược sáng hoặc quá tối, vui lòng chụp lại vào thời điểm đủ sáng.')
        break
      case 'WRONG_ANGLE':
        setNote('Góc chụp quá nghiêng, vui lòng đứng đối diện chính diện biển báo để chụp.')
        break
      case 'OCCLUDED':
        setNote('Biển báo bị che một phần bởi vật cản, vui lòng chọn góc chụp thấy trọn vẹn biển.')
        break
      case 'MISSING_CONTEXT':
        setNote('Cần thêm ảnh toàn cảnh thể hiện rõ biển báo đặt trên tuyến đường nào.')
        break
      default:
        setNote('')
        break
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(reason, note.trim())
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
        <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-3">
            <h3 className="font-bold text-amber-600 dark:text-amber-400 text-base flex items-center gap-2">
              <Camera size={20} weight="fill" />
              <span>Yêu cầu Surveyor chụp lại ảnh</span>
            </h3>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Info Preview */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {selectedReport.tempLabel}
                </span>
                <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-md">
                  #{selectedReport.id.slice(0, 8)}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                📍 {selectedReport.roadAddress}
              </p>
            </div>

            {/* Select Reason */}
            <div>
              <label className="block text-gray-500 dark:text-gray-400 font-mono uppercase text-[11px] mb-1 font-semibold">
                Lý do yêu cầu chụp lại <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                value={reason}
                onChange={handleReasonChange}
                direction="down"
                portal={true}
                className="w-full"
                buttonClassName="w-full bg-gray-50 dark:bg-black/40 border-gray-200 dark:border-white/10 text-xs py-2"
                options={REASON_OPTIONS}
              />
            </div>

            {/* Notes for Surveyor */}
            <div>
              <label className="block text-gray-500 dark:text-gray-400 font-mono uppercase text-[11px] mb-1 font-semibold">
                Ghi chú <span className="text-red-500">*</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú..."
                rows={3}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            {/* Explanatory note */}
            <div className="flex items-start gap-2 p-2.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-blue-700 dark:text-blue-300 text-[11px]">
              <WarningCircle size={16} className="shrink-0 mt-0.5" />
              <span>
                Hồ sơ sẽ chuyển sang trạng thái <strong>Cần bổ sung</strong>. Hệ thống sẽ tự động phân bổ ngẫu nhiên một Surveyor đang hoạt động đến chụp lại ảnh tại vị trí GPS này trong bán kính tối đa 100 mét (nhiệm vụ thực địa).
              </span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer disabled:opacity-50"
              >
                {t('missing_signs.btn_cancel', 'Hủy')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !note.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <CircleNotch size={14} className="animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <span>Gửi yêu cầu chụp lại</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  )
}

export default MissingSignRecaptureModal
