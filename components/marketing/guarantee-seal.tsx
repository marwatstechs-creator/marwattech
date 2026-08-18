/**
 * Rotating "money-back guarantee" seal.
 *
 * Brand-modified version of the classic trust badge:
 *   - Outer ring   → brand primary  (theme token, flips with day/night)
 *   - Inner ring   → brand gold     (accent/highlight)
 *   - Circular text → brand primary, slow spin
 *   - Checkmark    → brand gold
 *
 * Uses currentColor + Tailwind theme tokens so it always matches the site's
 * brand and stays legible in both light and dark mode.
 */
export function GuaranteeSeal({ className }: { className?: string }) {
  return (
    <svg
      width="224"
      height="224"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="14-day risk-free trial, 100% money-back guarantee"
      className={className}
    >
      {/* Outer ring — brand primary */}
      <circle cx="100" cy="100" r="96" stroke="currentColor" strokeWidth="2" className="text-primary/30" />
      {/* Inner ring — brand gold accent */}
      <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="1.5" className="text-gold/50" />

      {/* Rotating circular text */}
      <g
        className="animate-[spin_26s_linear_infinite] motion-reduce:animate-none"
        style={{ transformBox: "view-box", transformOrigin: "100px 100px" }}
      >
        <defs>
          <path id="marwat-guarantee-arc" d="M100 22 a78 78 0 1 1 -0.1 0" fill="none" />
        </defs>
        <text
          fill="currentColor"
          className="font-mono uppercase text-primary/60"
          fontSize="12.5"
          fontWeight="600"
          letterSpacing="1.1"
        >
          <textPath href="#marwat-guarantee-arc">
            14-day risk-free trial · 100% money back guaranteed ·{" "}
          </textPath>
        </text>
      </g>

      {/* Checkmark — brand gold */}
      <path
        d="M78 101 l14 16 l30 -36"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gold"
      />
    </svg>
  );
}
