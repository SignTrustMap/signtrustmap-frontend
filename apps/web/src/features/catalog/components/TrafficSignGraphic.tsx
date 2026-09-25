import type { TrafficCatalogSign } from '@/data'

interface TrafficSignGraphicProps {
  sign: Pick<TrafficCatalogSign, 'code' | 'shape' | 'color' | 'nameVi'>
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
        {/* Roof / cabin */}
        <path
          d="M 33 46 L 38 35 C 39.5 32 42 32 45 32 L 55 32 C 58 32 60.5 32 62 35 L 67 46 Z"
          fill="#1e293b"
        />
        {/* Windshield */}
        <path
          d="M 36 44 L 40 36 C 41 34.5 42.5 34.5 45 34.5 L 55 34.5 C 57.5 34.5 59 34.5 60 36 L 64 44 Z"
          fill="#ffffff"
        />
        {/* Lower body */}
        <rect x="27" y="46" width="46" height="18" rx="4" fill="#1e293b" />
        {/* Headlights */}
        <circle cx="33" cy="53" r="3.5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" />
        <circle cx="67" cy="53" r="3.5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" />
        {/* Grille */}
        <rect x="42" y="52" width="16" height="5" rx="1.5" fill="#ffffff" />
        <line x1="45" y1="54.5" x2="55" y2="54.5" stroke="#1e293b" strokeWidth="1.5" />
        {/* Tires */}
        <rect x="29" y="62" width="8" height="6" rx="2" fill="#0f172a" />
        <rect x="63" y="62" width="8" height="6" rx="2" fill="#0f172a" />
        {/* Bumper */}
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
        {/* U-Turn path */}
        <path
          d="M 58 64 L 58 46 C 58 36 53 30 46 30 C 39 30 34 36 34 46 L 34 58"
          fill="none"
          stroke="#1e293b"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Arrowhead */}
        <polygon points="26,56 42,56 34,68" fill="#1e293b" />
        {/* Red Diagonal Slash */}
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
        {/* Yellow equilateral triangle */}
        <polygon
          points="50,12 89,82 11,82"
          fill="#fbbf24"
          stroke="#0f172a"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        {/* Inner black border line */}
        <polygon
          points="50,18 84,79 16,79"
          fill="none"
          stroke="#0f172a"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Left curving arrow */}
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
        {/* Straight arrow */}
        <line x1="50" y1="72" x2="50" y2="36" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
        <polygon points="36,40 64,40 50,22" fill="#ffffff" />
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
          fontSize="18"
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
          fontSize="18"
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
        fontSize="18"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {sign.code}
      </text>
    </svg>
  )
}
