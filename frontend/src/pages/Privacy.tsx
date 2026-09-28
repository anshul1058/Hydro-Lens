import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <article className="max-w-3xl bg-surface border border-line rounded-md p-6 sm:p-8 space-y-6 shadow-2xs">
      <header className="border-b border-line pb-4">
        <p className="text-caption">Data Privacy and Edge Architecture</p>
        <h1 className="text-page-title mt-1">Privacy Policy</h1>
        <p className="text-[12px] font-mono text-ink-3 mt-1.5">Effective Date: 28 September 2026</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-section-title">1. Local Processing Architecture</h2>
        <p className="text-body">
          Hydro Lens operates without user accounts, authentication tokens, or telemetry trackers.
          Image analysis runs entirely against the local or direct self-hosted FastAPI instance.
          No usage analytics, session tracking cookies, or diagnostic pings are transmitted to third parties.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-section-title">2. Data Processed During Operation</h2>
        <ul className="list-disc pl-5 space-y-2 text-body">
          <li>
            <strong>Micrograph Imagery:</strong> Uploaded optical micrographs are transmitted to the backend inference
            process, cropped for particle bounding boxes, and returned to your active session. Files are not persisted into public repositories.
          </li>
          <li>
            <strong>Optical Metrology Records:</strong> Scale factors (µm/pixel), magnification settings, and validation
            bead readings are saved in the local server cache to preserve calibration validity across browser refreshes.
          </li>
          <li>
            <strong>Concentration Inputs:</strong> Filtration volume and dilution values are processed strictly in-memory
            for the active calculation.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-section-title">3. Data Not Collected</h2>
        <p className="text-body">
          The application collects no personally identifiable information (PII), email addresses, billing information,
          IP tracking records, or device fingerprinting identifiers.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-section-title">4. Third-Party Network Requests</h2>
        <p className="text-body">
          When connected to the internet, fonts (IBM Plex Sans and IBM Plex Mono) are loaded from Google Fonts via HTTPS.
          Under air-gapped or fully offline laboratory deployments, fallback system sans-serif and monospace typefaces are used automatically.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-section-title">5. Data Deletion and Retention</h2>
        <p className="text-body">
          Removing the application backend directory or resetting the active calibration clears all cached state and generated reports.
        </p>
      </section>
    </article>
  );
};

export default PrivacyPage;
