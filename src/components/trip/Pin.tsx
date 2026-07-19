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

const PIN_HEIGHT = 34;

export function Pin({ waypoint, visible, showMiles = true, compact = false }: Props) {
  const iconSize = compact ? 12 : 18;
  const side = waypoint.labelSide;
  const labelW = Math.max(88, waypoint.name.length * 7.6 + 24);

  // Position of the name label relative to the pin origin.
  const labelPos =
    side === "left"
      ? { x: -labelW - 16, y: -PIN_HEIGHT - 6 }
      : side === "top"
        ? { x: -labelW / 2, y: -PIN_HEIGHT - 54 }
        : side === "bottom"
          ? { x: -labelW / 2, y: 18 }
          : { x: 16, y: -PIN_HEIGHT - 6 };

  const milesPos =
    side === "left"
      ? { x: 14, y: -PIN_HEIGHT - 6 }
      : side === "top"
        ? { x: 22, y: -PIN_HEIGHT - 6 }
        : side === "bottom"
          ? { x: -60, y: 22 }
          : { x: -60, y: -PIN_HEIGHT - 6 };

  return (
    <g style={{ transform: `translate(${waypoint.x}px, ${waypoint.y}px)` }}>
      {/* drop pin */}
      <motion.g
        initial={{ y: -30, opacity: 0 }}
        animate={visible ? { y: 0, opacity: 1 } : { y: -30, opacity: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 18 }}
      >
        <ellipse cx={0} cy={2} rx={5} ry={1.4} fill="rgba(15,23,42,0.28)" />
        <path
          d={`M 0 ${-PIN_HEIGHT} C ${PIN_HEIGHT * 0.5} ${-PIN_HEIGHT} ${PIN_HEIGHT * 0.5} ${-PIN_HEIGHT * 0.35} 0 0
              C ${-PIN_HEIGHT * 0.5} ${-PIN_HEIGHT * 0.35} ${-PIN_HEIGHT * 0.5} ${-PIN_HEIGHT} 0 ${-PIN_HEIGHT} Z`}
          fill="var(--pin)"
          stroke="var(--pin-deep)"
          strokeWidth={0.8}
        />
        <circle cx={0} cy={-PIN_HEIGHT * 0.65} r={PIN_HEIGHT * 0.22} fill="#ffffff" />
      </motion.g>

      {/* icon badge above the pin */}
      {!compact && (
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={visible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.15 }}
          style={{ transform: `translate(0px, ${-PIN_HEIGHT - 24}px)` }}
        >
          <circle r={17} fill="#ffffff" stroke="var(--pin)" strokeWidth={1.4} />
          <circle r={20} fill="none" stroke="var(--pin)" strokeWidth={0.6} opacity={0.35} />
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
          style={{ transform: `translate(${labelPos.x}px, ${labelPos.y}px)` }}
        >
          <rect
            x={0}
            y={-13}
            width={labelW}
            height={28}
            rx={7}
            fill="#ffffff"
            stroke="var(--border)"
            strokeWidth={0.8}
          />
          <text
            x={10}
            y={-1}
            fontSize={9.5}
            fontWeight={700}
            fill="var(--deep)"
            letterSpacing={0.6}
          >
            {waypoint.name.toUpperCase()}
          </text>
          {waypoint.region && (
            <text
              x={10}
              y={10}
              fontSize={7.5}
              fontWeight={500}
              fill="var(--muted-foreground)"
              letterSpacing={0.4}
            >
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
          style={{ transform: `translate(${milesPos.x}px, ${milesPos.y}px)` }}
        >
          <rect x={0} y={-10} width={48} height={20} rx={5} fill="var(--deep)" />
          <text
            x={24}
            y={4}
            textAnchor="middle"
            fontSize={9}
            fontWeight={700}
            fill="#fff"
            letterSpacing={0.6}
          >
            {waypoint.milesFromPrev} MI
          </text>
        </motion.g>
      )}
    </g>
  );
}