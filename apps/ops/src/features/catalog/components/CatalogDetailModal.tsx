import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  X,
  CircleNotch,
  Trash,
  PushPin,
  Plus,
  Camera,
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

export interface SupportShotItem {
  id: string
  imageUrl: string
  imageType?: string
  role?: 'ANCHOR' | 'MEDOID' | 'REPRESENTATIVE'
  isPrimary?: boolean
  isPinned?: boolean
  sharpness?: number | null
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

  const numericId = useMemo(() => {
    if (!sign?.id) return NaN
    return parseInt(String(sign.id).replace(/\D/g, ''), 10)
  }, [sign?.id])

  // Support Shots states
  const [supportShots, setSupportShots] = useState<SupportShotItem[]>([])
  const [isLoadingShots, setIsLoadingShots] = useState(false)
  // Sub-modals for support shots
  const [previewShot, setPreviewShot] = useState<SupportShotItem | null>(null)
  const [isAddShotOpen, setIsAddShotOpen] = useState(false)
  const [shotImageUrl, setShotImageUrl] = useState('')
  const [shotImageFile, setShotImageFile] = useState<File | null>(null)
  const [shotImagePreview, setShotImagePreview] = useState('')
  const [shotShowUrlInput, setShotShowUrlInput] = useState(false)
  const [shotRole, setShotRole] = useState<'ANCHOR' | 'MEDOID'>('MEDOID')
  const [shotIsPinned, setShotIsPinned] = useState(false)
  const [isShotSubmitting, setIsShotSubmitting] = useState(false)
  const [shotToDelete, setShotToDelete] = useState<SupportShotItem | null>(null)
  const [isDeletingShot, setIsDeletingShot] = useState(false)
  const shotFileInputRef = useRef<HTMLInputElement | null>(null)
  const shotObjectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (shotObjectUrlRef.current) {
        URL.revokeObjectURL(shotObjectUrlRef.current)
      }
    }
  }, [])

  // Fetch support shots when sign opens
  const fetchSupportShots = useCallback(async () => {
    if (!sign || isNaN(numericId)) return
    setIsLoadingShots(true)
    try {
      const res: any = await catalogService.getSupportShots(numericId)
      const rawList =
        res?.shots ||
        res?.data?.shots ||
        (Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [])
      setSupportShots(Array.isArray(rawList) ? rawList : [])
    } catch (err) {
      console.error('Lỗi tải danh sách ảnh mẫu nhận diện:', err)
    } finally {
      setIsLoadingShots(false)
    }
  }, [sign, numericId])

  useEffect(() => {
    if (sign && !isNaN(numericId)) {
      fetchSupportShots()
    } else {
      setSupportShots([])
    }
  }, [sign, numericId, fetchSupportShots])

  // Admin actions on support shots
  const handleTogglePin = async (shot: SupportShotItem) => {
    if (!isAdmin || isNaN(numericId)) return
    try {
      const nextPinned = !shot.isPinned
      await catalogService.togglePinSupportShot(numericId, shot.id, nextPinned)
      toast.success(nextPinned ? 'Đã ghim cố định ảnh mẫu' : 'Đã bỏ ghim ảnh mẫu')
      fetchSupportShots()
    } catch (err: any) {
      toast.error(err?.message || 'Không thể cập nhật trạng thái ghim')
    }
  }

  const handleOpenAddShot = () => {
    setIsAddShotOpen(true)
    setShotImageUrl('')
    if (shotObjectUrlRef.current) {
      URL.revokeObjectURL(shotObjectUrlRef.current)
      shotObjectUrlRef.current = null
    }
    setShotImageFile(null)
    setShotImagePreview('')
    setShotShowUrlInput(false)
    setShotRole('MEDOID')
    setShotIsPinned(false)
  }

  const handleShotFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Dung lượng tệp vượt quá giới hạn tối đa 50MB')
        return
      }
      setShotImageFile(file)
      if (shotObjectUrlRef.current) {
        URL.revokeObjectURL(shotObjectUrlRef.current)
      }
      const newUrl = URL.createObjectURL(file)
      shotObjectUrlRef.current = newUrl
      setShotImagePreview(newUrl)
      setShotImageUrl('')
    }
  }

  const handleClearShotImage = () => {
    if (shotObjectUrlRef.current) {
      URL.revokeObjectURL(shotObjectUrlRef.current)
      shotObjectUrlRef.current = null
    }
    setShotImageFile(null)
    setShotImageUrl('')
    setShotImagePreview('')
    if (shotFileInputRef.current) shotFileInputRef.current.value = ''
  }

  const handleSaveShot = async (e: React.FormEvent) => {
    e.preventDefault()
    const hasImage = Boolean(shotImageFile || shotImageUrl.trim())
    if (!hasImage) {
      toast.error('Vui lòng tải tệp ảnh từ máy hoặc nhập đường dẫn ảnh')
      return
    }
    if (isNaN(numericId)) return

    setIsShotSubmitting(true)
    try {
      if (shotImageFile) {
        const formData = new FormData()
        formData.append('file', shotImageFile)
        formData.append('role', shotRole)
        formData.append('isPinned', String(shotIsPinned))
        await catalogService.addSupportShot(numericId, formData)
      } else {
        await catalogService.addSupportShot(numericId, {
          imageUrl: shotImageUrl.trim(),
          role: shotRole,
          isPinned: shotIsPinned,
        })
      }
      toast.success('Đã thêm ảnh mẫu mới thành công')
      handleClearShotImage()
      setIsAddShotOpen(false)
      fetchSupportShots()
    } catch (err: any) {
      toast.error(err?.message || 'Không thể lưu ảnh mẫu')
    } finally {
      setIsShotSubmitting(false)
    }
  }

  const handleConfirmDeleteShot = async () => {
    if (!shotToDelete || isNaN(numericId)) return
    setIsDeletingShot(true)
    try {
      await catalogService.deleteSupportShot(numericId, shotToDelete.id)
      toast.success('Đã xóa ảnh mẫu thành công')
      setShotToDelete(null)
      fetchSupportShots()
    } catch (err: any) {
      toast.error(err?.message || 'Không thể xóa ảnh mẫu')
    } finally {
      setIsDeletingShot(false)
    }
  }

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

            {/* ─── DẢI ẢNH MẪU THỰC TẾ NHẬN DIỆN ───── */}
            <div className="mt-5 pt-4 border-t border-gray-200 dark:border-white/10 flex flex-col gap-3">
              {/* Tiêu đề danh sách */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-gray-900 dark:text-white">
                    Ảnh thực tế nhận diện AI
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#007b8b]/10 text-[#007b8b] dark:bg-[#00c4de]/15 dark:text-[#00c4de]">
                    {supportShots.length} trên 16 ảnh
                  </span>
                </div>
              </div>

              {/* Dải cuộn ảnh */}
              <div className="relative">
                {isLoadingShots ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-gray-500 text-xs">
                    <CircleNotch size={16} className="animate-spin text-[#007b8b]" />
                    <span>Đang tải danh sách ảnh mẫu</span>
                  </div>
                ) : supportShots.length === 0 && !isAdmin ? (
                  <div className="py-6 px-4 rounded-xl border border-dashed border-gray-200 dark:border-white/10 text-center text-gray-400 dark:text-gray-500 text-xs">
                    Chưa có ảnh thực tế nào được lưu
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 py-1 select-none">
                    {supportShots.map((shot, idx) => (
                      <div
                        key={shot.id || idx}
                        className="group relative w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/30 overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-gray-300 dark:hover:border-white/25 transition-all"
                      >
                        {/* Khung ảnh */}
                        <div
                          onClick={() => setPreviewShot(shot)}
                          className="relative w-full h-28 bg-gray-50 dark:bg-white/[0.03] overflow-hidden cursor-pointer flex items-center justify-center p-1.5"
                          title="Bấm để xem ảnh lớn"
                        >
                          <img
                            src={shot.imageUrl}
                            alt="Ảnh mẫu thực tế"
                            className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                            onError={(e) => {
                              ; (e.target as HTMLElement).style.display = 'none'
                            }}
                          />

                          {/* Tag góc trên trái: Vai trò */}
                          <div className="absolute top-1.5 left-1.5 pointer-events-none">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white shadow-2xs ${shot.role === 'ANCHOR'
                                ? 'bg-blue-600'
                                : 'bg-purple-600'
                                }`}
                            >
                              {shot.role === 'ANCHOR' ? 'Mẫu chuẩn' : 'Biến thể'}
                            </span>
                          </div>

                          {/* Tag góc trên phải: Ghim */}
                          {shot.isPinned && (
                            <div className="absolute top-1.5 right-1.5 pointer-events-none">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white shadow-2xs">
                                Đã ghim
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Chân card: Độ nét và Thao tác của Admin */}
                        <div className="p-2 border-t border-gray-100 dark:border-white/5 flex flex-col gap-1.5 bg-gray-50/50 dark:bg-white/[0.02]">
                          {shot.sharpness !== null && shot.sharpness !== undefined && (
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                              Độ nét {Math.round(shot.sharpness)} phần trăm
                            </div>
                          )}

                          {/* Thao tác dành cho Admin */}
                          {isAdmin && (
                            <div className="flex items-center justify-between gap-1 pt-0.5">
                              <button
                                type="button"
                                onClick={() => handleTogglePin(shot)}
                                className={`p-1 rounded transition-colors cursor-pointer ${shot.isPinned
                                  ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'
                                  }`}
                                title={shot.isPinned ? 'Bỏ ghim ảnh' : 'Ghim cố định ảnh'}
                              >
                                <PushPin size={13} weight={shot.isPinned ? 'fill' : 'bold'} />
                              </button>

                              <button
                                type="button"
                                onClick={() => setShotToDelete(shot)}
                                className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                title="Xóa ảnh này"
                              >
                                <Trash size={13} weight="bold" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Thẻ Thêm ảnh mới nếu là Admin và chưa đạt 16 ảnh */}
                    {isAdmin && supportShots.length < 16 && (
                      <button
                        type="button"
                        onClick={handleOpenAddShot}
                        className="w-full min-h-[160px] rounded-xl border-2 border-dashed border-gray-200 dark:border-white/15 hover:border-[#007b8b] dark:hover:border-[#00c4de] bg-gray-50/40 dark:bg-white/[0.01] hover:bg-[#007b8b]/5 dark:hover:bg-[#00c4de]/5 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-[#007b8b] dark:hover:text-[#00c4de] transition-all cursor-pointer"
                      >
                        <Plus size={20} weight="bold" />
                        <span className="text-[11px] font-bold">Thêm ảnh</span>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500">Tối đa 16 ảnh</span>
                      </button>
                    )}
                  </div>
                )}
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

      {/* ─── SUB-MODAL 1: XEM ẢNH LỚN ───── */}
      {previewShot && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setPreviewShot(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-lg w-full p-4 flex flex-col gap-3 shadow-2xl text-xs text-gray-800 dark:text-gray-200"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">
                    Chi tiết ảnh mẫu
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${previewShot.role === 'ANCHOR' ? 'bg-blue-600' : 'bg-purple-600'
                      }`}
                  >
                    {previewShot.role === 'ANCHOR' ? 'Mẫu chuẩn' : 'Biến thể'}
                  </span>
                  {previewShot.isPinned && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                      Đã ghim
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewShot(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              <div className="w-full max-h-[60vh] bg-gray-50 dark:bg-black/50 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-gray-200 dark:border-white/10">
                <img
                  src={previewShot.imageUrl}
                  alt="Chi tiết ảnh mẫu"
                  className="max-h-[55vh] w-auto max-w-full object-contain rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-[11px] pt-1">
                {previewShot.sharpness !== null && previewShot.sharpness !== undefined ? (
                  <span>Độ nét {Math.round(previewShot.sharpness)} phần trăm</span>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => setPreviewShot(null)}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 font-semibold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ─── SUB-MODAL 2: THÊM ẢNH MẪU ───── */}
      {isAddShotOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => {
              if (!isShotSubmitting) {
                handleClearShotImage()
                setIsAddShotOpen(false)
              }
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-md w-full p-5 flex flex-col gap-4 shadow-2xl text-xs text-gray-800 dark:text-gray-200"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Thêm ảnh mẫu mới
                </h4>
                <button
                  type="button"
                  disabled={isShotSubmitting}
                  onClick={() => {
                    handleClearShotImage()
                    setIsAddShotOpen(false)
                  }}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              <form onSubmit={handleSaveShot} className="flex flex-col gap-4">
                <input
                  type="file"
                  ref={shotFileInputRef}
                  onChange={handleShotFileChange}
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="hidden"
                />

                {/* Chuyển đổi phương thức nguồn ảnh */}
                <div className="flex p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShotShowUrlInput(false)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${!shotShowUrlInput
                      ? 'bg-white dark:bg-[#007b8b] text-gray-900 dark:text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                      }`}
                  >
                    Tải tệp từ máy
                  </button>
                  <button
                    type="button"
                    onClick={() => setShotShowUrlInput(true)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${shotShowUrlInput
                      ? 'bg-white dark:bg-[#007b8b] text-gray-900 dark:text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                      }`}
                  >
                    Đường dẫn URL
                  </button>
                </div>

                {!shotShowUrlInput ? (
                  <div className="space-y-2">
                    {shotImagePreview ? (
                      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-black/30 p-3 flex flex-col items-center justify-center gap-3">
                        <div className="relative rounded-lg overflow-hidden bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 max-h-44 flex items-center justify-center p-1">
                          <img
                            src={shotImagePreview}
                            alt="Ảnh xem trước"
                            className="max-h-40 w-auto object-contain rounded"
                          />
                        </div>
                        <div className="flex items-center gap-2 w-full">
                          <button
                            type="button"
                            onClick={() => shotFileInputRef.current?.click()}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-[11px] font-semibold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer text-center"
                          >
                            Đổi ảnh khác
                          </button>
                          <button
                            type="button"
                            onClick={handleClearShotImage}
                            className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-[11px] font-semibold text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                          >
                            Gỡ ảnh
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => shotFileInputRef.current?.click()}
                        className="group border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-[#007b8b] dark:hover:border-[#00c4de] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-gray-50/50 hover:bg-[#007b8b]/5 dark:bg-white/[0.02] dark:hover:bg-[#00c4de]/5"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105">
                          <Camera size={24} weight="bold" />
                        </div>
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          Chọn tệp ảnh từ thiết bị
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                          Hỗ trợ JPG, PNG, WEBP tối đa 50MB
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                      Đường dẫn URL ảnh trực tiếp
                    </label>
                    <input
                      type="url"
                      value={shotImageUrl}
                      onChange={(e) => {
                        setShotImageUrl(e.target.value)
                        if (shotImageFile) {
                          handleClearShotImage()
                        }
                      }}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-white dark:bg-black/30 border border-gray-300 dark:border-white/15 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] transition-colors"
                    />
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      Nhập đường dẫn trực tiếp đến tệp ảnh của biển báo
                    </p>
                  </div>
                )}

                {/* Phân loại vai trò */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                    Phân loại vai trò
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setShotRole('MEDOID')}
                      className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${shotRole === 'MEDOID'
                        ? 'border-[#007b8b] bg-[#007b8b]/10 text-[#007b8b] dark:border-[#00c4de] dark:bg-[#00c4de]/15 dark:text-[#00c4de] font-bold shadow-2xs'
                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                        }`}
                    >
                      <div className="text-xs">Biến thể</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShotRole('ANCHOR')}
                      className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${shotRole === 'ANCHOR'
                        ? 'border-[#007b8b] bg-[#007b8b]/10 text-[#007b8b] dark:border-[#00c4de] dark:bg-[#00c4de]/15 dark:text-[#00c4de] font-bold shadow-2xs'
                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                        }`}
                    >
                      <div className="text-xs">Mẫu chuẩn</div>
                    </button>
                  </div>
                </div>

                {/* Ghim cố định */}
                <label
                  htmlFor="pinShotCheckbox"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-100/60 dark:hover:bg-white/[0.04] transition-colors cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    id="pinShotCheckbox"
                    checked={shotIsPinned}
                    onChange={(e) => setShotIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#007b8b] focus:ring-[#007b8b] cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      Ghim cố định ảnh mẫu
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      Tránh bị thuật toán tự động thay thế
                    </span>
                  </div>
                </label>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-white/10">
                  <button
                    type="button"
                    disabled={isShotSubmitting}
                    onClick={() => {
                      handleClearShotImage()
                      setIsAddShotOpen(false)
                    }}
                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 font-semibold cursor-pointer transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isShotSubmitting || (!shotImageFile && !shotImageUrl.trim())}
                    className="px-5 py-2 rounded-xl bg-[#007b8b] hover:bg-[#00606d] text-white font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    {isShotSubmitting && <CircleNotch size={14} className="animate-spin" />}
                    <span>Thêm ảnh</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ─── SUB-MODAL 3: XÁC NHẬN XÓA ẢNH MẪU ───── */}
      {shotToDelete && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => !isDeletingShot && setShotToDelete(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-sm w-full p-5 flex flex-col gap-3 shadow-2xl text-xs text-gray-800 dark:text-gray-200"
            >
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Xác nhận xóa ảnh mẫu
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                Bạn có chắc chắn muốn xóa ảnh này khỏi tập huấn luyện AI không? Thao tác này không thể hoàn tác sau khi thực hiện.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  disabled={isDeletingShot}
                  onClick={() => setShotToDelete(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isDeletingShot}
                  onClick={handleConfirmDeleteShot}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {isDeletingShot && <CircleNotch size={13} className="animate-spin" />}
                  <span>Xóa ảnh</span>
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </ModalPortal>
  )
}
