import { motion } from "framer-motion";
import { DestinationIcon } from "./DestinationIcons";
import type { Waypoint } from "@/lib/trip-data";

type Props = {
  waypoint: Waypoint;
  /** Show pin + badge. */
  visible: boolean;
  /** Show mileage flag (from previous stop). */
  showMiles?: boolean;
  /** Compact ("summary") variant for the final overview. */
  compact?: boolean;
};

export function Pin({ waypoint, visible, showMiles = true, compact = false }: Props) {
  const size = compact ? 22 : 34;
  const iconSize = compact ? 12 : 18;

  return (
    <g style={{ transform: `translate(${waypoint.x}px, ${waypoint.y}px)` }}>
      {/* drop pin */}
      <motion.g
        initial={{ y: -30, opacity: 0 }}
        animate={visible ? { y: 0, opacity: 1 } : { y: -30, opacity: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 18 }}
      >
        <ellipse cx={0} cy={2} rx={4} ry={1.2} fill="rgba(15,23,42,0.25)" />
        <path
          d={`M 0 ${-size} C ${size * 0.5} ${-size} ${size * 0.5} ${-size * 0.35} 0 0
              C ${-size * 0.5} ${-size * 0.35} ${-size * 0.5} ${-size} 0 ${-size} Z`}
          fill="var(--pin)"
        />
        <circle cx={0} cy={-size * 0.65} r={size * 0.22} fill="#ffffff" />
      </motion.g>

      {/* icon badge above the pin */}
      {!compact && (
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={visible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.15 }}
          style={{ transform: `translate(0px, ${-size - 22}px)` }}
        >
          <circle r={17} fill="#ffffff" stroke="var(--pin)" strokeWidth={1.5} />
          <g style={{ transform: `translate(-${iconSize / 2}px, -${iconSize / 2}px)`, color: "var(--deep)" }}>
            <DestinationIcon icon={waypoint.icon} size={iconSize} />
          </g>
        </motion.g>
      )}

      {/* name label */}
      {!compact && (
        <motion.g
          initial={{ opacity: 0, y: 6 }}
          animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          style={{ transform: `translate(22px, ${-size * 0.7}px)` }}
        >
          <rect
            x={0}
            y={-11}
            width={waypoint.name.length * 6.6 + 16}
            height={24}
            rx={6}
            fill="#ffffff"
            stroke="var(--border)"
            strokeWidth={0.8}
          />
          <text x={8} y={-1} fontSize={9} fontWeight={700} fill="var(--deep)" letterSpacing={0.3}>
            {waypoint.name.toUpperCase()}
          </text>
          {waypoint.region && (
            <text x={8} y={9} fontSize={7} fontWeight={500} fill="var(--muted-foreground)">
              {waypoint.region}
            </text>
          )}
        </motion.g>
      )}

      {/* mileage chip */}
      {!compact && showMiles && waypoint.milesFromPrev > 0 && (
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          style={{ transform: `translate(-58px, ${-size - 6}px)` }}
        >
          <rect x={0} y={-10} width={44} height={20} rx={5} fill="var(--deep)" />
          <text x={22} y={4} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff" letterSpacing={0.4}>
            {waypoint.milesFromPrev} MI
          </text>
        </motion.g>
      )}
    </g>
  );
}