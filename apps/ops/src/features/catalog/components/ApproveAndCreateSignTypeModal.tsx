import React, { useState, useEffect } from 'react'
import { ModalPortal } from '@/components/common/ModalPortal'
import CustomSelect, { type OptionItem } from '@/components/common/CustomSelect'
import {
  CheckCircle,
  X,
  Sparkle,
  ArrowsClockwise,
  ShieldCheck,
  CircleNotch,
} from '@phosphor-icons/react'
import type { MissingSignTypeReport } from '@/data/catalogData'
import type { SignCategoryItem, ApproveAndCreateSignTypeInput } from '@/api/services/catalog.service'

interface ApproveAndCreateSignTypeModalProps {
  isOpen: boolean
  report: MissingSignTypeReport | null
  categories: SignCategoryItem[]
  onClose: () => void
  onSubmit: (payload: ApproveAndCreateSignTypeInput, triggerReprocess: boolean) => Promise<void>
  isSubmitting?: boolean
}

const SHAPE_OPTIONS: OptionItem[] = [
  { value: 'Circle', label: 'Hình tròn' },
  { value: 'Triangle', label: 'Hình tam giác đều' },
  { value: 'Rectangle', label: 'Hình chữ nhật hoặc vuông' },
  { value: 'Octagon', label: 'Hình bát giác' },
  { value: 'Diamond', label: 'Hình thoi' },
]

const COLOR_OPTIONS: OptionItem[] = [
  { value: 'Red-White', label: 'Đỏ - Trắng' },
  { value: 'Blue-White', label: 'Xanh dương - Trắng' },
  { value: 'Yellow-Black', label: 'Vàng - Đen' },
  { value: 'Green-White', label: 'Xanh lá - Trắng' },
  { value: 'Black-White', label: 'Đen - Trắng' },
]

