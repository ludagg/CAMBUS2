import React from 'react';

interface Props {
  className?: string;
  /** Draw the headlight beam ahead of the bus. */
  beam?: boolean;
  /** Animate wheels, body bob and exhaust. */
  moving?: boolean;
}

/**
 * Side view of an Easy Travel coach, facing right. Pure SVG so it scales
 * cleanly and themes with the brand palette.
 */
const Bus: React.FC<Props> = ({ className, beam = false, moving = true }) => {
  const windows = [28, 64, 100, 136, 172];
  return (
    <svg
      viewBox="0 0 340 130"
      className={className}
      role="img"
      aria-label="Bus Easy Travel"
    >
      <defs>
        <linearGradient id="bus-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e8ede9" />
        </linearGradient>
        <linearGradient id="bus-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1f4a3a" />
          <stop offset="1" stopColor="#0a1a12" />
        </linearGradient>
        <linearGradient id="bus-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff7c2" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff7c2" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="160" cy="121" rx="150" ry="5" fill="#0a1a12" opacity="0.18" />

      {beam && <path d="M300 78 L340 64 L340 98 Z" fill="url(#bus-beam)" />}

      {/* exhaust */}
      {moving && (
        <g fill="#a6b6aa">
          <circle className="bus-puff" cx="8" cy="98" r="5" />
          <circle className="bus-puff bus-puff-2" cx="8" cy="98" r="4" />
        </g>
      )}

      <g className={moving ? 'bus-bob' : undefined}>
        {/* body */}
        <rect x="12" y="14" width="288" height="86" rx="16" fill="url(#bus-body)" stroke="#cfd8d1" />
        {/* roof stripe */}
        <path d="M28 14 H284 a16 16 0 0 1 16 16 V22 H12 V30 a16 16 0 0 1 16 -16 Z" fill="#0d4035" />
        <rect x="12" y="20" width="288" height="4" fill="#0d4035" />
        {/* brand band */}
        <rect x="12" y="74" width="288" height="12" fill="#13ec5b" />
        <rect x="12" y="86" width="288" height="3" fill="#0bb143" />

        {/* side windows */}
        {windows.map((x) => (
          <g key={x}>
            <rect x={x} y="30" width="30" height="32" rx="5" fill="url(#bus-glass)" />
            <path d={`M${x + 4} 58 L${x + 18} 33 L${x + 24} 33 L${x + 10} 58 Z`} fill="#ffffff" opacity="0.12" />
          </g>
        ))}

        {/* door */}
        <rect x="214" y="30" width="26" height="62" rx="4" fill="url(#bus-glass)" />
        <line x1="227" y1="32" x2="227" y2="90" stroke="#3f5948" strokeWidth="1.5" />

        {/* windshield */}
        <path d="M250 30 H284 a10 10 0 0 1 10 10 V66 H250 Z" fill="url(#bus-glass)" />
        <path d="M258 62 L276 34 L284 34 L266 62 Z" fill="#ffffff" opacity="0.14" />

        {/* brand text */}
        <text
          x="30"
          y="71"
          fontFamily="Inter Tight, Inter, system-ui, sans-serif"
          fontSize="9"
          fontWeight="700"
          letterSpacing="1.6"
          fill="#0d4035"
        >
          EASY TRAVEL
        </text>
        <text x="150" y="71" fontFamily="Inter, system-ui, sans-serif" fontSize="7" fill="#56725f">
          Douala · Yaoundé · Bafoussam
        </text>

        {/* lights */}
        <rect x="292" y="72" width="8" height="10" rx="3" fill="#fff7c2" />
        <rect x="12" y="70" width="5" height="12" rx="2" fill="#ef4444" />

        {/* wheel arches */}
        <circle cx="74" cy="100" r="20" fill="#0c1410" />
        <circle cx="246" cy="100" r="20" fill="#0c1410" />
      </g>

      {/* wheels (outside the bob group so they stay on the road) */}
      {[74, 246].map((cx) => (
        <g key={cx} className={moving ? 'bus-wheel' : undefined}>
          <circle cx={cx} cy="104" r="15" fill="#162b1e" />
          <circle cx={cx} cy="104" r="8" fill="#cfd8d1" />
          <path
            d={`M${cx - 8} 104 H${cx + 8} M${cx} 96 V112`}
            stroke="#56725f"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx={cx} cy="104" r="2.5" fill="#0d4035" />
        </g>
      ))}
    </svg>
  );
};

export default Bus;
