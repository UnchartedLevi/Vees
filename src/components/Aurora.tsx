import { useEffect, useRef } from "react";

interface AuroraProps {
  colorStops?: [string, string, string];
  amplitude?: number;
  blend?: number;
  speed?: number;
  className?: string;
}

export default function Aurora({
  colorStops = ["#6B21A8", "#10B981", "#6B21A8"],
  amplitude = 0.55,
  blend = 0.6,
  speed = 0.5,
  className = "",
}: AuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let startTime = performance.now();

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * Math.min(devicePixelRatio, 2);
      canvas.height = canvas.offsetHeight * Math.min(devicePixelRatio, 2);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // Simple smooth noise: sum of sines at different frequencies/phases
    const noise = (x: number, t: number) =>
      Math.sin(x * 1.7 + t * 1.1) * 0.5 +
      Math.sin(x * 3.1 - t * 0.7) * 0.3 +
      Math.sin(x * 0.9 + t * 1.9) * 0.2;

    const draw = () => {
      const t = ((performance.now() - startTime) / 1000) * speed;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Draw 3 overlapping aurora bands, one per colour stop pair
      const bands = [
        { color: colorStops[0], yBase: 0.55, phase: 0 },
        { color: colorStops[1], yBase: 0.48, phase: Math.PI * 0.66 },
        { color: colorStops[2], yBase: 0.52, phase: Math.PI * 1.33 },
      ];

      ctx.globalCompositeOperation = "screen";

      for (const band of bands) {
        const steps = 48;
        for (let i = 0; i < steps; i++) {
          const x0 = (i / steps) * width;
          const x1 = ((i + 1) / steps) * width;
          const xc  = (i + 0.5) / steps;

          const y = (band.yBase + noise(xc + band.phase * 0.3, t + band.phase) * amplitude) * height;

          const bandH = blend * height * 0.55;
          const grad  = ctx.createLinearGradient(0, y - bandH, 0, y + bandH);
          grad.addColorStop(0,   "transparent");
          grad.addColorStop(0.4, hexToRgba(band.color, 0.18));
          grad.addColorStop(0.5, hexToRgba(band.color, 0.30));
          grad.addColorStop(0.6, hexToRgba(band.color, 0.18));
          grad.addColorStop(1,   "transparent");

          ctx.fillStyle = grad;
          ctx.fillRect(x0, y - bandH, x1 - x0, bandH * 2);
        }
      }

      ctx.globalCompositeOperation = "source-over";
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [amplitude, blend, speed, colorStops]);

  return (
    <canvas
      ref={canvasRef}
      className={`h-full w-full ${className}`}
      style={{ display: "block" }}
    />
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
