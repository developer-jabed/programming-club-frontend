export default function LoginIllustration() {
  return (
    <div className="relative flex items-center justify-center py-6">
      {/* dashed orbit ring */}
      <div className="absolute h-56 w-56 rounded-full border-2 border-dashed border-emerald-400/20 animate-spin-slow" />
      <div className="absolute h-40 w-40 rounded-full bg-emerald-400/[0.07] blur-2xl" />

      <svg
        width="260"
        height="220"
        viewBox="0 0 260 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
        role="img"
        aria-label="Code editor window"
      >
        {/* ground shadow */}
        <ellipse cx="130" cy="205" rx="80" ry="8" fill="#000" opacity="0.35" />

        {/* editor window */}
        <rect x="30" y="30" width="200" height="150" rx="14" fill="#0f1f1b" stroke="rgba(255,255,255,0.12)" />
        <path d="M30 44a14 14 0 0 1 14-14h172a14 14 0 0 1 14 14v14H30z" fill="#142a24" />
        <circle cx="48" cy="44" r="4" fill="#f87171" />
        <circle cx="62" cy="44" r="4" fill="#fbbf24" />
        <circle cx="76" cy="44" r="4" fill="#34d399" />
        <text x="152" y="48" fontFamily="monospace" fontSize="9" fill="#64748b">club.ts</text>

        {/* code lines */}
        <text x="48" y="82" fontFamily="monospace" fontSize="11" fill="#c084fc">const</text>
        <text x="86" y="82" fontFamily="monospace" fontSize="11" fill="#e2e8f0">you</text>
        <text x="110" y="82" fontFamily="monospace" fontSize="11" fill="#64748b">=</text>
        <text x="122" y="82" fontFamily="monospace" fontSize="11" fill="#6ee7b7">club</text>
        <text x="150" y="82" fontFamily="monospace" fontSize="11" fill="#e2e8f0">.join()</text>

        <rect x="60" y="96" width="70" height="6" rx="3" fill="#34d399" opacity="0.55" />
        <rect x="136" y="96" width="40" height="6" rx="3" fill="#fbbf24" opacity="0.55" />
        <rect x="60" y="112" width="42" height="6" rx="3" fill="#38bdf8" opacity="0.5" />
        <rect x="108" y="112" width="64" height="6" rx="3" fill="#e2e8f0" opacity="0.25" />
        <rect x="60" y="128" width="90" height="6" rx="3" fill="#e2e8f0" opacity="0.2" />

        <text x="48" y="156" fontFamily="monospace" fontSize="11" fill="#34d399">&gt;</text>
        <rect x="60" y="146" width="7" height="13" rx="1.5" fill="#6ee7b7">
          <animate attributeName="opacity" values="1;0;1" dur="1.2s" repeatCount="indefinite" />
        </rect>

        {/* floating badge: </> */}
        <rect x="190" y="12" width="48" height="30" rx="10" fill="#fbbf24" />
        <text x="214" y="32" textAnchor="middle" fontFamily="monospace" fontSize="12" fontWeight="700" fill="#1a1203">{"</>"}</text>

        {/* floating chip: check */}
        <rect x="8" y="132" width="44" height="30" rx="10" fill="#10b981" />
        <path d="M22 147l6 6 11-12" stroke="#04110d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* depth dots */}
        <circle cx="22" cy="70" r="4" fill="#6ee7b7" opacity="0.6" />
        <circle cx="244" cy="120" r="3.5" fill="#fcd34d" opacity="0.7" />
        <circle cx="240" cy="176" r="3" fill="#5eead4" opacity="0.6" />
      </svg>
    </div>
  );
}