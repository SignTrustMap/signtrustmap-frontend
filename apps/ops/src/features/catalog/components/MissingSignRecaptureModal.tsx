import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalPortal } from '@/components/common/ModalPortal'
import { Camera, X, CircleNotch } from '@phosphor-icons/react'
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

export function MissingSignRecaptureModal({
  isOpen,
  selectedReport,
  onClose,
  onSubmit,
  isSubmitting = false,
}: MissingSignRecaptureModalProps) {
  const { t } = useTranslation('ops')

  const [note, setNote] = useState('')

  useEffect(() => {
    if (isOpen) {
      setNote('')
    }
  }, [isOpen])

  if (!isOpen || !selectedReport) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim()) return
    await onSubmit('BLURRY', note.trim())
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
