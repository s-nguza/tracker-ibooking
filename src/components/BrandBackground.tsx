const BRAND = '61 90 254';

// Each screen's glow sits behind its logo.
const GLOWS = {
  login: `radial-gradient(circle 245px at 50% 150px, rgb(${BRAND} / 0.45), rgb(${BRAND} / 0.22) 37%, rgb(${BRAND} / 0.1) 59%, transparent)`,
  register: `radial-gradient(circle 185px at 50% 70px, rgb(${BRAND} / 0.34), rgb(${BRAND} / 0.24) 35%, transparent)`,
};

/**
 * The dark backdrop: a blue glow over a giant, tilted version of the receipt logo.
 * `fixed` keeps it in place behind screens that scroll.
 */
export function BrandBackground({
  glow,
  fixed = false,
}: {
  glow: keyof typeof GLOWS;
  fixed?: boolean;
}) {
  return (
    <div aria-hidden="true" className={`${fixed ? 'fixed' : 'absolute'} inset-0 -z-10`}>
      <svg
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 size-full"
      >
        <defs>
          <linearGradient
            id="auth-receipt-fill"
            gradientUnits="userSpaceOnUse"
            x1="60"
            y1="400"
            x2="390"
            y2="844"
          >
            <stop offset="0" stopColor="#fff" stopOpacity="0.015" />
            <stop offset="0.6" stopColor="#fff" stopOpacity="0.06" />
            <stop offset="1" stopColor="#7c8fff" stopOpacity="0.2" />
          </linearGradient>
          <mask
            id="auth-receipt-cutouts"
            maskUnits="userSpaceOnUse"
            x="-60"
            y="280"
            width="520"
            height="620"
          >
            <rect x="-60" y="280" width="520" height="620" fill="#fff" />
            <g fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round">
              <path d="M92 516 318 460" strokeWidth="44" strokeOpacity="0.4" />
              <path d="M128 576 250 546" strokeWidth="40" strokeOpacity="0.4" />
              <path d="M185 775 286 829 392 630" strokeWidth="60" />
            </g>
          </mask>
        </defs>
        <g mask="url(#auth-receipt-cutouts)">
          <rect
            x="-5"
            y="420"
            width="420"
            height="720"
            rx="36"
            transform="rotate(-13.5 -5 420)"
            fill="url(#auth-receipt-fill)"
          />
        </g>
      </svg>
      <div className="absolute inset-0" style={{ background: GLOWS[glow] }} />
    </div>
  );
}
