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


const keyFeatures = [
  {
    icon: <VideoCamera size={26} weight="duotone" className="text-[#00c4de]" />,
    title: 'Ghi Nhận Chuyến Đi (Video + GPX)',
    desc: 'Đồng bộ hóa video camera hành trình và vệt quỹ đạo GPX thực địa để hệ thống AI tự động bóc tách biển báo.',
  },
  {
    icon: <NavigationArrow size={26} weight="duotone" className="text-[#00c4de]" />,
    title: 'Cảnh Báo Đúng Hướng Di Chuyển',
    desc: 'Nhận diện chiều xe chạy và chỉ phát cảnh báo âm thanh/hình ảnh đối với các biển báo có hiệu lực theo làn đường.',
  },
  {
    icon: <Coins size={26} weight="duotone" className="text-[#00c4de]" />,
    title: 'Thưởng Tín Dụng (Credit Economy)',
    desc: 'Tích lũy điểm thưởng tín dụng minh bạch khi chuyến đi hoặc hình ảnh đóng góp được cộng đồng kiểm duyệt thông qua.',
  },
  {
    icon: <ArrowsClockwise size={26} weight="duotone" className="text-[#00c4de]" />,
    title: 'Nhiệm Vụ Tái Thẩm Định Thực Địa',
    desc: 'Nhận các nhiệm vụ kiểm tra lại biển báo cũ (Stale Signs) xung quanh vị trí của bạn để nhận thêm phần thưởng lớn.',
  },
]

export default function ProductApp() {
  return (
    <div className="w-full bg-[#030708] text-white min-h-screen py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ─── SECTION 1: HERO SHOWCASE (2 Columns) ────────────────── */}
        <div className="glass-panel rounded-[28px] p-6 sm:p-12 lg:p-14 border border-white/10 relative overflow-hidden bg-gradient-to-br from-[#061418] via-[#040b0d] to-[#020506] shadow-2xl mb-14">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00c4de]/12 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
            {/* Left Content Column (7 cols) */}
            <div className="lg:col-span-7 flex flex-col text-left">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full bg-[#007b8b]/20 border border-[#00c4de]/30 text-xs font-semibold text-[#00c4de] w-fit">
                <DeviceMobile size={16} weight="bold" />
                <span>Ứng dụng di động SignTrustMap • iOS & Android</span>
              </div>

              {/* H1 Heading */}
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight mb-4 font-sans">
                Ứng Dụng Khảo Sát &{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c4de] via-[#d3f7ff] to-[#007b8b]">
                  Dẫn Đường Cảnh Báo
                </span>
              </h1>

              {/* Subtitle Paragraph */}
              <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-8 max-w-2xl">
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
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-200">
                    <CheckCircle size={20} weight="fill" className="text-[#00c4de] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* App Store / Google Play Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="#"
                  className="flex items-center gap-3 px-6 py-3.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl transition-all shadow-md active:scale-[0.98] group"
                >
                  <AppleLogo size={26} weight="fill" className="text-white group-hover:scale-105 transition-transform" />
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 leading-none mb-1 uppercase font-mono">Tải về trên</p>
                    <p className="text-sm font-bold leading-none text-white">App Store</p>
                  </div>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 px-6 py-3.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl transition-all shadow-md active:scale-[0.98] group"
                >
                  <GooglePlayLogo size={26} weight="fill" className="text-white group-hover:scale-105 transition-transform" />
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 leading-none mb-1 uppercase font-mono">Tải về trên</p>
                    <p className="text-sm font-bold leading-none text-white">Google Play</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Right Phone Mockup Column (5 cols) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-72 sm:w-80 h-[560px] bg-black rounded-[40px] border-4 border-gray-700/80 p-3.5 shadow-2xl relative shadow-[#00c4de]/15 flex flex-col justify-between overflow-hidden">
                {/* Dynamic island notch */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-gray-900 rounded-full z-20" />

                {/* Phone screen UI */}
                <div className="w-full h-full rounded-[30px] bg-gradient-to-b from-[#081b1f] via-[#051316] to-[#020608] p-5 flex flex-col justify-between text-center relative border border-white/10">
                  {/* Top Status */}
                  <div className="pt-5 text-left">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-[11px] font-mono font-bold text-emerald-400">GPS LIVE • 50 KM/H</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#007b8b]/30 text-[#00c4de] border border-[#00c4de]/30">
                        +50 CREDITS
                      </span>
                    </div>

                    <p className="text-xs text-gray-400">Đang lưu thông trên:</p>
                    <p className="text-sm font-bold text-white truncate">Đường Nguyễn Huệ, Quận 1</p>
                  </div>

                  {/* Direction-Aware Real-Time Warning Alert Card */}
                  <div className="glass-panel p-4 rounded-2xl border border-[#00c4de]/40 bg-[#06181d]/90 text-left shadow-xl animate-pulse">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1.5 font-mono">
                      <span className="text-[#00c4de] font-bold">CẢNH BÁO THEO HƯỚNG XE</span>
                      <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">CÁCH 150M</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center border-2 border-white shrink-0">
                        P
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white leading-tight">P.102 Cấm đi ngược chiều</h4>
                        <p className="text-[10px] text-emerald-400 font-mono mt-0.5">Độ tin cậy: 99.4% • QCVN 41</p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Trip Telemetry Bar */}
                  <div className="glass-panel p-3 rounded-xl border border-white/10 text-left flex items-center justify-between text-xs">
                    <div>
                      <p className="text-[10px] text-gray-400 font-mono">CHUYẾN ĐI HIỆN TẠI</p>
                      <p className="font-bold text-white font-mono">12.4 km • 18 Biển báo</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#00c4de] flex items-center justify-center text-black font-bold text-xs shadow-md shadow-[#00c4de]/30">
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
            <span className="text-xs font-mono uppercase tracking-widest text-[#00c4de] mb-2 block">
              // TÍNH NĂNG TOÀN DIỆN
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              Công nghệ tiên tiến hỗ trợ lái xe & khảo sát
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {keyFeatures.map((f) => (
              <div
                key={f.title}
                className="glass-panel rounded-[20px] p-6 flex flex-col justify-between group hover:border-[#00c4de]/40 transition-all bg-[#061417]/80"
              >
                <div>
                  <div className="w-12 h-12 rounded-[12px] bg-[#007b8b]/20 flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#00c4de] transition-colors mb-2">
                    {f.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── SECTION 3: 4 SIMPLE STEPS ───────────────────────────── */}
        <div className="glass-panel rounded-[24px] p-8 sm:p-12 border border-white/10 bg-[#051114] text-left">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Quy trình hoạt động 4 bước đơn giản
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
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
              <div key={s.step} className="p-5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col">
                <span className="text-2xl font-extrabold text-[#00c4de] font-mono mb-2">{s.step}</span>
                <h4 className="text-sm font-bold text-white mb-1.5">{s.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