export const ApproveAndCreateSignTypeModal: React.FC<ApproveAndCreateSignTypeModalProps> = ({
  isOpen,
  report,
  categories,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [signCode, setSignCode] = useState('')
  const [nameVi, setNameVi] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('1')
  const [shape, setShape] = useState<string>('Circle')
  const [colorScheme, setColorScheme] = useState<string>('Red-White')
  const [description, setDescription] = useState('')
  const [aiLabelPrompt, setAiLabelPrompt] = useState('')
  const [staffNotes, setStaffNotes] = useState('')
  const [triggerReprocess, setTriggerReprocess] = useState(true)

  // Populate initial values when report changes
  useEffect(() => {
    if (report) {
      // Suggest sign code from label or ID
      const suggestedCode = report.tempLabel.match(/^[A-Z]\.[0-9a-z]+/i)
        ? report.tempLabel.match(/^[A-Z]\.[0-9a-z]+/i)![0].toUpperCase()
        : `NEW_${report.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase()}`

      setSignCode(suggestedCode)
      setNameVi(report.tempLabel)
      setNameEn(report.clipPrompt || report.tempLabel)
      setDescription(
        report.reporterNote
          ? `Biển báo giao thông theo phản ánh thực địa: ${report.reporterNote}. Chuẩn quy chuẩn kỹ thuật QCVN 41:2019/BGTVT.`
          : 'Quy chuẩn kỹ thuật theo QCVN 41:2019/BGTVT.'
      )

      const rawShape = report.suggestedShape || (report as any).shape || (report as any).suggested_shape
      if (rawShape) {
        const lowerS = rawShape.toLowerCase()
        if (lowerS.includes('triang')) setShape('Triangle')
        else if (lowerS.includes('rect')) setShape('Rectangle')
        else if (lowerS.includes('squar')) setShape('Square')
        else if (lowerS.includes('octag')) setShape('Octagon')
        else setShape('Circle')
      } else {
        setShape('Circle')
      }

      const rawColor = report.suggestedColorScheme || (report as any).colorScheme || (report as any).suggested_color_scheme || (report as any).color_scheme || (report as any).color
      if (rawColor) {
        const lowerC = rawColor.toLowerCase()
        if (lowerC.includes('blue') && lowerC.includes('white')) setColorScheme('Blue-White')
        else if (lowerC.includes('yellow')) setColorScheme('Yellow-Black')
        else if (lowerC.includes('green')) setColorScheme('Green-White')
        else if (lowerC.includes('black')) setColorScheme('Black-White')
        else setColorScheme('Red-White')
      } else {
        setColorScheme('Red-White')
      }

      if (report.proposedCategoryId) {
        setSelectedCategoryId(String(report.proposedCategoryId))
      } else if (categories.length > 0) {
        setSelectedCategoryId(String(categories[0].id))
      }

      setAiLabelPrompt(
        report.clipPrompt ||
          `Road traffic sign with shape ${report.suggestedShape || 'circle'}, color scheme ${report.suggestedColorScheme || 'red and white'}, text and pictogram representing ${report.tempLabel}.`
      )
      setStaffNotes(
        `Phê duyệt loại biển mới từ báo cáo #${report.id}. Ban hành phiên bản Catalog mới và giải phóng candidate về hàng đợi thẩm định.`
      )
    }
  }, [report, categories])

  if (!isOpen || !report) return null

  const categoryOptions: OptionItem[] = categories.map((cat) => ({
    value: String(cat.id),
    label: `${cat.nameVi} (${cat.code})`,
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signCode.trim() || !nameVi.trim()) return

    const payload: ApproveAndCreateSignTypeInput = {
      signCode: signCode.trim().toUpperCase(),
      nameVi: nameVi.trim(),
      nameEn: nameEn.trim() || nameVi.trim(),
      proposedCategoryId: Number(selectedCategoryId) || undefined,
      categoryId: Number(selectedCategoryId) || undefined,
      suggestedShape: shape,
      shape,
      suggestedColorScheme: colorScheme,
      colorScheme,
      description: description.trim(),
      aiLabelPrompt: aiLabelPrompt.trim(),
      staffNotes: staffNotes.trim(),
    }

    await onSubmit(payload, triggerReprocess)
  }

  return (
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-3xl w-full p-5 sm:p-6 space-y-5 shadow-2xl relative my-6 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col text-left overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck size={24} weight="bold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10">
                    Báo cáo #{report.id}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Quyền Admin
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                  Phê duyệt &amp; Ban hành Loại Biển mới vào Catalog
                </h3>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer disabled:opacity-50"
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          {/* Form Content - Scrollable */}
          <form id="approve-sign-form" onSubmit={handleSubmit} className="overflow-y-auto space-y-4 pr-1 text-xs">
            {/* Evidence Header Comparison */}
            <div className="p-3.5 rounded-xl border border-[#007b8b]/20 dark:border-[#00c4de]/20 bg-[#007b8b]/5 dark:bg-[#00c4de]/5 flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 bg-black/20 shrink-0">
                  <img
                    src={report.sampleImageUrl}
                    alt={report.tempLabel}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Bằng chứng hiện trường</span>
                  <span className="font-bold text-gray-900 dark:text-white truncate block text-xs">
                    {report.tempLabel}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {report.roadAddress || `${report.lat.toFixed(4)}°, ${report.lng.toFixed(4)}°`}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-gray-600 dark:text-gray-300 sm:border-l sm:border-gray-200 sm:dark:border-white/10 sm:pl-4">
                Thao tác này sẽ tự động: <strong>1.</strong> Tạo mới TrafficSignType; <strong>2.</strong> Xuất bản Catalog Version mới; <strong>3.</strong> Giải phóng candidate về hàng đợi thẩm định; <strong>4.</strong> Đồng bộ danh mục client.
              </div>
            </div>

            {/* Core Sign Identifiers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                  Mã hiệu biển chuẩn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={signCode}
                  onChange={(e) => setSignCode(e.target.value.toUpperCase())}
                  placeholder="VD: P.124d, W.205b"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#007b8b] font-mono font-bold text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                  Tên biển Tiếng Việt <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nameVi}
                  onChange={(e) => setNameVi(e.target.value)}
                  placeholder="VD: Cấm xe buýt và taxi..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#007b8b] text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                  Tên biển Tiếng Anh
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="VD: No buses and taxis..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#007b8b] text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Category & Visual Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                  Nhóm biển <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  options={categoryOptions.length > 0 ? categoryOptions : [{ value: '1', label: 'Biển báo cấm' }]}
                  value={selectedCategoryId}
                  onChange={setSelectedCategoryId}
                  size="sm"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                  Hình dạng biển
                </label>
                <CustomSelect
                  options={SHAPE_OPTIONS}
                  value={shape}
                  onChange={setShape}
                  size="sm"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                  Hệ màu sắc
                </label>
                <CustomSelect
                  options={COLOR_OPTIONS}
                  value={colorScheme}
                  onChange={setColorScheme}
                  size="sm"
                  className="w-full"
                />
              </div>
            </div>

            {/* Technical Description */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                Mô tả quy chuẩn kỹ thuật
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ý nghĩa, căn cứ pháp lý và hiệu lực của biển báo..."
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#007b8b] text-gray-900 dark:text-white"
              />
            </div>

            {/* AI Vision Label Prompt */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-gray-700 dark:text-gray-300 font-semibold flex items-center gap-1.5">
                  <Sparkle size={14} className="text-[#007b8b] dark:text-[#00c4de]" />
                  <span>AI CLIP Vision Detection Prompt</span>
                </label>
                <span className="text-[10px] text-gray-400 font-mono">Dùng để huấn luyện / sync embeddings nhận diện tự động</span>
              </div>
              <textarea
                rows={2}
                value={aiLabelPrompt}
                onChange={(e) => setAiLabelPrompt(e.target.value)}
                placeholder="VD: Round traffic sign with red border, white background, depicting black truck symbol with red diagonal slash..."
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#007b8b] font-mono text-[11px] text-gray-900 dark:text-white"
              />
            </div>

            {/* Staff / Admin Audit Notes */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                Ghi chú phê duyệt &amp; Quyết định ban hành
              </label>
              <textarea
                rows={2}
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                placeholder="Nhập ghi chú phê duyệt hoặc căn cứ pháp lý..."
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#007b8b] text-gray-900 dark:text-white"
              />
            </div>

            {/* Candidate Reprocessing Checkbox */}
            <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 flex items-start gap-3">
              <input
                type="checkbox"
                id="trigger-reprocess-cb"
                checked={triggerReprocess}
                onChange={(e) => setTriggerReprocess(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#007b8b] focus:ring-[#007b8b] cursor-pointer"
              />
              <label htmlFor="trigger-reprocess-cb" className="text-xs text-gray-800 dark:text-gray-200 cursor-pointer">
                <span className="font-bold flex items-center gap-1 text-[#007b8b] dark:text-[#00c4de]">
                  <ArrowsClockwise size={14} weight="bold" />
                  Tự động quét lại các Candidate chưa nhận diện (Historical Candidates Reprocessing)
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                  Kích hoạt quy trình reprocess các candidate trước đây có độ tin cậy thấp hoặc chưa xác định đối chiếu với loại biển mới này (ngưỡng tương đồng 70%).
                </span>
              </label>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-white/10 shrink-0">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              form="approve-sign-form"
              disabled={isSubmitting || !signCode.trim() || !nameVi.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <CircleNotch size={16} className="animate-spin" />
                  <span>Đang ban hành Catalog &amp; đồng bộ...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} weight="bold" />
                  <span>Xác nhận Phê duyệt &amp; Ban hành ({signCode || 'Biển mới'})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}

export default ApproveAndCreateSignTypeModal
