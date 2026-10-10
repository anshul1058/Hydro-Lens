import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number; // 0.15 (deep/far) to 1.0 (shallow/close)
  size: number;
  type: 'sphere' | 'fragment' | 'fiber' | 'film';
  color: string;
  opacity: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  points?: { x: number; y: number }[]; // For angular fragment morphology
  aspectRatio?: number;
  curveAmp?: number;
}

export const Scientific3DBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const targetParallaxRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentParallaxRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Respect reduced-motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = mediaQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    mediaQuery.addEventListener('change', handleMotionChange);

    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse parallax tracking
    const handleMouseMove = (e: MouseEvent) => {
      const normX = e.clientX / window.innerWidth;
      const normY = e.clientY / window.innerHeight;
      mousePosRef.current = { x: normX, y: normY };
      targetParallaxRef.current = {
        x: (normX - 0.5) * 30,
        y: (normY - 0.5) * 20
      };
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Particle palette: translucent cyan, aqua, ocean blue, teal, fluorescent microplastic trace
    const colors = [
      'rgba(6, 182, 212,',   // cyan-500
      'rgba(8, 145, 178,',   // teal-600
      'rgba(2, 132, 199,',   // sky-600
      'rgba(13, 148, 136,',  // teal-dark
      'rgba(56, 189, 248,',  // light cyan
      'rgba(16, 185, 129,'   // bio/fluorescent trace
    ];

    const particleCount = 42;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const z = 0.15 + Math.random() * 0.85; // 3D depth
      const typeChoice = Math.random();
      let type: Particle['type'] = 'sphere';
      let points: { x: number; y: number }[] | undefined;

      if (typeChoice < 0.35) {
        type = 'sphere'; // Microbead / pellet
      } else if (typeChoice < 0.65) {
        type = 'fragment'; // Angular shard
        const numSides = 4 + Math.floor(Math.random() * 3);
        points = [];
        for (let s = 0; s < numSides; s++) {
          const angle = (s / numSides) * Math.PI * 2;
          const r = 0.6 + Math.random() * 0.8;
          points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
        }
      } else if (typeChoice < 0.85) {
        type = 'fiber'; // Elongated fiber
      } else {
        type = 'film'; // Thin planar flake
      }

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        size: (3.5 + Math.random() * 8.5) * z,
        type,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: (0.15 + Math.random() * 0.35) * (0.4 + 0.6 * z),
        vx: (Math.random() - 0.5) * 0.35 * z,
        vy: (0.15 + Math.random() * 0.4) * (0.5 + 0.5 * z), // slow fluid drift downward/convection
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.015,
        points,
        aspectRatio: 1.8 + Math.random() * 3.5,
        curveAmp: Math.random() * 6
      });
    }

    let time = 0;
    let isTabVisible = !document.hidden;

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible && !prefersReducedMotion) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let lastTime = performance.now();

    // Render loop
    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      time += dt * 0.6;

      // Parallax smooth interpolation
      currentParallaxRef.current.x += (targetParallaxRef.current.x - currentParallaxRef.current.x) * 0.05;
      currentParallaxRef.current.y += (targetParallaxRef.current.y - currentParallaxRef.current.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // 1. Water Caustics & Volumetric Ambient Light Shimmer (3D Fluid Effect)
      const gradient = ctx.createRadialGradient(
        width * 0.35 + Math.sin(time * 0.5) * 60,
        height * 0.25 + Math.cos(time * 0.4) * 40,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.12)');
      gradient.addColorStop(0.35, 'rgba(8, 145, 178, 0.06)');
      gradient.addColorStop(0.7, 'rgba(2, 132, 199, 0.04)');
      gradient.addColorStop(1, 'rgba(235, 247, 252, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Secondary deep water depth glow in bottom right
      const depthGlow = ctx.createRadialGradient(
        width * 0.85 - Math.cos(time * 0.3) * 50,
        height * 0.75 + Math.sin(time * 0.3) * 30,
        80,
        width * 0.85,
        height * 0.75,
        Math.max(width, height) * 0.55
      );
      depthGlow.addColorStop(0, 'rgba(13, 148, 136, 0.09)');
      depthGlow.addColorStop(0.5, 'rgba(6, 182, 212, 0.03)');
      depthGlow.addColorStop(1, 'rgba(235, 247, 252, 0)');

      ctx.fillStyle = depthGlow;
      ctx.fillRect(0, 0, width, height);

      // Subtle sinusoidal liquid caustic light filaments
      ctx.save();
      ctx.lineWidth = 1.2;
      for (let c = 0; c < 3; c++) {
        const cTime = time * 0.35 + c * 2.1;
        ctx.beginPath();
        const startY = height * (0.15 + c * 0.28);
        ctx.moveTo(0, startY + Math.sin(cTime) * 20);

        for (let x = 0; x <= width; x += 40) {
          const wave1 = Math.sin(x * 0.0035 + cTime) * 18;
          const wave2 = Math.cos(x * 0.007 - cTime * 0.8) * 10;
          ctx.lineTo(x, startY + wave1 + wave2);
        }

        ctx.strokeStyle = `rgba(6, 182, 212, ${0.035 + c * 0.015})`;
        ctx.stroke();
      }
      ctx.restore();

      // 2. Render 3D Suspended Microplastic Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          // Physics simulation with gentle buoyancy & fluid turbulence
          p.x += p.vx + Math.sin(time * 1.2 + i) * 0.25 * p.z;
          p.y += p.vy + Math.cos(time * 0.9 + i) * 0.2 * p.z;
          p.rotation += p.vRot;

          // Seamless edge wrapping
          if (p.x < -40) p.x = width + 40;
          if (p.x > width + 40) p.x = -40;
          if (p.y > height + 40) p.y = -40;
          if (p.y < -40) p.y = height + 40;
        }

        // Apply 3D parallax displacement according to depth (z)
        const renderX = p.x + currentParallaxRef.current.x * p.z;
        const renderY = p.y + currentParallaxRef.current.y * p.z;

        ctx.save();
        ctx.translate(renderX, renderY);
        ctx.rotate(p.rotation);

        if (p.type === 'sphere') {
          // Microbead with 3D specular highlight and refractive halo
          const rad = p.size;
          const sphereGrad = ctx.createRadialGradient(
            -rad * 0.35,
            -rad * 0.35,
            rad * 0.1,
            0,
            0,
            rad
          );
          sphereGrad.addColorStop(0, `rgba(255, 255, 255, ${p.opacity * 1.5})`);
          sphereGrad.addColorStop(0.35, `${p.color} ${p.opacity})`);
          sphereGrad.addColorStop(0.85, `${p.color} ${p.opacity * 0.5})`);
          sphereGrad.addColorStop(1, `${p.color} 0)`);

          ctx.fillStyle = sphereGrad;
          ctx.beginPath();
          ctx.arc(0, 0, rad, 0, Math.PI * 2);
          ctx.fill();

          // Subtle optical outer edge ring
          ctx.strokeStyle = `${p.color} ${p.opacity * 0.75})`;
          ctx.lineWidth = 0.8 * p.z;
          ctx.beginPath();
          ctx.arc(0, 0, rad, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.type === 'fragment' && p.points) {
          // Irregular angular polymer fragment with refractive 3D facets
          const rad = p.size * 1.3;
          ctx.beginPath();
          ctx.moveTo(p.points[0].x * rad, p.points[0].y * rad);
          for (let pt = 1; pt < p.points.length; pt++) {
            ctx.lineTo(p.points[pt].x * rad, p.points[pt].y * rad);
          }
          ctx.closePath();

          ctx.fillStyle = `${p.color} ${p.opacity * 0.75})`;
          ctx.fill();

          ctx.strokeStyle = `${p.color} ${p.opacity * 1.3})`;
          ctx.lineWidth = 1.0 * p.z;
          ctx.stroke();

          // Internal specular facet highlight
          ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity * 0.9})`;
          ctx.lineWidth = 0.75 * p.z;
          ctx.beginPath();
          ctx.moveTo(p.points[0].x * rad * 0.6, p.points[0].y * rad * 0.6);
          ctx.lineTo(p.points[1].x * rad * 0.6, p.points[1].y * rad * 0.6);
          ctx.stroke();
        } else if (p.type === 'fiber') {
          // Synthetic fiber thread with natural fluid curvature
          const len = p.size * (p.aspectRatio || 2.5);
          const amp = (p.curveAmp || 4) * p.z;
          ctx.beginPath();
          ctx.moveTo(-len * 0.5, 0);
          ctx.quadraticCurveTo(0, amp * Math.sin(time + i), len * 0.5, 0);

          ctx.strokeStyle = `${p.color} ${p.opacity * 1.2})`;
          ctx.lineWidth = Math.max(1, 1.8 * p.z);
          ctx.lineCap = 'round';
          ctx.stroke();

          // Specular glint along fiber spine
          ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity * 0.8})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        } else if (p.type === 'film') {
          // Thin planar membrane / film flake with translucent plane
          const w = p.size * 1.5;
          const h = p.size * 0.8;
          ctx.fillStyle = `${p.color} ${p.opacity * 0.5})`;
          ctx.strokeStyle = `${p.color} ${p.opacity * 0.9})`;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.roundRect(-w * 0.5, -h * 0.5, w, h, 2);
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      }

      if (!prefersReducedMotion && isTabVisible) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      mediaQuery.removeEventListener('change', handleMotionChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* 3D Depth Layer 1: Ambient Fluid Glow Spheres */}
      <div 
        className="absolute -top-24 left-1/4 w-[520px] h-[520px] rounded-full bg-cyan-400/14 blur-[130px] transform-gpu" 
      />
      <div 
        className="absolute -bottom-28 right-8 w-[640px] h-[640px] rounded-full bg-teal-400/12 blur-[150px] transform-gpu" 
      />
      <div 
        className="absolute top-1/2 -left-20 w-[420px] h-[420px] rounded-full bg-blue-500/10 blur-[120px] transform-gpu" 
      />

      {/* 3D Depth Layer 2: Interactive High-Performance Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-85"
      />

      {/* 3D Depth Layer 3: Subtle Scientific Optical Mesh Gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-900/[0.015] to-[#EAF7FC]/30 pointer-events-none" 
      />
    </div>
  );
};

export default Scientific3DBackground;
