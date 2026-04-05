"use client";

import { useEffect, useRef } from "react";

interface SparklesCoreProps {
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  particleColor?: string;
}

/** Dense, subtle sparkle field for hero branding (tuned lighter than full-screen demos). */
export default function SparklesCore({
  className = "",
  background = "transparent",
  minSize = 0.4,
  maxSize = 1,
  particleDensity = 400,
  particleColor = "#5E6AD2",
}: SparklesCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const context = ctx;

    let frame = 0;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      life: number;
      maxLife: number;
    }> = [];

    const density = Math.min(900, Math.max(120, particleDensity / 4));

    function resize() {
      const w = c.offsetWidth;
      const h = c.offsetHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = w * dpr;
      c.height = h * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    function spawn() {
      if (particles.length >= density) return;
      particles.push({
        x: Math.random() * c.offsetWidth,
        y: Math.random() * c.offsetHeight,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -Math.random() * 0.35 - 0.1,
        size: minSize + Math.random() * (maxSize - minSize),
        life: 0,
        maxLife: 80 + Math.random() * 100,
      });
    }

    function loop() {
      context.clearRect(0, 0, c.offsetWidth, c.offsetHeight);
      if (background !== "transparent") {
        context.fillStyle = background;
        context.fillRect(0, 0, c.offsetWidth, c.offsetHeight);
      }

      if (Math.random() > 0.65) spawn();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        const t = p.life / p.maxLife;
        const alpha = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 0.45;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        context.beginPath();
        context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        context.fillStyle = particleColor;
        context.globalAlpha = Math.min(0.55, alpha);
        context.fill();
        context.globalAlpha = 1;
      }

      frame = requestAnimationFrame(loop);
    }

    loop();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [background, maxSize, minSize, particleColor, particleDensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
