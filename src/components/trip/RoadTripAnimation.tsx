import { useEffect, useMemo, useRef, useState } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";

import { ROUTE_PATH, WAYPOINTS, TOTAL_MILES } from "@/lib/trip-data";
import { UsaMap } from "./UsaMap";
import { RV } from "./RV";
import { Pin } from "./Pin";
import { DestinationIcon } from "./DestinationIcons";

const VIEW_W = 1000;
const VIEW_H = 620;

type Stage =
  | "intro"
  | "reveal"
  | "zoomHome"
  | "driving"
  | "arrived"
  | "outro"
  | "done";

export function RoadTripAnimation() {
  // no props for now
  return <RoadTripAnimationInner />;
}

export function RoadTripAnimationInner({ onComplete }: { onComplete?: () => void } = {}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);

  // Segment cumulative lengths measured from the real SVG path.
  const [segmentLens, setSegmentLens] = useState<number[]>([]);
  const totalLen = segmentLens.at(-1) ?? 0;

  // Live motion values.
  const pathLen = useMotionValue(0);          // 0..totalLen, RV progress
  const camX = useMotionValue(500);
  const camY = useMotionValue(310);
  const camScale = useMotionValue(1);
  const rvOpacity = useMotionValue(0);
  const rvMoving = useMotionValue(0);         // 0 idle, 1 driving (wheels)

  const [stage, setStage] = useState<Stage>("intro");
  const [visibleIndex, setVisibleIndex] = useState<number>(-1); // last pin dropped
  const [rvPos, setRvPos] = useState({ x: WAYPOINTS[0].x, y: WAYPOINTS[0].y, angle: 0 });

  // Route drawing — dash offset shrinks as RV advances.
  const dashOffset = useTransform(pathLen, (v) => Math.max(totalLen - v, 0));

  // ── measure the path once mounted ──────────────────────────────────────────
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    // getTotalLength on the composite path.
    const full = path.getTotalLength();
    // For segment boundaries, we walk the path and mark where each waypoint sits
    // by finding the point nearest to each waypoint via coarse search.
    const samples = 2000;
    const pts: { x: number; y: number; d: number }[] = [];
    for (let i = 0; i <= samples; i++) {
      const d = (i / samples) * full;
      const p = path.getPointAtLength(d);
      pts.push({ x: p.x, y: p.y, d });
    }
    const lens: number[] = [0];
    let startFrom = 0;
    for (let w = 1; w < WAYPOINTS.length; w++) {
      const target = WAYPOINTS[w];
      let bestI = startFrom;
      let bestDist = Infinity;
      for (let i = startFrom; i < pts.length; i++) {
        const dx = pts[i].x - target.x;
        const dy = pts[i].y - target.y;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          bestI = i;
        }
      }
      lens.push(pts[bestI].d);
      startFrom = bestI;
    }
    setSegmentLens(lens);
  }, []);

  // ── keep RV sprite state (x/y/angle) in sync with pathLen ─────────────────
  useMotionValueEvent(pathLen, "change", (v) => {
    const path = pathRef.current;
    if (!path) return;
    const p = path.getPointAtLength(v);
    const ahead = path.getPointAtLength(Math.min(v + 1, totalLen || 1));
    const angle = (Math.atan2(ahead.y - p.y, ahead.x - p.x) * 180) / Math.PI;
    setRvPos({ x: p.x, y: p.y, angle });
  });

  // ── main timeline ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (segmentLens.length === 0) return;
    let cancelled = false;

    const wait = (ms: number) =>
      new Promise<void>((res) => setTimeout(() => (cancelled ? null : res()), ms));

    const easeCam = { type: "tween" as const, ease: [0.65, 0, 0.35, 1] as const };

    const flyTo = (x: number, y: number, scale: number, duration = 2) =>
      Promise.all([
        animate(camX, x, { duration, ...easeCam }),
        animate(camY, y, { duration, ...easeCam }),
        animate(camScale, scale, { duration, ...easeCam }),
      ]);

    const driveTo = (fromLen: number, toLen: number, duration: number) =>
      animate(pathLen, [fromLen, toLen], {
        duration,
        ease: [0.45, 0.05, 0.35, 1],
      });

    (async () => {
      // Scene 1 — Title
      setStage("intro");
      await wait(3200);
      if (cancelled) return;

      // Scene 2 — reveal + slow drift to home
      setStage("reveal");
      await flyTo(500, 310, 1, 1.6);
      if (cancelled) return;

      setStage("zoomHome");
      await flyTo(WAYPOINTS[0].x, WAYPOINTS[0].y, 2.4, 2.2);
      if (cancelled) return;

      // Scene 3 — RV appears with a bounce
      animate(rvOpacity, 1, { duration: 0.6 });
      setVisibleIndex(0); // home pin visible
      await wait(1400);
      if (cancelled) return;

      // Scene 4 — drive segment by segment
      for (let i = 1; i < WAYPOINTS.length; i++) {
        if (cancelled) return;
        const fromLen = segmentLens[i - 1];
        const toLen = segmentLens[i];
        const miles = WAYPOINTS[i].milesFromPrev;
        const duration = Math.min(3.4, Math.max(1.8, miles / 160));

        // Follow-cam: pan toward next waypoint at driving zoom while advancing.
        rvMoving.set(1);
        flyTo(
          (WAYPOINTS[i].x + WAYPOINTS[i - 1].x) / 2,
          (WAYPOINTS[i].y + WAYPOINTS[i - 1].y) / 2,
          2.1,
          duration,
        );
        await driveTo(fromLen, toLen, duration);
        rvMoving.set(0);
        if (cancelled) return;

        // Arrive — zoom in, drop pin, pause.
        setStage("arrived");
        await flyTo(WAYPOINTS[i].x, WAYPOINTS[i].y, 2.8, 1.2);
        setVisibleIndex(i);
        await wait(2000);
      }

      // Scene 5 — outro overview
      setStage("outro");
      await flyTo(500, 310, 1, 2.6);
      await wait(2200);
      setStage("done");
    })();

    return () => {
      cancelled = true;
    };
  }, [segmentLens, pathLen, camX, camY, camScale, rvOpacity, rvMoving]);

  // Camera transform string
  const cameraTransform = useTransform([camX, camY, camScale], (vals) => {
    const [x, y, s] = vals as number[];
    // Center (x, y) in the viewBox and scale around it.
    const tx = VIEW_W / 2 - x * s;
    const ty = VIEW_H / 2 - y * s;
    return `translate(${tx} ${ty}) scale(${s})`;
  });

  // Precomputed cloud positions (deterministic).
  const clouds = useMemo(
    () => [
      { x: 120, y: 90, s: 1, delay: 0 },
      { x: 780, y: 60, s: 1.4, delay: 4 },
      { x: 420, y: 40, s: 0.8, delay: 8 },
      { x: 640, y: 500, s: 1.1, delay: 2 },
      { x: 220, y: 520, s: 0.9, delay: 6 },
    ],
    [],
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      {/* Ambient gradient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 800px at 50% -10%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 60%), radial-gradient(900px 600px at 90% 110%, color-mix(in oklab, var(--accent) 10%, transparent), transparent 60%)",
        }}
      />

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="relative h-full w-full"
      >
        {/* Drifting clouds live outside the camera transform */}
        <g>
          {clouds.map((c, i) => (
            <motion.g
              key={i}
              initial={{ x: c.x, opacity: 0 }}
              animate={{ x: [c.x - 40, c.x + 40, c.x - 40], opacity: 0.55 }}
              transition={{
                x: { duration: 18 + i * 3, repeat: Infinity, ease: "easeInOut" },
                opacity: { duration: 2, delay: c.delay * 0.1 },
              }}
            >
              <Cloud x={0} y={c.y} scale={c.s} />
            </motion.g>
          ))}
        </g>

        {/* Camera group */}
        <motion.g style={{ transform: cameraTransform }}>
          <UsaMap />

          {/* Route — soft glow underlay + main stroke */}
          <path
            d={ROUTE_PATH}
            fill="none"
            stroke="var(--route-glow)"
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: totalLen || 1,
              strokeDashoffset: totalLen || 1,
            }}
          />
          <motion.path
            ref={pathRef}
            d={ROUTE_PATH}
            fill="none"
            stroke="var(--route)"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: totalLen || 1,
              strokeDashoffset: dashOffset,
            }}
          />

          {/* Waypoint pins — only those already reached */}
          {WAYPOINTS.map((w, i) => (
            <Pin
              key={`${w.id}-${i}`}
              waypoint={w}
              visible={i <= visibleIndex && stage !== "outro" && stage !== "done"}
              compact={false}
            />
          ))}

          {/* Compact pins for outro summary */}
          {(stage === "outro" || stage === "done") &&
            WAYPOINTS.map((w, i) => (
              <g key={`sum-${i}`} style={{ transform: `translate(${w.x}px, ${w.y}px)` }}>
                <circle r={9} fill="#fff" stroke="var(--pin)" strokeWidth={1.5} />
                <g
                  style={{
                    transform: "translate(-6px, -6px)",
                    color: "var(--deep)",
                  }}
                >
                  <DestinationIcon icon={w.icon} size={12} />
                </g>
              </g>
            ))}

          {/* RV sprite */}
          <motion.g style={{ opacity: rvOpacity }}>
            <g style={{ transform: `translate(${rvPos.x}px, ${rvPos.y}px)` }}>
              <RV angle={rvPos.angle} moving={rvMoving.get()} />
            </g>
          </motion.g>
        </motion.g>
      </svg>

      {/* HUD overlays */}
      <AnimatePresence>
        {stage === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.p
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="text-xs font-semibold uppercase tracking-[0.5em] text-primary"
              >
                A Cinematic Journey
              </motion.p>
              <motion.h1
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.9 }}
                className="mt-4 text-5xl font-extrabold leading-[0.95] tracking-tight text-[color:var(--deep)] sm:text-7xl md:text-8xl"
              >
                Summer Road Trip
                <span className="ml-3 text-primary">2026</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="mt-6 text-sm text-muted-foreground sm:text-base"
              >
                {WAYPOINTS.length - 1} stops · {TOTAL_MILES.toLocaleString()} miles · one RV
              </motion.p>
            </div>
          </motion.div>
        )}

        {stage === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center"
          >
            <div className="rounded-2xl bg-white/85 px-6 py-4 text-center shadow-[0_10px_40px_-10px_rgba(15,23,42,0.25)] backdrop-blur">
              <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-primary">
                Journey Complete
              </p>
              <p className="mt-1 text-2xl font-extrabold text-[color:var(--deep)]">
                Summer Road Trip 2026
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {TOTAL_MILES.toLocaleString()} miles · {WAYPOINTS.length - 1} stops
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top-left brand chip */}
      <div className="pointer-events-none absolute left-6 top-6 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        Summer Road Trip · 2026
      </div>

      {/* Bottom-right progress */}
      <ProgressReadout
        segmentLens={segmentLens}
        pathLen={pathLen}
        visibleIndex={visibleIndex}
      />

      {/* Hidden probe path for measurement is the actual pathRef above. */}
    </div>
  );
}

