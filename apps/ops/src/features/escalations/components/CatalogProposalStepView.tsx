import React, { useState, useEffect, useRef } from 'react'
import { useToast } from '@/context/ToastContext'
import CustomSelect from '@/components/common/CustomSelect'
import { CircleNotch } from '@phosphor-icons/react'
import {
  catalogService,
  STANDARD_SIGN_CATEGORIES,
  type SignCategoryItem,
} from '@/api/services/catalog.service'
import { escalationService } from '@/api/services/escalation.service'
import { resolveImageUrl } from '@/features/map/utils/signUrlHelpers'

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

// Shape & Color options according to Vietnamese traffic sign standards (QCVN 41:2019/BGTVT)
const SHAPE_OPTIONS = [
  { value: 'Circle', labelVi: 'Hình tròn', labelEn: 'Circle' },
  { value: 'Triangle', labelVi: 'Hình tam giác', labelEn: 'Triangle' },
  { value: 'Inverted Triangle', labelVi: 'Hình tam giác ngược', labelEn: 'Inverted Triangle' },
  { value: 'Octagon', labelVi: 'Hình bát giác', labelEn: 'Octagon' },
  { value: 'Rectangle', labelVi: 'Hình chữ nhật', labelEn: 'Rectangle' },
  { value: 'Square', labelVi: 'Hình vuông', labelEn: 'Square' },
  { value: 'Diamond', labelVi: 'Hình thoi', labelEn: 'Diamond' },
  { value: 'Other', labelVi: 'Khác', labelEn: 'Other' },
]

