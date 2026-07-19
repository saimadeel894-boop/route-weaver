export type Waypoint = {
  id: string;
  name: string;
  region?: string;
  /** SVG viewBox coordinates (viewBox 0 0 1000 620). */
  x: number;
  y: number;
  /** Icon key rendered inside the destination badge. */
  icon:
    | "home"
    | "boat"
    | "cave"
    | "raft"
    | "guitar"
    | "bath"
    | "arch"
    | "beach";
  /** Miles from previous stop. `0` for the origin. */
  milesFromPrev: number;
};

export const WAYPOINTS: Waypoint[] = [
  { id: "home", name: "Home", region: "Ohio", x: 672, y: 258, icon: "home", milesFromPrev: 0 },
  { id: "lake-cumberland", name: "Lake Cumberland", region: "Kentucky", x: 648, y: 308, icon: "boat", milesFromPrev: 230 },
  { id: "mammoth-cave", name: "Mammoth Cave", region: "Kentucky", x: 615, y: 320, icon: "cave", milesFromPrev: 78 },
  { id: "new-river", name: "New River", region: "West Virginia", x: 738, y: 272, icon: "raft", milesFromPrev: 400 },
  { id: "nashville", name: "Nashville", region: "Tennessee", x: 605, y: 348, icon: "guitar", milesFromPrev: 450 },
  { id: "hot-springs", name: "Hot Springs", region: "Arkansas", x: 488, y: 388, icon: "bath", milesFromPrev: 410 },
  { id: "st-louis", name: "St. Louis", region: "Missouri", x: 552, y: 292, icon: "arch", milesFromPrev: 410 },
  { id: "indiana-dunes", name: "Indiana Dunes", region: "Indiana", x: 618, y: 214, icon: "beach", milesFromPrev: 310 },
  { id: "home-return", name: "Back Home", region: "Ohio", x: 672, y: 258, icon: "home", milesFromPrev: 300 },
];

/** Build a smooth SVG path through waypoints using a Catmull-Rom → Bezier conversion. */
export function buildRoutePath(points: { x: number; y: number }[], tension = 0.5): string {
  if (points.length < 2) return "";
  const d: string[] = [`M ${points[0].x} ${points[0].y}`];
  const p = points;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension * 2;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension * 2;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension * 2;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension * 2;
    d.push(`C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`);
  }
  return d.join(" ");
}

export const ROUTE_PATH = buildRoutePath(WAYPOINTS);

/** Total miles across the trip. */
export const TOTAL_MILES = WAYPOINTS.reduce((s, w) => s + w.milesFromPrev, 0);