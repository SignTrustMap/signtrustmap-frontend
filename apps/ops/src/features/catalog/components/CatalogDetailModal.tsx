import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Copy,
  Check,
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
  type SignCategoryItem,
} from '@/api/services/catalog.service'
import { resolveImageUrl } from '@/features/map/utils/signUrlHelpers'
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
  /** Returns category visual metadata (badge style, label, dot indicator). */
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

/** Standard geometric shapes mapped to natural Vietnamese labels without parentheses */
const SHAPE_OPTIONS = [
  { value: 'TRIANGLE', label: 'Hình tam giác' },
  { value: 'CIRCLE', label: 'Hình tròn' },
  { value: 'RECTANGLE', label: 'Hình chữ nhật' },
  { value: 'OCTAGON', label: 'Hình bát giác' },
  { value: 'DIAMOND', label: 'Hình thoi' },
  { value: 'INVERTED_TRIANGLE', label: 'Hình tam giác ngược' },
]

/** Standard color schemes mapped to natural Vietnamese labels without parentheses */
const COLOR_OPTIONS = [
  { value: 'RED_WHITE', label: 'Đỏ - Trắng' },
  { value: 'RED_YELLOW', label: 'Đỏ - Vàng' },
  { value: 'YELLOW_BLACK', label: 'Vàng - Đen' },
  { value: 'BLUE_WHITE', label: 'Xanh dương - Trắng' },
  { value: 'GREEN_WHITE', label: 'Xanh lá - Trắng' },
  { value: 'WHITE_BLACK', label: 'Trắng - Đen' },
]

const CATEGORY_MAP: Record<string, number> = {
  prohibitory: 1,
  warning: 2,
  mandatory: 3,
  guide: 4,
  speed_limit: 1,
  additional: 5,
}

const CATEGORY_ID_TO_KEY: Record<number, CatalogCategory> = {
  1: 'prohibitory',
  2: 'warning',
  3: 'mandatory',
  4: 'guide',
  5: 'additional',
}

/**
 * Normalizes backend shape strings to standard option keys so the select control
 * displays the original value accurately.
 */
function normalizeShapeValue(val?: string | null): string {
  if (!val) return 'CIRCLE'
  const v = val.trim().toUpperCase().replace(/[-\s]/g, '_')
  if (v.includes('TRIANGLE') && v.includes('INVERT')) return 'INVERTED_TRIANGLE'
  if (v.includes('TRIANGLE')) return 'TRIANGLE'
  if (v.includes('CIRCLE')) return 'CIRCLE'
  if (v.includes('RECTANGLE') || v.includes('SQUARE')) return 'RECTANGLE'
  if (v.includes('OCTAGON')) return 'OCTAGON'
  if (v.includes('DIAMOND') || v.includes('RHOMBUS')) return 'DIAMOND'
  return 'CIRCLE'
}

/**
 * Normalizes backend color_scheme strings to standard option keys so the select control
 * displays the original value accurately.
 */
function normalizeColorValue(val?: string | null): string {
  if (!val) return 'RED_WHITE'
  const v = val.trim().toUpperCase().replace(/[-\s]/g, '_')
  if (v.includes('RED') && v.includes('YELLOW')) return 'RED_YELLOW'
  if (v.includes('YELLOW') && v.includes('BLACK')) return 'YELLOW_BLACK'
  if (v.includes('RED') && v.includes('WHITE')) return 'RED_WHITE'
  if (v.includes('BLUE') && v.includes('WHITE')) return 'BLUE_WHITE'
  if (v.includes('GREEN') && v.includes('WHITE')) return 'GREEN_WHITE'
  if (v.includes('WHITE') && v.includes('BLACK')) return 'WHITE_BLACK'
  if (v.includes('BLACK') && v.includes('WHITE')) return 'WHITE_BLACK'
  return 'RED_WHITE'
}

/**
 * Direct In-Place Editable Traffic Sign Detail Modal.
 * Redesigned for clean aesthetics, zero unnecessary icons, natural terminology,
 * and escalation-style image management.
 */
