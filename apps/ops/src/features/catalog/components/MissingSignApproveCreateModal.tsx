import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalPortal } from '@/components/common/ModalPortal'
import CustomSelect from '@/components/common/CustomSelect'
import {
  X,
  PlusCircle,
  UploadSimple,
  Link as LinkIcon,
  Trash,
  CircleNotch,
  Image as ImageIcon,
} from '@phosphor-icons/react'
import { useToast } from '@/context/ToastContext'
import { catalogService } from '@/api/services/catalog.service'
import type { CatalogCategory } from '@/data/catalogData'
import type { MissingSignTypeReport } from '@/data'

interface MissingSignApproveCreateModalProps {
  isOpen: boolean
  selectedReport: MissingSignTypeReport | null
  onClose: () => void
  onSuccess: (signCode: string) => void
}

export function MissingSignApproveCreateModal({
  isOpen,
  selectedReport,
  onClose,
  onSuccess,
}: MissingSignApproveCreateModalProps) {
  const { t } = useTranslation('ops')
  const toast = useToast()

  const [signCode, setSignCode] = useState('')
  const [nameVi, setNameVi] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [category, setCategory] = useState<CatalogCategory>('prohibitory')
  const [shape, setShape] = useState<'Circle' | 'Triangle' | 'Rectangle' | 'Octagon' | 'Diamond'>('Circle')
  const [color, setColor] = useState('Red-White')
  const [description, setDescription] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')

  // Representative Image state (Mandatory)
  const [imageMode, setImageMode] = useState<'crop' | 'upload' | 'url'>('crop')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [imageError, setImageError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form when selectedReport changes
  useEffect(() => {
    if (selectedReport) {
      const suggested = selectedReport.similarCatalogEntries?.[0]
        ? `${selectedReport.similarCatalogEntries[0]}-NEW`
        : 'P.100'
      setSignCode(suggested)
      setNameVi(selectedReport.tempLabel || '')
      setNameEn(selectedReport.clipPrompt?.slice(0, 50) || selectedReport.tempLabel || '')
      setCategory((selectedReport.category as CatalogCategory) || 'prohibitory')
      setShape('Circle')
      setColor('Red-White')
      setDescription(selectedReport.reporterNote || '')
      setAiPrompt(selectedReport.clipPrompt || '')

      if (selectedReport.sampleImageUrl) {
        setImageMode('crop')
        setImageUrl(selectedReport.sampleImageUrl)
        setImagePreview(selectedReport.sampleImageUrl)
      } else {
        setImageMode('upload')
        setImageUrl('')
        setImagePreview('')
      }
      setImageFile(null)
      setImageError('')
    }
  }, [selectedReport])

  if (!isOpen || !selectedReport) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setImageError('')
    }
  }

  const handleUrlChange = (val: string) => {
    setImageUrl(val)
    setImagePreview(val.trim())
    if (val.trim()) setImageError('')
  }

  const handleModeChange = (mode: 'crop' | 'upload' | 'url') => {
    setImageMode(mode)
    setImageError('')
    if (mode === 'crop') {
      setImageFile(null)
      setImageUrl(selectedReport.sampleImageUrl || '')
      setImagePreview(selectedReport.sampleImageUrl || '')
    } else if (mode === 'upload') {
      setImageUrl('')
      setImagePreview(imageFile ? URL.createObjectURL(imageFile) : '')
    } else {
      setImageFile(null)
      setImagePreview(imageUrl.trim())
    }
  }

  const handleClearImage = () => {
    setImageFile(null)
    setImageUrl('')
    setImagePreview('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signCode.trim()) return

    const hasImage = Boolean(imageFile || imageUrl.trim() || imagePreview)
    if (!hasImage) {
      setImageError(t('catalog.err_image_required'))
      return
    }

    setIsSubmitting(true)
    setImageError('')

    const catMap: Record<string, number> = {
      prohibitory: 1,
      warning: 2,
      mandatory: 3,
      guide: 4,
      speed_limit: 1,
      additional: 5,
    }
    const categoryId = catMap[category] || 1

    try {
      if (imageFile) {
        const formData = new FormData()
        formData.append('categoryId', String(categoryId))
        formData.append('signCode', signCode.trim().toUpperCase())
        formData.append('nameVi', nameVi.trim())
        formData.append('nameEn', nameEn.trim() || nameVi.trim())
        if (description.trim()) formData.append('description', description.trim())
        formData.append('shape', shape)
        formData.append('colorScheme', color)
        if (aiPrompt.trim()) formData.append('aiLabelPrompt', aiPrompt.trim())
        formData.append('file', imageFile)
        await catalogService.approveAndCreateType(selectedReport.id, formData)
      } else {
        const repKey = imageUrl.trim() || imagePreview
        await catalogService.approveAndCreateType(selectedReport.id, {
          categoryId,
          signCode: signCode.trim().toUpperCase(),
          nameVi: nameVi.trim(),
          nameEn: nameEn.trim() || nameVi.trim(),
          description: description.trim() || undefined,
          shape,
          colorScheme: color,
          aiLabelPrompt: aiPrompt.trim() || undefined,
          representativeImageKey: repKey,
        })
      }

      toast.success(
        t('missing_signs.toast_approved_and_created', {
          id: selectedReport.id,
          code: signCode.trim().toUpperCase(),
        })
      )
      onSuccess(signCode.trim().toUpperCase())
      onClose()
    } catch (err: any) {
      console.error('Failed to approve and create sign type:', err)
      const msg = err?.message || 'Không thể tạo biển báo mới từ báo cáo này'
      setImageError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative my-8 animate-in zoom-in-95 duration-200 text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3">
            <h3 className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <PlusCircle size={20} weight="bold" />
              <span>{t('missing_signs.modal_approve_create_title')}</span>
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-300">
            {t('missing_signs.modal_approve_create_desc')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('catalog.field_code')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. P.106a"
                  value={signCode}
                  onChange={(e) => setSignCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('catalog.field_category')} *
                </label>
                <CustomSelect
                  value={category}
                  onChange={(val) => setCategory(val as CatalogCategory)}
                  className="w-full"
                  buttonClassName="w-full"
                  options={[
                    { value: 'prohibitory', label: t('catalog.cat_prohibitory') },
                    { value: 'warning', label: t('catalog.cat_warning') },
                    { value: 'mandatory', label: t('catalog.cat_mandatory') },
                    { value: 'speed_limit', label: t('catalog.cat_speed_limit') },
                    { value: 'guide', label: t('catalog.cat_guide') },
                    { value: 'additional', label: t('catalog.cat_additional') },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('catalog.field_name')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('catalog.field_name_placeholder')}
                  value={nameVi}
                  onChange={(e) => setNameVi(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('catalog.field_name_en')}
                </label>
                <input
                  type="text"
                  placeholder={t('catalog.field_name_en_placeholder')}
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('catalog.field_shape')}
                </label>
                <CustomSelect
                  value={shape}
                  onChange={(val) => setShape(val as any)}
                  className="w-full"
                  buttonClassName="w-full"
                  options={[
                    { value: 'Circle', label: t('catalog.shape_circle') },
                    { value: 'Triangle', label: t('catalog.shape_triangle') },
                    { value: 'Rectangle', label: t('catalog.shape_rectangle') },
                    { value: 'Octagon', label: t('catalog.shape_octagon') },
                    { value: 'Diamond', label: t('catalog.shape_diamond') },
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('catalog.field_color')}
                </label>
                <CustomSelect
                  value={color}
                  onChange={(val) => setColor(val)}
                  className="w-full"
                  buttonClassName="w-full"
                  options={[
                    { value: 'Red-White', label: t('catalog.colors_red_white') },
                    { value: 'Yellow-Black', label: t('catalog.colors_yellow_black') },
                    { value: 'Blue-White', label: t('catalog.colors_blue_white') },
                    { value: 'Green-White', label: t('catalog.colors_green_white') },
                    { value: 'Black-White', label: t('catalog.colors_black_white') },
                  ]}
                />
              </div>
            </div>

            {/* Representative Image (Required) */}
            <div className="space-y-2 p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block font-mono font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide text-xs">
                    {t('catalog.field_representative_image')} *
                  </label>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('catalog.field_representative_image_hint')}
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-gray-200/60 dark:bg-white/10 p-1 rounded-lg text-[11px] font-semibold">
                  {selectedReport.sampleImageUrl && (
                    <button
                      type="button"
                      onClick={() => handleModeChange('crop')}
                      className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                        imageMode === 'crop'
                          ? 'bg-white dark:bg-[#061115] text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <ImageIcon size={13} weight="bold" />
                      <span>Ảnh thực địa</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleModeChange('upload')}
                    className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                      imageMode === 'upload'
                        ? 'bg-white dark:bg-[#061115] text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <UploadSimple size={13} weight="bold" />
                    <span>Tải ảnh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('url')}
                    className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                      imageMode === 'url'
                        ? 'bg-white dark:bg-[#061115] text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <LinkIcon size={13} weight="bold" />
                    <span>URL</span>
                  </button>
                </div>
              </div>

              {imageMode === 'upload' ? (
                <div>
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-white/15 rounded-xl hover:border-emerald-500 hover:bg-gray-100/50 dark:hover:bg-white/5 transition-all cursor-pointer">
                    <UploadSimple size={24} className="text-emerald-600 dark:text-emerald-400 mb-1.5" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                      {t('catalog.upload_or_drag')}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      {t('catalog.upload_hint')}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : imageMode === 'url' ? (
                <div>
                  <input
                    type="url"
                    placeholder="https://s3.signmap.site/stm-sign-crops/representative/..."
                    value={imageUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              ) : null}

              {/* Preview Card */}
              {imagePreview && (
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#061115]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Representative Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate block">
                        {imageFile?.name || (imageMode === 'crop' ? 'Ảnh cắt từ hiện trường' : 'URL Image')}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Ảnh đại diện đã sẵn sàng
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Xóa ảnh"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              )}

              {imageError && (
                <p className="text-xs text-red-500 font-semibold mt-1">
                  ⚠ {imageError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {t('catalog.field_ai_prompt')}
              </label>
              <textarea
                rows={2}
                placeholder="a circular red traffic sign with symbol..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl font-mono text-[11px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                {t('catalog.btn_cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting && <CircleNotch size={14} className="animate-spin" />}
                <span>{t('missing_signs.btn_approve_and_create')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  )
}
export default MissingSignApproveCreateModal
