import {
  DeviceMobile,
  AppleLogo,
  GooglePlayLogo,
  CheckCircle,
  NavigationArrow,
  VideoCamera,
  Coins,
  ArrowsClockwise,
  Sparkle,
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/context/ThemeContext'

export default function ProductApp() {
  const { isDark } = useTheme()
  const { t } = useTranslation('product')

  const keyFeatures = [
    {
      icon: <VideoCamera size={24} weight="bold" />,
      title: t('app_page.feature_1_title'),
      desc: t('app_page.feature_1_desc'),
      tag: '01',
    },
    {
      icon: <NavigationArrow size={24} weight="bold" />,
      title: t('app_page.feature_2_title'),
      desc: t('app_page.feature_2_desc'),
      tag: '02',
    },
    {
      icon: <Coins size={24} weight="bold" />,
      title: t('app_page.feature_3_title'),
      desc: t('app_page.feature_3_desc'),
      tag: '03',
    },
    {
      icon: <ArrowsClockwise size={24} weight="bold" />,
      title: t('app_page.feature_4_title'),
      desc: t('app_page.feature_4_desc'),
      tag: '04',
    },
  ]

  const checklistItems = [
    t('app_page.checklist_1'),
    t('app_page.checklist_2'),
    t('app_page.checklist_3'),
    t('app_page.checklist_4'),
  ]

  const workflowSteps = [
    {
      step: '01',
      title: t('app_page.step_1_title'),
      desc: t('app_page.step_1_desc'),
    },
    {
      step: '02',
      title: t('app_page.step_2_title'),
      desc: t('app_page.step_2_desc'),
    },
    {
      step: '03',
      title: t('app_page.step_3_title'),
      desc: t('app_page.step_3_desc'),
    },
    {
      step: '04',
      title: t('app_page.step_4_title'),
      desc: t('app_page.step_4_desc'),
    },
  ]

  return (
    <div
      className={`w-full min-h-[calc(100vh-80px)] py-6 sm:py-8 transition-colors ${
        isDark ? 'bg-[#030708] text-gray-100' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* ─── SECTION 1: HERO SHOWCASE (Clean 2-Column Split) ─────────── */}
        <div
          className={`rounded-2xl p-6 sm:p-10 lg:p-12 border relative overflow-hidden transition-colors text-left ${
            isDark
              ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
              : 'bg-white border-[#E8E4E3] shadow-xs'
          }`}
        >
          {/* Subtle Ambient Glow */}
          <div
            className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
              isDark ? 'bg-[#00c4de]/10' : 'bg-teal-100/50'
            }`}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            {/* Left Content Column (7 cols) */}
            <div className="lg:col-span-7 flex flex-col text-left">
              {/* Eyebrow badge */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                    isDark
                      ? 'bg-[#007b8b]/20 border-[#00c4de]/30 text-[#00c4de]'
                      : 'bg-teal-50 border-teal-200 text-[#007b8b]'
                  }`}
                >
                  <DeviceMobile size={14} weight="bold" />
                  <span>{t('app_page.eyebrow')}</span>
                </span>
              </div>

              {/* H1 Title */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                {t('app_page.title')}{' '}
                <span className="text-[#007b8b] dark:text-[#00c4de]">
                  {t('app_page.title_highlight')}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-3 leading-relaxed max-w-2xl font-medium">
                {t('app_page.subtitle')}
              </p>

              {/* Checklist Items */}
              <ul className="mt-6 space-y-3">
                {checklistItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-xs sm:text-sm">
                    <CheckCircle
                      size={18}
                      weight="fill"
                      className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400"
                    />
                    <span className="font-semibold text-gray-800 dark:text-gray-200 leading-snug">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Download Buttons Row */}
              <div className="flex flex-wrap items-center gap-3.5 mt-8">
                <a
                  href="#download-ios"
                  onClick={(e) => e.preventDefault()}
                  className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/15 text-white border-white/20 shadow-black/40'
                      : 'bg-gray-900 hover:bg-black text-white border-gray-900 shadow-gray-400/40'
                  }`}
                >
                  <AppleLogo size={24} weight="fill" className="shrink-0" />
                  <div className="text-left leading-none">
                    <p className="text-[10px] uppercase font-mono text-gray-300 mb-1">
                      {t('app_page.download_on')}
                    </p>
                    <p className="text-sm font-extrabold">{t('app_page.download_ios')}</p>
                  </div>
                </a>

                <a
                  href="#download-android"
                  onClick={(e) => e.preventDefault()}
                  className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/15 text-white border-white/20 shadow-black/40'
                      : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 shadow-xs'
                  }`}
                >
                  <GooglePlayLogo size={24} weight="fill" className="shrink-0 text-[#007b8b] dark:text-[#00c4de]" />
                  <div className="text-left leading-none">
                    <p className="text-[10px] uppercase font-mono text-gray-500 dark:text-gray-400 mb-1">
                      {t('app_page.download_on')}
                    </p>
                    <p className="text-sm font-extrabold">{t('app_page.download_android')}</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Right Column: High-Fidelity Phone Screen Mockup (5 cols) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-72 sm:w-80 h-[520px] rounded-[38px] border-4 border-gray-800 dark:border-gray-700 bg-black p-3 shadow-2xl relative flex flex-col justify-between overflow-hidden">
                {/* Dynamic island notch */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-20" />

                {/* Phone Screen Internal Container */}
                <div
                  className={`w-full h-full rounded-[28px] p-4 flex flex-col justify-between text-left relative transition-colors ${
                    isDark
                      ? 'bg-[#08171b] border border-white/10 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  {/* Status Bar */}
                  <div className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {t('app_page.phone_live_gps')}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
                        {t('app_page.phone_credits')}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                        {t('app_page.phone_driving_on')}
                      </span>
                      <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                        {t('app_page.phone_road_name')}
                      </p>
                    </div>
                  </div>

                  {/* Real-time Direction Alert Card */}
                  <div
                    className={`p-3.5 rounded-2xl border-2 transition-colors ${
                      isDark
                        ? 'bg-red-500/15 border-red-500/40 text-white shadow-lg'
                        : 'bg-red-50 border-red-300 text-gray-900 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                      <span className="font-extrabold text-red-700 dark:text-red-400">
                        {t('app_page.phone_warning_heading')}
                      </span>
                      <span className="font-extrabold px-1.5 py-0.5 rounded bg-red-100 text-red-900 border border-red-300 dark:bg-red-500/30 dark:text-red-300 dark:border-red-500/40">
                        {t('app_page.phone_warning_distance')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-red-600 text-white font-extrabold text-xs flex items-center justify-center border-2 border-white shrink-0 shadow-xs font-mono">
                        P
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                          {t('app_page.phone_sign_name')}
                        </h4>
                        <p className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                          {t('app_page.phone_sign_trust')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Trip Telemetry Bar */}
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      isDark
                        ? 'bg-black/50 border-white/10 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block font-mono">
                        {t('app_page.phone_trip_title')}
                      </span>
                      <p className="font-extrabold font-mono text-xs text-gray-900 dark:text-white mt-0.5">
                        {t('app_page.phone_trip_stat')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600 text-white font-mono font-extrabold text-[10px] shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span>REC</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 2: 4 KEY CAPABILITIES ─────────────────────────── */}
        <div className="space-y-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-gray-200 dark:border-white/10">
            <div>
              <span className="text-xs font-bold text-[#007b8b] dark:text-[#00c4de] uppercase tracking-wider block mb-1">
                {t('app_page.section_features_eyebrow')}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {t('app_page.section_features_title')}
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400">
              QCVN 41:2019 • YOLO12 & CLIP
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {keyFeatures.map((f) => (
              <div
                key={f.title}
                className={`rounded-2xl p-5 border flex flex-col justify-between group transition-all ${
                  isDark
                    ? 'bg-[#071317] border-white/10 hover:border-[#00c4de] hover:shadow-lg hover:shadow-[#00c4de]/5'
                    : 'bg-white border-[#E8E4E3] hover:border-[#007b8b] hover:shadow-md shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-50 text-[#007b8b] dark:bg-[#007b8b]/20 dark:text-[#00c4de] border border-teal-200/60 dark:border-[#00c4de]/20">
                      {f.icon}
                    </div>
                    <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 border border-gray-200 dark:bg-white/5 dark:text-gray-300 dark:border-white/10">
                      {f.tag}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white group-hover:text-[#007b8b] dark:group-hover:text-[#00c4de] transition-colors leading-snug">
                    {f.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed font-normal">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── SECTION 3: 4 SIMPLE STEPS (Clean Timeline Cards) ────────── */}
        <div
          className={`rounded-2xl p-6 sm:p-8 border text-left transition-colors ${
            isDark
              ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
              : 'bg-white border-[#E8E4E3] shadow-xs'
          }`}
        >
          <div className="mb-6 pb-4 border-b border-gray-200 dark:border-white/10">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('app_page.section_steps_title')}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('app_page.section_steps_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {workflowSteps.map((s) => (
              <div
                key={s.step}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isDark
                    ? 'bg-white/[0.02] border-white/10'
                    : 'bg-gray-50/80 border-gray-200'
                }`}
              >
                <div>
                  <span className="text-2xl font-extrabold font-mono text-[#007b8b] dark:text-[#00c4de] block mb-2">
                    {s.step}
                  </span>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white mb-1.5 leading-snug">
                    {s.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-normal">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── SECTION 4: INVITATION / DOWNLOAD CALL TO ACTION ─────────── */}
        <div
          className={`rounded-2xl p-8 sm:p-10 border text-center relative overflow-hidden transition-colors ${
            isDark
              ? 'bg-gradient-to-br from-[#08181c] via-[#061418] to-[#040b0d] border-white/15 shadow-xl'
              : 'bg-gradient-to-br from-teal-50 via-white to-teal-50/30 border-[#E8E4E3] shadow-xs'
          }`}
        >
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-teal-100 text-teal-950 border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30">
              <Sparkle size={14} weight="fill" className="text-amber-500" />
              <span>{t('app_page.cta_badge', { ns: 'product' })}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('app_page.cta_title', { ns: 'product' })}
            </h2>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl mx-auto font-medium">
              {t('app_page.cta_subtitle', { ns: 'product' })}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="#download-ios"
                onClick={(e) => e.preventDefault()}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/15 text-white border-white/20'
                    : 'bg-gray-900 hover:bg-black text-white border-gray-900'
                }`}
              >
                <AppleLogo size={20} weight="fill" />
                <span>App Store</span>
              </a>

              <a
                href="#download-android"
                onClick={(e) => e.preventDefault()}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/15 text-white border-white/20'
                    : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300'
                }`}
              >
                <GooglePlayLogo size={20} weight="fill" className="text-[#007b8b] dark:text-[#00c4de]" />
                <span>Google Play</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
