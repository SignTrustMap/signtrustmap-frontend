import React, { useState, useEffect, useRef } from 'react'
import { X, CircleNotch } from '@phosphor-icons/react'
import { useToast } from '@/context/ToastContext'
import { ModalPortal } from '@/components/common/ModalPortal'
import CustomSelect from '@/components/common/CustomSelect'
import type { CatalogCategory, CatalogEntry } from '@/data/catalogData'
import { type VehicleType, catalogService } from '@/api/services/catalog.service'
import { normalizeSignCodeCase } from '@/features/map/utils/signUrlHelpers'

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

const CATEGORY_OPTIONS: Array<{ value: CatalogCategory; label: string; id: number }> = [
  { value: 'prohibitory', label: 'Biển báo cấm', id: 1 },
  { value: 'warning', label: 'Biển báo nguy hiểm', id: 2 },
  { value: 'mandatory', label: 'Biển hiệu lệnh', id: 3 },
  { value: 'speed_limit', label: 'Biển giới hạn tốc độ', id: 1 },
  { value: 'guide', label: 'Biển chỉ dẫn', id: 4 },
  { value: 'additional', label: 'Biển phụ', id: 5 },
]

const VEHICLE_OPTIONS: Array<{ value: VehicleType; labelVi: string }> = [
  { value: 'CAR', labelVi: 'Ô tô' },
  { value: 'MOTORCYCLE', labelVi: 'Xe máy' },
  { value: 'TRUCK', labelVi: 'Xe tải' },
  { value: 'BUS', labelVi: 'Xe buýt' },
  { value: 'BICYCLE', labelVi: 'Xe đạp' },
  { value: 'PEDESTRIAN', labelVi: 'Người đi bộ' },
]

const DEFAULT_ALLOWED_VEHICLES: VehicleType[] = VEHICLE_OPTIONS.map((v) => v.value)

