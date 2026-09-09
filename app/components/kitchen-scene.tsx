"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const DURATION = 8000;
const WIDTH = 1672;
const HEIGHT = 941;
type Phase = "before" | "cabinetry" | "surfaces" | "details" | "after";
type Playback = "loading" | "playing" | "paused" | "finished";
type Part = {
  x: number;
  y: number;
  w: number;
  h: number;
  start: number;
  duration: number;
  axis: "x" | "y";
};

// Coordinates follow the actual architectural seams in the source photograph.
// All crops share one camera transform, so the room never changes perspective.
const PARTS: Part[] = [
  { x: 570, y: 117, w: 215, h: 267, start: 1500, duration: 1050, axis: "y" },
  { x: 785, y: 117, w: 169, h: 267, start: 1740, duration: 1050, axis: "y" },
  { x: 954, y: 117, w: 201, h: 267, start: 1980, duration: 1050, axis: "y" },
  { x: 1155, y: 117, w: 180, h: 267, start: 2220, duration: 1050, axis: "y" },
  { x: 551, y: 559, w: 224, h: 218, start: 2640, duration: 1050, axis: "x" },
  { x: 775, y: 559, w: 160, h: 218, start: 2880, duration: 1050, axis: "x" },
  { x: 935, y: 559, w: 116, h: 218, start: 3120, duration: 1050, axis: "x" },
  { x: 1051, y: 559, w: 116, h: 218, start: 3360, duration: 1050, axis: "x" },
  { x: 1167, y: 559, w: 191, h: 218, start: 3600, duration: 1050, axis: "x" },
  { x: 550, y: 536, w: 809, h: 23, start: 3750, duration: 1100, axis: "x" },
  { x: 582, y: 384, w: 751, h: 152, start: 4250, duration: 1200, axis: "x" },
  { x: 1335, y: 103, w: 280, h: 675, start: 4700, duration: 1100, axis: "x" },
];

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => 1 - Math.pow(1 - clamp(value), 3);
const phaseFor = (time: number): Phase =>
  time < 1500
    ? "before"
    : time < 3750
      ? "cabinetry"
      : time < 5500
        ? "surfaces"
        : time < 7000
          ? "details"
          : "after";
const labels: Record<Phase, string> = {
  before: "An everyday kitchen",
  cabinetry: "A place for everything",
  surfaces: "Natural beauty, revealed",
  details: "The finishing touches",
  after: "An extraordinary everyday",
};

