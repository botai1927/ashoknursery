import { useEffect, useRef } from 'react';

interface LeafParticle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  swingAngle: number;
  swingSpeed: number;
  color: string;
  opacity: number;
  aspectRatio: number;
}

const LEAF_COLORS = [
  '#4D7C0F', // deep fresh leaf green
  '#65A30D', // vibrant spring green
  '#84CC16', // young bud green
  '#B45309', // warm autumn terracotta tint
  '#15803D', // emerald foliage
];

export function FallingLeaves({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Respect user motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initial pool of 24 gentle leaves
    const particleCount = 22;
    const particles: LeafParticle[] = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 10 + Math.random() * 12,
      speedY: 0.6 + Math.random() * 0.9,
      speedX: -0.3 + Math.random() * 0.6,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      swingAngle: Math.random() * Math.PI * 2,
      swingSpeed: 0.015 + Math.random() * 0.02,
      color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
      opacity: 0.35 + Math.random() * 0.45,
      aspectRatio: 1.6 + Math.random() * 0.8,
    }));

    const drawLeaf = (p: LeafParticle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      // Draw stylized lanceolate leaf shape
      ctx.beginPath();
      const w = p.size;
      const h = p.size / p.aspectRatio;

      ctx.moveTo(-w / 2, 0);
      ctx.bezierCurveTo(-w / 4, -h, w / 4, -h, w / 2, 0);
      ctx.bezierCurveTo(w / 4, h, -w / 4, h, -w / 2, 0);
      ctx.fill();

      // Delicate central leaf vein
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.lineTo(w / 2, 0);
      ctx.stroke();

      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.swingAngle += p.swingSpeed;
        p.x += p.speedX + Math.sin(p.swingAngle) * 0.8;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x < -30) p.x = width + 20;
        if (p.x > width + 30) p.x = -20;

        drawLeaf(p);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 w-full h-full z-10 ${className}`}
    />
  );
}
