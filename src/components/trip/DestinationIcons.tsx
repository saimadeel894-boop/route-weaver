import type { Waypoint } from "@/lib/trip-data";

type Props = { icon: Waypoint["icon"]; size?: number };

const stroke = "currentColor";

export function DestinationIcon({ icon, size = 22 }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (icon) {
    case "home":
      return (
        <svg {...common}>
          <path d="M4 11l8-6 8 6" />
          <path d="M6 10v9h12v-9" />
          <path d="M10 19v-5h4v5" />
        </svg>
      );
    case "boat":
      return (
        <svg {...common}>
          <path d="M3 16l2 4h14l2-4" />
          <path d="M4 16l1.5-4h13L20 16" />
          <path d="M12 4v8" />
          <path d="M12 4l5 3-5 1" />
        </svg>
      );
    case "cave":
      return (
        <svg {...common}>
          <path d="M3 20c0-8 4-13 9-13s9 5 9 13" />
          <path d="M9 20c0-4 1.4-7 3-7s3 3 3 7" />
        </svg>
      );
    case "raft":
      return (
        <svg {...common}>
          <path d="M3 15c2 0 2 1.5 4.5 1.5S10 15 12 15s2.5 1.5 4.5 1.5S19 15 21 15" />
          <path d="M3 19c2 0 2 1.5 4.5 1.5S10 19 12 19s2.5 1.5 4.5 1.5S19 19 21 19" />
          <path d="M7 13l2-7h6l2 7" />
          <path d="M9 10h6" />
        </svg>
      );
    case "guitar":
      return (
        <svg {...common}>
          <path d="M14 4l6 6-3 3" />
          <path d="M17 7l-3 3" />
          <path d="M13 9l-6 6a4 4 0 105 5l6-6" />
          <circle cx={11} cy={16} r={1.5} />
        </svg>
      );
    case "bath":
      return (
        <svg {...common}>
          <path d="M4 12h16v3a4 4 0 01-4 4H8a4 4 0 01-4-4v-3z" />
          <path d="M6 12V7a2 2 0 012-2h1" />
          <path d="M9 8h3" />
          <path d="M6 20l-1 2M18 20l1 2" />
        </svg>
      );
    case "arch":
      return (
        <svg {...common}>
          <path d="M4 20V12a8 8 0 0116 0v8" />
          <path d="M4 20h16" />
        </svg>
      );
    case "beach":
      return (
        <svg {...common}>
          <path d="M12 3v18" />
          <path d="M12 6c-4 0-8 3-9 6h9" />
          <path d="M12 6c4 0 6 2 7 4" />
          <path d="M3 20c2-1 4-1 6 0s4 1 6 0 4-1 6 0" />
        </svg>
      );
  }
}