import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowRight,
  Brain,
  ShieldCheck,
  DeviceMobile,
  Compass,
  CheckCircle,
  Database,
} from '@phosphor-icons/react'

import { TopographicContour } from '@/components/common/TopographicContour'

/* ─── 1. AI & IDE SPONSOR / ECOSYSTEM LOGOS (Sharp SVG Vector Marks) ─ */
function AiSponsorLogos() {
  const sponsors = [
    {
      name: 'Cursor',
      label: 'Cursor AI',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M12 2L2 19.5h20L12 2zm0 3.8l6.5 11.4H5.5L12 5.8z" />
        </svg>
      ),
    },
    {
      name: 'Claude',
      label: 'Anthropic Claude',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M13.5 3h-3L4 21h3.5l1.5-4.5h6l1.5 4.5H20L13.5 3zm-3.3 10.5L12 7.8l1.8 5.7h-3.6z" />
        </svg>
      ),
    },
    {
      name: 'Gemini',
      label: 'Google Gemini',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M12 2C12 7.5 7.5 12 2 12c5.5 0 10 4.5 10 10 0-5.5 4.5-10 10-10-5.5 0-10-4.5-10-10z" />
        </svg>
      ),
    },
    {
      name: 'OpenAI',
      label: 'OpenAI / ChatGPT',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M22.28 10.55a6.03 6.03 0 00-.51-4.88 6.13 6.13 0 00-5.9-3.05 6.06 6.06 0 00-4.66-2.12c-3.15 0-5.74 2.37-6.08 5.48a6.05 6.05 0 00-4.04 2.92 6.13 6.13 0 00.75 6.58 6.03 6.03 0 00.51 4.88 6.13 6.13 0 005.9 3.05 6.05 6.05 0 004.66 2.12c3.15 0 5.74-2.37 6.08-5.48a6.05 6.05 0 004.04-2.92 6.13 6.13 0 00-.75-6.58zm-7.6 10.4a4.42 4.42 0 01-2.68.9 4.5 4.5 0 01-4.43-3.66l.08-.04 4.36-2.52a.8.8 0 00.4-.69v-6.17l1.85 1.07a.08.08 0 01.04.07v6.86a4.43 4.43 0 01.38 4.18z" />
        </svg>
      ),
    },
    {
      name: 'v0',
      label: 'v0 by Vercel',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13H5.5L12 6.5z" />
        </svg>
      ),
    },
    {
      name: 'Windsurf',
      label: 'Windsurf AI',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M3 17h18c-2-4-5-8-9-8s-7 4-9 8zm0-6h18c-1-3-4-6-9-6s-8 3-9 6z" />
        </svg>
      ),
    },
    {
      name: 'Copilot',
      label: 'GitHub Copilot',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
        </svg>
      ),
    },
    {
      name: 'HuggingFace',
      label: 'Hugging Face',
      svg: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-3 8a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm6 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm-3 8c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="w-full pt-10 pb-6">
      <p className="text-center text-xs text-gray-400 font-medium tracking-wide mb-6">
        Được tin cậy bởi các nhóm phát triển AI & hệ thống bản đồ thông minh
      </p>
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-70 hover:opacity-100 transition-opacity">
        {sponsors.map((s) => (
          <div
            key={s.name}
            className="flex items-center gap-2 text-gray-400 hover:text-[#00c4de] transition-colors cursor-default"
            title={s.label}
          >
            {s.svg}
            <span className="text-xs font-semibold tracking-wider font-mono uppercase">
              {s.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── 2. HERO SECTION (DigitalOcean Style with 3D Wireframe Terrain) ── */
function HeroSection() {
  return (
    <section className="relative min-h-[100dvh] flex flex-col justify-between overflow-hidden bg-[#030708] pt-12 pb-16">
      {/* 3D Wireframe Terrain Background Asset (Slightly brighter & vibrant) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <img
          src="/images/hero-wireframe.jpg"
          alt="3D Wireframe Terrain Mountain"
          className="w-full h-full object-cover object-bottom opacity-55 brightness-[0.8] contrast-[1.2] mix-blend-screen"
        />


        {/* Overhead spotlight beam with vibrant cyan glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[380px] bg-gradient-to-b from-[#00c4de]/18 via-[#007b8b]/8 to-transparent blur-[130px]" />

        {/* Soft balanced radial scrim behind text */}
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[480px] bg-[#030708]/55 rounded-full blur-[100px]" />

        {/* Top and bottom subtle dark fades */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030708] via-transparent to-[#030708]" />
      </div>



      {/* Main Hero Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center pt-8 sm:pt-14">
        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#007b8b]/20 border border-[#00c4de]/30 text-xs sm:text-sm font-medium text-[#d3f7ff] mb-6 backdrop-blur-md shadow-lg shadow-[#00c4de]/10"
        >
          <span className="w-2 h-2 rounded-full bg-[#00c4de] animate-ping" />
          <span className="text-xs uppercase tracking-wider font-semibold text-[#00c4de]">
            Nền Tảng AI-Native Cloud
          </span>
          <span className="text-gray-400">•</span>
          <span>Chuẩn QCVN 41:2019/BGTVT</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] mb-6"

        >
          Bản Đồ Biển Báo Số{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c4de] via-[#d3f7ff] to-[#007b8b] glow-cyan">
            Thời Gian Thực
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-10"
        >
          Hệ thống số hóa hạ tầng giao thông kết hợp thị giác máy tính AI và cơ chế xác thực cộng đồng phi tập trung.
        </motion.p>

        {/* CTA Buttons (DigitalOcean style: bright cyan pill + dark glass pill) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Link
            to="/product/map"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-base text-black bg-[#00c4de] hover:bg-[#38dbf1] shadow-xl shadow-[#00c4de]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            <span>Khám phá bản đồ</span>
            <ArrowRight size={18} weight="bold" className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/product/app"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full font-medium text-base text-white bg-white/5 hover:bg-white/10 border border-white/15 backdrop-blur-md transition-all flex items-center justify-center gap-2"
          >
            <DeviceMobile size={18} />
            <span>Tải ứng dụng mobile</span>
          </Link>
        </motion.div>

        {/* Sponsor Strip (Directly overlaid onto the wireframe slope) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.32 }}
        >
          <AiSponsorLogos />
        </motion.div>
      </div>

      {/* 3 Metric Glassmorphism Cards (DigitalOcean 3-col stats style) */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {[
            {
              stat: '142k+',
              title: 'Biển báo đã số hóa',
              desc: 'Hơn 140,000 cột biển báo được định vị GPS vi sai và lập chỉ mục chuẩn QCVN 41 trên toàn quốc.',
            },
            {
              stat: '98.4%',
              title: 'Độ chính xác xác thực',
              desc: 'Mô hình Vision AI kết hợp cơ chế chấm điểm Trust Score đa tầng từ mạng lưới Reviewer độc lập.',
            },
            {
              stat: '< 3s',
              title: 'Đồng bộ thời gian thực',
              desc: 'Dữ liệu biển báo mới cập nhật tức thì đến toàn bộ người dùng qua kiến trúc phân tán Edge.',
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 + idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card rounded-[16px] p-7 text-left relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-[#00c4de]/10 rounded-full blur-2xl group-hover:bg-[#00c4de]/20 transition-all pointer-events-none" />
              <p
                className="text-4xl sm:text-5xl font-extrabold text-[#00c4de] tracking-tight mb-2 font-mono"
              >
                {item.stat}
              </p>
              <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── 3. TOPOGRAPHIC CONTOUR TRANSITION (Option C: Vector SVG Sóng) ─── */
function TopographicTransitionSection() {
  return (
    <section className="relative bg-[#030708] pt-12 pb-20 overflow-hidden border-t border-white/5">
      <TopographicContour className="absolute top-0 left-0 right-0 z-0 opacity-40" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-mono uppercase tracking-widest text-[#00c4de] mb-3">
            // KIẾN TRÚC NỀN TẢNG
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight"
  
          >
            Hệ sinh thái xử lý dữ liệu bản đồ toàn diện
          </h2>
          <p className="text-sm text-gray-400 mt-4 leading-relaxed">
            Từ camera hành trình đến bản đồ dẫn đường thông minh — một chuỗi cung ứng dữ liệu hoàn chỉnh, minh bạch và có thể kiểm chứng.
          </p>
        </div>

        {/* 3 Core Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Brain size={28} weight="duotone" className="text-[#00c4de]" />,
              tag: 'Thị giác máy tính',
              title: 'AI Vision & Object Detection',
              body: 'Mô hình phân loại tự động phát hiện mọi loại biển báo trong tích tắc từ hình ảnh thực địa, kể cả trong điều kiện thời tiết xấu hay ban đêm.',
            },
            {
              icon: <ShieldCheck size={28} weight="duotone" className="text-[#00c4de]" />,
              tag: 'Xác thực đa tầng',
              title: 'Thuật toán Trust Score',
              body: 'Hệ thống chống gian lận định vị GPS giả mạo và phân bổ trọng số tin cậy dựa trên lịch sử đóng góp của từng người dùng.',
            },
            {
              icon: <Database size={28} weight="duotone" className="text-[#00c4de]" />,
              tag: 'Tiêu chuẩn quốc gia',
              title: 'Bộ danh mục QCVN 41',
              body: 'Đầy đủ dữ liệu chuẩn hóa của 5 nhóm biển báo: Cấm (P), Hiệu lệnh (R), Cảnh báo (W), Chỉ dẫn (I) và Biển phụ (S).',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="glass-panel rounded-[16px] p-6 flex flex-col justify-between group hover:border-[#00c4de]/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-[10px] bg-[#007b8b]/20 flex items-center justify-center">
                    {card.icon}
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10">
                    {card.tag}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#00c4de] transition-colors mb-2">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">{card.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── 4. INTERACTIVE MAP PREVIEW SECTION ───────────────────────────── */
function MapPreviewSection() {
  return (
    <section className="py-20 bg-[#050e11] border-t border-white/5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Description */}
          <div className="lg:col-span-5 text-left">
            <span className="text-xs font-mono uppercase tracking-widest text-[#00c4de] mb-2 block">
              // KHÁM PHÁ CÔNG KHAI
            </span>
            <h2
              className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight mb-4"
    
            >
              Bản đồ tương tác không cần đăng nhập
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Tra cứu vị trí biển báo theo từng tuyến đường, khu vực hoặc tìm kiếm theo mã chuẩn QCVN 41. Mọi dữ liệu đều công khai và minh bạch.
            </p>

            <ul className="flex flex-col gap-3 mb-8">
              {[
                'Xem điểm tin cậy Trust Score của từng biển',
                'Lọc theo 5 nhóm biển báo chính',
                'Xem ảnh chụp thực địa và thời điểm cập nhật',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-xs text-gray-300">
                  <CheckCircle size={16} weight="fill" className="text-[#00c4de] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/product/map"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-black bg-[#00c4de] hover:bg-[#38dbf1] transition-all shadow-lg shadow-[#00c4de]/20"
            >
              <span>Mở bản đồ toàn màn hình</span>
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>

          {/* Right Simulated Interactive Map Card */}
          <div className="lg:col-span-7">
            <div className="glass-panel rounded-[18px] overflow-hidden border border-white/15 shadow-2xl relative aspect-[16/10] bg-[#08171b]">
              {/* Map Header Bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#040c0e] border-b border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  <span className="text-[11px] text-gray-400 ml-2 font-mono">
                    signtrustmap.site/explore/hcmc
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#007b8b]/30 text-[#00c4de] font-mono">
                  LIVE TELEMETRY
                </span>
              </div>

              {/* Map Simulation Canvas */}
              <div className="relative w-full h-[calc(100%-41px)] bg-[#071317] flex items-center justify-center overflow-hidden">
                {/* Grid roads */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle, #00c4de 1px, transparent 1px), linear-gradient(to right, #007b8b 1px, transparent 1px), linear-gradient(to bottom, #007b8b 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                  }}
                />

                {/* Simulated Pins */}
                <div className="absolute top-[30%] left-[35%] flex flex-col items-center group cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-[#00c4de] text-black font-bold text-[10px] flex items-center justify-center shadow-lg shadow-[#00c4de]/50 border-2 border-white animate-bounce">
                    P
                  </div>
                  <span className="mt-1 px-2 py-0.5 rounded bg-black/80 text-[9px] font-mono text-[#00c4de] border border-[#00c4de]/30">
                    P.102 (Cấm đi ngược chiều) • 98%
                  </span>
                </div>

                <div className="absolute top-[55%] left-[60%] flex flex-col items-center group cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-[#007b8b] text-white font-bold text-[10px] flex items-center justify-center shadow-lg border-2 border-white">
                    R
                  </div>
                  <span className="mt-1 px-2 py-0.5 rounded bg-black/80 text-[9px] font-mono text-gray-300 border border-white/10">
                    R.301 (Hướng đi phải theo) • 95%
                  </span>
                </div>

                <div className="absolute top-[40%] left-[75%] flex flex-col items-center group cursor-pointer">
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-black font-bold text-[9px] flex items-center justify-center shadow-md border-2 border-white">
                    W
                  </div>
                </div>

                {/* Center Explore button overlay */}
                <div className="relative z-10 text-center p-4 rounded-xl bg-black/70 backdrop-blur-md border border-white/10">
                  <Compass size={32} weight="duotone" className="text-[#00c4de] mx-auto mb-2 animate-spin-slow" />
                  <p className="text-xs font-bold text-white">Bản Đồ Trực Tiếp TP.HCM & Hà Nội</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">142,381 điểm dữ liệu đang hoạt động</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── 5. MOBILE APP DOWNLOAD CTA ──────────────────────────────────── */
function MobileDownloadSection() {
  return (
    <section className="py-20 bg-[#030708] border-t border-white/5 relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-[24px] p-8 sm:p-12 relative overflow-hidden border border-[#00c4de]/20 bg-gradient-to-br from-[#061519] to-[#030a0c]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#00c4de] mb-2 block">
                // DÀNH CHO CỘNG ĐỒNG
              </span>
              <h2
                className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight mb-4"
      
              >
                Khảo sát biển báo, nhận thưởng tín dụng
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed mb-8">
                Tải ứng dụng SignTrustMap để ghi nhận biển báo mới trên cung đường hàng ngày của bạn. Mỗi dữ liệu được xác thực đều nhận điểm thưởng tín dụng minh bạch.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/product/app"
                  className="px-6 py-3 rounded-full font-bold text-xs text-black bg-[#00c4de] hover:bg-[#38dbf1] transition-all flex items-center gap-2 shadow-lg shadow-[#00c4de]/20"
                >
                  <DeviceMobile size={16} />
                  <span>Tải ứng dụng miễn phí</span>
                </Link>
                <Link
                  to="/docs"
                  className="px-6 py-3 rounded-full font-medium text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2"
                >
                  <span>Tìm hiểu thể lệ thưởng →</span>
                </Link>
              </div>
            </div>

            {/* Right Mini Spec Badges */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'GPS Vi Sai', desc: 'Định vị độ chính xác cao' },
                { title: 'Offline Mode', desc: 'Lưu trữ khi mất sóng 4G' },
                { title: 'Tự động bóc tách', desc: 'Nhận diện biển báo tức thì' },
                { title: 'Ví tín dụng', desc: 'Rút thưởng minh bạch' },
              ].map((b) => (
                <div
                  key={b.title}
                  className="p-4 rounded-[12px] bg-white/[0.03] border border-white/10 flex flex-col justify-center"
                >
                  <h4 className="text-xs font-bold text-[#00c4de] mb-1">{b.title}</h4>
                  <p className="text-[11px] text-gray-400">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── HOME MAIN COMPONENT ─────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#030708] text-white">
      <HeroSection />
      <TopographicTransitionSection />
      <MapPreviewSection />
      <MobileDownloadSection />
    </div>
  )
}
