/**
 * Stylized vector silhouette of the continental United States.
 * Not geographically exact — tuned as a soft, Apple-Maps-inspired backdrop
 * that the waypoint coordinates in `trip-data.ts` are calibrated against.
 */
export function UsaMap() {
  return (
    <g>
      {/* soft water halo */}
      <rect x={0} y={0} width={1000} height={620} fill="var(--map-water)" />

      {/* subtle grid — barely visible, adds map texture */}
      <g opacity={0.35} stroke="var(--map-land-stroke)" strokeWidth={0.4}>
        {Array.from({ length: 13 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 50} x2={1000} y2={i * 50} />
        ))}
        {Array.from({ length: 21 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 50} y1={0} x2={i * 50} y2={620} />
        ))}
      </g>

      {/* land silhouette */}
      <path
        d="M 92 246
           C 110 214, 150 196, 196 190
           C 236 176, 276 174, 312 168
           C 356 152, 402 142, 452 138
           C 508 132, 566 130, 622 134
           C 678 138, 732 148, 780 168
           C 820 184, 858 208, 888 240
           C 912 268, 918 302, 908 336
           C 898 372, 872 396, 838 414
           C 800 434, 758 446, 714 456
           C 668 466, 620 470, 570 476
           C 520 482, 470 486, 424 480
           C 372 472, 322 460, 276 442
           C 232 424, 192 400, 158 372
           C 128 346, 104 314, 92 280 Z"
        fill="var(--map-land)"
        stroke="var(--map-land-stroke)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* Great Lakes — a soft accent to feel map-like */}
      <g fill="var(--map-water)" stroke="var(--map-land-stroke)" strokeWidth={1}>
        <path d="M 560 168 C 590 158, 640 158, 660 172 C 672 182, 660 196, 630 198 C 592 200, 552 190, 560 168 Z" />
        <path d="M 668 172 C 700 168, 738 176, 738 194 C 736 210, 700 212, 682 200 C 668 190, 662 180, 668 172 Z" />
        <path d="M 610 200 C 640 198, 662 210, 656 224 C 648 238, 616 236, 606 222 C 600 214, 602 204, 610 200 Z" />
      </g>

      {/* Faint state-like divisions — light dashes only, no borders */}
      <g opacity={0.22} stroke="var(--map-land-stroke)" strokeWidth={0.9} strokeDasharray="2 4" fill="none">
        <path d="M 300 200 Q 340 320, 320 460" />
        <path d="M 420 180 Q 440 320, 430 470" />
        <path d="M 540 180 Q 560 320, 555 470" />
        <path d="M 660 190 Q 680 320, 675 460" />
        <path d="M 780 210 Q 790 320, 780 440" />
        <path d="M 120 300 Q 500 260, 900 300" />
        <path d="M 140 380 Q 500 360, 880 370" />
      </g>
    </g>
  );
}