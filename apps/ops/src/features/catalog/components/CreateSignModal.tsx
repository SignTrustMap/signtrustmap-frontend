import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, UploadSimple, Link as LinkIcon, Trash, Check, CircleNotch } from '@phosphor-icons/react'
import { ModalPortal } from '@/components/common/ModalPortal'
import CustomSelect from '@/components/common/CustomSelect'
import type { CatalogCategory, CatalogEntry } from '@/data/catalogData'
import { VEHICLE_TYPE_OPTIONS, type VehicleType, catalogService } from '@/api/services/catalog.service'

export interface CreateSignModalProps {
  /** Controls modal visibility. */
  isOpen: boolean
  /** Callback fired to close modal without saving. */
  onClose: () => void
  /** Callback fired with the validated new CatalogEntry to publish and optional image file. */
  onCreate: (newEntry: CatalogEntry, file?: File) => void
  /** Optional existing sign codes in catalog for duplicate checking */
  existingCodes?: string[]
}

function getPrefixForCatalogCategory(cat: CatalogCategory): string {
  switch (cat) {
    case 'prohibitory':
    case 'speed_limit':
      return 'P.'
    case 'warning':
      return 'W.'
    case 'mandatory':
      return 'R.'
    case 'guide':
      return 'I.'
    case 'additional':
      return 'S.'
    default:
      return 'P.'
  }
}

/**
 * Modal dialog enabling Administrators to publish a new traffic sign specification
 * into the QCVN 41:2019 reference catalog with AI CLIP vector prompt and OSM tagging rules.
 */
