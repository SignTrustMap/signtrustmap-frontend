export function TopographicContour({ className = '' }: { className?: string }) {
  return (
    <div className={`relative w-full overflow-hidden pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 1440 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto opacity-30 preserve-3d"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="contourGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#007b8b" stopOpacity="0" />
            <stop offset="30%" stopColor="#00c4de" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#007b8b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00c4de" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="contourGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00c4de" stopOpacity="0" />
            <stop offset="50%" stopColor="#00c4de" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#007b8b" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="meshCenterGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00c4de" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#007b8b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Center ambient glow */}
        <ellipse cx="720" cy="160" rx="450" ry="120" fill="url(#meshCenterGlow)" />

        {/* Contour lines (elevation curves) */}
        <path
          d="M-50,220 C200,140 450,260 720,170 C990,80 1250,230 1490,160"
          stroke="url(#contourGrad1)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d="M-50,250 C240,160 480,290 720,200 C960,110 1200,260 1490,190"
          stroke="url(#contourGrad1)"
          strokeWidth="1.2"
        />
        <path
          d="M-50,280 C260,190 500,310 720,225 C940,140 1180,280 1490,220"
          stroke="url(#contourGrad2)"
          strokeWidth="1"
        />
        <path
          d="M-50,180 C180,110 430,220 720,130 C1010,40 1260,190 1490,120"
          stroke="url(#contourGrad2)"
          strokeWidth="0.8"
        />
        <path
          d="M-50,140 C150,80 400,180 720,95 C1040,10 1280,150 1490,80"
          stroke="url(#contourGrad1)"
          strokeWidth="0.6"
          strokeDasharray="6 3"
        />

        {/* Geospatial GPS data nodes */}
        <circle cx="450" cy="260" r="3" fill="#00c4de" />
        <circle cx="720" cy="170" r="4" fill="#00c4de" className="animate-ping" />
        <circle cx="720" cy="170" r="3" fill="#ffffff" />
        <circle cx="990" cy="80" r="3" fill="#00c4de" />
        <circle cx="1200" cy="260" r="2.5" fill="#007b8b" />
      </svg>
    </div>
  )
}
