/**
 * MeetHub logo mark — a rounded hexagon with an "M" and a coral accent dot.
 * Transparent SVG (scales crisply, works in light/dark, no background to crop).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      role="img"
      aria-label="MeetHub"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="meethub-gradient"
          x1="6"
          y1="4"
          x2="34"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8B7CF6" />
          <stop offset="1" stopColor="#5468EE" />
        </linearGradient>
      </defs>

      <polygon
        points="20,3 34.6,11.5 34.6,28.5 20,37 5.4,28.5 5.4,11.5"
        fill="url(#meethub-gradient)"
        stroke="url(#meethub-gradient)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <polyline
        points="12.5,27 12.5,14 20,21.5 27.5,14 27.5,27"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="25.5" r="2.3" fill="#FB7185" />
    </svg>
  );
}
