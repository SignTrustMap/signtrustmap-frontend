import React, { useState, useEffect, useRef } from 'react'
import { useToast } from '@/context/ToastContext'
import { extractApiErrorMessage } from '@/api/client'
import CustomSelect from '@/components/common/CustomSelect'
import { CircleNotch, ChatText } from '@phosphor-icons/react'
import {
  catalogService,
  STANDARD_SIGN_CATEGORIES,
  VEHICLE_TYPE_OPTIONS,
  type SignCategoryItem,
  type VehicleType,
} from '@/api/services/catalog.service'
import { escalationService } from '@/api/services/escalation.service'
import { resolveImageUrl, normalizeSignCodeCase } from '@/features/map/utils/signUrlHelpers'

export interface CatalogProposalStepViewProps {
  caseId: string
  reportId: string
  targetData: any
  initialNotes?: string
  candidateCropUrl?: string | null
  candidateFrameUrl?: string | null
  isEn?: boolean
  onBack: () => void
  onSuccess: () => void
}

/**
 * Maps a sign category entity to its standard QCVN 41:2019 code prefix (with trailing dot).
 * Example: Prohibitory -> 'P.', Warning -> 'W.', Mandatory -> 'R.', Guide -> 'I.', Expressway -> 'IE.', Supplementary -> 'S.'
 */
export function getCategoryPrefix(category?: SignCategoryItem): string {
  if (!category) return 'P.'
  const code = (category.code || '').toUpperCase().trim()
  const name = `${category.nameVi || ''} ${category.nameEn || ''}`.toLowerCase()

  // 1. Direct standard short code matching
  if (['P', 'W', 'R', 'I', 'IE', 'S', 'SG', 'DP', 'E'].includes(code)) {
    return `${code}.`
  }

  // 2. Expressway indication signs
  if (code.includes('EXPRESS') || name.includes('cao tốc')) {
    return 'IE.'
  }

  // 3. Prohibitory signs (Biển báo cấm)
  if (code.includes('PROHIBIT') || code.includes('CAM') || name.includes('cấm')) {
    return 'P.'
  }

  // 4. Warning signs (Biển cảnh báo)
  if (code.includes('WARN') || code.includes('CANH_BAO') || name.includes('cảnh báo') || name.includes('nguy hiểm')) {
    return 'W.'
  }

  // 5. Mandatory signs (Biển hiệu lệnh)
  if (code.includes('MANDAT') || code.includes('ORDER') || code.includes('HIEU_LENH') || name.includes('hiệu lệnh')) {
    return 'R.'
  }

  // 6. Information / Guide signs (Biển chỉ dẫn)
  if (code.includes('GUIDE') || code.includes('INFO') || code.includes('CHI_DAN') || name.includes('chỉ dẫn')) {
    return 'I.'
  }

  // 7. Supplementary / Additional signs (Biển phụ)
  if (code.includes('SUPPLE') || code.includes('ADDIT') || code.includes('PHU') || name.includes('phụ')) {
    return 'S.'
  }

  // 8. Speed limit signs are prohibitive in VN (P.127)
  if (code.includes('SPEED') || name.includes('tốc độ')) {
    return 'P.'
  }

  // Fallback: if code has 1-3 uppercase letters
  if (/^[A-Z]{1,3}$/.test(code)) {
    return `${code}.`
  }

  return 'P.'
}

/**
 * Visual specifications (Shape & Color) for a sign category according to standard regulations.
 * Evaluated automatically when a category is selected. Users cannot edit these fields directly.
 */
export interface CategoryVisualSpec {
  shape: string
  color: string
  standardShape: string
  standardColor: string
}