function ProgressReadout({
  segmentLens,
  pathLen,
  visibleIndex,
}: {
  segmentLens: number[];
  pathLen: ReturnType<typeof useMotionValue<number>>;
  visibleIndex: number;
}) {
  const [miles, setMiles] = useState(0);
  const totalLen = segmentLens.at(-1) ?? 0;
  useMotionValueEvent(pathLen, "change", (v) => {
    if (!totalLen) return;
    const ratio = v / totalLen;
    setMiles(Math.round(ratio * TOTAL_MILES));
  });

  const nextIdx = Math.min(visibleIndex + 1, WAYPOINTS.length - 1);
  const next = WAYPOINTS[nextIdx];

  return (
    <div className="pointer-events-none absolute bottom-6 right-6 flex flex-col items-end gap-2">
      <div className="rounded-full bg-white/85 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--deep)] shadow-[0_6px_20px_-8px_rgba(15,23,42,0.3)] backdrop-blur">
        {miles.toLocaleString()} / {TOTAL_MILES.toLocaleString()} mi
      </div>
      {visibleIndex >= 0 && visibleIndex < WAYPOINTS.length - 1 && (
        <div className="rounded-2xl bg-white/85 px-4 py-3 text-right shadow-[0_10px_30px_-12px_rgba(15,23,42,0.25)] backdrop-blur">
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Next Stop
          </p>
          <p className="text-sm font-bold text-[color:var(--deep)]">{next.name}</p>
        </div>
      )}
    </div>
  );
}

function Cloud({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px) scale(${scale})` }} opacity={0.7}>
      <ellipse cx={0} cy={0} rx={26} ry={10} fill="var(--cloud)" />
      <ellipse cx={-14} cy={4} rx={14} ry={7} fill="var(--cloud)" />
      <ellipse cx={16} cy={4} rx={16} ry={7} fill="var(--cloud)" />
    </g>
  );
}