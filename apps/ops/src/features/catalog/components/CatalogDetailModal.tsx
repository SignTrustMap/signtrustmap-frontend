import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  X,
  CircleNotch,
} from '@phosphor-icons/react'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/features/auth/AuthContext'
import { ModalPortal } from '@/components/common/ModalPortal'
import CustomSelect from '@/components/common/CustomSelect'
import type { CatalogCategory, CatalogEntry } from '@/data/catalogData'
import {
  catalogService,
  type CatalogSignTypeItem,
  type VehicleType,
} from '@/api/services/catalog.service'
import { resolveImageUrl, normalizeSignCodeCase } from '@/features/map/utils/signUrlHelpers'
import { TrafficSignGraphic } from './TrafficSignGraphic'

export interface CategoryMeta {
  label: string
  badgeClass: string
  dot: string
}

export interface CatalogDetailModalProps {
  /** The selected traffic sign catalog record to inspect, or null when modal is closed. */
  sign: CatalogEntry | null
  /** Callback fired when user closes modal via Escape key, close button, or backdrop click. */
  onClose: () => void
  /** Toggles sign status between Active and Deprecated. */
  onToggleStatus: (signId: string) => void
  /** Optional callback fired when sign data is updated. */
  onSignUpdated?: (updatedSign: CatalogEntry) => void
  /** Returns category visual metadata. */
  getCategoryMeta: (cat: string) => CategoryMeta
  /** Resolves primary localized sign name based on current language. */
  getSignPrimaryName: (sign: CatalogEntry) => string
  /** Resolves secondary/subtitle sign name in alternate language. */
  getSignSecondaryName: (sign: CatalogEntry) => string
  /** Resolves primary localized sign description. */
  getSignPrimaryDesc: (sign: CatalogEntry) => string
  /** Resolves secondary sign description. */
  getSignSecondaryDesc: (sign: CatalogEntry) => string
  /** Localizes geometric shape name. */
  getShapeLabel: (shape: string) => string
  /** Renders visual color pill indicator for technical specs grid. */
  renderColorPill: (color: string) => React.ReactNode
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

function splitSignCode(code?: string): { prefix: string; number: string } {
  if (!code) return { prefix: 'P.', number: '' }
  const clean = normalizeSignCodeCase(code)
  const match = clean.match(/^([A-Za-z]+)\.?([0-9]+[a-zA-Z]*)$/)
  if (match) {
    return { prefix: `${match[1].toUpperCase()}.`, number: match[2] }
  }
  return { prefix: 'P.', number: clean }
}

const CATEGORY_OPTIONS: Array<{ value: CatalogCategory; label: string; id: number }> = [
  { value: 'prohibitory', label: 'Biển báo cấm', id: 1 },
  { value: 'warning', label: 'Biển báo nguy hiểm', id: 2 },
  { value: 'mandatory', label: 'Biển hiệu lệnh', id: 3 },
  { value: 'speed_limit', label: 'Biển giới hạn tốc độ', id: 1 },
  { value: 'guide', label: 'Biển chỉ dẫn', id: 4 },
  { value: 'additional', label: 'Biển phụ', id: 5 },
]

const CATEGORY_MAP: Record<string, number> = {
  prohibitory: 1,
  warning: 2,
  mandatory: 3,
  guide: 4,
  speed_limit: 1,
  additional: 5,
}

const VEHICLE_OPTIONS: Array<{ value: VehicleType; labelVi: string }> = [
  { value: 'CAR', labelVi: 'Ô tô' },
  { value: 'MOTORCYCLE', labelVi: 'Xe máy' },
  { value: 'TRUCK', labelVi: 'Xe tải' },
  { value: 'BUS', labelVi: 'Xe buýt' },
  { value: 'BICYCLE', labelVi: 'Xe đạp' },
  { value: 'PEDESTRIAN', labelVi: 'Người đi bộ' },
]

export const CatalogDetailModal: React.FC<CatalogDetailModalProps> = ({
  sign,
  onClose,
  onSignUpdated,
}) => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const toast = useToast()

  // Form states
  const [codePrefix, setCodePrefix] = useState('P.')
  const [codeNumber, setCodeNumber] = useState('')
  const [newNameVi, setNewNameVi] = useState('')
  const [newNameEn, setNewNameEn] = useState('')
  const [newCategory, setNewCategory] = useState<CatalogCategory>('prohibitory')
  const [allowedVehicles, setAllowedVehicles] = useState<VehicleType[]>([])
  const [editStatus, setEditStatus] = useState<'Active' | 'Deprecated'>('Active')