const COLOR_SCHEME_OPTIONS = [
  { value: 'Red-White', labelVi: 'Đỏ - Trắng', labelEn: 'Red-White' },
  { value: 'Blue-White', labelVi: 'Xanh dương - Trắng', labelEn: 'Blue-White' },
  { value: 'Yellow-Black', labelVi: 'Vàng - Đen', labelEn: 'Yellow-Black' },
  { value: 'Green-White', labelVi: 'Xanh lá - Trắng', labelEn: 'Green-White' },
  { value: 'White-Black', labelVi: 'Trắng - Đen', labelEn: 'White-Black' },
  { value: 'Other', labelVi: 'Khác', labelEn: 'Other' },
]

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

  // Form Fields
  const [signCode, setSignCode] = useState('')
  const [nameVi, setNameVi] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [shape, setShape] = useState('Circle')
  const [colorScheme, setColorScheme] = useState('Red-White')
  const [description, setDescription] = useState('')
  const [aiLabelPrompt, setAiLabelPrompt] = useState('')
  const [staffNotes, setStaffNotes] = useState('')

  // Categories list from live backend
  const [categories, setCategories] = useState<SignCategoryItem[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

  // Image Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Submitting State
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        if (repCatId && effectiveCats.some((c) => c.id === repCatId)) {
          setCategoryId(repCatId)
        } else if (effectiveCats.length > 0) {
          // Default to prohibition signs (P) if available, or first category
          const defaultCat = effectiveCats.find((c) => c.code === 'P' || c.code === 'PROHIBITORY') || effectiveCats[0]
          setCategoryId(defaultCat.id)
        }
      })
      .catch(() => {
        if (!isMounted) return
        setCategories(STANDARD_SIGN_CATEGORIES)
        setCategoryId(1)
      })
      .finally(() => {
        if (isMounted) setIsLoadingCategories(false)
      })

    // Pre-fill fields from report
    const proposedName = String(raw.proposedName || raw.tempLabel || '').trim()
    const rawCode = String(raw.suggestedCode || raw.signCode || '').trim()

    // Smart auto-detection of sign code (e.g. if name is "P.130" or matches code regex)
    let initialCode = rawCode
    if (!initialCode && proposedName) {
      const match = proposedName.match(/\b([A-Z]{1,3}\.[0-9]{1,4}[a-z]?)\b/i)
      if (match) {
        initialCode = match[1].toUpperCase()
      } else {
        initialCode = 'P.'
      }
    }
    if (!initialCode) initialCode = 'P.'

    setSignCode(initialCode)
    setNameVi(proposedName)
    setNameEn(raw.suggestedNameEn || raw.nameEn || proposedName)
    setShape(raw.suggestedShape || 'Circle')
    setColorScheme(raw.suggestedColorScheme || 'Red-White')
    setDescription(raw.description || raw.reporterNote || '')
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

  // Generate / update AI label prompt when relevant fields change
  useEffect(() => {
    if (nameVi && !aiLabelPrompt) {
      setAiLabelPrompt(
        `Biển báo giao thông "${nameEn || nameVi}". Hình dạng: ${shape}, màu sắc: ${colorScheme}. QCVN 41.`
      )
    }
  }, [nameVi, nameEn, shape, colorScheme])

  // Handle file selection (SVG or PNG, max 20MB)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      warning(
        isEn
          ? 'File size exceeds maximum limit of 20MB!'
          : 'Dung lượng file vượt quá giới hạn cho phép (tối đa 20MB)!'
      )
      return
    }

    // Validate type (SVG or PNG)
    const validTypes = ['image/svg+xml', 'image/png']
    const isSvgExt = file.name.toLowerCase().endsWith('.svg')
    const isPngExt = file.name.toLowerCase().endsWith('.png')
    if (!validTypes.includes(file.type) && !isSvgExt && !isPngExt) {
      warning(
        isEn
          ? 'Only SVG or PNG vector/graphic files are supported!'
          : 'Chỉ chấp nhận file đồ họa quy chuẩn định dạng SVG hoặc PNG!'
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

    const cleanCode = signCode.trim().toUpperCase()
    const cleanNameVi = nameVi.trim()
    const cleanStaffNotes = staffNotes.trim()

    if (!cleanCode) {
      warning(isEn ? 'Please enter a sign code!' : 'Vui lòng nhập mã biển!')
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
          signCode: cleanCode,
          nameVi: cleanNameVi,
          nameEn: nameEn.trim() || cleanNameVi,
          proposedCategoryId: categoryId,
          suggestedShape: shape,
          suggestedColorScheme: colorScheme,
          description: description.trim() || undefined,
          aiLabelPrompt: aiLabelPrompt.trim() || undefined,
          staffNotes: cleanStaffNotes,
        },
        selectedFile || undefined
      )

      const createdSignType = createRes?.createdSignType || createRes?.signType
      const newSignTypeId = createdSignType?.id

      // =========================================================================
      // BƯỚC 2: Cập nhật trạng thái ca Escalation sang RESOLVED
      // (Chỉ được phép thực thi sau khi Bước 1 trả về thành công)
      // =========================================================================
      await escalationService.resolveCase(caseId, {
        resolutionNote: cleanStaffNotes,
        actionType: 'APPROVED',
        targetSignTypeId: newSignTypeId,
        reportId,
      })

      success(
        isEn
          ? `Sign type ${cleanCode} approved!`
          : `Đã tạo biển ${cleanCode} và phê duyệt ca!`
      )

      onSuccess()
    } catch (err: any) {
      console.error('Failed to approve and create sign type:', err)
      // CHỐT CHẶN AN TOÀN: BƯỚC 2 TUYỆT ĐỐI KHÔNG CHẠY KHI BƯỚC 1 GẶP LỖI
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        (isEn ? 'Failed to create sign type. Escalation case status remains unchanged.' : 'Không thể tạo biển mới. Ca chuyển tiếp vẫn được giữ nguyên trạng thái!')
      error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

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
                {isEn ? 'Sign Representative Image' : 'Ảnh đại diện biển báo'}
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
                      SVG / PNG
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
                accept=".svg,.png,image/svg+xml,image/png"
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
                      ? 'Upload SVG / PNG'
                      : 'Tải ảnh SVG / PNG'}
                  </button>

                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30 hover:bg-red-100/90 dark:hover:bg-red-900/40 hover:border-red-400 text-[11px] font-semibold text-red-600 dark:text-red-400 transition-colors cursor-pointer text-center shrink-0 shadow-2xs"
                    >
                      {isEn ? 'Use sample photo' : 'Dùng lại ảnh mẫu'}
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                  {isEn
                    ? 'Supports SVG, PNG (max 20MB). Automatically uses field crop if no file uploaded.'
                    : 'Hỗ trợ SVG, PNG (tối đa 20MB). Tự động dùng ảnh hiện trường nếu không tải file.'}
                </p>
              </div>
            </div>
          </div>

          {/* ─── CỘT PHẢI: TOÀN BỘ THÔNG SỐ & PHÊ DUYỆT (7 cols) ───── */}
          <div className="md:col-span-7 flex flex-col h-full justify-between gap-3">
            {/* Hàng 1: Mã biển & Nhóm biển */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                  {isEn ? 'Sign code' : 'Mã biển'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={signCode}
                  onChange={(e) => setSignCode(e.target.value.toUpperCase())}
                  placeholder="VD: P.130, W.205..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/50 text-gray-900 dark:text-white font-mono text-xs uppercase placeholder:text-gray-400 outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] focus:ring-1 focus:ring-[#007b8b]/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                  {isEn ? 'Category' : 'Nhóm biển'} <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  value={categoryId ? String(categoryId) : ''}
                  onChange={(val) => setCategoryId(val ? Number(val) : undefined)}
                  options={categoryOptions}
                  placeholder={isLoadingCategories ? (isEn ? 'Loading...' : 'Đang tải...') : (isEn ? 'Select category' : 'Chọn nhóm biển')}
                  className="w-full text-xs"
                />
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
                  placeholder="VD: Cấm dừng xe và đỗ xe"
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
                  placeholder="VD: No Stopping and Parking"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] focus:ring-1 focus:ring-[#007b8b]/20"
                />
              </div>
            </div>

            {/* Hàng 3: Hình dạng & Màu sắc */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                  {isEn ? 'Shape' : 'Hình dạng'}
                </label>
                <CustomSelect
                  value={shape}
                  onChange={(val) => setShape(val)}
                  options={SHAPE_OPTIONS.map((s) => ({
                    value: s.value,
                    label: isEn ? s.labelEn : s.labelVi,
                  }))}
                  className="w-full text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                  {isEn ? 'Color scheme' : 'Màu sắc'}
                </label>
                <CustomSelect
                  value={colorScheme}
                  onChange={(val) => setColorScheme(val)}
                  options={COLOR_SCHEME_OPTIONS.map((c) => ({
                    value: c.value,
                    label: isEn ? c.labelEn : c.labelVi,
                  }))}
                  className="w-full text-xs"
                />
              </div>
            </div>

            {/* Hàng 4: Mô tả biển & Mô tả nhận diện AI (2 cột song song) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                  {isEn ? 'Description' : 'Mô tả biển'}
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ý nghĩa và quy định..."
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/50 text-gray-900 dark:text-white placeholder:text-gray-400 text-xs resize-none outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] focus:ring-1 focus:ring-[#007b8b]/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                  {isEn ? 'AI prompt' : 'Mô tả nhận diện AI'}
                </label>
                <textarea
                  rows={2}
                  value={aiLabelPrompt}
                  onChange={(e) => setAiLabelPrompt(e.target.value)}
                  placeholder="Mô tả nhận diện hình ảnh..."
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/50 text-gray-900 dark:text-white placeholder:text-gray-400 text-xs resize-none outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] focus:ring-1 focus:ring-[#007b8b]/20"
                />
              </div>
            </div>

            {/* Hàng 5: Ghi chú phê duyệt * (Kéo dài tự nhiên bằng flex-1 để bằng khít chiều cao cột trái) */}
            <div className="space-y-1 flex-1 flex flex-col min-h-[70px]">
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block shrink-0">
                {isEn ? 'Review notes' : 'Ghi chú phê duyệt'} <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                placeholder={isEn ? 'Enter review notes...' : 'Nhập ghi chú xử lý lưu vào lịch sử...'}
                className="w-full flex-1 min-h-[64px] p-2.5 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/50 text-gray-900 dark:text-white placeholder:text-gray-400 text-xs resize-none outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] focus:ring-1 focus:ring-[#007b8b]/20"
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
          disabled={isSubmitting || !signCode.trim() || !nameVi.trim() || !staffNotes.trim()}
          className={`inline-flex items-center justify-center px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
            !isSubmitting && signCode.trim() && nameVi.trim() && staffNotes.trim()
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
