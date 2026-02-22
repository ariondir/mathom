export function HobbitDoor({ size = 42 }: { size?: number }) {
  return (
    <svg
      className="hobbit-door-logo"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Earth / hill mound */}
      <ellipse cx="50" cy="72" rx="48" ry="30" fill="#1c2210" />

      {/* Stone arch surround */}
      <path
        d="M 18 72 A 32 38 0 0 1 82 72"
        fill="#2a3515"
        stroke="#3a4a1a"
        strokeWidth="2"
      />

      {/* The round green door */}
      <circle cx="50" cy="58" r="28" fill="#3a6018" stroke="#4a7a20" strokeWidth="2.5" />

      {/* Wood grain lines across door */}
      <line x1="22" y1="48" x2="78" y2="48" stroke="#2d4a14" strokeWidth="1.5" opacity="0.5" />
      <line x1="22" y1="58" x2="78" y2="58" stroke="#2d4a14" strokeWidth="1.5" opacity="0.5" />
      <line x1="22" y1="68" x2="78" y2="68" stroke="#2d4a14" strokeWidth="1.5" opacity="0.5" />

      {/* Vertical split (double door) */}
      <line x1="50" y1="31" x2="50" y2="85" stroke="#2d4a14" strokeWidth="1.5" opacity="0.4" />

      {/* Brass door knob — right side */}
      <circle cx="60" cy="58" r="4.5" fill="#c9a84c" stroke="#a88030" strokeWidth="1" />
      <circle cx="60" cy="58" r="1.8" fill="#e8c870" />

      {/* Door frame ring highlight */}
      <circle cx="50" cy="58" r="28" fill="none" stroke="#5a8a28" strokeWidth="1" opacity="0.6" />

      {/* Ground line */}
      <line x1="2" y1="88" x2="98" y2="88" stroke="#2a3515" strokeWidth="1.5" />

      {/* Little round window above door */}
      <circle cx="50" cy="28" r="6" fill="#1c3010" stroke="#4a7a20" strokeWidth="1.5" />
      <circle cx="50" cy="28" r="3" fill="#2a4a18" opacity="0.8" />
    </svg>
  );
}
