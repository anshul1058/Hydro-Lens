import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <article className="max-w-3xl bg-surface border border-line rounded-md p-6 sm:p-8 space-y-6 shadow-2xs">
      <header className="border-b border-line pb-4">
        <p className="text-caption">Operational and Legal Guidelines</p>
        <h1 className="text-page-title mt-1">Terms of Service</h1>
        <p className="text-[12px] font-mono text-ink-3 mt-1.5">Effective Date: 28 September 2026</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-section-title">1. Operational Scope and Screening Intent</h2>
        <p className="text-body">
          Hydro Lens is an optical computer vision screening application designed for preliminary microplastic detection
          in aqueous samples. It detects particle morphologies and calculates geometric dimensions (Feret diameters and
          equivalent circular diameter). It is provided for educational, scientific research, and environmental field screening.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-section-title">2. Not a Confirmatory Chemical Assay</h2>
        <p className="text-body">
          Optical screening provides morphological categorization only. Hydro Lens does not measure infrared vibrational
          modes or Raman scattering. Chemical confirmation of polymer composition (such as polyethylene, polypropylene, or polystyrene)
          strictly requires secondary analytical spectroscopy (FTIR / Raman). Hydro Lens outputs must not serve as the sole evidentiary
          basis for regulatory compliance filings or public health declarations.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-section-title">3. User Responsibility for Metrology and Data</h2>
        <p className="text-body">
          Users are responsible for optical calibration accuracy, regular stage micrometer verification, and sample custody.
          Uploaded micrographs and volumetric figures remain under the control of the operating organization.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-section-title">4. Warranty and Limitation of Liability</h2>
        <p className="text-body">
          The software is provided on an "as is" and "as available" basis, without warranty of any kind, express or implied.
          The authors and HackMatrix 5.0 Team Nishtha assume no liability for experimental errors, optical misidentifications,
          or downstream decisions resulting from automated screening outputs.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-section-title">5. Contact and Attribution</h2>
        <p className="text-body">
          Inquiries regarding these operational terms may be directed to the repository maintainers of Team Nishtha.
        </p>
      </section>
    </article>
  );
};

export default TermsPage;