export const CreateSignModal: React.FC<CreateSignModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  existingCodes,
}) => {
  const { t } = useTranslation('ops')

  const [codePrefix, setCodePrefix] = useState('P.')
  const [codeNumber, setCodeNumber] = useState('')
  const [codeError, setCodeError] = useState('')
  const [isDuplicateCode, setIsDuplicateCode] = useState(false)
  const [isCheckingApi, setIsCheckingApi] = useState(false)
  const [newNameVi, setNewNameVi] = useState('')
  const [newNameEn, setNewNameEn] = useState('')
  const [newCategory, setNewCategory] = useState<CatalogCategory>('prohibitory')
  const [newShape, setNewShape] = useState<'Circle' | 'Triangle' | 'Rectangle' | 'Octagon' | 'Diamond'>('Circle')
  const [newColor, setNewColor] = useState('')
  const [newDescriptionVi, setNewDescriptionVi] = useState('')
  const [newDescriptionEn, setNewDescriptionEn] = useState('')
  const [newAiPrompt, setNewAiPrompt] = useState('')
  const [newOsmMapping, setNewOsmMapping] = useState('')
  const [allowedVehicles, setAllowedVehicles] = useState<VehicleType[]>([])

  // Representative Image state (Mandatory)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload')
  const [imageError, setImageError] = useState('')

  if (!isOpen) return null

  const resetForm = () => {
    setCodePrefix('P.')
    setCodeNumber('')
    setCodeError('')
    setNewNameVi('')
    setNewNameEn('')
    setNewDescriptionVi('')
    setNewDescriptionEn('')
    setNewAiPrompt('')
    setNewOsmMapping('')
    setNewCategory('prohibitory')
    setNewShape('Circle')
    setNewColor('')
    setAllowedVehicles([])
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

  const cleanCode = `${codePrefix}${codeNumber.trim()}`.toUpperCase()
  const hasInputNumber = Boolean(codeNumber.trim())

  // Real-time API check for code duplication with debounce
  useEffect(() => {
    if (!hasInputNumber) {
      setIsDuplicateCode(false)
      setIsCheckingApi(false)
      return
    }

    if (existingCodes?.some((c) => c.toUpperCase() === cleanCode)) {
      setIsDuplicateCode(true)
    }

    setIsCheckingApi(true)
    let isCancelled = false

    const timer = setTimeout(async () => {
      try {
        const res = await catalogService.getSignTypes({ search: cleanCode, size: 20 })
        if (isCancelled) return

        const isApiDuplicate = Boolean(
          res?.items?.some((item) => item.signCode?.trim().toUpperCase() === cleanCode)
        )

        if (isApiDuplicate) {
          setIsDuplicateCode(true)
        } else {
          const inLocal = existingCodes?.some((c) => c.toUpperCase() === cleanCode)
          setIsDuplicateCode(Boolean(inLocal))
        }
      } catch (err) {
        console.error('[CreateSignModal] Duplicate check API error:', err)
      } finally {
        if (!isCancelled) {
          setIsCheckingApi(false)
        }
      }
    }, 200)

    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [cleanCode, hasInputNumber, existingCodes])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!codeNumber.trim()) {
      setCodeError('Vui lòng nhập số hiệu biển!')
      return
    }

    if (isDuplicateCode) {
      setCodeError(`Mã biển "${cleanCode}" đã bị trùng trong Catalog!`)
      return
    }

    if (allowedVehicles.length === 0) {
      alert('Vui lòng chọn ít nhất một loại phương tiện áp dụng!')
      return
    }

    const hasImage = Boolean(imageFile || imageUrl.trim())
    if (!hasImage) {
      setImageError(t('catalog.err_image_required'))
      return
    }

    setCodeError('')
    const resolvedImg = imageUrl.trim() || imagePreview
    const newEntry: CatalogEntry = {
      id: `CAT-${cleanCode.replace(/[^a-zA-Z0-9]/g, '')}`,
      code: cleanCode,
      name: newNameVi.trim() || newNameEn.trim(),
      nameVi: newNameVi.trim() || cleanCode,
      nameEn: newNameEn.trim() || newNameVi.trim(),
      category: newCategory,
      shape: newShape,
      color: newColor,
      description: newDescriptionVi.trim() || 'Standard road sign regulation definition',
      descriptionVi: newDescriptionVi.trim() || 'Mô tả quy chuẩn kỹ thuật theo QCVN 41:2019/BGTVT.',
      descriptionEn: newDescriptionEn.trim() || 'Standard technical traffic regulation definition.',
      aiPrompt: newAiPrompt.trim() || `${newShape.toLowerCase()} road traffic sign for ${cleanCode}`,
      clipPrompt: newAiPrompt.trim() || `${newShape.toLowerCase()} road traffic sign for ${cleanCode}`,
      osmMapping: newOsmMapping.trim() || `traffic_sign=VN:${cleanCode}`,
      standardRef: 'QCVN 41:2019/BGTVT',
      status: 'Active',
      version: 'v2.5',
      imageUrl: resolvedImg,
      representativeImageKey: imageUrl.trim() || undefined,
      allowedVehicles,
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
                <div className="flex items-center justify-between">
                  <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    {t('catalog.field_code')} *
                  </label>
                  {isCheckingApi ? (
                    <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                      <CircleNotch size={11} className="animate-spin text-[#007b8b] dark:text-[#00c4de]" />
                      <span>{t('catalog.checking', 'Đang kiểm tra...')}</span>
                    </span>
                  ) : isDuplicateCode ? (
                    <span className="text-[10px] font-mono text-red-500 font-bold">
                      {t('catalog.already_exists', 'Đã tồn tại')}
                    </span>
                  ) : null}
                </div>

                {/* 2 ô nhỏ: Tiền tố (không sửa được) & Số hiệu (chỉ nhập số) */}
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <input
                      type="text"
                      readOnly
                      tabIndex={-1}
                      value={codePrefix}
                      title="Tiền tố tự động gán theo nhóm biển (Không sửa được)"
                      className={`w-16 sm:w-20 px-3 py-2.5 rounded-xl border text-center font-mono font-bold select-none outline-none transition-colors cursor-not-allowed ${
                        hasInputNumber
                          ? isDuplicateCode
                            ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                            : 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                          : 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300'
                      }`}
                    />
                  </div>

                  <div className="flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      placeholder="130"
                      value={codeNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '')
                        setCodeNumber(val)
                        if (codeError) setCodeError('')
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-gray-900 dark:text-white outline-none transition-colors ${
                        hasInputNumber
                          ? isDuplicateCode
                            ? 'border border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500/20 bg-red-50/10'
                            : 'border border-emerald-500 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20 bg-white dark:bg-[#061115]'
                          : 'border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#061115] focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]'
                      }`}
                    />
                  </div>
                </div>

                {!isDuplicateCode && codeError && (
                  <p className="text-[11px] text-red-500 font-medium pt-0.5">{codeError}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('catalog.field_category')} *
                </label>
                <CustomSelect
                  value={newCategory}
                  onChange={(val) => {
                    const nextCat = val as CatalogCategory
                    setNewCategory(nextCat)
                    setCodePrefix(getPrefixForCatalogCategory(nextCat))
                  }}
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
                <input
                  type="text"
                  maxLength={30}
                  placeholder="Đỏ - Trắng"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b]"
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

            {/* Applicable Vehicle Types */}
            <div className="space-y-1.5 p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <label className="block font-mono font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide text-xs">
                  Phương tiện áp dụng *
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setAllowedVehicles(VEHICLE_TYPE_OPTIONS.map((v) => v.value))}
                    className="text-[#007b8b] dark:text-[#00c4de] hover:underline font-semibold cursor-pointer"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <button
                    type="button"
                    onClick={() => setAllowedVehicles([])}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-semibold cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                {VEHICLE_TYPE_OPTIONS.map((v) => {
                  const selected = allowedVehicles.includes(v.value)
                  return (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setAllowedVehicles(allowedVehicles.filter((item) => item !== v.value))
                        } else {
                          setAllowedVehicles([...allowedVehicles, v.value])
                        }
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        selected
                          ? 'bg-[#007b8b]/10 border-[#007b8b] text-[#007b8b] dark:bg-[#00c4de]/15 dark:border-[#00c4de] dark:text-[#00c4de]'
                          : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      <span className="truncate">{v.labelVi}</span>
                      {selected && <Check size={12} weight="bold" className="shrink-0 ml-1" />}
                    </button>
                  )
                })}
              </div>

              <div className="min-h-[16px] flex items-center pt-1">
                {allowedVehicles.length === 0 ? (
                  <p className="text-[10px] text-red-500 font-medium animate-in fade-in">
                    Vui lòng chọn ít nhất 1 loại phương tiện áp dụng.
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    Các loại phương tiện tuân thủ theo quy định của biển báo.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {t('catalog.field_ai_prompt')}
              </label>
              <textarea
                rows={2}
                placeholder="Mô tả nhận diện hình ảnh..."
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
