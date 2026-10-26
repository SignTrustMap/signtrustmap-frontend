import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, UploadSimple, Link as LinkIcon, Trash } from '@phosphor-icons/react'
import { ModalPortal } from '@/components/common/ModalPortal'
import CustomSelect from '@/components/common/CustomSelect'
import type { CatalogCategory, CatalogEntry } from '@/data/catalogData'

export interface CreateSignModalProps {
  /** Controls modal visibility. */
  isOpen: boolean
  /** Callback fired to close modal without saving. */
  onClose: () => void
  /** Callback fired with the validated new CatalogEntry to publish and optional image file. */
  onCreate: (newEntry: CatalogEntry, file?: File) => void
}

/**
 * Modal dialog enabling Administrators to publish a new traffic sign specification
 * into the QCVN 41:2019 reference catalog with AI CLIP vector prompt and OSM tagging rules.
 */
export const CreateSignModal: React.FC<CreateSignModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const { t } = useTranslation('ops')

  const [newCode, setNewCode] = useState('')
  const [newNameVi, setNewNameVi] = useState('')
  const [newNameEn, setNewNameEn] = useState('')
  const [newCategory, setNewCategory] = useState<CatalogCategory>('prohibitory')
  const [newShape, setNewShape] = useState<'Circle' | 'Triangle' | 'Rectangle' | 'Octagon' | 'Diamond'>('Circle')
  const [newColor, setNewColor] = useState('Red-White')
  const [newDescriptionVi, setNewDescriptionVi] = useState('')
  const [newDescriptionEn, setNewDescriptionEn] = useState('')
  const [newAiPrompt, setNewAiPrompt] = useState('')
  const [newOsmMapping, setNewOsmMapping] = useState('')

  // Representative Image state (Mandatory)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload')
  const [imageError, setImageError] = useState('')

  if (!isOpen) return null

  const resetForm = () => {
    setNewCode('')
    setNewNameVi('')
    setNewNameEn('')
    setNewDescriptionVi('')
    setNewDescriptionEn('')
    setNewAiPrompt('')
    setNewOsmMapping('')
    setNewCategory('prohibitory')
    setNewShape('Circle')
    setNewColor('Red-White')
    setImageFile(null)
    setImageUrl('')
    setImagePreview('')
    setImageError('')
  }

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

  const handleClearImage = () => {
    setImageFile(null)
    setImageUrl('')
    setImagePreview('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCode.trim()) return

    const hasImage = Boolean(imageFile || imageUrl.trim())
    if (!hasImage) {
      setImageError(t('catalog.err_image_required'))
      return
    }

    const normalizedCode = newCode.trim().match(/^T\.xxx$/i) ? 'T.xxx' : newCode.trim()
    const resolvedImg = imageUrl.trim() || imagePreview
    const newEntry: CatalogEntry = {
      id: `CAT-${normalizedCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`,
      code: normalizedCode,
      name: newNameVi.trim() || newNameEn.trim(),
      nameVi: newNameVi.trim() || newCode.trim(),
      nameEn: newNameEn.trim() || newNameVi.trim(),
      category: newCategory,
      shape: newShape,
      color: newColor,
      description: newDescriptionVi.trim() || 'Standard road sign regulation definition',
      descriptionVi: newDescriptionVi.trim() || 'Mô tả quy chuẩn kỹ thuật theo QCVN 41:2019/BGTVT.',
      descriptionEn: newDescriptionEn.trim() || 'Standard technical traffic regulation definition.',
      aiPrompt: newAiPrompt.trim() || `${newShape.toLowerCase()} road traffic sign for ${newCode}`,
      clipPrompt: newAiPrompt.trim() || `${newShape.toLowerCase()} road traffic sign for ${newCode}`,
      osmMapping: newOsmMapping.trim() || `traffic_sign=VN:${newCode}`,
      standardRef: 'QCVN 41:2019/BGTVT',
      status: 'Active',
      version: 'v2.5',
      imageUrl: resolvedImg,
      representativeImageKey: imageUrl.trim() || undefined,
    }

    onCreate(newEntry, imageFile || undefined)
    resetForm()
    onClose()
  }

  return (
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative my-8 animate-in zoom-in-95 duration-200 text-left"
        >
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              {t('catalog.modal_title')}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('catalog.field_code')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. P.106a, T.xxx"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('catalog.field_category')} *
                </label>
                <CustomSelect
                  value={newCategory}
                  onChange={(val) => setNewCategory(val as CatalogCategory)}
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
                  value={newNameVi}
                  onChange={(e) => setNewNameVi(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('catalog.field_name_en')}
                </label>
                <input
                  type="text"
                  placeholder={t('catalog.field_name_en_placeholder')}
                  value={newNameEn}
                  onChange={(e) => setNewNameEn(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('catalog.field_shape')}
                </label>
                <CustomSelect
                  value={newShape}
                  onChange={(val) => setNewShape(val as any)}
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
                  value={newColor}
                  onChange={(val) => setNewColor(val)}
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
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                      imageMode === 'upload'
                        ? 'bg-white dark:bg-[#061115] text-[#007b8b] dark:text-[#00c4de] shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <UploadSimple size={13} weight="bold" />
                    <span>Tải ảnh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                      imageMode === 'url'
                        ? 'bg-white dark:bg-[#061115] text-[#007b8b] dark:text-[#00c4de] shadow-xs'
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
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-white/15 rounded-xl hover:border-[#007b8b] dark:hover:border-[#00c4de] hover:bg-gray-100/50 dark:hover:bg-white/5 transition-all cursor-pointer">
                    <UploadSimple size={24} className="text-[#007b8b] dark:text-[#00c4de] mb-1.5" />
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
              ) : (
                <div>
                  <input
                    type="url"
                    placeholder="https://s3.signmap.site/stm-sign-crops/representative/..."
                    value={imageUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
                  />
                </div>
              )}

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
                        {imageFile?.name || (imageUrl ? 'URL Image' : 'Selected image')}
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
                placeholder="a circular red traffic sign with a black truck silhouette indicating no trucks"
                value={newAiPrompt}
                onChange={(e) => setNewAiPrompt(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl font-mono text-[11px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {t('catalog.field_osm_mapping')}
              </label>
              <input
                type="text"
                placeholder="hgv=no; traffic_sign=VN:P.106a"
                value={newOsmMapping}
                onChange={(e) => setNewOsmMapping(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl font-mono text-[11px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
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
                className="px-5 py-2 bg-[#007b8b] hover:bg-[#00606d] text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>{t('catalog.btn_publish')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  )
}
