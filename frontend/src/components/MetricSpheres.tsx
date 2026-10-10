/**
 * MetricSpheres
 * ------------------------------------------------------------------
 * Four glass-morphic 3D spheres for the HydroLens screening metrics.
 *
 * Usage:
 *   import { MetricSpheres } from './components/MetricSpheres';
 *
 *   <MetricSpheres
 *     scaleFactor={0.417}
 *     magnification="200x"
 *     status="REQUIRED"
 *     expiry="N/A"
 *   />
 *
 * All four values are optional and fall back to the demo defaults shown
 * above, so `<MetricSpheres />` renders the reference design as-is.
 * ------------------------------------------------------------------
 */
import React from 'react';
import { MetricSphere } from './MetricSphere';
import './MetricSpheres.css';

/* ----------------------------- inline icons ----------------------------- */

/** Scale ruler: five vertical lines of varying height. */
const ScaleIcon = () => (
  <svg
    className="ms-icon"
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    aria-hidden="true"
  >
    <line x1="3" y1="8" x2="3" y2="14" />
    <line x1="7" y1="6" x2="7" y2="16" />
    <line x1="11" y1="4" x2="11" y2="18" />
    <line x1="15" y1="6" x2="15" y2="16" />
    <line x1="19" y1="8" x2="19" y2="14" />
  </svg>
);

/** Camera / webcam lens: rounded body, inner circle, top bump. */
const CameraIcon = () => (
  <svg
    className="ms-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinejoin="round"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <rect x="3" y="8.5" width="18" height="11.5" rx="3" />
    <circle cx="12" cy="14.25" r="3.1" />
    <rect x="9" y="5.5" width="6" height="3" rx="1.2" />
  </svg>
);

/** Shield with an exclamation mark. */
const ShieldIcon = () => (
  <svg
    className="ms-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinejoin="round"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M12 3.2 18.8 6v5.1c0 4.2-2.8 7-6.8 8.7-4-1.7-6.8-4.5-6.8-8.7V6L12 3.2z" />
    <line x1="12" y1="9" x2="12" y2="13.2" />
    <circle cx="12" cy="16" r="0.85" fill="currentColor" stroke="none" />
  </svg>
);

/** Clock with hands pointing to 12 and ~7. */
const ClockIcon = () => (
  <svg
    className="ms-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="8.4" />
    <line x1="12" y1="12" x2="12" y2="6.6" />
    <line x1="12" y1="12" x2="7.6" y2="15.4" />
  </svg>
);

/* ------------------------------- component ------------------------------ */

export interface MetricSpheresProps {
  /** Micrometres per pixel, e.g. 0.417 */
  scaleFactor?: string | number;
  /** Objective magnification, e.g. "200x" */
  magnification?: string;
  /** System status word, e.g. "REQUIRED" */
  status?: string;
  /** Calibration expiry label, e.g. "N/A" */
  expiry?: string;
}

export const MetricSpheres: React.FC<MetricSpheresProps> = ({
  scaleFactor = 0.417,
  magnification = '200x',
  status = 'REQUIRED',
  expiry = 'N/A',
}) => {
  return (
    <div className="metric-spheres">
      <MetricSphere
        icon={<ScaleIcon />}
        label="Scale Factor"
        value={scaleFactor}
        unit="µm / pixel"
        animationDelay={0}
      />
      <MetricSphere
        icon={<CameraIcon />}
        label="Magnification"
        value={magnification}
        unit="Objective Optical Zoom"
        animationDelay={1}
      />
      <MetricSphere
        icon={<ShieldIcon />}
        label="Status"
        value={status}
        unit="Check System Status"
        variant="warning"
        animationDelay={2}
      />
      <MetricSphere
        icon={<ClockIcon />}
        label="Expiry"
        value={expiry}
        unit="7-Day Safety Rule"
        animationDelay={3}
      />
    </div>
  );
};

export default MetricSpheres;
