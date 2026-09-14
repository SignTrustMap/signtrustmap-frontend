import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X,
  Camera,
  Sparkle,
  WarningCircle,
  FileArrowUp,
  MapPin,
  TrafficSignal,
  ChatText,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { Modal } from '@/components/common/Modal'
import { CustomSelect } from '@/components/common/CustomSelect'

interface NewSignTypeModalProps {
  isOpen: boolean
  onClose: () => void
  initialLat?: string
  initialLng?: string
}

export function NewSignTypeModal({
  isOpen,
  onClose,
  initialLat = '10.7769',
  initialLng = '106.7009',
}: NewSignTypeModalProps) {
  const { t } = useTranslation('common')
  const { isDark } = useTheme()
  const toast = useToast()

  const [signName, setSignName] = useState('')
  const [category, setCategory] = useState<'prohibitory' | 'warning' | 'mandatory' | 'guide' | 'additional'>('warning')
  const [locationName, setLocationName] = useState('')
  const [lat, setLat] = useState(initialLat)
  const [lng, setLng] = useState(initialLng)
  const [reason, setReason] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const categoryOptions = [
    { value: 'warning', label: t('new_sign_modal.cat_warning') },
    { value: 'prohibitory', label: t('new_sign_modal.cat_prohibitory') },
    { value: 'mandatory', label: t('new_sign_modal.cat_mandatory') },
    { value: 'guide', label: t('new_sign_modal.cat_guide') },
    { value: 'additional', label: t('new_sign_modal.cat_additional') },
  ]

  const handleImageChange = (file: File) => {
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!signName.trim()) {
      setError(t('new_sign_modal.err_name'))
      return
    }

    if (!imageFile) {
      setError(t('new_sign_modal.err_photo'))
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success(
        t('new_sign_modal.toast_success_desc'),
        t('new_sign_modal.toast_success_title')
      )
      // Reset form
      setSignName('')
      setLocationName('')
      setReason('')
      setImageFile(null)
      setImagePreview(null)
      onClose()
    }, 800)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl" topSpacing="pt-6 sm:pt-10 pb-8 sm:pb-12">
      <div
        className={`rounded-2xl border p-6 sm:p-8 space-y-6 shadow-2xl transition-colors text-left ${
          isDark
            ? 'bg-[#071317] border-white/10 text-gray-100 shadow-black/80'
            : 'bg-white border-[#E8E4E3] text-gray-900 shadow-xl'
        }`}
      >
        {/* ─── Modal Header (Identical to SurveyDetailModal) ────────────────────────── */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                {t('new_sign_modal.badge_proposal')}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {t('new_sign_modal.badge_standard')}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {t('new_sign_modal.badge_survey')}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
              {t('new_sign_modal.title')}
            </h2>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1.5 font-medium">
              <Sparkle size={15} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
              <span>{t('new_sign_modal.subtitle')}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
                isDark
                  ? 'bg-amber-900/30 text-amber-300 border-amber-500/40'
                  : 'bg-amber-100 text-amber-950 border-amber-300'
              }`}
            >
              <Sparkle size={13} weight="bold" />
              <span>{t('new_sign_modal.badge_status')}</span>
            </span>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'border-white/10 hover:bg-white/10 text-gray-400 hover:text-white'
                  : 'border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── Error Notice ──────────────────────────────────────────────────────────── */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 text-red-900 dark:text-red-200 flex items-start gap-2.5">
            <WarningCircle size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" weight="fill" />
            <div>
              <h5 className="font-bold text-xs sm:text-sm text-red-800 dark:text-red-300">
                {t('new_sign_modal.err_title')}
              </h5>
              <p className="text-xs mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* ─── Form Container with Scroll ───────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-5 max-h-[calc(85vh-200px)] overflow-y-auto pr-1">
          {/* Section 1: Thông tin biển báo */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/70 border-gray-200'
            }`}
          >
            <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 tracking-wider flex items-center gap-1.5">
              <TrafficSignal size={15} className="text-[#007b8b] dark:text-[#00c4de]" />
              <span>{t('new_sign_modal.sec_sign_info')}</span>
            </h4>

            {/* Sign Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('new_sign_modal.lbl_name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={signName}
                onChange={(e) => setSignName(e.target.value)}
                placeholder={t('new_sign_modal.ph_name')}
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border outline-none transition-all ${
                  isDark
                    ? 'bg-black/50 border-white/15 text-white placeholder:text-gray-500 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                }`}
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('new_sign_modal.lbl_category')}
              </label>
              <CustomSelect
                options={categoryOptions}
                value={category}
                onChange={(val) => setCategory(val as any)}
                className="w-full"
              />
            </div>
          </div>

          {/* Section 2: Ảnh chụp thực tế minh chứng */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
              isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/70 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 tracking-wider flex items-center gap-1.5">
                <Camera size={15} className="text-[#007b8b] dark:text-[#00c4de]" />
                <span>{t('new_sign_modal.sec_photo')} <span className="text-red-500">*</span></span>
              </h4>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {t('new_sign_modal.photo_hint')}
              </span>
            </div>

            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 max-h-52 flex items-center justify-center bg-black/40 p-2">
                <img src={imagePreview} alt="Preview" className="max-h-48 object-contain rounded-lg" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/70 text-white hover:bg-black/90 cursor-pointer"
                >
                  <X size={15} weight="bold" />
                </button>
              </div>
            ) : (
              <label
                className={`p-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isDark
                    ? 'border-white/15 bg-black/30 hover:border-white/30 text-white'
                    : 'border-gray-300 bg-white hover:border-gray-400 text-gray-900'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-2 text-gray-400">
                  <Camera size={22} />
                </div>
                <span className="text-xs font-bold">{t('new_sign_modal.photo_drop_prompt')}</span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {t('new_sign_modal.photo_format_hint')}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageChange(e.target.files[0])}
                />
              </label>
            )}
          </div>

          {/* Section 3: Vị trí & Tọa độ thực địa */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
              isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/70 border-gray-200'
            }`}
          >
            <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 tracking-wider flex items-center gap-1.5">
              <MapPin size={15} className="text-[#007b8b] dark:text-[#00c4de]" />
              <span>{t('new_sign_modal.sec_location')}</span>
            </h4>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('new_sign_modal.lbl_location')}
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder={t('new_sign_modal.ph_location')}
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border outline-none transition-all ${
                  isDark
                    ? 'bg-black/50 border-white/15 text-white placeholder:text-gray-500 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-mono">
                  {t('new_sign_modal.lbl_lat')}
                </label>
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className={`w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border outline-none transition-all ${
                    isDark
                      ? 'bg-black/50 border-white/15 text-white focus:border-[#00c4de]'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-[#007b8b]'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-mono">
                  {t('new_sign_modal.lbl_lng')}
                </label>
                <input
                  type="text"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className={`w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border outline-none transition-all ${
                    isDark
                      ? 'bg-black/50 border-white/15 text-white focus:border-[#00c4de]'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-[#007b8b]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Lý do hoặc ghi chú cho Staff */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border space-y-2 ${
              isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/70 border-gray-200'
            }`}
          >
            <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 tracking-wider flex items-center gap-1.5">
              <ChatText size={15} className="text-[#007b8b] dark:text-[#00c4de]" />
              <span>{t('new_sign_modal.sec_notes')}</span>
            </h4>

            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('new_sign_modal.ph_notes')}
              className={`w-full px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl border outline-none resize-none transition-all ${
                isDark
                  ? 'bg-black/50 border-white/15 text-white placeholder:text-gray-500 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                  : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
              }`}
            />
          </div>

          {/* ─── Footer Action Buttons ────────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'border-white/10 hover:bg-white/5 text-gray-300'
                  : 'border-gray-200 hover:bg-gray-100 text-gray-600'
              }`}
            >
              {t('new_sign_modal.btn_cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black shadow-[#00c4de]/25'
                  : 'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-[#007b8b]/25'
              }`}
            >
              <FileArrowUp size={16} weight="bold" />
              <span>{isSubmitting ? t('new_sign_modal.btn_submitting') : t('new_sign_modal.btn_submit')}</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
