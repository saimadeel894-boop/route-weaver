import { createFileRoute } from "@tanstack/react-router";
import { RoadTripAnimation } from "@/components/trip/RoadTripAnimation";

export const Route = createFileRoute("/render")({
  component: RenderPage,
});

function RenderPage() {
  const seek =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("seek") === "1";
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#ffffff",
        overflow: "hidden",
      }}
    >
      <RoadTripAnimation chromeless autoPlay={!seek} showControls={false} seekMode={seek} />
    </div>
  );
}