export function KitchenScene({
  onTimelineUpdate,
}: {
  onTimelineUpdate: (time: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(DURATION);
  const renderRef = useRef<(time: number) => void>(() => {});
  const wakeRef = useRef<() => void>(() => {});
  const userSelectedRef = useRef(false);
  const playbackRef = useRef<Playback>("loading");
  const phaseRef = useRef<Phase>("after");
  const reducedRef = useRef(false);
  const readyRef = useRef(false);
  const [playback, setPlayback] = useState<Playback>("loading");
  const [phase, setPhase] = useState<Phase>("after");
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const updatePlayback = useCallback((next: Playback) => {
    playbackRef.current = next;
    setPlayback(next);
    wakeRef.current();
  }, []);

  const seek = useCallback(
    (time: number) => {
      timeRef.current = time;
      renderRef.current(time);
      onTimelineUpdate(time);
      const nextPhase = phaseFor(time);
      phaseRef.current = nextPhase;
      setPhase(nextPhase);
      if (progressRef.current)
        progressRef.current.style.transform = `scaleX(${time / DURATION})`;
    },
    [onTimelineUpdate],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      onTimelineUpdate(DURATION);
      return;
    }
    let cancelled = false;
    let frame = 0;
    let previous = 0;
    let visible = true;
    let before: HTMLImageElement | null = null;
    let after: HTMLImageElement | null = null;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 700px)");

    function drawPatch(
      image: HTMLImageElement,
      part: Part,
      dx: number,
      dy: number,
      dw: number,
      dh: number,
    ) {
      const sx = image.naturalWidth / WIDTH;
      const sy = image.naturalHeight / HEIGHT;
      context?.drawImage(
        image,
        part.x * sx,
        part.y * sy,
        part.w * sx,
        part.h * sy,
        dx,
        dy,
        dw,
        dh,
      );
    }

    function paint(time: number) {
      if (!context || !canvas || !after) return;
      const scale = canvas.width / WIDTH;
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.save();
      // An almost imperceptible 1.2% push-in, shared by every architectural part.
      const zoom =
        reducedRef.current || mobileQuery.matches
          ? 1
          : 1 + 0.012 * ease(time / DURATION);
      context.translate(WIDTH * 0.69, HEIGHT * 0.53);
      context.scale(zoom, zoom);
      context.translate(-WIDTH * 0.69, -HEIGHT * 0.53);
      context.drawImage(after, 0, 0, WIDTH, HEIGHT);

      if (before && time < 7000) {
        // Only untouched room surfaces resolve here; cabinetry is independently assembled below.
        context.globalAlpha = 1 - ease((time - 6100) / 900);
        context.drawImage(before, 0, 0, WIDTH, HEIGHT);
        context.globalAlpha = 1;
        for (const part of PARTS) {
          const t = clamp((time - part.start) / part.duration);
          if (t === 0) continue;
          const { x, y, w, h } = part;
          context.save();
          context.beginPath();
          context.rect(x, y, w, h);
          context.clip();
          if (t < 1) {
            context.fillStyle = "#39372b";
            context.fillRect(x, y, w, h);
            // Existing fronts recess before replacements slide into their own bays.
            const retract = ease(t / 0.38);
            context.globalAlpha = 1 - retract;
            const inset = mobileQuery.matches ? 0 : retract * 3;
            drawPatch(
              before,
              part,
              x + inset,
              y + inset,
              w - inset * 2,
              h - inset * 2,
            );
            context.globalAlpha = 1;
          }
          const assembly = ease((t - 0.16) / 0.84);
          if (assembly > 0) {
            const distance = mobileQuery.matches ? 5 : 22;
            const offset = (1 - assembly) * distance;
            const reveal = part.axis === "x" ? w * assembly : h * assembly;
            context.beginPath();
            context.rect(
              x,
              y,
              part.axis === "x" ? reveal : w,
              part.axis === "y" ? reveal : h,
            );
            context.clip();
            if (part.y === 384)
              context.filter = `brightness(${0.78 + 0.22 * ease((time - 5500) / 1300)})`;
            drawPatch(
              after,
              part,
              x + (part.axis === "x" ? offset : 0),
              y + (part.axis === "y" ? -offset : 0),
              w,
              h,
            );
          }
          context.restore();
        }
      }
      context.restore();
    }
    renderRef.current = paint;

    const resize = () => {
      canvas.width = mobileQuery.matches ? 1100 : WIDTH;
      canvas.height = Math.round((canvas.width * HEIGHT) / WIDTH);
      paint(timeRef.current);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        wake();
      },
      { threshold: 0.05 },
    );
    intersection.observe(canvas);

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => img.decode().then(() => resolve(img), reject);
        img.onerror = reject;
        img.src = src;
      });

    const syncMotion = () => {
      reducedRef.current = motionQuery.matches;
      setReducedMotion(motionQuery.matches);
      if (motionQuery.matches) {
        seek(DURATION);
        updatePlayback("finished");
      }
    };
    syncMotion();
    motionQuery.addEventListener("change", syncMotion);
    const visibilityChange = () => {
      wake();
    };
    document.addEventListener("visibilitychange", visibilityChange);

    async function initialize() {
      try {
        const small = mobileQuery.matches;
        after = await loadImage(
          small
            ? "/images/kitchen-after-v2-mobile.webp"
            : "/images/kitchen-after-v2.webp",
        );
        if (cancelled) return;
        paint(DURATION);
        if (!reducedRef.current) {
          before = await loadImage(
            small
              ? "/images/kitchen-before-v3-mobile.webp"
              : "/images/kitchen-before-v3.webp",
          );
          if (cancelled) return;
          readyRef.current = true;
          setReady(true);
          if (!reducedRef.current && !userSelectedRef.current) {
            seek(0);
            updatePlayback("playing");
          }
        }
      } catch {
        if (!cancelled) {
          setLoadFailed(true);
          seek(DURATION);
          updatePlayback("finished");
        }
      }
    }

    function tick(now: number) {
      if (cancelled) return;
      if (
        playbackRef.current === "playing" &&
        visible &&
        !document.hidden &&
        readyRef.current
      ) {
        const delta = previous ? Math.min(now - previous, 80) : 0;
        timeRef.current = Math.min(DURATION, timeRef.current + delta);
        paint(timeRef.current);
        onTimelineUpdate(timeRef.current);
        if (progressRef.current)
          progressRef.current.style.transform = `scaleX(${timeRef.current / DURATION})`;
        const nextPhase = phaseFor(timeRef.current);
        if (nextPhase !== phaseRef.current) {
          phaseRef.current = nextPhase;
          setPhase(nextPhase);
        }
        if (timeRef.current === DURATION) updatePlayback("finished");
      }
      previous = now;
      frame =
        playbackRef.current === "playing" && visible && !document.hidden
          ? requestAnimationFrame(tick)
          : 0;
    }

    function wake() {
      previous = 0;
      if (!frame && !cancelled) frame = requestAnimationFrame(tick);
    }
    wakeRef.current = wake;
    initialize();
    wake();
    return () => {
      cancelled = true;
      readyRef.current = false;
      wakeRef.current = () => {};
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      motionQuery.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", visibilityChange);
    };
  }, [seek, updatePlayback, onTimelineUpdate]);

  const replay = () => {
    if (!ready || reducedMotion) return;
    seek(0);
    updatePlayback("playing");
  };

  return (
    <>
      <div className="kitchen-background" aria-hidden="true">
        <Image
          src="/images/kitchen-after-v2.webp"
          alt=""
          fill
          loading="eager"
          sizes="100vw"
          className="kitchen-poster"
        />
        <canvas
          ref={canvasRef}
          className={`kitchen-canvas ${ready ? "is-ready" : ""}`}
          width={WIDTH}
          height={HEIGHT}
        />
      </div>
      <div className="hero-shade" />
      <div
        className={`scene-caption ${phase === "after" ? "is-extraordinary-caption" : ""}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {phase !== "after" ? <span className="live-dot" /> : null}
        <span>{labels[phase]}</span>
      </div>
      <div className="transformation-console">
        <div className="console-title">
          <span className="tiny-label">THE ART OF TRANSFORMATION</span>
          <span className="concept-label">A Divora design concept</span>
        </div>
        <div className="console-controls">
          <div className="scene-switch" aria-label="Compare kitchen designs">
            <button
              type="button"
              disabled={!ready || reducedMotion}
              aria-pressed={phase === "before"}
              onClick={() => {
                seek(0);
                updatePlayback("paused");
              }}
            >
              Before
            </button>
            <span className="switch-arrow" aria-hidden="true">
              ⟶
            </span>
            <button
              type="button"
              aria-pressed={phase === "after"}
              onClick={() => {
                userSelectedRef.current = true;
                seek(DURATION);
                updatePlayback("finished");
              }}
            >
              Reimagined
            </button>
          </div>
          <span className="console-divider" />
          <button
            type="button"
            className="playback-button"
            disabled={reducedMotion || loadFailed || !ready}
            onClick={() => {
              if (playback === "playing") updatePlayback("paused");
              else if (playback === "paused") updatePlayback("playing");
              else replay();
            }}
            aria-label={
              playback === "playing"
                ? "Pause kitchen transformation"
                : playback === "paused"
                  ? "Resume kitchen transformation"
                  : "Replay kitchen transformation"
            }
          >
            {playback === "playing" ? (
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6 5h2v10H6zm6 0h2v10h-2z" />
              </svg>
            ) : playback === "paused" ? (
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="m7 4 9 6-9 6z" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                aria-hidden="true"
              >
                <path d="M4 6a7 7 0 1 1-1 7M4 2v5h5" />
              </svg>
            )}
            <span>
              {reducedMotion
                ? "Still view"
                : loadFailed
                  ? "Still view"
                  : playback === "loading"
                    ? "Preparing"
                    : playback === "playing"
                      ? "Pause"
                      : playback === "paused"
                        ? "Continue"
                        : "Replay"}
            </span>
          </button>
        </div>
        <div className="scene-progress" aria-hidden="true">
          <div ref={progressRef} />
        </div>
      </div>
    </>
  );
}
