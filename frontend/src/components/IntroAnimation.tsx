<<<<<<< HEAD
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ChevronRight, Sparkles } from 'lucide-react';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sceneStage, setSceneStage] = useState<number>(1); // 1 = DNA, 2 = Dispersion, 3 = Wordmark, 4 = Fade
  const [progress, setProgress] = useState<number>(0);
  const [fadeOpacity, setFadeOpacity] = useState<number>(1);
  const [showWordmarkText, setShowWordmarkText] = useState<boolean>(false);
  const wordmarkShownRef = useRef<boolean>(false);
  const animFrameRef = useRef<number | null>(null);
  const isCompletedRef = useRef<boolean>(false);

  const handleFinish = useCallback(() => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    onComplete();
  }, [onComplete]);

  // Handle manual skip
  const handleSkip = useCallback(() => {
    setFadeOpacity(0);
    setTimeout(() => {
      handleFinish();
    }, 250);
  }, [handleFinish]);

  // Handle keyboard Escape to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // 1. WebGL Support Detection
    let gl: WebGLRenderingContext | null = null;
    try {
      gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    } catch {
      gl = null;
    }

    if (!gl) {
      console.warn('WebGL not supported on this device. Bypassing 3D intro.');
      handleFinish();
      return;
    }

    // 2. Setup Three.js Scene, Camera, Renderer
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030914, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 36);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
    } catch (err) {
      console.warn('Failed to initialize WebGLRenderer:', err);
      handleFinish();
      return;
    }

    // 3. Lighting setup for realistic microscopy / darkfield aesthetics
    const ambientLight = new THREE.AmbientLight(0x08203e, 1.2);
    scene.add(ambientLight);

    const cyanPointLight = new THREE.PointLight(0x00f0ff, 4.0, 70);
    cyanPointLight.position.set(-15, 12, 18);
    scene.add(cyanPointLight);

    const tealPointLight = new THREE.PointLight(0x0d9488, 3.5, 70);
    tealPointLight.position.set(15, -10, 18);
    scene.add(tealPointLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    rimLight.position.set(0, 20, -10);
    scene.add(rimLight);

    const amberHighlight = new THREE.PointLight(0xf59e0b, 1.2, 50);
    amberHighlight.position.set(0, -14, 12);
    scene.add(amberHighlight);

    // 4. Sample Wordmark Target Positions ("HydroLens") via Offscreen Canvas
    const sampleWordmarkTargets = (targetCount: number): THREE.Vector3[] => {
      const targets: THREE.Vector3[] = [];
      const textCanvas = document.createElement('canvas');
      const textCtx = textCanvas.getContext('2d');
      if (!textCtx) {
        for (let i = 0; i < targetCount; i++) {
          targets.push(new THREE.Vector3((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 8, 0));
        }
        return targets;
      }

      const w = 1200;
      const h = 400;
      textCanvas.width = w;
      textCanvas.height = h;

      textCtx.fillStyle = '#000000';
      textCtx.fillRect(0, 0, w, h);

      textCtx.fillStyle = '#ffffff';
      textCtx.font = 'bold 150px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      textCtx.textAlign = 'center';
      textCtx.textBaseline = 'middle';
      textCtx.fillText('HydroLens', w / 2, h / 2 - 10);

      const imgData = textCtx.getImageData(0, 0, w, h);
      const pixels = imgData.data;
      const validPoints: { x: number; y: number }[] = [];

      const step = 4;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const idx = (y * w + x) * 4;
          if (pixels[idx] > 140) {
            validPoints.push({
              x: (x - w / 2) * 0.024,
              y: -(y - h / 2) * 0.024
            });
          }
        }
      }

      if (validPoints.length === 0) {
        for (let i = 0; i < targetCount; i++) {
          targets.push(new THREE.Vector3((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 6, 0));
        }
        return targets;
      }

      // Shuffle valid points for organic convergence
      for (let i = validPoints.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = validPoints[i];
        validPoints[i] = validPoints[j];
        validPoints[j] = temp;
      }

      for (let i = 0; i < targetCount; i++) {
        if (i < validPoints.length) {
          const pt = validPoints[i];
          targets.push(new THREE.Vector3(pt.x, pt.y, (Math.random() - 0.5) * 0.8));
        } else {
          // Extra particles form an ambient lens flare / halo ring around the wordmark
          const angle = Math.random() * Math.PI * 2;
          const rx = 15 + Math.random() * 4;
          const ry = 4.5 + Math.random() * 2.5;
          targets.push(new THREE.Vector3(
            Math.cos(angle) * rx,
            Math.sin(angle) * ry,
            (Math.random() - 0.5) * 3
          ));
        }
      }

      return targets;
    };

    // 5. Generate Particle System (DNA Helix -> Microplastics -> Wordmark)
    const PARTICLE_COUNT = 3600;
    const wordmarkTargets = sampleWordmarkTargets(PARTICLE_COUNT);

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    // Particle state tracking
    const helixPositions: THREE.Vector3[] = [];
    const dispersionPositions: THREE.Vector3[] = [];
    const dispersionVelocities: THREE.Vector3[] = [];
    const particleTypes: number[] = []; // 0: microbead sphere, 1: shard/fragment, 2: fiber, 3: film flake

    // DNA helix mathematical parameters
    const helixHeight = 28;
    const helixRadius = 4.8;
    const turns = 3.2;

    // Palette: Cyan, Teal, Sky, Emerald, Translucent Amber highlight
    const colorPalette = [
      new THREE.Color(0x00f0ff), // Luminous cyan
      new THREE.Color(0x0891b2), // Deep aqua/teal
      new THREE.Color(0x38bdf8), // Electric sky
      new THREE.Color(0x10b981), // Bio-fluorescence trace
      new THREE.Color(0xf59e0b), // Amber/polymer refraction
      new THREE.Color(0x0284c7)  // Deep ocean blue
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let hx = 0;
      let hy = 0;
      let hz = 0;
      let chosenColor = colorPalette[0];

      // Assign particle types
      const typeRand = Math.random();
      let pType = 0;
      if (typeRand < 0.45) pType = 0;      // Microbead
      else if (typeRand < 0.75) pType = 1; // Fragment shard
      else if (typeRand < 0.90) pType = 2; // Microfiber
      else pType = 3;                      // Film flake
      particleTypes.push(pType);

      // Distribute particles across the DNA double helix
      if (i < PARTICLE_COUNT * 0.38) {
        // Strand 1 Backbone (Phosphate-sugar chain)
        const t = (i / (PARTICLE_COUNT * 0.38)) * (Math.PI * 2 * turns);
        const yNorm = (i / (PARTICLE_COUNT * 0.38)) - 0.5;
        hy = yNorm * helixHeight;
        hx = Math.cos(t) * helixRadius + (Math.random() - 0.5) * 0.4;
        hz = Math.sin(t) * helixRadius + (Math.random() - 0.5) * 0.4;
        chosenColor = colorPalette[0]; // Cyan
      } else if (i < PARTICLE_COUNT * 0.76) {
        // Strand 2 Backbone (Antiparallel 180 deg shifted)
        const subIndex = i - PARTICLE_COUNT * 0.38;
        const totalSub = PARTICLE_COUNT * 0.38;
        const t = (subIndex / totalSub) * (Math.PI * 2 * turns) + Math.PI;
        const yNorm = (subIndex / totalSub) - 0.5;
        hy = yNorm * helixHeight;
        hx = Math.cos(t) * helixRadius + (Math.random() - 0.5) * 0.4;
        hz = Math.sin(t) * helixRadius + (Math.random() - 0.5) * 0.4;
        chosenColor = colorPalette[1]; // Teal
      } else if (i < PARTICLE_COUNT * 0.94) {
        // Base-pair bridging rungs (Adenine-Thymine, Guanine-Cytosine bonds)
        const rungIndex = Math.floor(Math.random() * 32);
        const t = (rungIndex / 32) * (Math.PI * 2 * turns);
        const yNorm = (rungIndex / 32) - 0.5;
        hy = yNorm * helixHeight + (Math.random() - 0.5) * 0.2;

        const s1x = Math.cos(t) * helixRadius;
        const s1z = Math.sin(t) * helixRadius;
        const s2x = Math.cos(t + Math.PI) * helixRadius;
        const s2z = Math.sin(t + Math.PI) * helixRadius;

        const lerpFactor = Math.random();
        hx = THREE.MathUtils.lerp(s1x, s2x, lerpFactor);
        hz = THREE.MathUtils.lerp(s1z, s2z, lerpFactor);

        chosenColor = Math.random() > 0.4 ? colorPalette[2] : colorPalette[3];
      } else {
        // Atmospheric floating suspended particulates
        hx = (Math.random() - 0.5) * 26;
        hy = (Math.random() - 0.5) * 26;
        hz = (Math.random() - 0.5) * 20;
        chosenColor = colorPalette[4]; // Amber/refraction
      }

      helixPositions.push(new THREE.Vector3(hx, hy, hz));

      // Dispersion positions: outward explosion & fluid suspension
      const outwardAngle = Math.atan2(hz, hx) + (Math.random() - 0.5) * 0.8;
      const dispersionDist = 8 + Math.random() * 18;
      const dx = Math.cos(outwardAngle) * dispersionDist + (Math.random() - 0.5) * 6;
      const dy = hy * 1.1 + (Math.random() - 0.5) * 12;
      const dz = Math.sin(outwardAngle) * dispersionDist + (Math.random() - 0.5) * 8;
      dispersionPositions.push(new THREE.Vector3(dx, dy, dz));

      dispersionVelocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.8
      ));

      // Initial positions set to Helix
      positions[i * 3] = hx;
      positions[i * 3 + 1] = hy;
      positions[i * 3 + 2] = hz;

      colors[i * 3] = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;

      // Particle size based on morphology
      let pSize = 0.55 + Math.random() * 0.65;
      if (pType === 1) pSize *= 1.25; // Shards slightly larger
      if (pType === 2) pSize *= 1.4;  // Fibers elongated appearance
      sizes[i] = pSize;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom high-performance particle texture
    const createParticleTexture = () => {
      const texCanvas = document.createElement('canvas');
      texCanvas.width = 64;
      texCanvas.height = 64;
      const ctx = texCanvas.getContext('2d');
      if (!ctx) return null;

      const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.25, 'rgba(200, 245, 255, 0.95)');
      grad.addColorStop(0.55, 'rgba(6, 182, 212, 0.6)');
      grad.addColorStop(0.85, 'rgba(2, 132, 199, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(32, 32, 30, 0, Math.PI * 2);
      ctx.fill();

      // Specular diamond center glint
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(30, 30, 4, 4);

      const texture = new THREE.CanvasTexture(texCanvas);
      return texture;
    };

    const particleTexture = createParticleTexture();

    const particleMaterial = new THREE.PointsMaterial({
      size: 1.1,
      vertexColors: true,
      map: particleTexture || undefined,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particleSystem = new THREE.Points(geometry, particleMaterial);
    scene.add(particleSystem);

    // 6. Volumetric 3D Molecular Backbone Tubes & Base Pair Rods (Scene 1 Realism)
    // Create physical 3D cylinders/ribbons for the two DNA strands to give tangible depth
    const strand1Points: THREE.Vector3[] = [];
    const strand2Points: THREE.Vector3[] = [];
    const totalBackboneSteps = 120;

    for (let s = 0; s <= totalBackboneSteps; s++) {
      const t1 = (s / totalBackboneSteps) * (Math.PI * 2 * turns);
      const y1 = ((s / totalBackboneSteps) - 0.5) * helixHeight;
      strand1Points.push(new THREE.Vector3(
        Math.cos(t1) * helixRadius,
        y1,
        Math.sin(t1) * helixRadius
      ));

      const t2 = t1 + Math.PI;
      strand2Points.push(new THREE.Vector3(
        Math.cos(t2) * helixRadius,
        y1,
        Math.sin(t2) * helixRadius
      ));
    }

    const curve1 = new THREE.CatmullRomCurve3(strand1Points);
    const curve2 = new THREE.CatmullRomCurve3(strand2Points);

    const tubeGeo1 = new THREE.TubeGeometry(curve1, 90, 0.22, 8, false);
    const tubeGeo2 = new THREE.TubeGeometry(curve2, 90, 0.22, 8, false);

    const tubeMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      emissive: 0x0891b2,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.3,
      transparent: true,
      opacity: 0.85
    });

    const tube1 = new THREE.Mesh(tubeGeo1, tubeMat);
    const tube2 = new THREE.Mesh(tubeGeo2, tubeMat.clone());
    (tube2.material as THREE.MeshPhysicalMaterial).color.setHex(0x0ea5e9);
    (tube2.material as THREE.MeshPhysicalMaterial).emissive.setHex(0x0369a1);

    const dnaSolidGroup = new THREE.Group();
    dnaSolidGroup.add(tube1);
    dnaSolidGroup.add(tube2);

    // Add 28 horizontal base-pair rung rods connecting the backbones
    const rungGeo = new THREE.CylinderGeometry(0.12, 0.12, helixRadius * 2, 8);
    const rungMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      transparent: true,
      opacity: 0.7
    });

    const rungCount = 28;
    for (let r = 0; r < rungCount; r++) {
      const t = (r / rungCount) * (Math.PI * 2 * turns);
      const y = ((r / rungCount) - 0.5) * helixHeight;
      const rungMesh = new THREE.Mesh(rungGeo, rungMat);
      rungMesh.position.set(0, y, 0);
      rungMesh.rotation.z = Math.PI / 2;
      rungMesh.rotation.y = -t;
      dnaSolidGroup.add(rungMesh);
    }

    scene.add(dnaSolidGroup);

    // 7. Background Atmospheric Dust / Microscopic Fluid Caustics
    const bgDustCount = 450;
    const bgDustGeo = new THREE.BufferGeometry();
    const bgDustPos = new Float32Array(bgDustCount * 3);
    for (let i = 0; i < bgDustCount; i++) {
      bgDustPos[i * 3] = (Math.random() - 0.5) * 70;
      bgDustPos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      bgDustPos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10;
    }
    bgDustGeo.setAttribute('position', new THREE.BufferAttribute(bgDustPos, 3));
    const bgDustMat = new THREE.PointsMaterial({
      size: 0.45,
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const bgDust = new THREE.Points(bgDustGeo, bgDustMat);
    scene.add(bgDust);

    // 8. Animation Timeline & Real-time Update Loop
    const startTime = performance.now();
    const TOTAL_DURATION = 5800; // 5.8 seconds total

    const currentPos = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      currentPos[i] = positions[i];
    }

    let isTabVisible = !document.hidden;
    const handleVisibility = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const handleResize = () => {
      if (!canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Smooth cubic easing functions
    const easeInOutCubic = (x: number): number => {
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    };
    const easeInQuad = (x: number): number => {
      return x * x;
    };

    const animate = (now: number) => {
      if (!isTabVisible) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = now - startTime;
      const overallProgress = Math.min(elapsed / TOTAL_DURATION, 1.0);
      setProgress(overallProgress);

      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      // Rotate background dust slowly
      bgDust.rotation.y = elapsed * 0.0001;
      bgDust.rotation.x = Math.sin(elapsed * 0.0002) * 0.05;

      // ==========================================
      // SCENE 1: Scientific Atmosphere & DNA (0.0s - 1.2s)
      // ==========================================
      if (elapsed < 1200) {
        setSceneStage(1);
        const sec1Prog = elapsed / 1200;

        // Controlled rotation of the double helix
        const rot = elapsed * 0.0016;
        dnaSolidGroup.rotation.y = rot;
        particleSystem.rotation.y = rot;

        // Subtle camera orbit and float
        camera.position.x = Math.sin(elapsed * 0.0006) * 3;
        camera.position.y = Math.cos(elapsed * 0.0008) * 2;
        camera.position.z = 36 - sec1Prog * 2;
        camera.lookAt(0, 0, 0);

        // Keep solid bonds visible
        tubeMat.opacity = 0.85;
        rungMat.opacity = 0.7;

        // Update positions (still in helix formation)
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const h = helixPositions[i];
          posArray[i * 3] = h.x;
          posArray[i * 3 + 1] = h.y;
          posArray[i * 3 + 2] = h.z;
        }
      }
      // ==========================================
      // SCENE 2: DNA Transformation -> Microplastics (1.2s - 3.2s)
      // ==========================================
      else if (elapsed < 3200) {
        setSceneStage(2);
        const transProgress = (elapsed - 1200) / 2000;
        const easedTrans = easeInOutCubic(transProgress);

        // Continue overall rotation smoothly slowing down
        const rot = 1200 * 0.0016 + (elapsed - 1200) * 0.0008;
        dnaSolidGroup.rotation.y = rot;
        particleSystem.rotation.y = rot * 0.6;

        // Solid DNA bonds dissolve and fade away smoothly
        const solidFade = Math.max(0, 1.0 - transProgress * 1.8);
        tubeMat.opacity = 0.85 * solidFade;
        rungMat.opacity = 0.7 * solidFade;
        dnaSolidGroup.scale.setScalar(Math.max(0.001, 1.0 - transProgress * 0.4));

        // Camera moves forward dynamically into the molecular suspension
        camera.position.z = 34 - easedTrans * 6;
        camera.position.y = THREE.MathUtils.lerp(2, -1, easedTrans);
        camera.lookAt(0, 0, 0);

        // Microplastics disperse with fluid buoyancy and Brownian turbulence
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const h = helixPositions[i];
          const d = dispersionPositions[i];
          const v = dispersionVelocities[i];

          // Curled fluid turbulence offset
          const fluidTurbulenceX = Math.sin(elapsed * 0.003 + i) * 1.4 * easedTrans;
          const fluidTurbulenceY = Math.cos(elapsed * 0.0025 + i * 0.5) * 1.2 * easedTrans;
          const fluidTurbulenceZ = Math.sin(elapsed * 0.002 + i * 1.5) * 1.5 * easedTrans;

          const tx = THREE.MathUtils.lerp(h.x, d.x + v.x * 4, easedTrans) + fluidTurbulenceX;
          const ty = THREE.MathUtils.lerp(h.y, d.y + v.y * 4, easedTrans) + fluidTurbulenceY;
          const tz = THREE.MathUtils.lerp(h.z, d.z + v.z * 4, easedTrans) + fluidTurbulenceZ;

          posArray[i * 3] = tx;
          posArray[i * 3 + 1] = ty;
          posArray[i * 3 + 2] = tz;
        }
      }
      // ==========================================
      // SCENE 3: Particle Convergence -> HydroLens Wordmark (3.2s - 4.6s)
      // ==========================================
      else if (elapsed < 4600) {
        setSceneStage(3);
        const convProgress = (elapsed - 3200) / 1400;
        const easedConv = easeInOutCubic(convProgress);

        // Solid DNA is completely hidden
        tubeMat.opacity = 0;
        rungMat.opacity = 0;
        dnaSolidGroup.visible = false;

        // Straighten rotation towards 0 for clear typographic alignment
        particleSystem.rotation.y = THREE.MathUtils.lerp(particleSystem.rotation.y, 0, 0.15);
        particleSystem.rotation.x = THREE.MathUtils.lerp(particleSystem.rotation.x, 0, 0.15);

        // Camera settles to frontal view
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.1);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, 0.1);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 28, 0.08);
        camera.lookAt(0, 0, 0);

        // Guide particles magnetically to the sampled wordmark target positions
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const d = dispersionPositions[i];
          const w = wordmarkTargets[i];

          // Dynamic magnetic attraction with subtle harmonic settle
          const harmonic = Math.sin(convProgress * Math.PI) * (1.0 - easedConv) * 2.0;
          const tx = THREE.MathUtils.lerp(d.x, w.x, easedConv) + (Math.sin(i + elapsed * 0.005) * 0.12 * harmonic);
          const ty = THREE.MathUtils.lerp(d.y, w.y, easedConv) + (Math.cos(i + elapsed * 0.004) * 0.12 * harmonic);
          const tz = THREE.MathUtils.lerp(d.z, w.z, easedConv) * (1.0 - easedConv * 0.85);

          posArray[i * 3] = tx;
          posArray[i * 3 + 1] = ty;
          posArray[i * 3 + 2] = tz;
        }

        // Trigger clean typography light sweep overlay when particles converge
        if (convProgress > 0.45 && !wordmarkShownRef.current) {
          wordmarkShownRef.current = true;
          setShowWordmarkText(true);
        }
      }
      // ==========================================
      // SCENE 4: Seamless Transition to Homepage (4.6s - 5.8s)
      // ==========================================
      else {
        setSceneStage(4);
        const fadeProgress = (elapsed - 4600) / 1200;
        const easedFade = easeInQuad(Math.min(fadeProgress, 1.0));

        // Smoothly dissolve the 3D scene and container
        setFadeOpacity(Math.max(0, 1.0 - easedFade));

        // Particles gently disperse and drift outward like microscopic light
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const w = wordmarkTargets[i];
          posArray[i * 3] = w.x + Math.sin(i * 0.5 + elapsed * 0.002) * (easedFade * 8);
          posArray[i * 3 + 1] = w.y + (Math.random() - 0.5) * (easedFade * 6);
          posArray[i * 3 + 2] = w.z + easedFade * 12;
        }

        particleMaterial.opacity = Math.max(0, 0.92 * (1.0 - easedFade));

        if (elapsed >= TOTAL_DURATION) {
          handleFinish();
          return;
        }
      }

      posAttr.needsUpdate = true;
      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // Cleanup resources cleanly on unmount to prevent any memory leaks
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);

      geometry.dispose();
      particleMaterial.dispose();
      if (particleTexture) particleTexture.dispose();

      tubeGeo1.dispose();
      tubeGeo2.dispose();
      tubeMat.dispose();
      rungGeo.dispose();
      rungMat.dispose();
      bgDustGeo.dispose();
      bgDustMat.dispose();

      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [handleFinish]);

  return (
    <div
      ref={containerRef}
      style={{ opacity: fadeOpacity }}
      className="fixed inset-0 z-[100] bg-[#030914] text-white flex flex-col items-center justify-center select-none overflow-hidden transition-opacity duration-700 ease-out"
      aria-label="HydroLens Cinematic Introduction"
      role="region"
    >
      {/* 3D WebGL Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-default"
      />

      {/* Atmospheric Optical Vignette & Darkfield Gradient */}
      <div 
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(3,9,20,0.85)_100%)]" 
        aria-hidden="true" 
      />

      {/* Top Header Status & Skip Intro Button */}
      <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between pointer-events-auto z-20">
        <div className="flex items-center space-x-3 text-cyan-400/80 text-xs tracking-widest uppercase font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-semibold text-cyan-300">Optical Resonance System</span>
          <span className="text-cyan-600">•</span>
          <span className="hidden sm:inline text-cyan-400/60">Stage 0{sceneStage} / 04</span>
        </div>

        <button
          onClick={handleSkip}
          className="group px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-cyan-400/30 hover:border-cyan-400/60 backdrop-blur-md text-xs font-semibold tracking-wider uppercase text-cyan-100 hover:text-white transition-all duration-300 flex items-center space-x-2 shadow-lg shadow-cyan-950/40 hover:shadow-cyan-500/25 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400"
          aria-label="Skip introductory 3D sequence"
        >
          <span>Skip Intro</span>
          <ChevronRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </header>

      {/* Scene 3 Wordmark Typography Reveal Layer */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 transition-all duration-1000 ${
          showWordmarkText ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-95 blur-sm'
        }`}
      >
        <div className="relative text-center">
          {/* Luminous optical light-sweep backdrop */}
          <div className="absolute -inset-x-20 -inset-y-10 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

          {/* Exact Brand Name Wordmark: HydroLens */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 drop-shadow-[0_0_35px_rgba(6,182,212,0.65)] font-sans">
            HydroLens
          </h1>

          {/* Subtitle tag with optical reticle brackets */}
          <div className="mt-4 flex items-center justify-center space-x-2 text-cyan-300 text-xs sm:text-sm font-semibold tracking-[0.28em] uppercase">
            <span className="text-cyan-500">[</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Portable Optical Microplastic Screening</span>
            <span className="text-cyan-500">]</span>
          </div>

          <div className="mt-2 text-[11px] text-cyan-400/60 font-mono tracking-wider uppercase">
            Molecular Screening Protocol • ISO/TR 21960
          </div>
        </div>
      </div>

      {/* Bottom Cinematic Progress Bar & Stage Indicator */}
      <footer className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-center justify-between text-xs text-cyan-400/60 font-mono gap-3 pointer-events-none z-20">
        <div className="flex items-center space-x-3">
          <span className="text-cyan-300 font-bold">
            {sceneStage === 1 && 'SCENE 1: Helical DNA Matrix'}
            {sceneStage === 2 && 'SCENE 2: Microplastic Dissociation & Flow'}
            {sceneStage === 3 && 'SCENE 3: Particle Convergence & HydroLens Reveal'}
            {sceneStage === 4 && 'SCENE 4: Transitioning to Laboratory Suite...'}
          </span>
        </div>

        {/* Progress track */}
        <div className="w-full sm:w-64 h-1.5 bg-cyan-950/80 rounded-full overflow-hidden border border-cyan-800/40 relative">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-teal-300 transition-all duration-100 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.8)]"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </footer>
    </div>
  );
};

export default IntroAnimation;
=======
import { useState, useEffect, useCallback, useRef } from 'react';
import './IntroAnimation.css';

/** Session key used to suppress replay within the same browser session. */
const SESSION_KEY = 'hydrolens-intro-seen';

/** Total duration (ms) before auto-dismissing the intro. */
const INTRO_DURATION_MS = 3500;

/** Duration (ms) for the exit fade-out transition. */
const EXIT_TRANSITION_MS = 700;

/* ──────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────── */

function wasIntroSeen(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    // Storage unavailable (private mode, disabled, etc.) — treat as unseen.
    return false;
  }
}

function markIntroSeen(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // Silently ignore — user will simply see the intro again on next visit.
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ──────────────────────────────────────────────────────────────
   IntroAnimation Component
   ────────────────────────────────────────────────────────────── */

export function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'playing' | 'exiting' | 'done'>('playing');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Begin the exit transition, then signal completion. */
  const beginExit = useCallback(() => {
    if (phase !== 'playing') return;
    setPhase('exiting');

    timerRef.current = setTimeout(() => {
      markIntroSeen();
      setPhase('done');
      onComplete();
    }, EXIT_TRANSITION_MS);
  }, [phase, onComplete]);

  /* Auto-dismiss after INTRO_DURATION_MS. */
  useEffect(() => {
    /* If the user prefers reduced motion, use a shorter intro. */
    const duration = prefersReducedMotion() ? 1500 : INTRO_DURATION_MS;
    const id = setTimeout(beginExit, duration);
    return () => clearTimeout(id);
  }, [beginExit]);

  /* Cleanup on unmount. */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /* Don't render anything once the intro is completely finished. */
  if (phase === 'done') return null;

  const letters = ['H', 'y', 'd', 'r', 'o', 'L', 'e', 'n', 's'];

  return (
    <div
      className={`intro-overlay ${phase === 'exiting' ? 'intro-exiting' : ''}`}
      aria-hidden="true"
      role="presentation"
    >
      {/* ── Scientific Grid (SVG) ──────────────────────────── */}
      <div className="intro-grid">
        <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <defs>
            <pattern id="intro-grid-sm" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(107,191,216,0.06)" strokeWidth="0.5" />
            </pattern>
            <pattern id="intro-grid-lg" width="200" height="200" patternUnits="userSpaceOnUse">
              <rect width="200" height="200" fill="url(#intro-grid-sm)" />
              <path d="M 200 0 L 0 0 0 200" fill="none" stroke="rgba(107,191,216,0.1)" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#intro-grid-lg)" />
        </svg>
      </div>

      {/* ── Floating Microplastic Particles ────────────────── */}
      <div className="intro-particles">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="intro-particle" />
        ))}
      </div>

      {/* ── Lens / Scanner Ring ─────────────────────────────── */}
      <div className="intro-lens" />

      {/* ── Central Glow ───────────────────────────────────── */}
      <div className="intro-glow" />

      {/* ── Scan Beam ──────────────────────────────────────── */}
      <div className="intro-scan-beam" />

      {/* ── Corner Crosshairs ──────────────────────────────── */}
      {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
        <svg key={pos} className={`intro-crosshair intro-crosshair--${pos}`} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="0" x2="16" y2="0" stroke="rgba(107,191,216,0.5)" strokeWidth="1" />
          <line x1="0" y1="0" x2="0" y2="16" stroke="rgba(107,191,216,0.5)" strokeWidth="1" />
          <circle cx="0" cy="0" r="2" fill="rgba(107,191,216,0.4)" />
        </svg>
      ))}

      {/* ── Brand Reveal ───────────────────────────────────── */}
      <div className="intro-brand">
        {/* HydroLens Real Logo */}
        <div className="intro-icon-container">
          <img
            src="/logo.png"
            alt="HydroLens Logo"
            className="intro-logo-img"
          />
        </div>

        {/* Wordmark */}
        <div className="intro-wordmark">
          {letters.map((char, i) => (
            <span key={i} className="intro-letter">{char}</span>
          ))}
        </div>

        {/* Horizontal line divider */}
        <div className="intro-line" />

        {/* Subtitle */}
        <span className="intro-subtitle">Microplastic Screening System</span>
      </div>

      {/* ── Progress Bar ───────────────────────────────────── */}
      <div className="intro-progress" />

      {/* ── Skip Button ────────────────────────────────────── */}
      <button
        className="intro-skip"
        onClick={beginExit}
        type="button"
        aria-label="Skip intro animation"
      >
        Skip Intro
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="13 17 18 12 13 7" />
          <polyline points="6 17 11 12 6 7" />
        </svg>
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Wrapper: Only mounts IntroAnimation when needed.
   Usage:  <IntroGuard>  <App /> </IntroGuard>
   ────────────────────────────────────────────────────────────── */

export function IntroGuard({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(() => !wasIntroSeen());

  const handleComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  return (
    <>
      {showIntro && <IntroAnimation onComplete={handleComplete} />}
      {/* Always render children underneath so the homepage is ready behind the overlay */}
      <div style={{ visibility: showIntro ? 'hidden' : 'visible' }}>
        {children}
      </div>
    </>
  );
}
>>>>>>> origin/main
