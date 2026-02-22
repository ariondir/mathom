export function HobbitDoorHero() {
  return (
    <svg
      viewBox="0 0 420 500"
      xmlns="http://www.w3.org/2000/svg"
      className="hobbit-door-hero"
      aria-label="Hobbit hole door"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#030805" />
          <stop offset="100%" stopColor="#0c1508" />
        </linearGradient>
        <radialGradient id="doorGrad" cx="38%" cy="32%" r="72%">
          <stop offset="0%"   stopColor="#4e8220" />
          <stop offset="60%"  stopColor="#3a6418" />
          <stop offset="100%" stopColor="#254510" />
        </radialGradient>
        <radialGradient id="hillGrad" cx="50%" cy="10%" r="90%">
          <stop offset="0%"   stopColor="#1e2a10" />
          <stop offset="100%" stopColor="#111808" />
        </radialGradient>
        <radialGradient id="lanternGlowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#f5b840" stopOpacity="1"   />
          <stop offset="50%"  stopColor="#d08020" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#c07020" stopOpacity="0"   />
        </radialGradient>
        <radialGradient id="windowGlowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#e8a030" stopOpacity="0.9" />
          <stop offset="60%"  stopColor="#9a6018" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#1e3a10" stopOpacity="0"   />
        </radialGradient>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Sky */}
      <rect width="420" height="500" fill="url(#skyGrad)" />

      {/* Stars */}
      {[
        [42,28],[110,18],[175,35],[240,14],[310,28],[370,18],[390,50],
        [60,65],[145,55],[280,48],[350,62],[20,90],[320,80],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.4 : 0.9}
          fill="#c9a84c" className={`hero-star hero-star-${i % 5}`} />
      ))}

      {/* Hill / mound */}
      <path
        d="M 0 480 L 0 320 Q 40 285 90 295 Q 140 305 180 280 Q 210 265 240 278 Q 290 295 340 285 Q 385 278 420 295 L 420 480 Z"
        fill="url(#hillGrad)"
      />

      {/* Chimney */}
      <rect x="170" y="155" width="20" height="52" rx="2"
        fill="#1a2410" stroke="#2a3818" strokeWidth="1.5" />
      <rect x="164" y="151" width="32" height="8" rx="1.5"
        fill="#202e12" stroke="#344020" strokeWidth="1" />

      {/* Smoke puffs */}
      <g className="chimney-smoke">
        <circle cx="180" cy="140" r="7"  fill="#3a4030" className="smoke-1" />
        <circle cx="174" cy="118" r="10" fill="#323828" className="smoke-2" />
        <circle cx="182" cy="96"  r="13" fill="#2a3020" className="smoke-3" />
      </g>

      {/* Stone arch — outer thick path to represent stonework */}
      <path d="M 112 330 A 98 118 0 0 1 308 330"
        fill="#1a2210" stroke="#2a3618" strokeWidth="38" />
      {/* Stone joints — dashes over the arch to suggest individual stones */}
      <path d="M 112 330 A 98 118 0 0 1 308 330"
        fill="none" stroke="#202c12" strokeWidth="34" strokeDasharray="24 4" />
      {/* Arch inner edge highlight */}
      <path d="M 124 330 A 86 104 0 0 1 296 330"
        fill="none" stroke="#3a4e20" strokeWidth="1.5" opacity="0.7" />

      {/* Round green door */}
      <circle cx="210" cy="308" r="86" fill="url(#doorGrad)" />

      {/* Door plank lines */}
      {[268, 295, 308, 321, 348].map((y, i) => (
        <line key={i} x1="124" y1={y} x2="296" y2={y}
          stroke="#1e4010" strokeWidth="2" opacity="0.55" />
      ))}

      {/* Door center vertical split */}
      <line x1="210" y1="224" x2="210" y2="393"
        stroke="#1e4010" strokeWidth="2" opacity="0.45" />

      {/* Hinges — left side, two pairs */}
      {[258, 272, 334, 348].map((y, i) => (
        <rect key={i} x="130" y={y} width="20" height="7" rx="2"
          fill="#7a6028" stroke="#c9a84c" strokeWidth="1" />
      ))}

      {/* Brass knocker ring */}
      <circle cx="244" cy="310" r="15"
        fill="none" stroke="#c9a84c" strokeWidth="4.5"
        filter="url(#softGlow)" />
      {/* Knocker bottom anchor */}
      <circle cx="244" cy="325" r="7"
        fill="#c9a84c" stroke="#a88030" strokeWidth="1.5" />
      {/* Knocker highlight */}
      <circle cx="241" cy="323" r="2.5" fill="#e8c870" opacity="0.8" />

      {/* Keyhole */}
      <circle cx="244" cy="310" r="3.5" fill="#152810" />

      {/* Door outer frame ring */}
      <circle cx="210" cy="308" r="86"
        fill="none" stroke="#5a8c2a" strokeWidth="2.5" opacity="0.6" />
      <circle cx="210" cy="308" r="81"
        fill="none" stroke="#7aac3a" strokeWidth="0.8" opacity="0.25" />

      {/* Round window — warm glow */}
      <circle cx="210" cy="196" r="28"
        fill="#0a1208" stroke="#3a5a18" strokeWidth="3" />
      <circle cx="210" cy="196" r="23" fill="url(#windowGlowGrad)" />
      {/* Window panes */}
      <line x1="184" y1="196" x2="236" y2="196"
        stroke="#2e4a14" strokeWidth="2.5" />
      <line x1="210" y1="170" x2="210" y2="222"
        stroke="#2e4a14" strokeWidth="2.5" />
      {/* Window frame ring */}
      <circle cx="210" cy="196" r="28"
        fill="none" stroke="#4a7020" strokeWidth="1.5" />

      {/* Ivy — left side */}
      <path d="M 115 328 Q 105 300 102 268 Q 99 236 114 210"
        fill="none" stroke="#1a3810" strokeWidth="3" opacity="0.9" />
      {[
        [108, 298, -30], [102, 268, 20], [107, 242, -15], [115, 218, 25],
      ].map(([cx, cy, rot], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={10} ry={6}
          fill="#2a5018" transform={`rotate(${rot} ${cx} ${cy})`} opacity="0.85" />
      ))}

      {/* Ivy — right side */}
      <path d="M 305 328 Q 315 300 318 268 Q 321 236 306 210"
        fill="none" stroke="#1a3810" strokeWidth="3" opacity="0.9" />
      {[
        [312, 298, 30], [318, 268, -20], [313, 242, 15], [305, 218, -25],
      ].map(([cx, cy, rot], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={10} ry={6}
          fill="#2a5018" transform={`rotate(${rot} ${cx} ${cy})`} opacity="0.85" />
      ))}

      {/* Lantern post */}
      <line x1="90" y1="460" x2="90" y2="308"
        stroke="#24200e" strokeWidth="5" />
      <line x1="90" y1="316" x2="114" y2="316"
        stroke="#24200e" strokeWidth="3.5" />
      {/* Lantern body */}
      <rect x="106" y="295" width="24" height="32" rx="3"
        fill="#1a180a" stroke="#8a7030" strokeWidth="2" />
      {/* Lantern glow — animated */}
      <rect x="109" y="298" width="18" height="26" rx="2"
        fill="url(#lanternGlowGrad)" className="lantern-glow" />
      {/* Lantern ambient light */}
      <circle cx="118" cy="311" r="22"
        fill="url(#lanternGlowGrad)" className="lantern-glow" opacity="0.35" />
      {/* Lantern top cap */}
      <path d="M 104 295 L 118 282 L 132 295 Z"
        fill="#24200e" stroke="#6a5828" strokeWidth="1.5" />

      {/* Small flowers by the door */}
      {[
        [150,398],[143,405],[272,398],[279,405],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i % 2 === 0 ? 3.5 : 2.5}
          fill={i % 2 === 0 ? '#c9a84c' : '#9a7830'} opacity="0.75" />
      ))}

      {/* Grass tufts */}
      {[
        [148,402],[156,398],[264,402],[272,398],[130,415],[285,415],
      ].map(([x, y], i) => (
        <path key={i}
          d={`M ${x} ${y} Q ${x+3} ${y-10} ${x+6} ${y}`}
          fill="none" stroke="#3a5818" strokeWidth="2" />
      ))}

      {/* Cobblestone path */}
      <ellipse cx="210" cy="462" rx="80" ry="20" fill="#141c0a" />
      {[
        [182,458,15,6],[210,464,18,6],[238,459,14,6],
        [195,468,13,5],[222,469,15,5],
      ].map(([cx,cy,rx,ry],i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry}
          fill="#1a2410" stroke="#20280e" strokeWidth="0.8" />
      ))}
    </svg>
  );
}
