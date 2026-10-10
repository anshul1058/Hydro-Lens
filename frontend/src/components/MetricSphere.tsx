import React, { useEffect, useRef } from 'react';

/**
 * Variant of a sphere.
 * - 'default' : cool blue glass (Scale, Magnification, Expiry)
 * - 'warning' : warm coral/red glass with a heartbeat glow (Status)
 */
export type SphereVariant = 'default' | 'warning';

export interface MetricSphereProps {
  /** Inline SVG icon rendered at the top of the sphere. */
  icon: React.ReactNode;
  /** Small uppercase label, e.g. "SCALE FACTOR". */
  label: string;
  /** Main value, e.g. 0.417 / "200x" / "REQUIRED". */
  value: string | number;
  /** Muted caption under the value (unit or helper text). */
  unit?: string;
  /** Visual variant. Defaults to 'default'. */
  variant?: SphereVariant;
  /** Idle-float stagger in seconds (0, 1, 2, 3). */
  animationDelay?: number;
}

/**
 * MetricSphere
 * A single glass-morphic 3D sphere with:
 *  - idle 3D float (CSS keyframes on the inner `.ms-float` layer)
 *  - internal shine drift + bottom reflection (pseudo elements on `.ms-surface`)
 *  - mouse-driven 3D tilt + internal parallax (vanilla JS, via refs)
 *  - click ripple (temporary element, cleaned up on unmount)
 *
 * The tilt transform lives on the outer `.ms-sphere` while the float animation
 * lives on the inner `.ms-float`, so pausing the float never fights the tilt.
 */
export const MetricSphere: React.FC<MetricSphereProps> = ({
  icon,
  label,
  value,
  unit,
  variant = 'default',
  animationDelay = 0,
}) => {
  const sphereRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const sphere = sphereRef.current;
    const float = floatRef.current;
    const glass = glassRef.current;
    if (!sphere || !float || !glass) return;

    const handleMove = (event: MouseEvent) => {
      const rect = sphere.getBoundingClientRect();
      // Normalise cursor offset from sphere centre into -1 .. 1
      const dx = Math.max(-1, Math.min(1, (event.clientX - rect.left - rect.width / 2) / (rect.width / 2)));
      const dy = Math.max(-1, Math.min(1, (event.clientY - rect.top - rect.height / 2) / (rect.height / 2)));

      sphere.style.transform =
        `translateY(-10px) scale(1.06) rotateX(${-dy * 18}deg) rotateY(${dx * 18}deg)`;
      // Anchor the sphere while the pointer is on it.
      float.style.animationPlayState = 'paused';
      // Subtle internal parallax consumed by `.ms-content`.
      glass.style.setProperty('--mx', `${dx * 8}px`);
      glass.style.setProperty('--my', `${dy * 8}px`);
    };

    const handleLeave = () => {
      sphere.style.transform = '';
      float.style.animationPlayState = 'running';
      glass.style.removeProperty('--mx');
      glass.style.removeProperty('--my');
    };

    const handleClick = () => {
      const ripple = document.createElement('div');
      ripple.className = 'ms-ripple';
      glass.appendChild(ripple);
      const timer = window.setTimeout(() => {
        if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
        timersRef.current = timersRef.current.filter((id) => id !== timer);
      }, 900);
      timersRef.current.push(timer);
    };

    sphere.addEventListener('mousemove', handleMove);
    sphere.addEventListener('mouseleave', handleLeave);
    sphere.addEventListener('click', handleClick);

    return () => {
      sphere.removeEventListener('mousemove', handleMove);
      sphere.removeEventListener('mouseleave', handleLeave);
      sphere.removeEventListener('click', handleClick);
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  const variantClass = variant === 'warning' ? ' is-warning' : '';

  return (
    <div className={`ms-sphere${variantClass}`} ref={sphereRef}>
      <div
        className="ms-float"
        ref={floatRef}
        style={{ animationDelay: `${animationDelay}s` }}
      >
        <div className={`ms-glass${variantClass}`} ref={glassRef}>
          <span className="ms-surface" aria-hidden="true" />
          <span className="ms-content">
            <span className="ms-icon-wrap">{icon}</span>
            <span className="ms-label">{label}</span>
            <span className="ms-value">{value}</span>
            {unit ? <span className="ms-unit">{unit}</span> : null}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MetricSphere;
