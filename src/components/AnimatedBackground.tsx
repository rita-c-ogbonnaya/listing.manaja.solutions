import { useEffect, useRef } from "react";

interface ShootingStar {
  lineIndex: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
  direction: 1 | -1;
  active: boolean;
  nextSpawnTime: number;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const LINE_COUNT = 6;

    const getColors = () => {
      const isDark = document.documentElement.classList.contains("dark");
      return {
        lineColor: isDark ? "rgba(80, 130, 220, 0.06)" : "rgba(43, 91, 169, 0.08)",
        // Lighter blue in dark mode, brand blue in light mode
        starRGB: isDark ? [100, 160, 255] : [43, 91, 169],
      };
    };

    const getLineX = (index: number) => {
      const spacing = w / (LINE_COUNT + 1);
      return spacing * (index + 1);
    };

    const stars: ShootingStar[] = [];
    for (let i = 0; i < LINE_COUNT; i++) {
      stars.push({
        lineIndex: i,
        y: 0,
        speed: 0,
        length: 0,
        opacity: 0,
        direction: 1,
        active: false,
        nextSpawnTime: performance.now() + Math.random() * 5000 + 2000,
      });
    }

    const spawnStar = (star: ShootingStar) => {
      star.active = true;
      star.direction = Math.random() > 0.5 ? 1 : -1;
      star.y = star.direction === 1 ? -40 : h + 40;
      star.speed = (Math.random() * 3 + 2) * star.direction;
      star.length = Math.random() * 40 + 30;
      star.opacity = Math.random() * 0.5 + 0.4;
    };

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      const { lineColor, starRGB } = getColors();

      for (let i = 0; i < LINE_COUNT; i++) {
        const x = getLineX(i);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const now = performance.now();

      stars.forEach((star) => {
        if (!star.active) {
          if (now >= star.nextSpawnTime) spawnStar(star);
          return;
        }

        const x = getLineX(star.lineIndex);
        const headY = star.y;
        const tailY = headY - star.length * star.direction;

        const gradient = ctx.createLinearGradient(x, tailY, x, headY);
        gradient.addColorStop(0, `rgba(${starRGB.join(",")}, 0)`);
        gradient.addColorStop(1, `rgba(${starRGB.join(",")}, ${star.opacity})`);

        ctx.beginPath();
        ctx.moveTo(x, tailY);
        ctx.lineTo(x, headY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, headY, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${starRGB.join(",")}, ${star.opacity})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, headY, 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${starRGB.join(",")}, ${star.opacity * 0.2})`;
        ctx.fill();

        star.y += star.speed;

        if (
          (star.direction === 1 && star.y > h + 60) ||
          (star.direction === -1 && star.y < -60)
        ) {
          star.active = false;
          // 5–10 second respawn
          star.nextSpawnTime = now + Math.random() * 5000 + 5000;
        }
      });

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 right-0 pointer-events-none z-0 opacity-50"
      style={{ height: "100vh" }}
    />
  );
}
