#!/usr/bin/env python3
"""Deterministically render both road-trip deliverables to H.264 MP4.

Unlike MediaRecorder/captureStream, this renderer advances the app timeline to
an exact timestamp before capturing every frame. Encoding happens offline, so
browser load cannot cause dropped or duplicated video frames.
"""

import asyncio
import os
import subprocess
from pathlib import Path

from playwright.async_api import async_playwright


FPS = 30
BASE_URL = os.environ.get("TRIP_RENDER_URL", "http://localhost:8080/render?seek=1")
OUTPUT_DIR = Path(os.environ.get("TRIP_OUTPUT_DIR", "/mnt/documents"))
DELIVERABLES = (
    (1920, 1080, "summer-road-trip-2026-youtube-1920x1080.mp4"),
    (1080, 1920, "summer-road-trip-2026-reels-1080x1920.mp4"),
)


async def render_one(browser, width: int, height: int, filename: str) -> Path:
    context = await browser.new_context(
        viewport={"width": width, "height": height},
        device_scale_factor=1,
        reduced_motion="no-preference",
    )
    page = await context.new_page()
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    await page.goto(BASE_URL, wait_until="networkidle")
    await page.wait_for_function("window.__trip && window.__trip.duration > 0")
    duration = await page.evaluate("window.__trip.duration")
    frame_count = round(duration * FPS) + 1

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output = OUTPUT_DIR / filename
    temporary = output.with_suffix(".rendering.mp4")
    command = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-f", "image2pipe", "-vcodec", "mjpeg", "-framerate", str(FPS), "-i", "-",
        "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "16",
        "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.2",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
        "-movflags", "+faststart", str(temporary),
    ]
    encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
    if encoder.stdin is None:
        raise RuntimeError("Unable to open FFmpeg input pipe")

    try:
        for frame in range(frame_count):
            timestamp = min(frame / FPS, duration)
            await page.evaluate("t => window.__trip.seek(t)", timestamp)
            # Let React commit the timeline state and Chromium paint it.
            await page.evaluate(
                "() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))"
            )
            image = await page.screenshot(type="jpeg", quality=95, animations="allow")
            encoder.stdin.write(image)
            if frame % (FPS * 5) == 0:
                print(f"{filename}: {frame}/{frame_count}", flush=True)
    finally:
        encoder.stdin.close()
        result = encoder.wait()
        await context.close()

    if result != 0:
        raise RuntimeError(f"FFmpeg exited with status {result}")
    if errors:
        raise RuntimeError("Browser rendering errors: " + "; ".join(errors))
    temporary.replace(output)
    return output


async def main() -> None:
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            headless=True,
            args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"],
        )
        try:
            for deliverable in DELIVERABLES:
                output = await render_one(browser, *deliverable)
                print(f"Rendered {output}", flush=True)
        finally:
            await browser.close()


if __name__ == "__main__":
    asyncio.run(main())