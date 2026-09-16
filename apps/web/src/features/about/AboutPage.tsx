import { useState, useEffect } from 'react'

export default function AboutPage() {
  const [showIp, setShowIp] = useState(false)
  const [timestamp, setTimestamp] = useState('2026-09-16 12:07:41 UTC')
  const [rayId, setRayId] = useState('7d6076f62e0d9bb2')
  const [hostName, setHostName] = useState('signtrustmap.vn')

  useEffect(() => {
    // 1. Set authentic Cloudflare title on document tab
    const previousTitle = document.title
    document.title = '502 Bad Gateway'

    // 2. Generate current UTC time formatted: YYYY-MM-DD HH:mm:ss UTC
    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const formattedDate = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`
    setTimestamp(formattedDate)

    // 3. Set host name dynamically from browser or fallback
    if (typeof window !== 'undefined' && window.location.host) {
      setHostName(window.location.host)
    }

    // 4. Generate realistic 16-hex Cloudflare Ray ID
    const randomHex = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
    setRayId(randomHex)

    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <div className="min-h-screen w-full bg-white text-[#36393b] font-sans antialiased flex flex-col justify-between selection:bg-[#2f7bbf] selection:text-white">
      {/* ─── Top Header Section ────────────────────────────────────────── */}
      <div className="w-full">
        <div className="max-w-[1000px] mx-auto px-6 sm:px-8 pt-10 sm:pt-14 pb-8 text-left">
          <div className="flex items-center gap-3.5 flex-wrap">
            <h1 className="text-[44px] sm:text-[54px] font-light text-[#36393b] tracking-tight leading-none">
              Bad gateway
            </h1>
            <span className="inline-block text-[12px] font-normal text-[#595959] bg-[#e2e2e2] px-2.5 py-0.5 rounded-full mt-1.5 sm:mt-2">
              Error code 502
            </span>
          </div>

          <p className="text-[15px] text-[#595959] mt-4 font-normal">
            Visit{' '}
            <a
              href="https://www.cloudflare.com/5xx-error-landing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2f7bbf] hover:underline"
            >
              cloudflare.com
            </a>{' '}
            for more information.
          </p>

          <p className="text-[15px] text-[#595959] mt-1.5 font-normal">
            {timestamp}
          </p>
        </div>

        {/* ─── Middle Diagnostic Banner (Light Gray with Pointer) ────────── */}
        <div className="w-full bg-[#ebebeb] py-10 sm:py-12 relative select-none">
          <div className="max-w-[1000px] mx-auto px-6 sm:px-8">
            <div className="grid grid-cols-3 gap-2 sm:gap-6 text-center items-end">
              {/* 1. Browser Column */}
              <div className="flex flex-col items-center">
                {/* Browser Device Graphic */}
                <div className="relative inline-block mb-1">
                  <svg
                    viewBox="0 0 88 68"
                    className="w-[74px] sm:w-[88px] h-[58px] sm:h-[68px]"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="6" y="6" width="76" height="56" rx="8" fill="#797979" />
                    <rect x="12" y="12" width="6" height="4" rx="1" fill="#ebebeb" />
                    <rect x="21" y="12" width="6" height="4" rx="1" fill="#ebebeb" />
                    <rect x="30" y="12" width="6" height="4" rx="1" fill="#ebebeb" />
                    <rect x="12" y="21" width="64" height="35" rx="3" fill="#ebebeb" />
                  </svg>
                  {/* Green Check Badge */}
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#8ec33f] flex items-center justify-center shadow-xs">
                    <svg
                      viewBox="0 0 16 16"
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white fill-none stroke-current stroke-[2.5] stroke-linecap-round stroke-linejoin-round"
                    >
                      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
                    </svg>
                  </div>
                </div>

                <span className="text-[13px] sm:text-[14px] text-[#595959] mt-3 font-normal">
                  You
                </span>
                <span className="text-[20px] sm:text-[26px] text-[#797979] font-light mt-0.5 sm:mt-1 leading-tight">
                  Browser
                </span>
                <span className="text-[17px] sm:text-[22px] text-[#8ec33f] font-light mt-0.5 leading-tight">
                  Working
                </span>
              </div>

              {/* 2. Cloudflare Column */}
              <div className="flex flex-col items-center">
                {/* Cloud Graphic */}
                <div className="relative inline-block mb-1">
                  <svg
                    viewBox="0 0 100 68"
                    className="w-[84px] sm:w-[100px] h-[58px] sm:h-[68px]"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M24 60h52a16 16 0 0 0 5.8-30.9 23 23 0 0 0-43.6-7.8A17 17 0 0 0 14 37a17 17 0 0 0 10 23z"
                      fill="#797979"
                    />
                  </svg>
                  {/* Green Check Badge */}
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#8ec33f] flex items-center justify-center shadow-xs">
                    <svg
                      viewBox="0 0 16 16"
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white fill-none stroke-current stroke-[2.5] stroke-linecap-round stroke-linejoin-round"
                    >
                      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
                    </svg>
                  </div>
                </div>

                <span className="text-[13px] sm:text-[14px] text-[#595959] mt-3 font-normal">
                  Frankfurt
                </span>
                <span className="text-[20px] sm:text-[26px] text-[#2f7bbf] font-light mt-0.5 sm:mt-1 leading-tight">
                  Cloudflare
                </span>
                <span className="text-[17px] sm:text-[22px] text-[#8ec33f] font-light mt-0.5 leading-tight">
                  Working
                </span>
              </div>

              {/* 3. Host Column (Error) */}
              <div className="flex flex-col items-center">
                {/* Host Server Appliance Graphic */}
                <div className="relative inline-block mb-1">
                  <svg
                    viewBox="0 0 88 68"
                    className="w-[74px] sm:w-[88px] h-[58px] sm:h-[68px]"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 10h52a10 10 0 0 1 9.8 8l4.2 24a8 8 0 0 1-7.8 10H11.8a8 8 0 0 1-7.8-10l4.2-24a10 10 0 0 1 9.8-8z"
                      fill="#797979"
                    />
                    <rect x="18" y="34" width="36" height="5" rx="2.5" fill="#ebebeb" />
                    <circle cx="63" cy="36.5" r="3" fill="#ebebeb" />
                    <circle cx="71" cy="36.5" r="3" fill="#ebebeb" />
                  </svg>
                  {/* Red Cross Badge */}
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#b9352e] flex items-center justify-center shadow-xs">
                    <svg
                      viewBox="0 0 16 16"
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white fill-none stroke-current stroke-[2.5] stroke-linecap-round stroke-linejoin-round"
                    >
                      <path d="M4 4l8 8m0-8l-8 8" />
                    </svg>
                  </div>
                </div>

                <span className="text-[12px] sm:text-[14px] text-[#595959] mt-3 font-normal truncate max-w-full px-1">
                  {hostName}
                </span>
                <span className="text-[20px] sm:text-[26px] text-[#797979] font-light mt-0.5 sm:mt-1 leading-tight">
                  Host
                </span>
                <span className="text-[17px] sm:text-[22px] text-[#b9352e] font-light mt-0.5 leading-tight">
                  Error
                </span>
              </div>
            </div>
          </div>

          {/* Downward triangle pointer pointing from under the Host column */}
          <div className="absolute bottom-0 left-0 w-full pointer-events-none">
            <div className="max-w-[1000px] mx-auto px-6 sm:px-8 grid grid-cols-3">
              <div className="col-start-3 flex justify-center">
                <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[14px] border-t-[#ebebeb] -mb-[14px]" />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Lower Section: What happened? & What can I do? ────────────── */}
        <div className="max-w-[1000px] mx-auto px-6 sm:px-8 pt-16 sm:pt-20 pb-8 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16">
            <div>
              <h2 className="text-[24px] sm:text-[28px] font-normal text-[#36393b] mb-3 sm:mb-4">
                What happened?
              </h2>
              <p className="text-[15px] text-[#595959] leading-relaxed">
                The web server reported a bad gateway error.
              </p>
            </div>
            <div>
              <h2 className="text-[24px] sm:text-[28px] font-normal text-[#36393b] mb-3 sm:mb-4">
                What can I do?
              </h2>
              <p className="text-[15px] text-[#595959] leading-relaxed">
                Please try again in a few minutes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Cloudflare Ray ID & Security Footer ───────────────────────── */}
      <div className="w-full">
        <div className="max-w-[1000px] mx-auto px-6 sm:px-8">
          <div className="w-full border-t border-[#e5e5e5] my-8 sm:my-10" />
          <div className="text-[12px] sm:text-[13px] text-[#595959] text-center pb-10 leading-relaxed font-normal">
            <span>
              Cloudflare Ray ID:{' '}
              <strong className="font-semibold text-[#36393b]">{rayId}</strong>
            </span>
            <span className="mx-2 text-[#b0b0b0]">•</span>
            <span>
              Your IP:{' '}
              <button
                type="button"
                onClick={() => setShowIp(!showIp)}
                className="text-[#2f7bbf] hover:underline cursor-pointer bg-transparent border-none p-0 inline font-normal"
              >
                {showIp ? '14.241.229.84' : 'Click to reveal'}
              </button>
            </span>
            <span className="mx-2 text-[#b0b0b0]">•</span>
            <span>
              Performance &amp; security by{' '}
              <a
                href="https://www.cloudflare.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2f7bbf] hover:underline"
              >
                Cloudflare
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
