import { useEffect, useState, useCallback, useRef } from 'react'
import {
  X,
  CheckCircle,
  Copy,
  Check,
  CircleNotch,
  QrCode,
  ArrowSquareOut,
  ShieldCheck,
  CreditCard,
  Flask,
} from '@phosphor-icons/react'
import { Modal } from '@/components/common/Modal'
import { useToast } from '@/context/ToastContext'
import {
  walletService,
  type TopUpPackage,
  type TopUpOrderResponse,
  type PaymentGatewayOption,
  AVAILABLE_PAYMENT_GATEWAYS,
} from '@/api/services/wallet.service'

export interface PaymentCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  isDark: boolean
  packageItem: TopUpPackage | null
  isCustomMode: boolean
  customCredits: number
  effectiveCredits: number
  effectivePriceVnd: number
  onPaymentSuccess: (creditedCredits: number) => void
}

export function PaymentCheckoutModal({
  isOpen,
  onClose,
  isDark,
  packageItem,
  isCustomMode,
  customCredits,
  effectiveCredits,
  effectivePriceVnd,
  onPaymentSuccess,
}: PaymentCheckoutModalProps) {
  const toast = useToast()

  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayOption['id']>('VIETQR')
  const [isLoadingOrder, setIsLoadingOrder] = useState<boolean>(false)
  const [order, setOrder] = useState<TopUpOrderResponse | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)

  // Track initialization to avoid infinite re-creates
  const currentRequestRef = useRef<string>('')

  // Create or switch order
  const initOrder = useCallback(
    async (gatewayId: PaymentGatewayOption['id']) => {
      const requestKey = `${gatewayId}_${isCustomMode ? `custom_${customCredits}` : `pkg_${packageItem?.id}`}_${effectivePriceVnd}`
      if (currentRequestRef.current === requestKey && order) {
        return
      }
      currentRequestRef.current = requestKey

      try {
        setIsLoadingOrder(true)
        setOrderError(null)
        setOrder(null)

        const idempotencyKey = `stm_checkout_${Date.now()}`
        let res: TopUpOrderResponse

        if (isCustomMode) {
          res = await walletService.topUpCustom(customCredits, gatewayId, idempotencyKey)
        } else if (packageItem) {
          res = await walletService.topUp(packageItem.id, gatewayId, idempotencyKey)
        } else {
          return
        }

        setOrder(res)
      } catch (err: any) {
        setOrderError(err?.message || 'Không thể tạo đơn nạp tiền. Vui lòng thử lại.')
      } finally {
        setIsLoadingOrder(false)
      }
    },
    [isCustomMode, customCredits, packageItem, effectivePriceVnd, order]
  )

  // Trigger init on open or gateway change
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false)
      initOrder(selectedGateway)
    } else {
      currentRequestRef.current = ''
      setOrder(null)
      setIsSuccess(false)
    }
  }, [isOpen, selectedGateway, initOrder])

  // Handle 1-click Copy
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success(`Đã sao chép: ${text}`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Handle payment confirmation
  const handleConfirmPaid = () => {
    setIsSuccess(true)
    toast.success(`Nạp thành công +${effectiveCredits.toLocaleString('vi-VN')} Credits`)
    onPaymentSuccess(effectiveCredits)

    setTimeout(() => {
      onClose()
    }, 1800)
  }

  // Handle Instant Sandbox Confirmation
  const handleSandboxConfirm = () => {
    setIsSuccess(true)
    toast.success(`Thử nghiệm thành công: +${effectiveCredits.toLocaleString('vi-VN')} Credits`)
    onPaymentSuccess(effectiveCredits)

    setTimeout(() => {
      onClose()
    }, 1800)
  }

  const packageDisplayName = isCustomMode
    ? 'Nạp số lượng tùy chỉnh'
    : (packageItem?.packageName || 'Gói nạp Credits').replace(/\s*\([^)]*\)/g, '').trim()

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl">
      <div
        className={`rounded-2xl border shadow-2xl overflow-hidden transition-all text-gray-900 dark:text-white ${
          isDark
            ? 'bg-[#071317] border-white/10 shadow-black/80'
            : 'bg-white border-[#E8E4E3] shadow-xl'
        }`}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDark ? 'bg-[#00c4de]/10 text-[#00c4de]' : 'bg-[#007b8b]/10 text-[#007b8b]'
              }`}
            >
              <CreditCard size={22} weight="bold" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">Phương thức thanh toán</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {packageDisplayName} • {effectiveCredits.toLocaleString('vi-VN')} Credits •{' '}
                {effectivePriceVnd.toLocaleString('vi-VN')} đ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Đóng modal"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-6">
          {isSuccess ? (
            /* Success View */
            <div className="py-8 text-center space-y-4 animate-scaleIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle size={40} weight="fill" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black">Nạp Credits thành công</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  +{effectiveCredits.toLocaleString('vi-VN')} Credits đã được cộng vào tài khoản ví
                  của bạn.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isDark ? 'bg-[#00c4de] text-black' : 'bg-[#007b8b] text-white'
                }`}
              >
                Hoàn tất
              </button>
            </div>
          ) : (
            <>
              {/* Payment Gateways Selection (Step 1 inside Modal) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block">
                  Chọn kênh thanh toán:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {AVAILABLE_PAYMENT_GATEWAYS.map((gw) => {
                    const isSelected = selectedGateway === gw.id
                    return (
                      <button
                        key={gw.id}
                        type="button"
                        onClick={() => setSelectedGateway(gw.id)}
                        className={`p-3 rounded-xl text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? isDark
                              ? 'bg-[#00c4de]/10 border-2 border-[#00c4de] text-white shadow-xs'
                              : 'bg-teal-50/70 border-2 border-[#007b8b] text-gray-900 shadow-xs'
                            : isDark
                            ? 'bg-white/5 border border-white/10 hover:border-white/20 text-gray-300'
                            : 'bg-gray-50/70 border border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          {gw.id === 'VIETQR' && (
                            <QrCode
                              size={18}
                              weight="bold"
                              className={
                                isSelected
                                  ? isDark
                                    ? 'text-[#00c4de]'
                                    : 'text-[#007b8b]'
                                  : 'text-gray-400'
                              }
                            />
                          )}
                          {gw.id === 'MOMO' && (
                            <span className="w-4 h-4 rounded-full bg-[#a50064] text-white text-[10px] font-black flex items-center justify-center">
                              M
                            </span>
                          )}
                          {gw.id === 'MOCK' && (
                            <Flask
                              size={18}
                              weight="bold"
                              className={
                                isSelected
                                  ? isDark
                                    ? 'text-[#00c4de]'
                                    : 'text-[#007b8b]'
                                  : 'text-gray-400'
                              }
                            />
                          )}

                          {gw.badge && (
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                isDark
                                  ? 'bg-white/10 text-gray-300'
                                  : 'bg-gray-200/80 text-gray-700'
                              }`}
                            >
                              {gw.badge}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="font-extrabold text-xs block truncate">{gw.name}</span>
                          <span className="text-[10px] text-gray-400 block truncate mt-0.5">
                            {gw.id === 'VIETQR'
                              ? 'Quét mã ngân hàng'
                              : gw.id === 'MOMO'
                              ? 'Ví điện tử MoMo'
                              : 'Kiểm thử tức thì'}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Dynamic Payment Gateways Body */}
              {isLoadingOrder ? (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <CircleNotch
                    size={28}
                    className={`animate-spin mx-auto ${
                      isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
                    }`}
                  />
                  <p className="text-xs">Đang khởi tạo cổng thanh toán an toàn...</p>
                </div>
              ) : orderError ? (
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 text-xs text-center space-y-2">
                  <p>{orderError}</p>
                  <button
                    type="button"
                    onClick={() => initOrder(selectedGateway)}
                    className="font-bold underline cursor-pointer"
                  >
                    Thử lại
                  </button>
                </div>
              ) : (
                <>
                  {/* Gate 1: VietQR */}
                  {selectedGateway === 'VIETQR' && order && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        {/* VietQR Canvas */}
                        <div className="sm:col-span-5 flex flex-col items-center">
                          <div className="w-44 h-44 p-2 rounded-xl bg-white border border-gray-200 shadow-md flex items-center justify-center">
                            {order.qrCodeUrl ? (
                              <img
                                src={order.qrCodeUrl}
                                alt="Mã thanh toán VietQR"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <CircleNotch size={24} className="animate-spin text-gray-400" />
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400 text-center mt-2">
                            Quét bằng ứng dụng ngân hàng bất kỳ
                          </span>
                        </div>

                        {/* Bank Transfer Details with 1-click Copy */}
                        <div className="sm:col-span-7">
                          {order.bankInfo ? (
                            <div className="p-3.5 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 text-xs font-mono space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-[11px]">Ngân hàng:</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                  MB Bank - Ngân hàng Quân Đội
                                </span>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-[11px]">Số tài khoản:</span>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`font-black text-xs ${
                                      isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
                                    }`}
                                  >
                                    {order.bankInfo.accountNo}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(order.bankInfo!.accountNo, 'acc')}
                                    className="p-1 rounded bg-gray-200 dark:bg-white/10 hover:bg-gray-300 transition-colors cursor-pointer"
                                    title="Sao chép số tài khoản"
                                  >
                                    {copiedField === 'acc' ? (
                                      <Check size={12} className="text-emerald-500" />
                                    ) : (
                                      <Copy size={12} />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-[11px]">Người nhận:</span>
                                <span className="font-bold text-gray-900 dark:text-white uppercase">
                                  {order.bankInfo.accountName}
                                </span>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-[11px]">Số tiền:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-amber-500">
                                    {order.bankInfo.amount.toLocaleString('vi-VN')} đ
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopy(order.bankInfo!.amount.toString(), 'amt')
                                    }
                                    className="p-1 rounded bg-gray-200 dark:bg-white/10 hover:bg-gray-300 transition-colors cursor-pointer"
                                    title="Sao chép số tiền"
                                  >
                                    {copiedField === 'amt' ? (
                                      <Check size={12} className="text-emerald-500" />
                                    ) : (
                                      <Copy size={12} />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="flex justify-between items-center border-t border-gray-200 dark:border-white/10 pt-2">
                                <span className="text-gray-500 text-[11px]">Nội dung CK:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                    {order.bankInfo.transferContent}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopy(order.bankInfo!.transferContent, 'content')
                                    }
                                    className="p-1 rounded bg-gray-200 dark:bg-white/10 hover:bg-gray-300 transition-colors cursor-pointer"
                                    title="Sao chép nội dung"
                                  >
                                    {copiedField === 'content' ? (
                                      <Check size={12} className="text-emerald-500" />
                                    ) : (
                                      <Copy size={12} />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-start gap-2.5 text-[11px] text-gray-500 dark:text-gray-400">
                        <ShieldCheck
                          size={18}
                          className={`shrink-0 mt-0.5 ${
                            isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
                          }`}
                        />
                        <span>
                          Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống tự động đối soát và
                          cộng Credits trong 10 đến 30 giây.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Gate 2: MoMo */}
                  {selectedGateway === 'MOMO' && order && (
                    <div className="space-y-4 py-2">
                      <div className="p-4 rounded-xl bg-[#a50064]/5 border border-[#a50064]/20 space-y-3 text-center">
                        <span className="inline-block p-2 rounded-xl bg-[#a50064] text-white">
                          <QrCode size={24} weight="bold" />
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-[#a50064] dark:text-[#ff3b9d]">
                            Cổng thanh toán điện tử MoMo
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Nhấn nút bên dưới để mở liên kết thanh toán an toàn trực tiếp qua MoMo.
                          </p>
                        </div>

                        {order.payUrl ? (
                          <a
                            href={order.payUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-[#a50064] hover:bg-[#860051] text-white shadow-md transition-all cursor-pointer"
                          >
                            <span>Mở ứng dụng MoMo thanh toán</span>
                            <ArrowSquareOut size={16} />
                          </a>
                        ) : (
                          <div className="text-xs text-gray-400">Đang chuẩn bị liên kết MoMo...</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Gate 3: Sandbox */}
                  {selectedGateway === 'MOCK' && (
                    <div className="space-y-4 py-2">
                      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center space-y-2">
                        <span className="inline-block p-2 rounded-xl bg-amber-500/10 text-amber-500">
                          <Flask size={24} weight="bold" />
                        </span>
                        <h4 className="font-bold text-sm text-amber-600 dark:text-amber-400">
                          Môi trường thử nghiệm Sandbox
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                          Chế độ dành cho kiểm thử chức năng. Credits sẽ được cộng ngay lập tức vào
                          ví mà không yêu cầu giao dịch tài chính thực tế.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Modal Footer Actions */}
                  <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
                    >
                      Đóng
                    </button>

                    {selectedGateway === 'MOCK' ? (
                      <button
                        type="button"
                        onClick={handleSandboxConfirm}
                        className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer ${
                          isDark
                            ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black'
                            : 'bg-[#007b8b] hover:bg-[#00606d] text-white'
                        }`}
                      >
                        Xác nhận nạp ngay Sandbox
                      </button>
                    ) : selectedGateway === 'MOMO' ? (
                      <button
                        type="button"
                        onClick={handleConfirmPaid}
                        className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer ${
                          isDark
                            ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black'
                            : 'bg-[#007b8b] hover:bg-[#00606d] text-white'
                        }`}
                      >
                        Tôi đã thanh toán trên MoMo
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleConfirmPaid}
                        className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer ${
                          isDark
                            ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black'
                            : 'bg-[#007b8b] hover:bg-[#00606d] text-white'
                        }`}
                      >
                        Tôi đã chuyển khoản xong
                      </button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
