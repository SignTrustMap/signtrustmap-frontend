import {
  DeviceMobile,
  AppleLogo,
  GooglePlayLogo,
  CheckCircle,
  NavigationArrow,
  VideoCamera,
  Coins,
  ArrowsClockwise,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'

const keyFeatures = [
  {
    icon: <VideoCamera size={26} weight="duotone" />,
    title: 'Ghi Nhận Chuyến Đi (Video + GPX)',
    desc: 'Đồng bộ hóa video camera hành trình và vệt quỹ đạo GPX thực địa để hệ thống AI tự động bóc tách biển báo.',
  },
  {
    icon: <NavigationArrow size={26} weight="duotone" />,
    title: 'Cảnh Báo Đúng Hướng Di Chuyển',
    desc: 'Nhận diện chiều xe chạy và chỉ phát cảnh báo âm thanh/hình ảnh đối với các biển báo có hiệu lực theo làn đường.',
  },
  {
    icon: <Coins size={26} weight="duotone" />,
    title: 'Thưởng Tín Dụng (Credit Economy)',
    desc: 'Tích lũy điểm thưởng tín dụng minh bạch khi chuyến đi hoặc hình ảnh đóng góp được cộng đồng kiểm duyệt thông qua.',
  },
  {
    icon: <ArrowsClockwise size={26} weight="duotone" />,
    title: 'Nhiệm Vụ Tái Thẩm Định Thực Địa',
    desc: 'Nhận các nhiệm vụ kiểm tra lại biển báo cũ (Stale Signs) xung quanh vị trí của bạn để nhận thêm phần thưởng lớn.',
  },
]

export default function ProductApp() {
  const { isDark } = useTheme()

  return (
    <div
      className={`w-full min-h-screen py-10 sm:py-16 transition-colors ${
        isDark ? 'bg-[#030708] text-white' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ─── SECTION 1: HERO SHOWCASE (2 Columns) ────────────────── */}
        <div
          className={`rounded-[28px] p-6 sm:p-12 lg:p-14 border relative overflow-hidden shadow-2xl mb-14 transition-all ${
            isDark
              ? 'glass-panel border-white/10 bg-gradient-to-br from-[#061418] via-[#040b0d] to-[#020506]'
              : 'bg-white border-[#E8E4E3] shadow-gray-200/80'
          }`}
        >
          {/* Ambient Glow */}
          <div
            className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none ${
              isDark ? 'bg-[#00c4de]/12' : 'bg-teal-100/60'
            }`}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
            {/* Left Content Column (7 cols) */}
            <div className="lg:col-span-7 flex flex-col text-left">
              {/* Eyebrow badge */}
              <div
                className={`inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full text-xs font-semibold w-fit transition-colors ${
                  isDark
                    ? 'bg-[#007b8b]/20 border border-[#00c4de]/30 text-[#00c4de]'
                    : 'bg-teal-50 border border-[#007b8b]/30 text-[#007b8b]'
                }`}
              >
                <DeviceMobile size={16} weight="bold" />
                <span>Ứng dụng di động SignTrustMap • iOS & Android</span>
              </div>

              {/* H1 Heading */}
              <h1
                className={`text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4 font-sans ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Ứng Dụng Khảo Sát &{' '}
                <span
                  className={`text-transparent bg-clip-text ${
                    isDark
                      ? 'bg-gradient-to-r from-[#00c4de] via-[#d3f7ff] to-[#007b8b]'
                      : 'bg-gradient-to-r from-[#007b8b] to-[#00c4de]'
                  }`}
                >
                  Dẫn Đường Cảnh Báo
                </span>
              </h1>

              {/* Subtitle Paragraph */}
              <p
                className={`text-base sm:text-lg leading-relaxed mb-8 max-w-2xl ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Biến điện thoại di động hoặc camera hành trình thành công cụ số hóa hạ tầng giao thông. Nhận cảnh báo biển báo thông minh theo đúng chiều di chuyển và tích lũy điểm thưởng tín dụng giá trị.
              </p>

              {/* Checklist */}
              <ul className="flex flex-col gap-3 mb-9">
                {[
                  'Tự động ghi và đồng bộ Video hành trình với vệt GPS/GPX',
                  'Cảnh báo bằng giọng nói & hình ảnh trước khi đến biển báo 150m',
                  'Nhận nhiệm vụ khảo sát các cung đường chưa có dữ liệu',
                  'Ví tín dụng minh bạch, đổi quyền lợi và tính năng nâng cao',
                ].map((item) => (
                  <li
                    key={item}
                    className={`flex items-start gap-3 text-sm ${
                      isDark ? 'text-gray-200' : 'text-gray-700'
                    }`}
                  >
                    <CheckCircle
                      size={20}
                      weight="fill"
                      className={`shrink-0 mt-0.5 ${isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'}`}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* App Store / Google Play Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="#"
                  className={`flex items-center gap-3 px-6 py-3.5 border rounded-2xl transition-all shadow-md active:scale-[0.98] group ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
                      : 'bg-white hover:bg-teal-50/40 border-gray-300 hover:border-[#007b8b] text-gray-900 shadow-gray-200/80'
                  }`}
                >
                  <AppleLogo size={26} weight="fill" className={`transition-transform group-hover:scale-105 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                  <div className="text-left">
                    <p className={`text-[10px] leading-none mb-1 uppercase font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tải về trên</p>
                    <p className={`text-sm font-bold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>App Store</p>
                  </div>
                </a>
                <a
                  href="#"
                  className={`flex items-center gap-3 px-6 py-3.5 border rounded-2xl transition-all shadow-md active:scale-[0.98] group ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
                      : 'bg-white hover:bg-teal-50/40 border-gray-300 hover:border-[#007b8b] text-gray-900 shadow-gray-200/80'
                  }`}
                >
                  <GooglePlayLogo size={26} weight="fill" className={`transition-transform group-hover:scale-105 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                  <div className="text-left">
                    <p className={`text-[10px] leading-none mb-1 uppercase font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tải về trên</p>
                    <p className={`text-sm font-bold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>Google Play</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Right Phone Mockup Column (5 cols) */}
            <div className="lg:col-span-5 flex justify-center">
              <div
                className={`w-72 sm:w-80 h-[560px] rounded-[40px] border-4 p-3.5 shadow-2xl relative flex flex-col justify-between overflow-hidden transition-colors ${
                  isDark
                    ? 'bg-black border-gray-800 shadow-[#00c4de]/15'
                    : 'bg-slate-100 border-slate-300 shadow-xl shadow-slate-300/60'
                }`}
              >
                {/* Dynamic island notch */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-gray-900 rounded-full z-20" />

                {/* Phone screen UI */}
                <div
                  className={`w-full h-full rounded-[30px] p-5 flex flex-col justify-between text-center relative border transition-colors ${
                    isDark
                      ? 'bg-gradient-to-b from-[#081b1f] via-[#051316] to-[#020608] border-white/10 text-white'
                      : 'bg-gradient-to-b from-teal-50/60 via-[#F8F7F7] to-white border-gray-200 text-gray-900'
                  }`}
                >
                  {/* Top Status */}
                  <div className="pt-5 text-left">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className={`text-[11px] font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          GPS LIVE • 50 KM/H
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          isDark
                            ? 'bg-[#007b8b]/30 text-[#00c4de] border-[#00c4de]/30'
                            : 'bg-teal-100 text-[#007b8b] border-teal-300 font-bold'
                        }`}
                      >
                        +50 CREDITS
                      </span>
                    </div>

                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Đang lưu thông trên:</p>
                    <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Đường Nguyễn Huệ, Quận 1
                    </p>
                  </div>

                  {/* Direction-Aware Real-Time Warning Alert Card */}
                  <div
                    className={`p-4 rounded-2xl text-left shadow-xl animate-pulse border transition-colors ${
                      isDark
                        ? 'bg-[#06181d] border-[#00c4de]/40 text-white'
                        : 'bg-white border-2 border-red-200 text-gray-900 shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1.5 font-mono">
                      <span className={`font-bold ${isDark ? 'text-[#00c4de]' : 'text-red-700'}`}>
                        CẢNH BÁO THEO HƯỚNG XE
                      </span>
                      <span className={`px-1.5 py-0.5 rounded ${
                        isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700 border border-red-200 font-bold'
                      }`}>
                        CÁCH 150M
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center border-2 border-white shrink-0 shadow-sm">
                        P
                      </div>
                      <div>
                        <h4 className={`text-xs font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          P.102 Cấm đi ngược chiều
                        </h4>
                        <p className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700 font-semibold'}`}>
                          Độ tin cậy: 99.4% • QCVN 41
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Trip Telemetry Bar */}
                  <div
                    className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-colors ${
                      isDark
                        ? 'bg-[#051417] border-white/10 text-white'
                        : 'bg-white border-gray-200 text-gray-900 shadow-sm'
                    }`}
                  >
                    <div>
                      <p className={`text-[10px] font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>CHUYẾN ĐI HIỆN TẠI</p>
                      <p className={`font-bold font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        12.4 km • 18 Biển báo
                      </p>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-md ${
                        isDark
                          ? 'bg-[#00c4de] text-black shadow-[#00c4de]/30'
                          : 'bg-[#007b8b] text-white shadow-[#007b8b]/30'
                      }`}
                    >
                      REC
                    </div>
                  </div>


                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 2: 4 KEY CAPABILITIES ───────────────────────── */}
        <div className="mb-14 text-left">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span
              className={`text-xs font-mono uppercase tracking-widest mb-2 block ${
                isDark ? 'text-[#00c4de]' : 'text-[#007b8b] font-bold'
              }`}
            >
              // TÍNH NĂNG TOÀN DIỆN
            </span>
            <h2
              className={`text-2xl sm:text-4xl font-bold tracking-tight leading-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              Công nghệ tiên tiến hỗ trợ lái xe & khảo sát
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {keyFeatures.map((f) => (
              <div
                key={f.title}
                className={`rounded-[20px] p-6 flex flex-col justify-between group transition-all ${
                  isDark
                    ? 'glass-panel bg-[#061417]/80 hover:border-[#00c4de]/40'
                    : 'bg-white border border-[#E8E4E3] shadow-md hover:border-[#007b8b]/50 hover:shadow-xl'
                }`}
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-[12px] flex items-center justify-center mb-4 ${
                      isDark ? 'bg-[#007b8b]/20 text-[#00c4de]' : 'bg-teal-50 text-[#007b8b]'
                    }`}
                  >
                    {f.icon}
                  </div>
                  <h3
                    className={`text-base font-bold mb-2 transition-colors ${
                      isDark ? 'text-white group-hover:text-[#00c4de]' : 'text-gray-900 group-hover:text-[#007b8b]'
                    }`}
                  >
                    {f.title}
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── SECTION 3: 4 SIMPLE STEPS ───────────────────────────── */}
        <div
          className={`rounded-[24px] p-8 sm:p-12 border text-left transition-all ${
            isDark
              ? 'glass-panel border-white/10 bg-[#051114]'
              : 'bg-white border-[#E8E4E3] shadow-lg'
          }`}
        >
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2
              className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              Quy trình hoạt động 4 bước đơn giản
            </h2>
            <p className={`text-xs sm:text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Dễ dàng tham gia đóng góp và nhận giá trị cho cộng đồng người lái xe
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Bật ứng dụng khi lái xe',
                desc: 'Đặt điện thoại lên giá đỡ hoặc kết nối camera hành trình để ghi hình và vệt GPX.',
              },
              {
                step: '02',
                title: 'Trích xuất tự động qua AI',
                desc: 'Mô hình YOLO12 & CLIP phát hiện biển báo, lọc trùng lặp và tính toán tọa độ thực địa.',
              },
              {
                step: '03',
                title: 'Cộng đồng xác thực',
                desc: 'Mạng lưới kiểm duyệt viên độc lập đối chiếu và chấm điểm tin cậy Weighted Consensus.',
              },
              {
                step: '04',
                title: 'Nhận thưởng tín dụng',
                desc: 'Dữ liệu xuất bản chính thức lên bản đồ và tài khoản nhận thưởng Credit tức thì.',
              },
            ].map((s) => (
              <div
                key={s.step}
                className={`p-5 rounded-xl border flex flex-col transition-all ${
                  isDark
                    ? 'bg-white/[0.02] border-white/5'
                    : 'bg-[#F8F7F7] border-gray-200 shadow-2xs'
                }`}
              >
                <span
                  className={`text-2xl font-extrabold font-mono mb-2 ${
                    isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
                  }`}
                >
                  {s.step}
                </span>
                <h4 className={`text-sm font-bold mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {s.title}
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
