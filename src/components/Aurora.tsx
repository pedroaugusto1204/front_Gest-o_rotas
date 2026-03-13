import React, { useEffect, useRef } from 'react';

interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
}

export const Aurora: React.FC<AuroraProps> = ({
  colorStops = ["#9a0e15", "#550202", "#ea8080"],
  amplitude = 0.8,
  blend = 0.15,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      time += 0.005;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Simple Aurora simulation using gradients and sine waves
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      colorStops.forEach((color, i) => {
        const pos = (i / (colorStops.length - 1)) + Math.sin(time + i) * 0.1;
        gradient.addColorStop(Math.max(0, Math.min(1, pos)), color);
      });

      ctx.fillStyle = gradient;
      ctx.globalAlpha = blend;
      
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        for (let x = 0; x < canvas.width; x += 5) {
          const y = canvas.height * 0.5 + 
                    Math.sin(x * 0.005 + time + i) * 100 * amplitude +
                    Math.cos(x * 0.002 - time * 0.5) * 50;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [colorStops, amplitude, blend]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ filter: 'blur(60px)' }}
    />
  );
};