export function getCategoryVisualSpec(category?: SignCategoryItem, isEn = false): CategoryVisualSpec {
  if (!category) {
    return {
      shape: '',
      color: '',
      standardShape: '',
      standardColor: '',
    }
  }

  const code = (category.code || '').toUpperCase().trim()
  const name = `${category.nameVi || ''} ${category.nameEn || ''}`.toLowerCase()

  // 1. Biển tốc độ tối đa: Hình tròn, Viền đỏ, nền trắng
  if (code.includes('SPEED') || name.includes('tốc độ')) {
    return {
      shape: isEn ? 'Circle' : 'Hình tròn',
      color: isEn ? 'Red border, white background' : 'Viền đỏ, nền trắng',
      standardShape: 'Circle',
      standardColor: 'Red - White',
    }
  }

  // 2. Biển báo tạm thời / Biển báo công trường: Nền màu vàng, Hình dạng không quan trọng
  if (
    code.includes('TEMP') ||
    code.includes('CONSTRUCT') ||
    code.includes('WORK') ||
    name.includes('tạm thời') ||
    name.includes('công trường')
  ) {
    return {
      shape: isEn ? 'Unspecified' : 'Không quy định',
      color: isEn ? 'Yellow background' : 'Nền màu vàng',
      standardShape: 'Any',
      standardColor: 'Yellow',
    }
  }

  // 3. Biển báo cấm: hình tròn, Viền đỏ, nền màu trắng
  if (code === 'P' || code.includes('PROHIBIT') || code.includes('CAM') || name.includes('cấm')) {
    return {
      shape: isEn ? 'Circle' : 'Hình tròn',
      color: isEn ? 'Red border, white background' : 'Viền đỏ, nền màu trắng',
      standardShape: 'Circle',
      standardColor: 'Red - White',
    }
  }

  // 4. Biển báo nguy hiểm: Hình tam giác đều, Viền đỏ, nền màu vàng
  if (
    code === 'W' ||
    code.includes('WARN') ||
    code.includes('CANH_BAO') ||
    name.includes('nguy hiểm') ||
    name.includes('cảnh báo')
  ) {
    return {
      shape: isEn ? 'Equilateral triangle' : 'Hình tam giác đều',
      color: isEn ? 'Red border, yellow background' : 'Viền đỏ, nền màu vàng',
      standardShape: 'Triangle',
      standardColor: 'Red - Yellow',
    }
  }

  // 5. Biển hiệu lệnh: Hình tròn, Nền màu xanh lam
  if (
    code === 'R' ||
    code.includes('MANDAT') ||
    code.includes('ORDER') ||
    code.includes('HIEU_LENH') ||
    name.includes('hiệu lệnh')
  ) {
    return {
      shape: isEn ? 'Circle' : 'Hình tròn',
      color: isEn ? 'Blue background' : 'Nền màu xanh lam',
      standardShape: 'Circle',
      standardColor: 'Blue',
    }
  }

  // 6. Biển chỉ dẫn: Hình chữ nhật/hình vuông, Nền màu xanh lam
  if (
    code === 'I' ||
    code === 'IE' ||
    code.includes('INFO') ||
    code.includes('GUIDE') ||
    code.includes('EXPRESS') ||
    name.includes('chỉ dẫn') ||
    name.includes('cao tốc')
  ) {
    return {
      shape: isEn ? 'Rectangle / Square' : 'Hình chữ nhật/hình vuông',
      color: isEn ? 'Blue background' : 'Nền màu xanh lam',
      standardShape: 'Rectangle',
      standardColor: 'Blue',
    }
  }

  // 7. Biển phụ: Hình chữ nhật, Viền đen, nền màu trắng
  if (code === 'S' || code.includes('SUPPLE') || code.includes('PHU') || name.includes('phụ')) {
    return {
      shape: isEn ? 'Rectangle' : 'Hình chữ nhật',
      color: isEn ? 'Black border, white background' : 'Viền đen, nền màu trắng',
      standardShape: 'Rectangle',
      standardColor: 'Black - White',
    }
  }

  // Fallback
  return {
    shape: isEn ? 'Circle' : 'Hình tròn',
    color: isEn ? 'Standard' : 'Theo quy chuẩn',
    standardShape: 'Circle',
    standardColor: 'Standard',
  }
}

export const DEFAULT_ALLOWED_VEHICLES: VehicleType[] = VEHICLE_TYPE_OPTIONS.map((v) => v.value).filter(
  (v) => v !== 'PEDESTRIAN'
)

