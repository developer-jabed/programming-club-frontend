"use client";

interface DashboardBackgroundProps {
  variant?: "default" | "subtle" | "vibrant";
  className?: string;
}

const DashboardBackground = ({
  variant = "default",
  className = "",
}: DashboardBackgroundProps) => {
  const patternOpacity =
    variant === "subtle"
      ? "opacity-[0.06]"
      : variant === "vibrant"
        ? "opacity-[0.12]"
        : "opacity-[0.09]";

  const gridOpacity =
    variant === "subtle"
      ? "opacity-[0.04]"
      : variant === "vibrant"
        ? "opacity-[0.08]"
        : "opacity-[0.05]";

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      {/* Base charcoal wash */}
      <div className="absolute inset-0 bg-background" />

      {/* Soft primary → accent gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-accent/[0.04]" />

      {/* Fine tech grid */}
      <svg
        className={`absolute inset-0 h-full w-full ${gridOpacity}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="pc-grid"
            x="0"
            y="0"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M48 0 L0 0 0 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-primary"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pc-grid)" />
      </svg>

      {/* Programming motif pattern */}
      <svg
        className={`absolute inset-0 h-full w-full ${patternOpacity}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="pc-code-pattern"
            x="0"
            y="0"
            width="240"
            height="240"
            patternUnits="userSpaceOnUse"
          >
            {/* Code brackets </> */}
            <g transform="translate(16,24)" className="text-primary">
              <path
                d="M12 4 L2 18 L12 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M28 4 L38 18 L28 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="22"
                y1="6"
                x2="18"
                y2="30"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>

            {/* Terminal window */}
            <g transform="translate(150,16)" className="text-primary">
              <rect
                x="0"
                y="0"
                width="56"
                height="40"
                rx="5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <circle cx="10" cy="10" r="2" fill="currentColor" className="text-accent" />
              <circle cx="18" cy="10" r="2" fill="currentColor" className="text-primary" />
              <circle cx="26" cy="10" r="2" fill="currentColor" className="text-muted-foreground" />
              <path
                d="M10 22 L18 28 L10 34"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="24"
                y1="34"
                x2="42"
                y2="34"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </g>

            {/* Chip / CPU */}
            <g transform="translate(20,120)" className="text-primary">
              <rect
                x="8"
                y="8"
                width="36"
                height="36"
                rx="4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <rect
                x="16"
                y="16"
                width="20"
                height="20"
                rx="2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              {/* Pins */}
              <line x1="14" y1="0" x2="14" y2="8" stroke="currentColor" strokeWidth="1.4" />
              <line x1="26" y1="0" x2="26" y2="8" stroke="currentColor" strokeWidth="1.4" />
              <line x1="38" y1="0" x2="38" y2="8" stroke="currentColor" strokeWidth="1.4" />
              <line x1="14" y1="44" x2="14" y2="52" stroke="currentColor" strokeWidth="1.4" />
              <line x1="26" y1="44" x2="26" y2="52" stroke="currentColor" strokeWidth="1.4" />
              <line x1="38" y1="44" x2="38" y2="52" stroke="currentColor" strokeWidth="1.4" />
              <line x1="0" y1="14" x2="8" y2="14" stroke="currentColor" strokeWidth="1.4" />
              <line x1="0" y1="26" x2="8" y2="26" stroke="currentColor" strokeWidth="1.4" />
              <line x1="0" y1="38" x2="8" y2="38" stroke="currentColor" strokeWidth="1.4" />
              <line x1="44" y1="14" x2="52" y2="14" stroke="currentColor" strokeWidth="1.4" />
              <line x1="44" y1="26" x2="52" y2="26" stroke="currentColor" strokeWidth="1.4" />
              <line x1="44" y1="38" x2="52" y2="38" stroke="currentColor" strokeWidth="1.4" />
            </g>

            {/* Binary dots */}
            <g transform="translate(140,130)" className="text-accent">
              <circle cx="0" cy="0" r="2.5" fill="currentColor" />
              <circle cx="14" cy="0" r="2.5" fill="currentColor" className="text-primary" />
              <circle cx="28" cy="0" r="2.5" fill="currentColor" />
              <circle cx="0" cy="14" r="2.5" fill="currentColor" className="text-primary" />
              <circle cx="14" cy="14" r="2.5" fill="currentColor" />
              <circle cx="28" cy="14" r="2.5" fill="currentColor" className="text-primary" />
              <circle cx="0" cy="28" r="2.5" fill="currentColor" />
              <circle cx="14" cy="28" r="2.5" fill="currentColor" className="text-primary" />
              <circle cx="28" cy="28" r="2.5" fill="currentColor" />
            </g>

            {/* Small sparkles */}
            <path
              d="M200 70 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z"
              fill="currentColor"
              className="text-primary"
            />
            <path
              d="M90 200 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z"
              fill="currentColor"
              className="text-accent"
            />
            <circle cx="210" cy="180" r="2.5" fill="currentColor" className="text-primary" />
            <circle cx="30" cy="70" r="2" fill="currentColor" className="text-accent" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pc-code-pattern)" />
      </svg>

      {/* Ambient glows — emerald + coral */}
      <div className="absolute -top-28 -left-24 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute top-1/3 -right-32 h-[30rem] w-[30rem] rounded-full bg-accent/8 blur-3xl" />
      <div className="absolute -bottom-20 left-1/3 h-80 w-80 rounded-full bg-primary/8 blur-3xl" />
      <div className="absolute bottom-10 right-16 h-56 w-56 rounded-full bg-accent/6 blur-3xl" />
    </div>
  );
};

export default DashboardBackground;