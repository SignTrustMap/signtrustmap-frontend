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
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { sponsorList } from '@/data'

/* ─── 1. AI & TECH ECOSYSTEM LOGO MARQUEE (Infinite Loop) ─────────── */
function AiMarqueeLogos() {
  const { isDark } = useTheme()
  const { t } = useTranslation('home')

  return (
    <div className="w-full pt-8 pb-6 overflow-hidden">
      <p
        className={`text-center text-xs sm:text-sm font-medium tracking-wide mb-6 ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}
      >
        {t('hero.marquee_label')}
      </p>

      {/* Infinite Scrolling Track with Soft Gradient Fade Mask */}
      <div className="relative w-full overflow-hidden marquee-mask">
        <div className="animate-marquee flex items-center gap-12 sm:gap-16 py-2">
          {/* First set of logos */}
          {sponsorList.map((s) => (
            <div
              key={`logo-1-${s.id}`}
              className={`flex items-center gap-3 transition-colors cursor-default shrink-0 group ${
                isDark ? 'text-gray-300 hover:text-[#00c4de]' : 'text-gray-700 hover:text-[#007b8b]'
              }`}
              title={s.label}
            >
              <img
                src={s.logoUrl}
                alt={s.name}
                className={`w-8 h-8 object-contain transition-all group-hover:scale-110 ${
                  isDark
                    ? 'brightness-90 group-hover:brightness-100'
                    : 'brightness-0 opacity-85 group-hover:opacity-100'
                }`}
              />
              <span
                className={`text-base sm:text-lg font-bold tracking-wide font-sans transition-colors ${
                  isDark
                    ? 'text-white group-hover:text-[#00c4de]'
                    : 'text-gray-900 group-hover:text-[#007b8b]'
                }`}
              >
                {s.name}
              </span>
            </div>
          ))}

          {/* Duplicate set of logos for seamless infinite loop */}
          {sponsorList.map((s) => (
            <div
              key={`logo-2-${s.id}`}
              className={`flex items-center gap-3 transition-colors cursor-default shrink-0 group ${
                isDark ? 'text-gray-300 hover:text-[#00c4de]' : 'text-gray-700 hover:text-[#007b8b]'
              }`}
              title={s.label}
            >
              <img
                src={s.logoUrl}
                alt={s.name}
                className={`w-8 h-8 object-contain transition-all group-hover:scale-110 ${
                  isDark
                    ? 'brightness-90 group-hover:brightness-100'
                    : 'brightness-0 opacity-85 group-hover:opacity-100'
                }`}
              />
              <span
                className={`text-base sm:text-lg font-bold tracking-wide font-sans transition-colors ${
                  isDark
                    ? 'text-white group-hover:text-[#00c4de]'
                    : 'text-gray-900 group-hover:text-[#007b8b]'
                }`}
              >
                {s.name}
              </span>
            </div>
          ))}

        </div>
      </div>
    </div>
  )
}

/* ─── 2. HERO SECTION ─────────────────────────────────────────────── */
function HeroSection() {
  const { isDark } = useTheme()
  const { t } = useTranslation('home')

  return (
    <section
      className={`relative overflow-hidden pt-16 sm:pt-24 pb-10 sm:pb-12 transition-colors ${
        isDark ? 'bg-[#030708] text-white' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      {/* 3D Wireframe Terrain Background Asset */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <img
          src="/images/hero-wireframe.jpg"
          alt="3D Wireframe Terrain Mesh"
          className={`w-full h-full object-cover object-bottom transition-all ${
            isDark
              ? 'opacity-50 brightness-[0.75] contrast-[1.2] mix-blend-screen'
              : 'opacity-35 mix-blend-multiply filter invert hue-rotate-180 brightness-95 contrast-125'
          }`}
        />

        {/* Overhead spotlight beam with soft glow */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] blur-[130px] ${
            isDark
              ? 'bg-gradient-to-b from-[#00c4de]/15 via-[#007b8b]/6 to-transparent'
              : 'bg-gradient-to-b from-[#007b8b]/15 via-[#d3f7ff]/30 to-transparent'
          }`}
        />

        {/* Soft radial scrim behind text */}
        <div
          className={`absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[520px] rounded-full blur-[110px] ${
            isDark ? 'bg-[#030708]/60' : 'bg-[#F8F7F7]/60'
          }`}
        />

        {/* Top and bottom gradient fades */}
        <div
          className={`absolute inset-0 bg-gradient-to-b ${
            isDark
              ? 'from-[#030708] via-transparent to-[#030708]'
              : 'from-[#F8F7F7]/80 via-transparent to-[#F8F7F7]'
          }`}
        />
      </div>


      {/* Main Hero Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-8 backdrop-blur-md shadow-lg transition-colors ${
            isDark
              ? 'bg-[#007b8b]/20 border border-[#00c4de]/30 text-[#d3f7ff] shadow-[#00c4de]/10'
              : 'bg-white border border-[#007b8b]/25 text-[#007b8b] shadow-gray-200'
          }`}
        >
          <span className={`w-2 h-2 rounded-full animate-ping ${isDark ? 'bg-[#00c4de]' : 'bg-[#007b8b]'}`} />
          <span className={`text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'}`}>
            {t('hero.badge_ai')}
          </span>
          <span className={isDark ? 'text-gray-400' : 'text-gray-300'}>•</span>
          <span className={isDark ? 'text-gray-200' : 'text-gray-700 font-medium'}>{t('hero.badge_standard')}</span>
        </motion.div>

        {/* H1 Title: Project Name */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={`text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] mb-7 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          Sign
          <span
            className={`text-transparent bg-clip-text ${
              isDark
                ? 'bg-gradient-to-r from-[#00c4de] via-[#d3f7ff] to-[#007b8b] glow-cyan'
                : 'bg-gradient-to-r from-[#007b8b] to-[#00c4de]'
            }`}
          >
            Trust
          </span>
          Map
        </motion.h1>

        {/* H2 / Subtitle */}
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className={`text-lg sm:text-xl md:text-2xl font-medium max-w-3xl mx-auto leading-relaxed mb-10 ${
            isDark ? 'text-gray-200' : 'text-gray-700'
          }`}
        >
          {t('hero.subtitle')}
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
            className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 group ${
              isDark
                ? 'text-black bg-[#00c4de] hover:bg-[#38dbf1] shadow-[#00c4de]/25'
                : 'text-white bg-[#007b8b] hover:bg-[#00606d] shadow-[#007b8b]/20'
            }`}
          >
            <span>{t('hero.cta_map')}</span>
            <ArrowRight size={18} weight="bold" className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/product/app"
            className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-medium text-base backdrop-blur-md transition-all flex items-center justify-center gap-2 ${
              isDark
                ? 'text-white bg-white/5 hover:bg-white/10 border border-white/15'
                : 'text-gray-800 bg-white hover:bg-gray-100 border border-gray-300 shadow-sm'
            }`}
          >
            <DeviceMobile size={18} />
            <span>{t('hero.cta_app')}</span>
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
              stat: t('hero.stats.s1_stat'),
              title: t('hero.stats.s1_title'),
              desc: t('hero.stats.s1_desc'),
            },
            {
              stat: t('hero.stats.s2_stat'),
              title: t('hero.stats.s2_title'),
              desc: t('hero.stats.s2_desc'),
            },
            {
              stat: t('hero.stats.s3_stat'),
              title: t('hero.stats.s3_title'),
              desc: t('hero.stats.s3_desc'),
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 + idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={`rounded-[18px] p-7 text-left relative overflow-hidden group transition-all ${
                isDark
                  ? 'glass-card'
                  : 'bg-white border border-[#E8E4E3] shadow-md hover:border-[#007b8b]/50 hover:shadow-xl'
              }`}
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-[#00c4de]/10 rounded-full blur-2xl group-hover:bg-[#00c4de]/20 transition-all pointer-events-none" />
              <p
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 font-mono ${
                  isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
                }`}
              >
                {item.stat}
              </p>
              <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {item.title}
              </h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── 3. TOPOGRAPHIC TRANSITION ───────────────────────────────────── */
function TopographicTransitionSection() {
  const { isDark } = useTheme()
  const { t } = useTranslation('home')

  return (
    <section
      className={`relative py-10 sm:py-12 overflow-hidden border-t transition-colors ${
        isDark ? 'bg-[#030708] border-white/5 text-white' : 'bg-white border-[#E8E4E3] text-gray-900'
      }`}
    >
      {/* Background Contour SVG */}
      <div className={`absolute inset-0 pointer-events-none overflow-hidden ${isDark ? 'opacity-25' : 'opacity-10'}`}>
        <TopographicContour className="w-full h-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p
            className={`text-xs font-mono uppercase tracking-widest mb-3 ${
              isDark ? 'text-[#00c4de]' : 'text-[#007b8b] font-bold'
            }`}
          >
            {t('topo.eyebrow')}
          </p>
          <h2 className={`text-3xl sm:text-5xl font-bold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('topo.title')}
          </h2>
          <p className={`text-base sm:text-lg mt-4 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {t('topo.subtitle')}
          </p>
        </div>

        {/* 3 Core Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {[
            {
              icon: <Brain size={28} weight="duotone" className={isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'} />,
              tag: t('topo.cards.c1_tag'),
              title: t('topo.cards.c1_title'),
              body: t('topo.cards.c1_body'),
            },
            {
              icon: <ShieldCheck size={28} weight="duotone" className={isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'} />,
              tag: t('topo.cards.c2_tag'),
              title: t('topo.cards.c2_title'),
              body: t('topo.cards.c2_body'),
            },
            {
              icon: <ArrowsClockwise size={28} weight="duotone" className={isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'} />,
              tag: t('topo.cards.c3_tag'),
              title: t('topo.cards.c3_title'),
              body: t('topo.cards.c3_body'),
            },
          ].map((card) => (
            <div
              key={card.title}
              className={`rounded-[18px] p-7 flex flex-col justify-between group transition-all text-left ${
                isDark
                  ? 'glass-panel hover:border-[#00c4de]/40'
                  : 'bg-[#F8F7F7] border border-[#E8E4E3] hover:border-[#007b8b]/50 shadow-sm hover:shadow-lg'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-[12px] flex items-center justify-center ${
                      isDark ? 'bg-[#007b8b]/20' : 'bg-teal-100/60'
                    }`}
                  >
                    {card.icon}
                  </div>
                  <span
                    className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full border ${
                      isDark
                        ? 'bg-white/5 text-gray-300 border-white/10'
                        : 'bg-white text-gray-700 border-gray-200 shadow-xs'
                    }`}
                  >
                    {card.tag}
                  </span>
                </div>
                <h3
                  className={`text-lg font-bold mb-2.5 transition-colors ${
                    isDark ? 'text-white group-hover:text-[#00c4de]' : 'text-gray-900 group-hover:text-[#007b8b]'
                  }`}
                >
                  {card.title}
                </h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {card.body}
                </p>
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
  const { isDark } = useTheme()
  const { t } = useTranslation('home')

  return (
    <section
      className={`py-10 sm:py-12 border-t transition-colors ${
        isDark ? 'bg-[#050e11] border-white/5 text-white' : 'bg-[#F8F7F7] border-[#E8E4E3] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Description */}
          <div className="lg:col-span-5 text-left">
            <span
              className={`text-xs font-mono uppercase tracking-widest mb-2 block ${
                isDark ? 'text-[#00c4de]' : 'text-[#007b8b] font-bold'
              }`}
            >
              {t('map_preview.eyebrow')}
            </span>
            <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('map_preview.title')}
            </h2>
            <p className={`text-base leading-relaxed mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('map_preview.subtitle')}
            </p>

            <ul className="flex flex-col gap-3.5 mb-8">
              {[
                t('map_preview.feature_1'),
                t('map_preview.feature_2'),
                t('map_preview.feature_3'),
              ].map((item) => (
                <li
                  key={item}
                  className={`flex items-start gap-3 text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  <CheckCircle
                    size={18}
                    weight="fill"
                    className={`shrink-0 mt-0.5 ${isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'}`}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/product/map"
              className={`inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-bold shadow-lg transition-all ${
                isDark
                  ? 'text-black bg-[#00c4de] hover:bg-[#38dbf1] shadow-[#00c4de]/20'
                  : 'text-white bg-[#007b8b] hover:bg-[#00606d] shadow-[#007b8b]/20'
              }`}
            >
              <span>{t('map_preview.cta')}</span>
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
  const { isDark } = useTheme()
  const { t } = useTranslation('home')

  return (
    <section
      className={`py-10 sm:py-12 border-t relative overflow-hidden transition-colors ${
        isDark ? 'bg-[#030708] border-white/5 text-white' : 'bg-white border-[#E8E4E3] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className={`rounded-[24px] p-8 sm:p-14 relative overflow-hidden border shadow-xl transition-all ${
            isDark
              ? 'glass-panel border-[#00c4de]/20 bg-gradient-to-br from-[#061519] to-[#030a0c]'
              : 'bg-gradient-to-br from-teal-50/80 via-[#F8F7F7] to-white border-[#007b8b]/25 shadow-gray-200/60'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center text-left">
            <div>
              <span
                className={`text-xs font-mono uppercase tracking-widest mb-2 block ${
                  isDark ? 'text-[#00c4de]' : 'text-[#007b8b] font-bold'
                }`}
              >
                {t('mobile_cta.eyebrow')}
              </span>
              <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('mobile_cta.title')}
              </h2>
              <p className={`text-base leading-relaxed mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('mobile_cta.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <Link
                  to="/product/app"
                  className={`px-5 sm:px-6 py-3 sm:py-3.5 rounded-full font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg whitespace-nowrap active:scale-[0.98] ${
                    isDark
                      ? 'text-black bg-[#00c4de] hover:bg-[#38dbf1] shadow-[#00c4de]/20'
                      : 'text-white bg-[#007b8b] hover:bg-[#00606d] shadow-[#007b8b]/20'
                  }`}
                >
                  <DeviceMobile size={18} />
                  <span>{t('mobile_cta.cta_app')}</span>
                </Link>
                <Link
                  to="/docs"
                  className={`px-5 sm:px-6 py-3 sm:py-3.5 rounded-full font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap active:scale-[0.98] ${
                    isDark
                      ? 'text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
                      : 'text-gray-800 hover:text-black bg-white hover:bg-gray-100 border border-gray-300 shadow-xs'
                  }`}
                >
                  <Coins size={18} className={isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'} />
                  <span>{t('mobile_cta.cta_credit')}</span>
                </Link>
              </div>
            </div>

            {/* Right Mini Spec Badges */}
            <div className="grid grid-cols-2 gap-3.5">
              {[
                { title: t('mobile_cta.badge_1_title'), desc: t('mobile_cta.badge_1_desc') },
                { title: t('mobile_cta.badge_2_title'), desc: t('mobile_cta.badge_2_desc') },
                { title: t('mobile_cta.badge_3_title'), desc: t('mobile_cta.badge_3_desc') },
                { title: t('mobile_cta.badge_4_title'), desc: t('mobile_cta.badge_4_desc') },
              ].map((b) => (
                <div
                  key={b.title}
                  className={`p-4 rounded-[14px] flex flex-col justify-center border transition-all ${
                    isDark
                      ? 'bg-white/[0.03] border-white/10'
                      : 'bg-white border-gray-200 shadow-sm'
                  }`}
                >
                  <h4 className={`text-sm font-bold mb-1 ${isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'}`}>
                    {b.title}
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{b.desc}</p>
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
  const { isDark } = useTheme()

  return (
    <div className={`flex flex-col min-h-screen transition-colors ${isDark ? 'bg-[#030708] text-white' : 'bg-[#F8F7F7] text-gray-900'}`}>
      <HeroSection />
      <TopographicTransitionSection />
      <MapPreviewSection />
      <MobileDownloadSection />
    </div>
  )
}
