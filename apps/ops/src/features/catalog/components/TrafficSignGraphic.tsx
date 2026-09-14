import type { CatalogEntry } from '@/data/catalogData'

interface TrafficSignGraphicProps {
  sign: Pick<CatalogEntry, 'code' | 'shape' | 'color' | 'nameVi'>
  className?: string
  size?: number
}

export function TrafficSignGraphic({ sign, className = 'w-16 h-16', size }: TrafficSignGraphicProps) {
  const style = size ? { width: size, height: size } : undefined
  const code = sign.code.toUpperCase().trim()

  // P.102: Cấm đi ngược chiều
  if (code === 'P.102') {
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        style={style}
        aria-label={sign.nameVi}
      >
        <circle cx="50" cy="50" r="45" fill="#dc2626" stroke="#b91c1c" strokeWidth="2" />
        <rect x="18" y="42" width="64" height="16" rx="3.5" fill="#ffffff" />
      </svg>
    )
  }

  // P.103a: Cấm ô tô
  if (code === 'P.103A' || code === 'P.103') {
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        style={style}
        aria-label={sign.nameVi}
      >
        <circle cx="50" cy="50" r="45" fill="#ffffff" stroke="#dc2626" strokeWidth="9" />
        {/* Car silhouette */}
        <path
          d="M 33 46 L 38 35 C 39.5 32 42 32 45 32 L 55 32 C 58 32 60.5 32 62 35 L 67 46 Z"
          fill="#1e293b"
        />
        <path
          d="M 36 44 L 40 36 C 41 34.5 42.5 34.5 45 34.5 L 55 34.5 C 57.5 34.5 59 34.5 60 36 L 64 44 Z"
          fill="#ffffff"
        />
        <rect x="27" y="46" width="46" height="18" rx="4" fill="#1e293b" />
        <circle cx="33" cy="53" r="3.5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" />
        <circle cx="67" cy="53" r="3.5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" />
        <rect x="42" y="52" width="16" height="5" rx="1.5" fill="#ffffff" />
        <line x1="45" y1="54.5" x2="55" y2="54.5" stroke="#1e293b" strokeWidth="1.5" />
        <rect x="29" y="62" width="8" height="6" rx="2" fill="#0f172a" />
        <rect x="63" y="62" width="8" height="6" rx="2" fill="#0f172a" />
        <rect x="30" y="60" width="40" height="3" rx="1" fill="#475569" />
      </svg>
    )
  }

  // P.127: Tốc độ tối đa cho phép 60 km/h
  if (code === 'P.127') {
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        style={style}
        aria-label={sign.nameVi}
      >
        <circle cx="50" cy="50" r="45" fill="#ffffff" stroke="#dc2626" strokeWidth="9" />
        <text
          x="50"
          y="62"
          textAnchor="middle"
          fill="#0f172a"
          fontSize="36"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        >
          60
        </text>
      </svg>
    )
  }

  // P.124a: Cấm quay đầu xe
  if (code === 'P.124A' || code === 'P.124') {
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        style={style}
        aria-label={sign.nameVi}
      >
        <circle cx="50" cy="50" r="45" fill="#ffffff" stroke="#dc2626" strokeWidth="9" />
        <path
          d="M 58 64 L 58 46 C 58 36 53 30 46 30 C 39 30 34 36 34 46 L 34 58"
          fill="none"
          stroke="#1e293b"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <polygon points="26,56 42,56 34,68" fill="#1e293b" />
        <line
          x1="26"
          y1="26"
          x2="74"
          y2="74"
          stroke="#dc2626"
          strokeWidth="7.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  // W.201a: Chỗ ngoặt nguy hiểm vòng bên trái
  if (code === 'W.201A' || code === 'W.201') {
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        style={style}
        aria-label={sign.nameVi}
      >
        <polygon
          points="50,12 89,82 11,82"
          fill="#fbbf24"
          stroke="#dc2626"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        <path
          d="M 57 70 L 57 52 C 57 44 50 40 42 40 L 36 40"
          fill="none"
          stroke="#0f172a"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <polygon points="38,32 38,48 26,40" fill="#0f172a" />
      </svg>
    )
  }

  // W.205a: Đường giao nhau cùng mức
  if (code === 'W.205A' || code === 'W.205') {
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        style={style}
        aria-label={sign.nameVi}
      >
        <polygon
          points="50,12 89,82 11,82"
          fill="#fbbf24"
          stroke="#dc2626"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        <line x1="50" y1="36" x2="50" y2="72" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
        <line x1="32" y1="54" x2="68" y2="54" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
      </svg>
    )
  }

  // W.207a: Giao nhau với đường không ưu tiên
  if (code === 'W.207A' || code === 'W.207') {
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        style={style}
        aria-label={sign.nameVi}
      >
        <polygon
          points="50,12 89,82 11,82"
          fill="#fbbf24"
          stroke="#dc2626"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        {/* Main priority road arrow */}
        <path d="M 50 72 L 50 40" stroke="#0f172a" strokeWidth="9" strokeLinecap="square" />
        <polygon points="40,42 60,42 50,30" fill="#0f172a" />
        {/* Side minor road */}
        <line x1="30" y1="56" x2="70" y2="56" stroke="#0f172a" strokeWidth="4" />
      </svg>
    )
  }

  // R.301a: Hướng đi phải theo - Đi thẳng
  if (code === 'R.301A' || code === 'R.301') {
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        style={style}
        aria-label={sign.nameVi}
      >
        <circle cx="50" cy="50" r="45" fill="#1d4ed8" stroke="#1e40af" strokeWidth="2" />
        <circle cx="50" cy="50" r="41" fill="none" stroke="#ffffff" strokeWidth="1.5" />
        <line x1="50" y1="72" x2="50" y2="36" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
        <polygon points="36,40 64,40 50,22" fill="#ffffff" />
      </svg>
    )
  }

  // R.302a: Hướng phải đi vòng chướng ngại vật - Vòng sang phải
  if (code === 'R.302A' || code === 'R.302') {
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        style={style}
        aria-label={sign.nameVi}
      >
        <circle cx="50" cy="50" r="45" fill="#1d4ed8" stroke="#1e40af" strokeWidth="2" />
        <circle cx="50" cy="50" r="41" fill="none" stroke="#ffffff" strokeWidth="1.5" />
        {/* Slanted arrow down-right */}
        <line x1="36" y1="36" x2="62" y2="62" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
        <polygon points="48,68 68,68 68,48" fill="#ffffff" />
      </svg>
    )
  }

  // I.401: Bắt đầu đường ưu tiên (Priority Road Diamond)
  if (code === 'I.401') {
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        style={style}
        aria-label={sign.nameVi}
      >
        <rect
          x="20"
          y="20"
          width="60"
          height="60"
          rx="4"
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth="2.5"
          transform="rotate(45 50 50)"
        />
        <rect
          x="28"
          y="28"
          width="44"
          height="44"
          rx="3"
          fill="#fbbf24"
          stroke="#f59e0b"
          strokeWidth="2"
          transform="rotate(45 50 50)"
        />
      </svg>
    )
  }

  // I.407a: Đường một chiều
  if (code === 'I.407A' || code === 'I.407') {
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        style={style}
        aria-label={sign.nameVi}
      >
        <rect x="14" y="10" width="72" height="80" rx="8" fill="#1d4ed8" stroke="#1e40af" strokeWidth="3" />
        <rect x="18" y="14" width="64" height="72" rx="5" fill="none" stroke="#ffffff" strokeWidth="1.5" />
        <line x1="50" y1="72" x2="50" y2="34" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
        <polygon points="36,38 64,38 50,20" fill="#ffffff" />
      </svg>
    )
  }

  // S.501: Phạm vi tác dụng của biển
  if (code === 'S.501') {
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        style={style}
        aria-label={sign.nameVi}
      >
        <rect x="10" y="24" width="80" height="52" rx="6" fill="#ffffff" stroke="#0f172a" strokeWidth="4" />
        {/* Up and down arrow on sides */}
        <line x1="22" y1="36" x2="22" y2="64" stroke="#0f172a" strokeWidth="3" />
        <polygon points="18,40 26,40 22,32" fill="#0f172a" />
        <polygon points="18,60 26,60 22,68" fill="#0f172a" />
        <text
          x="52"
          y="56"
          textAnchor="middle"
          fill="#0f172a"
          fontSize="18"
          fontWeight="900"
          fontFamily="monospace"
        >
          100m
        </text>
        <line x1="80" y1="36" x2="80" y2="64" stroke="#0f172a" strokeWidth="3" />
        <polygon points="76,40 84,40 80,32" fill="#0f172a" />
        <polygon points="76,60 84,60 80,68" fill="#0f172a" />
      </svg>
    )
  }

  // Generic Fallback based on shape & color
  const isRedWhite = sign.color === 'Red-White'
  const isYellowBlack = sign.color === 'Yellow-Black'

  if (sign.shape === 'Triangle') {
    let triangleTextFill = '#1e293b'
    if (isYellowBlack) {
      triangleTextFill = '#0f172a'
    } else if (isRedWhite) {
      triangleTextFill = '#dc2626'
    }

    return (
      <svg viewBox="0 0 100 100" className={className} style={style} aria-label={sign.nameVi}>
        <polygon
          points="50,12 89,82 11,82"
          fill={isYellowBlack ? '#fbbf24' : '#ffffff'}
          stroke={isRedWhite ? '#dc2626' : '#0f172a'}
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <text
          x="50"
          y="65"
          textAnchor="middle"
          fill={triangleTextFill}
          fontSize="16"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {sign.code}
        </text>
      </svg>
    )
  }

  if (sign.shape === 'Rectangle') {
    let bg = '#ffffff'
    let border = '#dc2626'
    let textFill = '#ffffff'

    if (sign.color === 'Blue-White') {
      bg = '#1d4ed8'
      border = '#1e40af'
    } else if (sign.color === 'Green-White') {
      bg = '#059669'
      border = '#047857'
    } else if (sign.color === 'Yellow-Black') {
      bg = '#fbbf24'
      border = '#0f172a'
      textFill = '#0f172a'
    }

    return (
      <svg viewBox="0 0 100 100" className={className} style={style} aria-label={sign.nameVi}>
        <rect x="12" y="18" width="76" height="64" rx="8" fill={bg} stroke={border} strokeWidth="4" />
        <text
          x="50"
          y="56"
          textAnchor="middle"
          fill={textFill}
          fontSize="16"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {sign.code}
        </text>
      </svg>
    )
  }

  // Default: Circle
  let circleBg = '#059669'
  let circleStroke = '#0f172a'
  let strokeWidth = 3
  let textFill = '#ffffff'

  if (sign.color === 'Blue-White') {
    circleBg = '#1d4ed8'
    circleStroke = '#1e40af'
  } else if (sign.color === 'Red-White') {
    circleBg = '#ffffff'
    circleStroke = '#dc2626'
    strokeWidth = 9
    textFill = '#dc2626'
  } else if (sign.color === 'Yellow-Black') {
    circleBg = '#fbbf24'
    circleStroke = '#0f172a'
    textFill = '#0f172a'
  }

  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-label={sign.nameVi}>
      <circle cx="50" cy="50" r="45" fill={circleBg} stroke={circleStroke} strokeWidth={strokeWidth} />
      <text
        x="50"
        y="56"
        textAnchor="middle"
        fill={textFill}
        fontSize="16"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {sign.code}
      </text>
    </svg>
  )
}
