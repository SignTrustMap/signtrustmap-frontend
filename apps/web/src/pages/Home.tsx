import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Camera, CheckCircle, MapTrifold, DeviceMobile } from '@phosphor-icons/react'

/* ─── Hero Section ───────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-[#060d0e]">
      {/* Background glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[#007b8b] opacity-[0.12] blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full bg-[#007b8b] opacity-[0.07] blur-[100px]" />
        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-[#007b8b]/40 bg-[#007b8b]/10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00c4de] animate-pulse" />
          <span className="text-xs font-medium text-[#d3f7ff] tracking-wide">Cập nhật thời gian thực</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl md:text-6xl font-bold text-white leading-[1.08] tracking-tight mb-6"
          style={{ fontFamily: 'Public Sans, sans-serif' }}
        >
          Bản đồ biển báo{' '}
          <span className="text-[#00c4de]">đáng tin cậy</span>
          <br />
          cho Việt Nam
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-base md:text-lg text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed"
        >
          Dữ liệu biển báo giao thông được cộng đồng xác thực, cập nhật liên tục — minh bạch và mở cho mọi người.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            to="/product/map"
            className="flex items-center gap-2 px-6 py-3 rounded-[4px] bg-[#007b8b] text-white text-sm font-semibold hover:bg-[#006272] active:scale-[0.98] transition-all"
          >
            Khám phá bản đồ
            <ArrowRight size={16} weight="bold" />
          </Link>
          <Link
            to="/product/app"
            className="flex items-center gap-2 px-6 py-3 rounded-[4px] border border-white/20 text-white text-sm font-medium hover:border-white/40 hover:bg-white/5 transition-all"
          >
            Tải ứng dụng
          </Link>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="w-px h-8 bg-gradient-to-b from-transparent to-[#007b8b]" />
      </motion.div>
    </section>
  )
}

/* ─── Stats Section ──────────────────────────────────────────────── */
const stats = [
  { value: '142k+', label: 'Biển báo đã số hóa' },
  { value: '98%', label: 'Độ chính xác trung bình' },
  { value: '45k+', label: 'Người đóng góp' },
]

function StatsSection() {
  return (
    <section className="border-t border-b border-[#E8E4E3] bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center md:items-start"
            >
              <span
                className="text-5xl font-bold text-[#007b8b] tracking-tight mb-2"
                style={{ fontFamily: 'Arvo, serif' }}
              >
                {stat.value}
              </span>
              <span className="text-sm text-gray-500 font-medium">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── How It Works ───────────────────────────────────────────────── */
const steps = [
  {
    Icon: Camera,
    title: 'Chụp ảnh thực địa',
    body: 'Người dùng ghi nhận biển báo qua ứng dụng di động, kèm tọa độ GPS chính xác.',
  },
  {
    Icon: CheckCircle,
    title: 'Xác thực cộng đồng',
    body: 'Cộng đồng Reviewer kiểm tra, chấm điểm tin cậy dựa trên thuật toán Trust Score.',
  },
  {
    Icon: MapTrifold,
    title: 'Lên bản đồ số',
    body: 'Dữ liệu đã xác thực hiển thị trực tiếp trên bản đồ, mở cho mọi người truy cập.',
  },
]

function HowItWorks() {
  return (
    <section className="py-24 bg-[#F8F7F7]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4"
          style={{ fontFamily: 'Public Sans, sans-serif' }}
        >
          Cách hoạt động
        </h2>
        <p className="text-gray-500 text-center max-w-lg mx-auto mb-14 text-sm leading-relaxed">
          Quy trình 3 bước đơn giản, minh bạch từ thực địa đến bản đồ số.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map(({ Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white rounded-[12px] border border-[#E8E4E3] p-8"
            >
              {/* Step number */}
              <span className="absolute top-6 right-6 text-xs font-bold text-gray-300 tabular-nums">
                0{i + 1}
              </span>
              <div className="w-11 h-11 rounded-[8px] bg-[#d3f7ff] flex items-center justify-center mb-5">
                <Icon size={22} weight="duotone" className="text-[#007b8b]" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Map Preview CTA ────────────────────────────────────────────── */
function MapPreviewCTA() {
  return (
    <section className="py-24 bg-white border-t border-[#E8E4E3]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight"
              style={{ fontFamily: 'Public Sans, sans-serif' }}
            >
              Dữ liệu biển báo
              <br />
              trực tiếp trên bản đồ
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-8 max-w-md">
              Khám phá hơn 142 nghìn biển báo đã được xác thực, lọc theo nhóm, khu vực và mức độ tin cậy — không cần đăng nhập.
            </p>
            <Link
              to="/product/map"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#007b8b] text-white text-sm font-semibold rounded-[4px] hover:bg-[#006272] active:scale-[0.98] transition-all"
            >
              Mở bản đồ <ArrowRight size={16} weight="bold" />
            </Link>
          </motion.div>

          {/* Map preview card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[12px] overflow-hidden border border-[#E8E4E3] shadow-md aspect-[4/3] bg-[#e8f4f6] flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-3 text-[#007b8b]">
              <MapTrifold size={48} weight="duotone" />
              <span className="text-sm font-medium text-gray-500">Bản đồ tương tác</span>
              <Link
                to="/product/map"
                className="text-xs font-semibold text-[#007b8b] underline underline-offset-2"
              >
                Xem toàn màn hình →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ─── Download CTA ───────────────────────────────────────────────── */
function DownloadCTA() {
  return (
    <section className="py-20 bg-[#007b8b]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-[12px] bg-white/15 mb-6">
            <DeviceMobile size={28} weight="duotone" className="text-white" />
          </div>
          <h2
            className="text-3xl font-bold text-white mb-3"
            style={{ fontFamily: 'Public Sans, sans-serif' }}
          >
            Tham gia cộng đồng ngay hôm nay
          </h2>
          <p className="text-[#d3f7ff] text-sm mb-8 max-w-md mx-auto">
            Tải ứng dụng SignTrustMap để khảo sát, xác thực biển báo và nhận thưởng tín dụng.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/product/app"
              className="flex items-center gap-2 px-6 py-3 bg-white text-[#007b8b] text-sm font-semibold rounded-[4px] hover:bg-[#d3f7ff] active:scale-[0.98] transition-all"
            >
              App Store
            </Link>
            <Link
              to="/product/app"
              className="flex items-center gap-2 px-6 py-3 border border-white/30 text-white text-sm font-semibold rounded-[4px] hover:bg-white/10 transition-all"
            >
              Google Play
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Home Page ──────────────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      <Hero />
      <StatsSection />
      <HowItWorks />
      <MapPreviewCTA />
      <DownloadCTA />
    </>
  )
}
