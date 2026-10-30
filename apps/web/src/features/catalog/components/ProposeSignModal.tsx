import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, CheckCircle } from '@phosphor-icons/react'
import { useToast } from '@/context/ToastContext'
import { Modal } from '@/components/common/Modal'

export interface ProposeSignModalProps {
  /** Controls modal visibility. */
  isOpen: boolean
  /** Callback fired to close modal. */
  onClose: () => void
  /** Theme indicator for dark/light styling. */
  isDark: boolean
}

/**
 * Community proposal modal allowing citizens and drivers to propose new/missing
 * traffic signs not yet cataloged in the QCVN reference system.
 */
export const ProposeSignModal: React.FC<ProposeSignModalProps> = ({
  isOpen,
  onClose,
  isDark,
}) => {
  const { t } = useTranslation('common')
  const toast = useToast()

  const [proposalTempName, setProposalTempName] = useState('')
  const [proposalDesc, setProposalDesc] = useState('')
  const [proposalSuccess, setProposalSuccess] = useState(false)

  if (!isOpen) return null

  const handleProposeSign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!proposalTempName.trim()) return

    setProposalSuccess(true)
    toast.success(t('catalog.proposal_success_title'), t('catalog.proposal_success_desc'))
    setTimeout(() => {
      setProposalSuccess(false)
      onClose()
      setProposalTempName('')
      setProposalDesc('')
    }, 1500)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div
        className={`w-full rounded-2xl border p-6 sm:p-7 text-left ${
          isDark
            ? 'bg-[#071317] border-white/15 text-white shadow-2xl shadow-black/80'
            : 'bg-white border-[#E8E4E3] text-gray-900 shadow-xl'
        }`}
      >
        {proposalSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle size={32} weight="bold" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
              {t('catalog.proposal_success_title')}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
              {t('catalog.proposal_success_desc')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleProposeSign} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
              <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">
                {t('catalog.propose_title')}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark
                    ? 'text-gray-400 hover:text-white hover:bg-white/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                {t('catalog.propose_name_lbl')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={proposalTempName}
                onChange={(e) => setProposalTempName(e.target.value)}
                placeholder={t('catalog.propose_name_ph')}
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border outline-none transition-all ${
                  isDark
                    ? 'bg-black/50 border-white/15 text-white placeholder:text-gray-400 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                {t('catalog.propose_desc_lbl')}
              </label>
              <textarea
                rows={3}
                value={proposalDesc}
                onChange={(e) => setProposalDesc(e.target.value)}
                placeholder={t('catalog.propose_desc_ph')}
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border outline-none transition-all ${
                  isDark
                    ? 'bg-black/50 border-white/15 text-white placeholder:text-gray-400 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                }`}
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10'
                    : 'bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {t('catalog.btn_cancel')}
              </button>
              <button
                type="submit"
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black shadow-[#00c4de]/20'
                    : 'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-[#007b8b]/20'
                }`}
              >
                {t('catalog.btn_submit_proposal')}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