export const CreateSignModal: React.FC<CreateSignModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  existingCodes,
}) => {
  const toast = useToast()
  const [codePrefix, setCodePrefix] = useState('P.')
  const [codeNumber, setCodeNumber] = useState('')
  const [codeError, setCodeError] = useState('')
  const [isDuplicateCode, setIsDuplicateCode] = useState(false)
  const [isCheckingApi, setIsCheckingApi] = useState(false)
  const [newNameVi, setNewNameVi] = useState('')
  const [newNameEn, setNewNameEn] = useState('')
  const [newCategory, setNewCategory] = useState<CatalogCategory>('prohibitory')
  const [allowedVehicles, setAllowedVehicles] = useState<VehicleType[]>(DEFAULT_ALLOWED_VEHICLES)

  // Representative Image state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [imageError, setImageError] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  if (!isOpen) return null

  const resetForm = () => {
    setCodePrefix('P.')
    setCodeNumber('')
    setCodeError('')
    setNewNameVi('')
    setNewNameEn('')
    setNewCategory('prohibitory')
    setAllowedVehicles(DEFAULT_ALLOWED_VEHICLES)
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setImageFile(null)
    setImageUrl('')
    setImagePreview('')
    setShowUrlInput(false)
    setImageError('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setImageError('Dung lượng tệp vượt quá giới hạn tối đa 20MB')
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
    setImagePreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const sanitizedNumber = codeNumber.trim().replace(/^[A-Za-z]+\./, '')
  const rawFullCode = `${codePrefix}${sanitizedNumber}`
  const cleanCode = normalizeSignCodeCase(rawFullCode)
  const hasInputNumber = Boolean(sanitizedNumber)

  // Real-time API check for code duplication with debounce
  useEffect(() => {
    if (!hasInputNumber) {
      setIsDuplicateCode(false)
      setIsCheckingApi(false)
      return
    }

    if (existingCodes?.some((c) => normalizeSignCodeCase(c) === cleanCode)) {
      setIsDuplicateCode(true)
    }

    setIsCheckingApi(true)
    let isCancelled = false

    const timer = setTimeout(async () => {
      try {
        const res = await catalogService.getSignTypes({ search: cleanCode, size: 20 })
        if (isCancelled) return

        const isApiDuplicate = Boolean(
          res?.items?.some((item) => normalizeSignCodeCase(item.signCode) === cleanCode)
        )

        if (isApiDuplicate) {
          setIsDuplicateCode(true)
        } else {
          const inLocal = existingCodes?.some((c) => normalizeSignCodeCase(c) === cleanCode)
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
      setCodeError('Vui lòng nhập số hiệu biển')
      return
    }

    if (isDuplicateCode) {
      setCodeError(`Mã biển "${cleanCode}" đã bị trùng trong danh mục`)
      return
    }

    if (allowedVehicles.length === 0) {
      toast.error('Vui lòng chọn ít nhất một loại phương tiện áp dụng')
      return
    }

    const hasImage = Boolean(imageFile || imageUrl.trim())
    if (!hasImage) {
      setImageError('Vui lòng tải ảnh đại diện hoặc nhập liên kết ảnh')
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
      shape: 'Circle',
      color: 'Red-White',
      description: 'Mô tả quy chuẩn kỹ thuật theo QCVN 41:2019/BGTVT.',
      descriptionVi: 'Mô tả quy chuẩn kỹ thuật theo QCVN 41:2019/BGTVT.',
      descriptionEn: 'Standard technical traffic regulation definition.',
      aiPrompt: `road traffic sign for ${cleanCode}`,
      clipPrompt: `road traffic sign for ${cleanCode}`,
      osmMapping: `traffic_sign=VN:${cleanCode}`,
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
              Thêm biển báo mới
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

          {/* Form Content - 2 Columns Layout */}
          <form id="create-sign-form" onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              {/* ─── CỘT TRÁI: ẢNH ĐẠI DIỆN (5 cols) ───── */}
              <div className="md:col-span-5 flex flex-col h-full">
                <div className="p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] flex flex-col h-full justify-between gap-3 shadow-2xs">
                  <div className="text-[11px] font-bold text-gray-900 dark:text-white shrink-0">
                    Ảnh đại diện biển báo <span className="text-red-500">*</span>
                  </div>

                  {/* Khung ảnh xem trước */}
                  <div className="relative flex-1 min-h-[220px] rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 overflow-hidden flex items-center justify-center shadow-xs">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Ảnh đại diện"
                        className="w-full h-full object-contain p-2 max-h-[220px]"
                      />
                    ) : (
                      <span className="text-gray-400 text-[11px] text-center p-2">
                        Chưa có ảnh
                      </span>
                    )}

                    {/* Badge text góc trên */}
                    <div className="absolute top-2 left-2">
                      {imageFile ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                          Ảnh mới tải lên
                        </span>
                      ) : imagePreview ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800/80 text-white backdrop-blur-xs">
                          Ảnh đại diện
                        </span>
                      ) : null}
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
                  <div className="space-y-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/30 hover:bg-gray-100 dark:hover:bg-white/5 text-[11px] font-semibold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer text-center shadow-2xs"
                      >
                        {imagePreview ? 'Đổi ảnh khác' : 'Tải ảnh từ máy'}
                      </button>

                      {imagePreview && (
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30 hover:bg-red-100/90 dark:hover:bg-red-900/40 hover:border-red-400 text-[11px] font-semibold text-red-600 dark:text-red-400 transition-colors cursor-pointer text-center shrink-0 shadow-2xs"
                        >
                          Gỡ ảnh
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
                </div>
              </div>

              {/* ─── CỘT PHẢI: TOÀN BỘ THÔNG SỐ (7 cols) ───── */}
              <div className="md:col-span-7 flex flex-col gap-3">
                {/* Hàng 1: Nhóm biển & Mã biển */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                      Nhóm biển <span className="text-red-500">*</span>
                    </label>
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
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                        Mã biển <span className="text-red-500">*</span>
                      </label>
                      {isCheckingApi ? (
                        <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                          <CircleNotch size={11} className="animate-spin text-[#007b8b] dark:text-[#00c4de]" />
                          <span>Đang kiểm tra...</span>
                        </span>
                      ) : isDuplicateCode ? (
                        <span className="text-[10px] font-mono text-red-500 font-bold">
                          Đã tồn tại
                        </span>
                      ) : null}
                    </div>

                    {/* 2 ô nhỏ: Tiền tố & Số hiệu */}
                    <div className="flex items-center gap-2">
                      <div className="relative shrink-0">
                        <input
                          type="text"
                          readOnly
                          tabIndex={-1}
                          value={codePrefix}
                          title="Tiền tố tự động gán theo nhóm biển"
                          className={`w-16 sm:w-20 px-2.5 py-2 rounded-lg border text-center font-mono font-bold text-xs select-none outline-none transition-colors cursor-not-allowed ${
                            hasInputNumber
                              ? isDuplicateCode
                                ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                                : 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                              : 'border-gray-300 dark:border-white/15 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300'
                          }`}
                        />
                      </div>

                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          value={codeNumber}
                          onChange={(e) => {
                            setCodeNumber(e.target.value)
                            if (codeError) setCodeError('')
                          }}
                          placeholder="127a hoặc 130"
                          className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-black/50 text-gray-900 dark:text-white font-mono text-xs placeholder:text-gray-400 outline-none transition-colors ${
                            hasInputNumber
                              ? isDuplicateCode
                                ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500/20 bg-red-50/10'
                                : 'border-emerald-500 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/20'
                              : 'border-gray-300 dark:border-white/15 focus:border-[#007b8b] dark:focus:border-[#00c4de] focus:ring-1 focus:ring-[#007b8b]/20'
                          }`}
                        />
                      </div>
                    </div>

                    {!isDuplicateCode && codeError && (
                      <p className="text-[11px] text-red-500 font-medium pt-0.5">{codeError}</p>
                    )}
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
                      value={newNameVi}
                      onChange={(e) => setNewNameVi(e.target.value)}
                      placeholder="Cấm dừng xe và đỗ xe"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] focus:ring-1 focus:ring-[#007b8b]/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                      Tên tiếng Anh
                    </label>
                    <input
                      type="text"
                      value={newNameEn}
                      onChange={(e) => setNewNameEn(e.target.value)}
                      placeholder="No Stopping and Parking"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] focus:ring-1 focus:ring-[#007b8b]/20"
                    />
                  </div>
                </div>

                {/* Hàng 3: Phương tiện áp dụng */}
                <div className="space-y-1.5 shrink-0">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                      Phương tiện áp dụng <span className="text-red-500">*</span>
                    </label>
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
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {VEHICLE_OPTIONS.map((v) => {
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
                          className={`flex items-center justify-center px-2.5 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                            selected
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
                      <p className="text-[10px] text-red-500 font-medium">
                        Vui lòng chọn ít nhất 1 loại phương tiện áp dụng
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        Các loại phương tiện tuân thủ theo quy định của biển báo
                      </p>
                    )}
                  </div>
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
              Hủy
            </button>
            <button
              type="submit"
              form="create-sign-form"
              disabled={!hasInputNumber || isDuplicateCode || !newNameVi.trim() || allowedVehicles.length === 0 || (!imageFile && !imageUrl.trim())}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#007b8b] hover:bg-[#00606d] text-white flex items-center justify-center min-w-[90px] shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Thêm biển báo
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
