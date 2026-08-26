import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { HomeMiniMap } from '@/components/common/HomeMiniMap'
import {
  ArrowRight,
  Brain,
  ShieldCheck,
  DeviceMobile,
  CheckCircle,
  ArrowsClockwise,
  Coins,
} from '@phosphor-icons/react'
import { TopographicContour } from '@/components/common/TopographicContour'

import { sponsorList } from '@/data'

/* ─── 1. AI & TECH ECOSYSTEM LOGO MARQUEE (Infinite Loop, Enlarged) ─── */
function AiMarqueeLogos() {
  return (
    <div className="w-full pt-8 pb-6 overflow-hidden">
      <p className="text-center text-xs sm:text-sm text-gray-300 font-medium tracking-wide mb-6">
        Tương thích và hỗ trợ phát triển bởi các mô hình AI & công cụ lập trình hàng đầu
      </p>

      {/* Infinite Scrolling Track with Soft Gradient Fade Mask */}
      <div className="relative w-full overflow-hidden marquee-mask">
        <div className="animate-marquee flex items-center gap-12 sm:gap-16 py-2">
          {/* First set of logos */}
          {sponsorList.map((s) => (
            <div
              key={`logo-1-${s.id}`}
              className="flex items-center gap-3 text-gray-300 hover:text-[#00c4de] transition-colors cursor-default shrink-0 group"
              title={s.label}
            >
              <img
                src={s.logoUrl}
                alt={s.name}
                className="w-8 h-8 object-contain brightness-90 group-hover:brightness-100 group-hover:scale-110 transition-all"
              />
              <span className="text-base sm:text-lg font-bold tracking-wide font-sans text-white group-hover:text-[#00c4de] transition-colors">
                {s.name}
              </span>
            </div>
          ))}

          {/* Duplicate set of logos for seamless infinite loop */}
          {sponsorList.map((s) => (
            <div
              key={`logo-2-${s.id}`}
              className="flex items-center gap-3 text-gray-300 hover:text-[#00c4de] transition-colors cursor-default shrink-0 group"
              title={s.label}
            >
              <img
                src={s.logoUrl}
                alt={s.name}
                className="w-8 h-8 object-contain brightness-90 group-hover:brightness-100 group-hover:scale-110 transition-all"
              />
              <span className="text-base sm:text-lg font-bold tracking-wide font-sans text-white group-hover:text-[#00c4de] transition-colors">
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


/* ─── 2. HERO SECTION (Breathable, Spacious DigitalOcean Vibe) ─────── */
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#030708] pt-16 sm:pt-24 pb-20 sm:pb-28">
      {/* 3D Wireframe Terrain Background Asset */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <img
          src="/images/hero-wireframe.jpg"
          alt="3D Wireframe Terrain Mesh"
          className="w-full h-full object-cover object-bottom opacity-50 brightness-[0.75] contrast-[1.2] mix-blend-screen"
        />

        {/* Overhead spotlight beam with soft cyan glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[750px] h-[420px] bg-gradient-to-b from-[#00c4de]/15 via-[#007b8b]/6 to-transparent blur-[140px]" />

        {/* Soft radial scrim behind text */}
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[520px] bg-[#030708]/60 rounded-full blur-[110px]" />

        {/* Top and bottom dark fades */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030708] via-transparent to-[#030708]" />
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#007b8b]/20 border border-[#00c4de]/30 text-xs sm:text-sm font-medium text-[#d3f7ff] mb-8 backdrop-blur-md shadow-lg shadow-[#00c4de]/10"
        >
          <span className="w-2 h-2 rounded-full bg-[#00c4de] animate-ping" />
          <span className="text-xs uppercase tracking-wider font-semibold text-[#00c4de]">
            Nền tảng Crowd-AI & GIS
          </span>
          <span className="text-gray-400">•</span>
          <span>Chuẩn QCVN 41:2019/BGTVT</span>
        </motion.div>

        {/* H1 Title: Project Name */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-white leading-[1.05] mb-7"
        >
          Sign<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c4de] via-[#d3f7ff] to-[#007b8b] glow-cyan">Trust</span>Map
        </motion.h1>

        {/* H2 / Subtitle */}
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg sm:text-xl md:text-2xl text-gray-200 font-medium max-w-3xl mx-auto leading-relaxed mb-10"
        >
          Nền tảng kết hợp AI và cộng đồng để xây dựng cơ sở dữ liệu biển báo giao thông tin cậy.
        </motion.h2>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
        >
          <Link
            to="/product/map"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-base text-black bg-[#00c4de] hover:bg-[#38dbf1] shadow-xl shadow-[#00c4de]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            <span>Khám phá bản đồ GIS</span>
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

        {/* Infinite Scrolling Sponsor Marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.32 }}
          className="my-6"
        >
          <AiMarqueeLogos />
        </motion.div>
      </div>

      {/* 3 Metric Cards */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {[
            {
              stat: 'YOLO12 + CLIP',
              title: 'Trích Xuất AI & Vector Search',
              desc: 'Tự động phát hiện biển báo từ video Dashcam, theo dõi đa vật thể BoT-SORT và phân loại vector pgvector.',
            },
            {
              stat: 'Weighted Consensus',
              title: 'Xác Thực Đồng Thuận Trọng Số',
              desc: 'Đánh giá độ tin cậy của Reviewer độc lập trước khi xuất bản bản ghi biển báo chính thức lên bản đồ GIS.',
            },
            {
              stat: 'Direction-Aware',
              title: 'Dẫn Đường Đúng Chiều Xe Chạy',
              desc: 'Ước tính toạ độ và hướng áp dụng của biển báo từ quỹ đạo GPX, camera geometry và hướng phương tiện.',
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 + idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card rounded-[18px] p-7 text-left relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-[#00c4de]/10 rounded-full blur-2xl group-hover:bg-[#00c4de]/20 transition-all pointer-events-none" />
              <p className="text-2xl sm:text-3xl font-extrabold text-[#00c4de] tracking-tight mb-2 font-mono">
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

/* ─── 3. TOPOGRAPHIC TRANSITION ───────────────────────────────────── */
function TopographicTransitionSection() {
  return (
    <section className="relative bg-[#030708] py-20 sm:py-24 overflow-hidden border-t border-white/5">
      {/* Background Contour SVG */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
        <TopographicContour className="w-full h-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs font-mono uppercase tracking-widest text-[#00c4de] mb-3">
            // VÒNG ĐỜI DỮ LIỆU KHÉP KÍN
          </p>
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            Từ camera thực địa đến bản đồ dẫn đường tin cậy
          </h2>
          <p className="text-base sm:text-lg text-gray-300 mt-4 leading-relaxed">
            Quy trình toàn diện giải quyết bài toán độ trễ và sự thay đổi liên tục của biển báo giao thông tại Việt Nam.
          </p>
        </div>

        {/* 3 Core Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {[
            {
              icon: <Brain size={28} weight="duotone" className="text-[#00c4de]" />,
              tag: 'Pipeline AI Tự Động',
              title: 'Trích xuất & Ước tính tọa độ',
              body: 'Mô hình YOLO12 kết hợp BoT-SORT bóc tách khung hình tối ưu, khử trùng lặp và tính toán tọa độ địa lý thực tế cùng hướng áp dụng từ vệt GPX.',
            },
            {
              icon: <ShieldCheck size={28} weight="duotone" className="text-[#00c4de]" />,
              tag: 'Xác Thực Cộng Đồng',
              title: 'Reviewer & Đồng thuận trọng số',
              body: 'Cộng đồng tham gia kiểm duyệt chéo, gán nhãn chuẩn QCVN 41 và tính điểm tin cậy Reviewer Reliability trước khi chính thức đưa lên bản đồ.',
            },
            {
              icon: <ArrowsClockwise size={28} weight="duotone" className="text-[#00c4de]" />,
              tag: 'MLOps & Revalidation',
              title: 'Tái thẩm định & Tái huấn luyện AI',
              body: 'Tự động tạo nhiệm vụ làm mới các biển báo cũ (Stale Signs) và nạp dữ liệu đã được người kiểm duyệt xác nhận vào vòng lặp Active Learning.',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="glass-panel rounded-[18px] p-7 flex flex-col justify-between group hover:border-[#00c4de]/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-[12px] bg-[#007b8b]/20 flex items-center justify-center">
                    {card.icon}
                  </div>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">
                    {card.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#00c4de] transition-colors mb-2.5">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">{card.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── 4. GIS MAP PREVIEW SECTION ──────────────────────────────────── */
function MapPreviewSection() {
  return (
    <section className="py-20 sm:py-24 bg-[#050e11] border-t border-white/5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Description */}
          <div className="lg:col-span-5 text-left">
            <span className="text-xs font-mono uppercase tracking-widest text-[#00c4de] mb-2 block">
              // BẢN ĐỒ GIS TƯƠNG TÁC
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight mb-4">
              Tra cứu & phân loại biển báo chuẩn QCVN 41
            </h2>
            <p className="text-base text-gray-300 leading-relaxed mb-6">
              Truy cập bản đồ không gian tương tác hỗ trợ tìm kiếm, lọc phân cụm, kiểm tra lịch sử tái thẩm định và hình ảnh bằng chứng thực địa.
            </p>

            <ul className="flex flex-col gap-3.5 mb-8">
              {[
                'Phân loại 5 nhóm: Biển cấm (P), Hiệu lệnh (R), Cảnh báo (W), Chỉ dẫn (I), Biển phụ (S)',
                'Hiển thị hướng áp dụng giao thông (Traffic Direction Metadata)',
                'Xem điểm tin cậy (Trust Score) và nguồn dữ liệu cộng đồng',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                  <CheckCircle size={18} weight="fill" className="text-[#00c4de] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/product/map"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-bold text-black bg-[#00c4de] hover:bg-[#38dbf1] transition-all shadow-lg shadow-[#00c4de]/20"
            >
              <span>Mở bản đồ toàn màn hình</span>
              <ArrowRight size={16} weight="bold" />
            </Link>
          </div>

          {/* Right Real Interactive Leaflet OpenStreetMap Card */}
          <div className="lg:col-span-7">
            <HomeMiniMap />
          </div>
        </div>
      </div>
    </section>
  )
}


/* ─── 5. MOBILE APP & CREDIT INCENTIVE CTA ────────────────────────── */
function MobileDownloadSection() {
  return (
    <section className="py-20 sm:py-24 bg-[#030708] border-t border-white/5 relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-[24px] p-8 sm:p-14 relative overflow-hidden border border-[#00c4de]/20 bg-gradient-to-br from-[#061519] to-[#030a0c]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#00c4de] mb-2 block">
                // ĐÓNG GÓP & NHẬN THƯỞNG
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight mb-4">
                Khảo sát thực địa, nhận thưởng tín dụng Credit
              </h2>
              <p className="text-base text-gray-300 leading-relaxed mb-8">
                Sử dụng ứng dụng SignTrustMap để ghi lại chuyến đi (Video + GPX) hoặc chụp ảnh biển báo mới. Nhận điểm thưởng tín dụng minh bạch khi đóng góp được cộng đồng kiểm duyệt thông qua.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/product/app"
                  className="px-7 py-3.5 rounded-full font-bold text-sm text-black bg-[#00c4de] hover:bg-[#38dbf1] transition-all flex items-center gap-2 shadow-lg shadow-[#00c4de]/20"
                >
                  <DeviceMobile size={18} />
                  <span>Tải ứng dụng mobile</span>
                </Link>
                <Link
                  to="/docs"
                  className="px-7 py-3.5 rounded-full font-medium text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2"
                >
                  <Coins size={18} className="text-[#00c4de]" />
                  <span>Cơ chế kinh tế tín dụng →</span>
                </Link>
              </div>
            </div>

            {/* Right Mini Spec Badges */}
            <div className="grid grid-cols-2 gap-3.5">
              {[
                { title: 'Video & GPX Sync', desc: 'Đồng bộ vệt quỹ đạo hành trình chính xác' },
                { title: 'Direction Alerts', desc: 'Cảnh báo biển báo đúng chiều di chuyển' },
                { title: 'Revalidation Tasks', desc: 'Nhận nhiệm vụ làm mới biển báo cũ' },
                { title: 'Credit Wallet', desc: 'Ví tín dụng và lịch sử thưởng minh bạch' },
              ].map((b) => (
                <div
                  key={b.title}
                  className="p-4 rounded-[14px] bg-white/[0.03] border border-white/10 flex flex-col justify-center"
                >
                  <h4 className="text-sm font-bold text-[#00c4de] mb-1">{b.title}</h4>
                  <p className="text-xs text-gray-400">{b.desc}</p>
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