export const CatalogDetailModal: React.FC<CatalogDetailModalProps> = ({
  sign,
  onClose,
  onSignUpdated,
}) => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const toast = useToast()

  // Copy status
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedOsm, setCopiedOsm] = useState(false)

  // Direct editable backend fields
  const [editCode, setEditCode] = useState('')
  const [editNameVi, setEditNameVi] = useState('')
  const [editNameEn, setEditNameEn] = useState('')
  const [editCategoryId, setEditCategoryId] = useState<number>(1)
  const [editShape, setEditShape] = useState('CIRCLE')
  const [editColor, setEditColor] = useState('RED_WHITE')
  const [editDescription, setEditDescription] = useState('')
  const [editAiPrompt, setEditAiPrompt] = useState('')
  const [editOsmMapping, setEditOsmMapping] = useState('')
  const [editStatus, setEditStatus] = useState<'Active' | 'Deprecated'>('Active')

  // Image editing (escalation style)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [customImageUrl, setCustomImageUrl] = useState<string>('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  // Backend categories
  const [categories, setCategories] = useState<SignCategoryItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync state accurately with current sign on open
  useEffect(() => {
    if (!sign) return
    setEditCode(sign.code)
    setEditNameVi(sign.nameVi || sign.name || '')
    setEditNameEn(sign.nameEn || '')
    setEditCategoryId(CATEGORY_MAP[sign.category] || 1)
    setEditShape(normalizeShapeValue(sign.shape))
    setEditColor(normalizeColorValue(sign.color))
    setEditDescription(sign.descriptionVi || sign.description || '')
    setEditAiPrompt(sign.aiPrompt || sign.clipPrompt || '')
    setEditOsmMapping(sign.osmMapping || '')
    setEditStatus(sign.status === 'Active' ? 'Active' : 'Deprecated')

    // Reset image state
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setImageFile(null)
    setShowUrlInput(false)
    setCustomImageUrl('')

    const initialImg = resolveImageUrl(sign.representativeImageKey || sign.imageUrl)
    setImagePreview(initialImg)
  }, [sign])

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  // Load backend categories
  useEffect(() => {
    let isMounted = true
    catalogService
      .getCategories()
      .then((cats) => {
        if (!isMounted) return
        const cleanCats = (cats || []).filter(
          (c) =>
            !c.code?.toLowerCase().includes('mock') &&
            !c.nameVi?.toLowerCase().includes('mock')
        )
        setCategories(cleanCats)
      })
      .catch((err) => {
        console.warn('Could not load categories in detail modal:', err)
      })
    return () => {
      isMounted = false
    }
  }, [])

  if (!sign) return null

  const numericId = parseInt(sign.id.replace(/\D/g, ''), 10)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(editCode || sign.code)
    setCopiedCode(true)
    toast.success('Đã sao chép mã biển')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCopyPrompt = () => {
    const text = editAiPrompt || sign.aiPrompt || sign.clipPrompt || ''
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedPrompt(true)
    toast.success('Đã sao chép mô tả nhận diện')
    setTimeout(() => setCopiedPrompt(false), 2000)
  }

  const handleCopyOsm = () => {
    const text = editOsmMapping || sign.osmMapping || ''
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedOsm(true)
    toast.success('Đã sao chép mã OpenStreetMap')
    setTimeout(() => setCopiedOsm(false), 2000)
  }

  // Handle file selection (SVG or PNG, max 20MB - identical to escalation proposal)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Dung lượng tệp vượt quá giới hạn tối đa 20MB')
      return
    }

    const validTypes = ['image/svg+xml', 'image/png']
    const isSvg = file.name.toLowerCase().endsWith('.svg')
    const isPng = file.name.toLowerCase().endsWith('.png')
    if (!validTypes.includes(file.type) && !isSvg && !isPng) {
      toast.error('Chỉ chấp nhận tệp đồ họa quy chuẩn định dạng SVG hoặc PNG')
      return
    }

    setImageFile(file)
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
    }
    const newUrl = URL.createObjectURL(file)
    objectUrlRef.current = newUrl
    setImagePreview(newUrl)
    setCustomImageUrl('')
    setShowUrlInput(false)
  }

  // Revert back to original sign image
  const handleRemoveFile = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setImageFile(null)
    setCustomImageUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setImagePreview(resolveImageUrl(sign.representativeImageKey || sign.imageUrl))
  }

  const handleApplyUrl = (url: string) => {
    setCustomImageUrl(url)
    if (url.trim()) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      setImageFile(null)
      setImagePreview(url.trim())
    }
  }

  const handleToggleStatusState = () => {
    setEditStatus((prev) => (prev === 'Active' ? 'Deprecated' : 'Active'))
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editCode.trim() || !editNameVi.trim()) {
      toast.error('Vui lòng điền đầy đủ mã biển và tên tiếng Việt')
      return
    }

    setIsSubmitting(true)
    try {
      let updatedSignBackend: CatalogSignTypeItem | undefined

      if (!isNaN(numericId)) {
        if (imageFile) {
          const formData = new FormData()
          formData.append('signCode', editCode.trim().toUpperCase())
          formData.append('nameVi', editNameVi.trim())
          formData.append('nameEn', editNameEn.trim())
          formData.append('categoryId', String(editCategoryId))
          formData.append('shape', editShape)
          formData.append('colorScheme', editColor)
          formData.append('description', editDescription.trim())
          formData.append('aiLabelPrompt', editAiPrompt.trim())
          formData.append('osmMapping', editOsmMapping.trim())
          formData.append('isActive', String(editStatus === 'Active'))
          formData.append('file', imageFile)

          updatedSignBackend = await catalogService.updateSignType(numericId, formData)
        } else {
          updatedSignBackend = await catalogService.updateSignType(numericId, {
            signCode: editCode.trim().toUpperCase(),
            nameVi: editNameVi.trim(),
            nameEn: editNameEn.trim(),
            categoryId: editCategoryId,
            shape: editShape,
            colorScheme: editColor,
            description: editDescription.trim(),
            aiLabelPrompt: editAiPrompt.trim(),
            osmMapping: editOsmMapping.trim(),
            isActive: editStatus === 'Active',
            representativeImageKey: customImageUrl.trim() || undefined,
          })
        }
      }

      const resolvedCategory = CATEGORY_ID_TO_KEY[editCategoryId] || sign.category
      const resolvedImg =
        updatedSignBackend?.representativeImageKey ||
        imagePreview ||
        sign.imageUrl

      const updatedEntry: CatalogEntry = {
        ...sign,
        code: editCode.trim().toUpperCase(),
        name: editNameVi.trim(),
        nameVi: editNameVi.trim(),
        nameEn: editNameEn.trim(),
        category: resolvedCategory,
        shape: editShape as any,
        color: editColor,
        description: editDescription.trim() || sign.description,
        descriptionVi: editDescription.trim() || sign.descriptionVi,
        descriptionEn: editNameEn.trim() || sign.descriptionEn,
        aiPrompt: editAiPrompt.trim() || sign.aiPrompt,
        clipPrompt: editAiPrompt.trim() || sign.clipPrompt,
        osmMapping: editOsmMapping.trim() || sign.osmMapping,
        status: editStatus,
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

  // Category options
  const categoryOptions =
    categories.length > 0
      ? categories.map((c) => ({
          value: String(c.id),
          label: c.nameVi,
        }))
      : [
          { value: '1', label: 'Biển báo cấm' },
          { value: '2', label: 'Biển báo nguy hiểm' },
          { value: '3', label: 'Biển hiệu lệnh' },
          { value: '4', label: 'Biển chỉ dẫn' },
          { value: '5', label: 'Biển phụ' },
        ]

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
          className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-[920px] w-full shadow-2xl animate-in zoom-in-95 my-auto max-h-[92vh] flex flex-col overflow-hidden text-xs text-gray-800 dark:text-gray-200 text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] shrink-0">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 transition-colors cursor-pointer"
                title="Sao chép mã biển"
              >
                <span>#{editCode || sign.code}</span>
                {copiedCode ? (
                  <Check size={12} className="text-emerald-500" />
                ) : (
                  <Copy size={12} className="text-gray-400" />
                )}
              </button>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[260px] sm:max-w-md">
                {editNameVi || sign.nameVi}
              </span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span
                className={`font-semibold ${
                  editStatus === 'Active'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {editStatus === 'Active' ? 'Hoạt động' : 'Ngừng áp dụng'}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
              title="Đóng"
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          {/* Modal Body */}
          <form id="catalog-sign-form" onSubmit={handleUpdate} className="p-5 sm:p-6 overflow-y-auto flex-1 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* ─── CỘT TRÁI: Ảnh đại diện & Nhóm biển (5 cols) ─── */}
              <div className="md:col-span-5 flex flex-col gap-4">
                {/* Khung ảnh đại diện (Đúng chuẩn Escalation Catalog Proposal) */}
                <div className="p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] flex flex-col gap-3 shadow-2xs">
                  <div className="text-xs font-bold text-gray-900 dark:text-white shrink-0">
                    Ảnh đại diện biển báo
                  </div>

                  {/* Vùng hiển thị ảnh */}
                  <div className="relative min-h-[220px] rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 overflow-hidden flex items-center justify-center shadow-xs">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Ảnh đại diện"
                        className="w-full h-full object-contain p-3 max-h-[240px]"
                      />
                    ) : (
                      <TrafficSignGraphic
                        sign={{
                          ...sign,
                          code: editCode,
                          imageUrl: imagePreview || sign.imageUrl,
                          shape: editShape as any,
                          color: editColor,
                        }}
                        className="w-full h-full object-contain p-3 drop-shadow-sm max-h-[240px]"
                      />
                    )}

                    {/* Badge trạng thái ảnh ở góc trên */}
                    <div className="absolute top-2.5 left-2.5">
                      {imageFile ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                          Ảnh mới tải lên
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800/80 text-white backdrop-blur-xs">
                          Ảnh hiện tại
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Input tệp ẩn */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".svg,.png,image/svg+xml,image/png"
                    className="hidden"
                  />

                  {/* Nút thao tác tải ảnh */}
                  {isAdmin && (
                    <div className="space-y-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/30 hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-semibold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer text-center shadow-2xs"
                        >
                          {imageFile ? 'Đổi ảnh khác' : 'Tải ảnh từ máy'}
                        </button>

                        {imageFile && (
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="px-3 py-2 rounded-lg border border-red-300 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30 hover:bg-red-100/90 dark:hover:bg-red-900/40 hover:border-red-400 text-xs font-semibold text-red-600 dark:text-red-400 transition-colors cursor-pointer text-center shrink-0 shadow-2xs"
                          >
                            Dùng lại ảnh gốc
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                          Hỗ trợ định dạng SVG hoặc PNG, dung lượng tối đa 20MB.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowUrlInput((prev) => !prev)}
                          className="text-[11px] text-[#007b8b] dark:text-[#00c4de] hover:underline cursor-pointer shrink-0 ml-1"
                        >
                          {showUrlInput ? 'Ẩn URL' : 'Dùng liên kết URL'}
                        </button>
                      </div>

                      {showUrlInput && (
                        <div className="pt-1">
                          <input
                            type="url"
                            placeholder="https://domain.com/sign-image.png"
                            value={customImageUrl}
                            onChange={(e) => handleApplyUrl(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:border-[#007b8b]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Nhóm biển báo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                    Nhóm biển báo
                  </label>
                  {isAdmin ? (
                    <CustomSelect
                      value={String(editCategoryId)}
                      onChange={(val) => setEditCategoryId(parseInt(val, 10))}
                      className="w-full"
                      buttonClassName="w-full text-xs font-semibold"
                      options={categoryOptions}
                    />
                  ) : (
                    <input
                      type="text"
                      readOnly
                      value={categoryOptions.find((c) => c.value === String(editCategoryId))?.label || 'Biển báo'}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300"
                    />
                  )}
                </div>

                {/* Nút chuyển trạng thái áp dụng */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleToggleStatusState}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      editStatus === 'Active'
                        ? 'border-amber-300 text-amber-800 dark:border-amber-500/30 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                        : 'border-emerald-300 text-emerald-800 dark:border-emerald-500/30 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                    }`}
                  >
                    {editStatus === 'Active'
                      ? 'Chuyển sang ngừng áp dụng'
                      : 'Kích hoạt lại biển báo'}
                  </button>
                )}
              </div>

              {/* ─── CỘT PHẢI: Thông tin biên tập chi tiết (7 cols) ─── */}
              <div className="md:col-span-7 space-y-4">
                {/* Khối 1: Thông tin cơ bản */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-3">
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    Thông tin biển báo
                  </div>

                  {/* Mã biển báo */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block">
                      Mã biển báo *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isAdmin}
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                      placeholder="Ví dụ: P.102, W.201..."
                      className="w-full sm:w-1/2 px-3 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl font-mono font-bold text-xs uppercase text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b] disabled:opacity-60"
                    />
                  </div>

                  {/* Tên tiếng Việt */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block">
                      Tên tiếng Việt *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isAdmin}
                      value={editNameVi}
                      onChange={(e) => setEditNameVi(e.target.value)}
                      placeholder="Ví dụ: Cấm đi ngược chiều"
                      className="w-full px-3 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl font-bold text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b] disabled:opacity-60"
                    />
                  </div>

                  {/* Tên tiếng Anh */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block">
                      Tên tiếng Anh
                    </label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={editNameEn}
                      onChange={(e) => setEditNameEn(e.target.value)}
                      placeholder="Ví dụ: No Entry"
                      className="w-full px-3 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl font-medium text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b] disabled:opacity-60"
                    />
                  </div>

                  {/* Mô tả chi tiết */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block">
                      Mô tả chi tiết
                    </label>
                    <textarea
                      rows={2}
                      disabled={!isAdmin}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Nhập mô tả ý nghĩa hoặc quy định áp dụng của biển báo..."
                      className="w-full px-3 py-2 bg-white dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-gray-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#007b8b]/30 focus:border-[#007b8b] disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Khối 2: Hình dạng & Màu sắc */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block">
                      Hình dạng
                    </label>
                    {isAdmin ? (
                      <CustomSelect
                        value={editShape}
                        onChange={setEditShape}
                        className="w-full"
                        buttonClassName="w-full text-xs font-semibold"
                        options={SHAPE_OPTIONS}
                      />
                    ) : (
                      <div className="font-semibold text-xs text-gray-900 dark:text-white py-1.5">
                        {SHAPE_OPTIONS.find((s) => s.value === editShape)?.label || editShape}
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block">
                      Màu sắc
                    </label>
                    {isAdmin ? (
                      <CustomSelect
                        value={editColor}
                        onChange={setEditColor}
                        className="w-full"
                        buttonClassName="w-full text-xs font-semibold"
                        options={COLOR_OPTIONS}
                      />
                    ) : (
                      <div className="font-semibold text-xs text-gray-900 dark:text-white py-1.5">
                        {COLOR_OPTIONS.find((c) => c.value === editColor)?.label || editColor}
                      </div>
                    )}
                  </div>
                </div>

                {/* Khối 3: Gợi ý nhận diện AI */}
                <div className="p-4 rounded-xl border border-amber-300/60 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-500/5 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-amber-900 dark:text-amber-300 font-bold">
                      Mô tả nhận diện AI
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border border-amber-300 dark:border-amber-500/40 bg-white dark:bg-amber-500/20 text-amber-950 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-500/30 transition-all cursor-pointer"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check size={12} className="text-emerald-500" />
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    disabled={!isAdmin}
                    value={editAiPrompt}
                    onChange={(e) => setEditAiPrompt(e.target.value)}
                    placeholder="Mô tả đặc điểm hình dạng và màu sắc nhận diện..."
                    className="w-full p-2.5 rounded-lg border border-amber-200 dark:border-amber-500/20 bg-white dark:bg-black/30 text-amber-950 dark:text-amber-200 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-60"
                  />
                </div>

                {/* Khối 4: Quy tắc gán thẻ OpenStreetMap */}
                <div className="p-4 rounded-xl border border-cyan-300/60 dark:border-cyan-500/30 bg-cyan-50/40 dark:bg-cyan-500/5 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-cyan-900 dark:text-cyan-300 font-bold">
                      Quy tắc gán thẻ OpenStreetMap
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyOsm}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border border-cyan-300 dark:border-cyan-500/40 bg-white dark:bg-cyan-500/20 text-cyan-950 dark:text-cyan-200 hover:bg-cyan-100 dark:hover:bg-cyan-500/30 transition-all cursor-pointer"
                    >
                      {copiedOsm ? (
                        <>
                          <Check size={12} className="text-emerald-500" />
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={editOsmMapping}
                    onChange={(e) => setEditOsmMapping(e.target.value)}
                    placeholder="Ví dụ: traffic_sign=VN:P.102"
                    className="w-full p-2.5 rounded-lg border border-cyan-200 dark:border-cyan-500/20 bg-white dark:bg-black/30 text-cyan-950 dark:text-cyan-200 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#007b8b] disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] shrink-0">
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
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#007b8b] hover:bg-[#00606d] text-white flex items-center justify-center min-w-[90px] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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

