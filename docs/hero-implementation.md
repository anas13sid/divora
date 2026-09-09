# Divora kitchen hero

Run `npm run dev` from `my-app` to view the site.

The hero uses generated, aligned before/after photography and a Canvas 2D assembly animation. It is a layered photographic animation, not a rendered 3D scene or an exported video. Cabinet fronts, base storage, the worktop, backsplash, and tall appliance unit each have their own timed region and movement. The room uses one shared camera transform.

- 0–1.5 s: original kitchen.
- 1.5–5.5 s: staggered cabinetry and surface assembly.
- 5.5–7 s: lighting and finishing details resolve.
- 7–8 s: finished kitchen hold, then rendering stops.

Playback runs once on load. Before/Reimagined comparison and pause/resume/replay controls stay independent of the artwork. Playback pauses outside the viewport and in hidden tabs. Reduced motion displays the final photograph and skips the original-image download. Mobile uses smaller WebP assets, shorter component travel, and no camera zoom.

Hero copy shares the kitchen playback clock: “Your space.” fades upward by 8px during 0.15–1.25 s, “Reimagined.” during 5.5–7 s, and the supporting description during 7–8 s. Pausing or leaving the viewport pauses both. Each line retains its layout space and the CTA stays visible and clickable. Revealed copy never rewinds during comparisons or replays. Reduced motion, image-load failures, unavailable canvas, and disabled JavaScript show all copy immediately.

The theme foundation is near-black royal green, `#061A14`. Hero overlays, footer, controls, and icon share this shade.

Source images and generation prompts are retained in `output/imagegen/` and `docs/kitchen-image-prompts.md`. Run `npm run assets:optimize` to rebuild the website WebP variants. The scene region coordinates in `app/components/kitchen-scene.tsx` assume the source images keep their current framing.

The project CTA opens a local design-brief download. It does not send leads or store personal details. A contact backend can be connected later when a destination is provided.

Validation: `npm run lint`, `npm run build`, then `npm run test:e2e`. Browser tests use installed Google Chrome and a production server on port 3100, avoiding interference with the development server on port 3000. Screenshots are written to `output/previews/`.