export function CatalogProposalStepView({
  caseId,
  reportId,
  targetData,
  initialNotes = '',
  candidateCropUrl,
  isEn = false,
  onBack,
  onSuccess,
}: CatalogProposalStepViewProps) {
  const { success, error, warning } = useToast()

  // Form Fields (Split into uneditable category prefix + numeric input)
  const [codePrefix, setCodePrefix] = useState('P.')
  const [codeNumber, setCodeNumber] = useState('')
  const [nameVi, setNameVi] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [description, setDescription] = useState('')
  const [staffNotes, setStaffNotes] = useState('')
  const [allowedVehicles, setAllowedVehicles] = useState<VehicleType[]>(DEFAULT_ALLOWED_VEHICLES)

  // Categories list from live backend
  const [categories, setCategories] = useState<SignCategoryItem[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

  // Image Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Submitting State
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Existing sign codes for duplicate validation
  const [existingSignCodes, setExistingSignCodes] = useState<string[]>([])
  const [isDuplicateCode, setIsDuplicateCode] = useState(false)
  const [isCheckingApi, setIsCheckingApi] = useState(false)

  // Extract raw report data for pre-fill
  const raw = targetData?.data || targetData || {}
  const rawCandidate = raw.candidate || raw
  const effectiveCropUrl =
    candidateCropUrl || resolveImageUrl(rawCandidate.signCropUrl || raw.sampleImageUrl)

  // Load categories and pre-fill form on mount
  useEffect(() => {
    let isMounted = true
    setIsLoadingCategories(true)

    catalogService
      .getCategories()
      .then((cats) => {
        if (!isMounted) return
        const cleanCats = (cats || []).filter(
          (c) =>
            !c.code?.toLowerCase().includes('mock') &&
            !c.nameVi?.toLowerCase().includes('mock') &&
            !c.nameEn?.toLowerCase().includes('mock')
        )
        const effectiveCats = cleanCats.length > 0 ? cleanCats : STANDARD_SIGN_CATEGORIES
        setCategories(effectiveCats)

        // Pre-select category if specified in report
        const repCatId = raw.proposedCategoryId ?? raw.categoryId
        let initialCat: SignCategoryItem | undefined
        if (repCatId && effectiveCats.some((c) => c.id === repCatId)) {
          setCategoryId(repCatId)
          initialCat = effectiveCats.find((c) => c.id === repCatId)
        } else if (effectiveCats.length > 0) {
          // Default to prohibition signs (P) if available, or first category
          const defaultCat =
            effectiveCats.find((c) => c.code === 'P' || c.code === 'PROHIBITORY' || c.nameVi?.toLowerCase().includes('cấm')) ||
            effectiveCats[0]
          setCategoryId(defaultCat.id)
          initialCat = defaultCat
        }

        if (initialCat) {
          setCodePrefix(getCategoryPrefix(initialCat))
        }
      })
      .catch(() => {
        if (!isMounted) return
        setCategories(STANDARD_SIGN_CATEGORIES)
        setCategoryId(1)
        setCodePrefix('P.')
      })
      .finally(() => {
        if (isMounted) setIsLoadingCategories(false)
      })

    // Load ALL existing sign types across all pages to detect duplicate codes
    catalogService
      .getAllSignTypes()
      .then((res) => {
        if (!isMounted || !res?.items) return
        const codes = (res.items.map((i) => i.signCode?.toUpperCase()).filter(Boolean) as string[])
        setExistingSignCodes(codes)
      })
      .catch(() => {
        catalogService
          .getSignTypes({ page: 0, size: 100 })
          .then((res) => {
            if (!isMounted || !res?.items) return
            const codes = (res.items.map((i) => i.signCode?.toUpperCase()).filter(Boolean) as string[])
            setExistingSignCodes(codes)
          })
          .catch(() => {})
      })

    // Pre-fill fields from report - keep code and names blank for manual admin specification
    setCodeNumber('')
    setNameVi('')
    setNameEn('')
    const initialAllowedVehicles =
      Array.isArray(raw.allowedVehicles) && raw.allowedVehicles.length > 0
        ? raw.allowedVehicles
        : DEFAULT_ALLOWED_VEHICLES
    setAllowedVehicles(initialAllowedVehicles)
    const extractedDescription =
      raw.description ||
      raw.reporterNote ||
      raw.reporter_note ||
      raw.note ||
      raw.regulationNotes ||
      raw.fieldNotes ||
      rawCandidate?.submission?.note ||
      rawCandidate?.note ||
      raw.submission?.note ||
      ''
    setDescription(extractedDescription)
    setStaffNotes(
      initialNotes ||
        raw.staffNotes ||
        `Phê duyệt loại biển mới theo đề xuất của ca #${caseId.slice(0, 8)}.`
    )

    // Reset file upload
    setSelectedFile(null)
    setPreviewUrl(null)

    return () => {
      isMounted = false
    }
  }, [caseId, initialNotes])


  // Handle file selection (SVG or PNG, max 20MB)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      warning(
        isEn
          ? 'File size exceeds maximum limit of 20MB!'
          : 'Dung lượng file vượt quá giới hạn tối đa 20MB!'
      )
      return
    }

    // Validate type (JPEG, PNG, WebP, HEIF)
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']
    const hasValidExt = validExts.some((ext) => file.name.toLowerCase().endsWith(ext))
    if (!validMimes.includes(file.type) && !hasValidExt) {
      warning(
        isEn
          ? 'Representative image must be JPEG, PNG, WebP, or HEIF!'
          : 'Chỉ chấp nhận file ảnh định dạng PNG, JPG, WebP hoặc HEIF!'
      )
      return
    }

    setSelectedFile(file)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
  }

  // Remove chosen file (fallback to candidate crop)
  const handleRemoveFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  // Handle Form Submission with Fail-Safe Sequential Execution
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const fullCode = normalizeSignCodeCase(`${codePrefix}${codeNumber.trim()}`)
    const cleanNameVi = nameVi.trim()
    const cleanStaffNotes = staffNotes.trim()

    if (!codeNumber.trim()) {
      warning(isEn ? 'Please enter the sign number!' : 'Vui lòng nhập số hiệu biển!')
      return
    }

    if (existingSignCodes.some((c) => normalizeSignCodeCase(c) === fullCode)) {
      warning(
        isEn
          ? `Sign code "${fullCode}" already exists in the catalog! Please choose another number or merge into existing catalog sign.`
          : `Mã biển "${fullCode}" đã bị trùng trong danh mục! Vui lòng chọn số khác hoặc chuyển sang chức năng Gộp Catalog.`
      )
      return
    }

    if (!cleanNameVi) {
      warning(isEn ? 'Please enter the Vietnamese name!' : 'Vui lòng nhập tên tiếng Việt!')
      return
    }
    if (!categoryId) {
      warning(isEn ? 'Please select a category!' : 'Vui lòng chọn nhóm biển!')
      return
    }
    if (allowedVehicles.length === 0) {
      warning(
        isEn
          ? 'Please select at least one applicable vehicle type!'
          : 'Vui lòng chọn ít nhất một loại phương tiện áp dụng!'
      )
      return
    }
    if (!selectedFile) {
      warning(
        isEn
          ? 'Representative image file (PNG, JPG, WebP) is required to approve and create a new sign!'
          : 'Bắt buộc phải tải lên file ảnh đại diện quy chuẩn (PNG, JPG, WebP) để tạo biển mới!'
      )
      return
    }
    if (!cleanStaffNotes) {
      warning(isEn ? 'Please enter review notes!' : 'Vui lòng nhập ghi chú phê duyệt!')
      return
    }

    setIsSubmitting(true)

    try {
      // =========================================================================
      // BƯỚC 1: Tạo biển mới trong Database qua API approve-and-create-type
      // =========================================================================
      const createRes = await catalogService.approveAndCreateType(
        reportId,
        {
          signCode: fullCode,
          nameVi: cleanNameVi,
          nameEn: nameEn.trim() || cleanNameVi,
          proposedCategoryId: categoryId,
          description: description.trim() || undefined,
          staffNotes: cleanStaffNotes,
          allowedVehicles: allowedVehicles as any,
        },
        selectedFile
      )

      const createdSignType = createRes?.createdSignType || createRes?.signType
      const newSignTypeId = createdSignType?.id

      // =========================================================================
      // BƯỚC 2: Cập nhật trạng thái ca Escalation sang RESOLVED
      // (Chỉ được phép thực thi sau khi Bước 1 trả về thành công)
      // =========================================================================
      try {
        await escalationService.resolveCase(caseId, {
          resolutionNote: cleanStaffNotes,
          actionType: 'APPROVED',
          targetSignTypeId: newSignTypeId,
          reportId,
        })
      } catch (resolveErr: any) {
        const resolveMsg = extractApiErrorMessage(resolveErr)
        if (!resolveMsg.toLowerCase().includes('already resolved')) {
          throw resolveErr
        }
      }

      success(
        isEn
          ? `Sign type ${fullCode} approved!`
          : `Đã tạo biển ${fullCode} và phê duyệt ca!`
      )

      onSuccess()
    } catch (err: any) {
      const status = err?.response?.status || err?.status || err?.statusCode
      const formattedMessage = extractApiErrorMessage(err)
      console.error('Failed to approve and create sign type:', formattedMessage || err)
      if (status === 409 || formattedMessage.toLowerCase().includes('already exists') || formattedMessage.toLowerCase().includes('trùng')) {
        error(
          isEn
            ? `Sign code "${fullCode}" already exists in the catalog! Please choose another code.`
            : `Mã biển "${fullCode}" đã tồn tại trong Catalog! Vui lòng chọn mã khác.`
        )
      } else {
        const errorMsg =
          formattedMessage ||
          (isEn ? 'Failed to create sign type. Escalation case status remains unchanged.' : 'Không thể tạo biển mới. Ca chuyển tiếp vẫn được giữ nguyên trạng thái!')
        error(errorMsg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const fullCode = normalizeSignCodeCase(`${codePrefix}${codeNumber.trim()}`)
  const hasInputNumber = Boolean(codeNumber.trim())

  // Real-time API check for code duplication with debounce
  useEffect(() => {
    if (!hasInputNumber) {
      setIsDuplicateCode(false)
      setIsCheckingApi(false)
      return
    }

    // 1. Instant check against already known sign codes
    const isLocalDuplicate = existingSignCodes.some((c) => normalizeSignCodeCase(c) === fullCode)
    if (isLocalDuplicate) {
      setIsDuplicateCode(true)
    }

    // 2. Query API to verify with live database
    setIsCheckingApi(true)
    let isCancelled = false

    const timer = setTimeout(async () => {
      try {
        const res = await catalogService.getSignTypes({ search: fullCode, size: 20 })
        if (isCancelled) return

        const isApiDuplicate = Boolean(
          res?.items?.some((item) => item.signCode?.trim().toUpperCase() === fullCode)
        )

        if (isApiDuplicate) {
          setIsDuplicateCode(true)
          setExistingSignCodes((prev) => (prev.includes(fullCode) ? prev : [...prev, fullCode]))
        } else {
          // If not in API and not in local cache
          const inLocal = existingSignCodes.some((c) => c.toUpperCase() === fullCode)
          setIsDuplicateCode(Boolean(inLocal))
        }
      } catch (err) {
        console.error('[CatalogProposal] Duplicate check API error:', err)
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
  }, [fullCode, hasInputNumber, existingSignCodes])

  const categoryOptions = categories.map((c) => ({
    value: String(c.id),
    label: isEn ? (c.nameEn || c.nameVi) : c.nameVi,
  }))

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Scrollable Form Body */}
      <form id="catalog-proposal-step-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          {/* ─── CỘT TRÁI: 100% VỀ ẢNH ĐẠI DIỆN (5 cols) ───── */}
          <div className="md:col-span-5 flex flex-col h-full">
            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] flex flex-col h-full justify-between gap-3 shadow-2xs">
              <div className="text-[11px] font-bold text-gray-900 dark:text-white shrink-0">
                {isEn ? 'Sign Representative Image' : 'Ảnh đại diện biển báo'} <span className="text-red-500">*</span>
              </div>

              {/* Khung ảnh: flex-1 tự co giãn đồng bộ chiều cao với cột phải */}
              <div className="relative flex-1 min-h-[220px] rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 overflow-hidden flex items-center justify-center shadow-xs">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Uploaded sign preview"
                    className="w-full h-full object-contain p-2"
                  />
                ) : effectiveCropUrl ? (
                  <img
                    src={effectiveCropUrl}
                    alt="Candidate crop"
                    className="w-full h-full object-contain sm:object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-[11px] text-center p-2">
                    {isEn ? 'No photo' : 'Chưa có ảnh'}
                  </span>
                )}

                {/* Badge text góc trên */}
                <div className="absolute top-2 left-2">
                  {previewUrl ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                      PNG / JPG
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800/80 text-white backdrop-blur-xs">
                      {isEn ? 'Field crop' : 'Ảnh hiện trường'}
                    </span>
                  )}
                </div>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png,image/jpeg,image/webp,image/heic,image/heif,.png,.jpg,.jpeg,.webp"
                className="hidden"
              />

              {/* Upload Controls & Helper */}
              <div className="space-y-2 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/30 hover:bg-gray-100 dark:hover:bg-white/5 text-[11px] font-semibold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer text-center shadow-2xs"
                  >
                    {previewUrl
                      ? isEn
                        ? 'Change image'
                        : 'Đổi ảnh khác'
                      : isEn
                      ? 'Upload image (PNG/JPG) *'
                      : 'Tải ảnh PNG / JPG *'}
                  </button>

                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30 hover:bg-red-100/90 dark:hover:bg-red-900/40 hover:border-red-400 text-[11px] font-semibold text-red-600 dark:text-red-400 transition-colors cursor-pointer text-center shrink-0 shadow-2xs"
                    >
                      {isEn ? 'Remove' : 'Gỡ ảnh'}
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                  {isEn
                    ? 'Supports PNG, JPEG, WebP, max 20MB. File upload is required for catalog creation.'
                    : 'Hỗ trợ định dạng PNG, JPG, WebP, tối đa 20MB. Bắt buộc phải tải file ảnh chuẩn để tạo biển mới.'}
                </p>
              </div>
            </div>
          </div>

          {/* ─── CỘT PHẢI: TOÀN BỘ THÔNG SỐ & PHÊ DUYỆT (7 cols) ───── */}
          <div className="md:col-span-7 flex flex-col gap-3">
            {/* Hàng 1: Nhóm biển & Mã biển */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                  {isEn ? 'Category' : 'Nhóm biển'} <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  value={categoryId ? String(categoryId) : ''}
                  onChange={(val) => {
                    const newId = val ? Number(val) : undefined
                    setCategoryId(newId)
                    if (newId) {
                      const cat = categories.find((c) => c.id === newId)
                      if (cat) {
                        setCodePrefix(getCategoryPrefix(cat))
                      }
                    }
                  }}
                  options={categoryOptions}
                  placeholder={isLoadingCategories ? (isEn ? 'Loading...' : 'Đang tải...') : (isEn ? 'Select category' : 'Chọn nhóm biển')}
                  className="w-full text-xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                    {isEn ? 'Sign code' : 'Mã biển'} <span className="text-red-500">*</span>
                  </label>
                  {isCheckingApi ? (
                    <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                      <CircleNotch size={11} className="animate-spin text-[#007b8b] dark:text-[#00c4de]" />
                      <span>{isEn ? 'Checking...' : 'Đang kiểm tra...'}</span>
                    </span>
                  ) : isDuplicateCode ? (
                    <span className="text-[10px] font-mono text-red-500 font-bold">
                      {isEn ? 'Already exists' : 'Đã tồn tại'}
                    </span>
                  ) : null}
                </div>

                {/* 2 ô nhỏ: Ô đầu tiền tố (không sửa được), Ô 2 chỉ nhập số */}
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <input
                      type="text"
                      readOnly
                      tabIndex={-1}
                      value={codePrefix}
                      title={isEn ? 'Prefix (assigned by category)' : 'Tiền tố (tự động gán theo nhóm biển)'}
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
              </div>
            </div>

            {/* Hàng 2: Tên tiếng Việt & Tên tiếng Anh */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                  {isEn ? 'Vietnamese name' : 'Tên tiếng Việt'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nameVi}
                  onChange={(e) => setNameVi(e.target.value)}
                  placeholder="Cấm dừng xe và đỗ xe"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] focus:ring-1 focus:ring-[#007b8b]/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                  {isEn ? 'English name' : 'Tên tiếng Anh'}
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="No Stopping and Parking"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] focus:ring-1 focus:ring-[#007b8b]/20"
                />
              </div>
            </div>

            {/* Hàng 3: Phương tiện áp dụng (allowedVehicles) */}
            <div className="space-y-1.5 shrink-0">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                  {isEn ? 'Applicable Vehicles' : 'Phương tiện áp dụng'} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAllowedVehicles(VEHICLE_TYPE_OPTIONS.map((v) => v.value))}
                    className="text-[10px] text-[#007b8b] dark:text-[#00c4de] hover:underline cursor-pointer font-medium"
                  >
                    {isEn ? 'Select all' : 'Chọn tất cả'}
                  </button>
                  <span className="text-gray-300 dark:text-white/20">•</span>
                  <button
                    type="button"
                    onClick={() => setAllowedVehicles([])}
                    className="text-[10px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:underline cursor-pointer font-medium"
                  >
                    {isEn ? 'Clear' : 'Bỏ chọn'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
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
                      className={`flex items-center px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        selected
                          ? 'bg-[#007b8b]/10 border-[#007b8b] text-[#007b8b] dark:bg-[#00c4de]/15 dark:border-[#00c4de] dark:text-[#00c4de]'
                          : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      <span className="truncate">{isEn ? v.labelEn : v.labelVi}</span>
                    </button>
                  )
                })}
              </div>

              {/* Hàng thông báo cố định chiều cao (Zero Layout Shift): hợp lệ hiện hướng dẫn, bỏ chọn hiện cảnh báo */}
              <div className="min-h-[16px] flex items-center">
                {allowedVehicles.length === 0 ? (
                  <p className="text-[10px] text-red-500 font-medium animate-in fade-in">
                    {isEn ? 'Please select at least 1 applicable vehicle type.' : 'Vui lòng chọn ít nhất 1 loại phương tiện áp dụng.'}
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    {isEn ? 'Select vehicles affected by this sign.' : 'Các loại phương tiện tuân thủ theo quy định của biển báo.'}
                  </p>
                )}
              </div>
            </div>

            {/* Mô tả từ người gửi (Mô tả của người gửi / ghi chú quy định từ hiện trường - hiển thị giống bên staff) */}
            {description ? (
              <div className="space-y-1 shrink-0">
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <ChatText size={12} className="text-gray-400 shrink-0" />
                  <span>{isEn ? 'Reporter Description:' : 'Mô tả từ người gửi:'}</span>
                </span>
                <div className="px-2.5 py-1.5 rounded-lg border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] text-gray-800 dark:text-gray-200 text-xs leading-relaxed max-h-[64px] overflow-y-auto">
                  {description}
                </div>
              </div>
            ) : null}

            {/* Hàng 5: Ghi chú phê duyệt * (Kích thước chuẩn, vừa vặn không bị kéo dãn bất thường) */}
            <div className="space-y-1 shrink-0">
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block shrink-0">
                {isEn ? 'Review notes' : 'Ghi chú phê duyệt'} <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                placeholder={isEn ? 'Enter review notes...' : 'Nhập ghi chú xử lý lưu vào lịch sử...'}
                className="w-full h-20 p-2.5 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/50 text-gray-900 dark:text-white placeholder:text-gray-400 text-xs resize-none outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] focus:ring-1 focus:ring-[#007b8b]/20 transition-colors"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Step View Footer Actions (Clean, minimal icons) */}
      <div className="px-5 py-3 border-t border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.02] flex items-center justify-between gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          {isEn ? 'Back' : 'Quay lại'}
        </button>

        <button
          type="submit"
          form="catalog-proposal-step-form"
          disabled={isSubmitting || !codeNumber.trim() || isDuplicateCode || !nameVi.trim() || !staffNotes.trim() || allowedVehicles.length === 0}
          className={`inline-flex items-center justify-center px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
            !isSubmitting && codeNumber.trim() && !isDuplicateCode && nameVi.trim() && staffNotes.trim() && allowedVehicles.length > 0
              ? 'bg-[#007b8b] hover:bg-[#006471] dark:bg-[#00c4de] dark:hover:bg-[#00b2c9] text-white dark:text-black shadow-[#007b8b]/20'
              : 'bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-1.5">
              <CircleNotch size={14} className="animate-spin" />
              <span>{isEn ? 'Processing...' : 'Đang xử lý...'}</span>
            </span>
          ) : (
            <span>{isEn ? 'Approve & Create' : 'Tạo biển & Duyệt'}</span>
          )}
        </button>
      </div>
    </div>
  )
}