  // Image states
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [imageError, setImageError] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Baseline vehicle types for the given sign
  const initialAllowedVehicles = useMemo<VehicleType[]>(() => {
    if (Array.isArray(sign?.allowedVehicles) && sign.allowedVehicles.length > 0) {
      return [...sign.allowedVehicles]
    }
    return VEHICLE_OPTIONS.map((v) => v.value)
  }, [sign])

  const initialImg = useMemo(() => {
    if (!sign) return ''
    return resolveImageUrl(sign.representativeImageKey || sign.imageUrl, sign.code)
  }, [sign])

  // Sync state accurately with current sign on open
  useEffect(() => {
    if (!sign) return
    const { prefix, number } = splitSignCode(sign.code)
    setCodePrefix(prefix)
    setCodeNumber(number)
    setNewNameVi(sign.nameVi || sign.name || '')
    setNewNameEn(sign.nameEn || '')
    setNewCategory((sign.category as CatalogCategory) || 'prohibitory')
    setAllowedVehicles(initialAllowedVehicles)
    setEditStatus(sign.status === 'Active' ? 'Active' : 'Deprecated')

    // Reset image states
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setImageFile(null)
    setImageUrl('')
    setShowUrlInput(false)
    setImageError('')

    const resolved = resolveImageUrl(sign.representativeImageKey || sign.imageUrl, sign.code)
    setImagePreview(resolved)
  }, [sign, initialAllowedVehicles])

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  const sanitizedNumber = codeNumber.trim().replace(/^[A-Za-z]+\./, '')
  const rawFullCode = `${codePrefix}${sanitizedNumber}`
  const cleanCode = normalizeSignCodeCase(rawFullCode)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Dung lượng tệp vượt quá giới hạn tối đa 20MB')
        return
      }
      setImageFile(file)
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
      const newUrl = URL.createObjectURL(file)
      objectUrlRef.current = newUrl
      setImagePreview(newUrl)
      setImageUrl('')
      setImageError('')
    }
  }

  const handleUrlChange = (val: string) => {
    setImageUrl(val)
    setImagePreview(val.trim())
    if (val.trim()) setImageError('')
  }

  const handleClearImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setImageFile(null)
    setImageUrl('')
    if (sign) {
      setImagePreview(resolveImageUrl(sign.representativeImageKey || sign.imageUrl, sign.code))
    } else {
      setImagePreview('')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Check whether any value has been modified compared to initial
  const isDirty = useMemo(() => {
    if (!sign) return false

    const initialCode = normalizeSignCodeCase(sign.code || '')
    if (cleanCode !== initialCode) return true

    const initialNameVi = (sign.nameVi || sign.name || '').trim()
    if (newNameVi.trim() !== initialNameVi) return true

    const initialNameEn = (sign.nameEn || '').trim()
    if (newNameEn.trim() !== initialNameEn) return true

    const initialCat = (sign.category as CatalogCategory) || 'prohibitory'
    if (newCategory !== initialCat) return true

    const initialStatus = sign.status === 'Active' ? 'Active' : 'Deprecated'
    if (editStatus !== initialStatus) return true

    if (imageFile !== null) return true
    if (imageUrl.trim() !== '' && imageUrl.trim() !== (sign.representativeImageKey || sign.imageUrl || '').trim()) {
      return true
    }

    const sortedCurrent = [...allowedVehicles].sort()
    const sortedInitial = [...initialAllowedVehicles].sort()
    if (
      sortedCurrent.length !== sortedInitial.length ||
      !sortedCurrent.every((v, i) => v === sortedInitial[i])
    ) {
      return true
    }

    return false
  }, [
    sign,
    cleanCode,
    newNameVi,
    newNameEn,
    newCategory,
    editStatus,
    imageFile,
    imageUrl,
    allowedVehicles,
    initialAllowedVehicles,
  ])

  if (!sign) return null

  const numericId = parseInt(sign.id.replace(/\D/g, ''), 10)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codeNumber.trim()) {
      toast.error('Vui lòng nhập số hiệu biển')
      return
    }
    if (!newNameVi.trim()) {
      toast.error('Vui lòng điền tên tiếng Việt')
      return
    }
    if (allowedVehicles.length === 0) {
      toast.error('Vui lòng chọn ít nhất một loại phương tiện áp dụng')
      return
    }

    setIsSubmitting(true)
    try {
      let updatedSignBackend: CatalogSignTypeItem | undefined
      const categoryId = sign.categoryId || CATEGORY_MAP[newCategory] || 1
      const isCodeChanged = cleanCode !== normalizeSignCodeCase(sign.code || '')

      if (!isNaN(numericId)) {
        if (imageFile) {
          const formData = new FormData()
          if (isCodeChanged) {
            formData.append('signCode', cleanCode)
          }
          formData.append('nameVi', newNameVi.trim())
          formData.append('nameEn', newNameEn.trim())
          formData.append('categoryId', String(categoryId))
          formData.append('shape', sign.shape || 'Circle')
          formData.append('colorScheme', sign.color || 'Red-White')
          formData.append('isActive', String(editStatus === 'Active'))
          formData.append('allowedVehicles', JSON.stringify(allowedVehicles))
          if (sign.descriptionVi || sign.description) {
            formData.append('description', (sign.descriptionVi || sign.description || '').trim())
          }
          if (sign.aiPrompt) {
            formData.append('aiLabelPrompt', sign.aiPrompt.trim())
          }
          if (sign.osmMapping) {
            formData.append('osmMapping', sign.osmMapping.trim())
          }
          formData.append('file', imageFile)

          updatedSignBackend = await catalogService.updateSignType(numericId, formData)
        } else {
          const updatePayload: any = {
            nameVi: newNameVi.trim(),
            nameEn: newNameEn.trim(),
            categoryId,
            shape: sign.shape || 'Circle',
            colorScheme: sign.color || 'Red-White',
            isActive: editStatus === 'Active',
            allowedVehicles,
            description: sign.descriptionVi || sign.description,
            aiLabelPrompt: sign.aiPrompt,
            osmMapping: sign.osmMapping,
            representativeImageKey: imageUrl.trim() || undefined,
          }
          if (isCodeChanged) {
            updatePayload.signCode = cleanCode
          }
          updatedSignBackend = await catalogService.updateSignType(numericId, updatePayload)
        }
      }

      const resolvedImg =
        updatedSignBackend?.representativeImageKey ||
        (imageUrl.trim() ? imageUrl.trim() : undefined) ||
        imagePreview ||
        sign.imageUrl

      const updatedEntry: CatalogEntry = {
        ...sign,
        code: cleanCode,
        name: newNameVi.trim() || newNameEn.trim(),
        nameVi: newNameVi.trim() || cleanCode,
        nameEn: newNameEn.trim() || newNameVi.trim(),
        category: newCategory,
        categoryId,
        status: editStatus,
        allowedVehicles,
        imageUrl: resolvedImg,
        representativeImageKey: resolvedImg,
      }

      onSignUpdated?.(updatedEntry)
      toast.success('Đã cập nhật thông tin biển báo thành công')
      onClose()
    } catch (err: any) {
      console.error('Failed to update traffic sign:', err)
      toast.error(err?.message || 'Không thể cập nhật thông tin biển báo')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-4xl w-full shadow-2xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden text-xs text-gray-800 dark:text-gray-200 text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] shrink-0">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              {isAdmin ? 'Cập nhật biển báo' : 'Chi tiết biển báo'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
              title="Đóng"
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          {/* Form Content */}
          <form id="catalog-sign-form" onSubmit={handleUpdate} className="p-5 overflow-y-auto flex-1 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              {/* ─── CỘT TRÁI: ẢNH ĐẠI DIỆN (5 cols) ───── */}
              <div className="md:col-span-5 flex flex-col h-full">
                <div className="p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] flex flex-col h-full justify-between gap-3 shadow-2xs">
                  <div className="text-[11px] font-bold text-gray-900 dark:text-white shrink-0">
                    Ảnh đại diện biển báo <span className="text-red-500">*</span>
                  </div>

                  {/* Khung ảnh xem trước */}
                  <div className="relative flex-1 min-h-[220px] rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 overflow-hidden flex items-center justify-center shadow-xs">
                    {imageFile ? (
                      <img
                        src={imagePreview}
                        alt="Ảnh mới tải lên"
                        className="w-full h-full object-contain p-2 max-h-[220px]"
                      />
                    ) : imageUrl.trim() ? (
                      <img
                        src={imageUrl.trim()}
                        alt="Ảnh từ URL"
                        className="w-full h-full object-contain p-2 max-h-[220px]"
                        onError={() => setImageError('Không thể tải ảnh từ URL đã nhập')}
                      />
                    ) : (
                      <TrafficSignGraphic
                        sign={{
                          code: sign.code,
                          nameVi: sign.nameVi || sign.name,
                          name: sign.nameEn,
                          imageUrl: initialImg,
                          shape: sign.shape,
                          color: sign.color,
                        }}
                        className="w-full h-full object-contain p-2 max-h-[220px]"
                      />
                    )}

                    {/* Badge text góc trên */}
                    <div className="absolute top-2 left-2 pointer-events-none">
                      {imageFile ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                          Ảnh mới tải lên
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800/80 text-white backdrop-blur-xs">
                          Ảnh đại diện
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".svg,.png,image/svg+xml,image/png,image/jpeg,image/webp"
                    className="hidden"
                  />

                  {/* Upload Controls */}
                  {isAdmin && (
                    <div className="space-y-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/30 hover:bg-gray-100 dark:hover:bg-white/5 text-[11px] font-semibold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer text-center shadow-2xs"
                        >
                          {imageFile || imageUrl ? 'Đổi ảnh khác' : 'Tải ảnh từ máy'}
                        </button>

                        {(imageFile || imageUrl) && (
                          <button
                            type="button"
                            onClick={handleClearImage}
                            className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30 hover:bg-red-100/90 dark:hover:bg-red-900/40 hover:border-red-400 text-[11px] font-semibold text-red-600 dark:text-red-400 transition-colors cursor-pointer text-center shrink-0 shadow-2xs"
                          >
                            Dùng lại ảnh gốc
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                          Hỗ trợ định dạng SVG hoặc PNG, tối đa 20MB
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowUrlInput((prev) => !prev)}
                          className="text-[11px] text-[#007b8b] dark:text-[#00c4de] hover:underline cursor-pointer shrink-0 ml-1"
                        >
                          {showUrlInput ? 'Ẩn URL' : 'Dùng URL'}
                        </button>
                      </div>

                      {showUrlInput && (
                        <input
                          type="url"
                          placeholder="https://s3.signmap.site/stm-catalog-images/representative/..."
                          value={imageUrl}
                          onChange={(e) => handleUrlChange(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:border-[#007b8b]"
                        />
                      )}

                      {imageError && (
                        <p className="text-xs text-red-500 font-semibold mt-1">
                          ⚠ {imageError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ─── CỘT PHẢI: THÔNG SỐ (7 cols) ───── */}
              <div className="md:col-span-7 flex flex-col gap-3">
                {/* Hàng 1: Nhóm biển & Mã biển */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                      Nhóm biển <span className="text-red-500">*</span>
                    </label>
                    {isAdmin ? (
                      <CustomSelect
                        value={newCategory}
                        onChange={(val) => {
                          const nextCat = val as CatalogCategory
                          setNewCategory(nextCat)
                          setCodePrefix(getPrefixForCatalogCategory(nextCat))
                        }}
                        className="w-full"
                        buttonClassName="w-full text-xs font-semibold"
                        options={CATEGORY_OPTIONS}
                      />
                    ) : (
                      <input
                        type="text"
                        readOnly
                        value={CATEGORY_OPTIONS.find((c) => c.value === newCategory)?.label || newCategory}
                        className="w-full px-2.5 py-2 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/15 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300"
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                      Mã biển <span className="text-red-500">*</span>
                    </label>

                    {/* 2 ô: Tiền tố & Số hiệu */}
                    <div className="flex items-center gap-2">
                      <div className="relative shrink-0">
                        <input
                          type="text"
                          readOnly
                          tabIndex={-1}
                          value={codePrefix}
                          title="Tiền tố tự động gán theo nhóm biển"
                          className="w-16 sm:w-20 px-2.5 py-2 rounded-lg border text-center font-mono font-bold text-xs select-none outline-none transition-colors cursor-not-allowed border-gray-300 dark:border-white/15 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300"
                        />
                      </div>

                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          disabled={!isAdmin}
                          value={codeNumber}
                          onChange={(e) => setCodeNumber(e.target.value)}
                          placeholder="127a hoặc 130"
                          className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-black/50 text-gray-900 dark:text-white font-mono text-xs placeholder:text-gray-400 outline-none transition-colors border-gray-300 dark:border-white/15 focus:border-[#007b8b] dark:focus:border-[#00c4de] focus:ring-1 focus:ring-[#007b8b]/20 disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hàng 2: Tên tiếng Việt & Tên tiếng Anh */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                      Tên tiếng Việt <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isAdmin}
                      value={newNameVi}
                      onChange={(e) => setNewNameVi(e.target.value)}
                      placeholder="Cấm dừng xe và đỗ xe"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] focus:ring-1 focus:ring-[#007b8b]/20 disabled:opacity-60"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                      Tên tiếng Anh
                    </label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={newNameEn}
                      onChange={(e) => setNewNameEn(e.target.value)}
                      placeholder="No Stopping and Parking"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] focus:ring-1 focus:ring-[#007b8b]/20 disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Hàng 3: Phương tiện áp dụng */}
                <div className="space-y-1.5 shrink-0">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                      Phương tiện áp dụng <span className="text-red-500">*</span>
                    </label>
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAllowedVehicles(VEHICLE_OPTIONS.map((v) => v.value))}
                          className="text-[10px] text-[#007b8b] dark:text-[#00c4de] hover:underline cursor-pointer font-medium"
                        >
                          Chọn tất cả
                        </button>
                        <span className="text-gray-300 dark:text-white/20">•</span>
                        <button
                          type="button"
                          onClick={() => setAllowedVehicles([])}
                          className="text-[10px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:underline cursor-pointer font-medium"
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {VEHICLE_OPTIONS.map((v) => {
                      const selected = allowedVehicles.includes(v.value)
                      return (
                        <button
                          key={v.value}
                          type="button"
                          disabled={!isAdmin}
                          onClick={() => {
                            if (!isAdmin) return
                            if (selected) {
                              setAllowedVehicles(allowedVehicles.filter((item) => item !== v.value))
                            } else {
                              setAllowedVehicles([...allowedVehicles, v.value])
                            }
                          }}
                          className={`flex items-center justify-center px-2.5 py-2 rounded-lg border text-xs font-semibold transition-all ${isAdmin ? 'cursor-pointer' : 'cursor-default'
                            } ${selected
                              ? 'bg-[#007b8b]/10 border-[#007b8b] text-[#007b8b] dark:bg-[#00c4de]/15 dark:border-[#00c4de] dark:text-[#00c4de]'
                              : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                            }`}
                        >
                          <span className="truncate">{v.labelVi}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="min-h-[16px] flex items-center">
                    {allowedVehicles.length === 0 ? (
                      <p className="text-[10px] text-red-500 font-medium animate-in fade-in">
                        Vui lòng chọn ít nhất 1 loại phương tiện áp dụng
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        Các loại phương tiện tuân thủ theo quy định của biển báo
                      </p>
                    )}
                  </div>
                </div>

                {/* Hàng 4: Trạng thái áp dụng */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] shrink-0">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                      Trạng thái áp dụng
                    </label>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {editStatus === 'Active' ? 'Biển báo đang có hiệu lực thi hành' : 'Biển báo đang tạm ngừng áp dụng'}
                    </span>
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setEditStatus((prev) => (prev === 'Active' ? 'Deprecated' : 'Active'))}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${editStatus === 'Active'
                        ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-500/30'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-500/30'
                        }`}
                    >
                      {editStatus === 'Active' ? 'Ngừng áp dụng' : 'Cho phép hoạt động'}
                    </button>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold border ${editStatus === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30'
                        }`}
                    >
                      {editStatus === 'Active' ? 'Đang hoạt động' : 'Ngừng áp dụng'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="px-5 py-3 border-t border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.02] flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 transition-colors cursor-pointer"
            >
              Đóng
            </button>
            {isAdmin && (
              <button
                type="submit"
                form="catalog-sign-form"
                disabled={!isDirty || isSubmitting || !codeNumber.trim() || !newNameVi.trim() || allowedVehicles.length === 0}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#007b8b] hover:bg-[#00606d] text-white flex items-center justify-center min-w-[90px] shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <CircleNotch size={14} className="animate-spin" />
                ) : (
                  'Cập nhật'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
