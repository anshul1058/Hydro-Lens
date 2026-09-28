import React, { useState } from 'react';
import { DownloadSimple, Copy, Check } from '@phosphor-icons/react';

interface JsonViewerProps {
  data: Record<string, unknown>;
  sampleId: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data, sampleId }) => {
  const [copied, setCopied] = useState(false);
  const jsonStr = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sampleId}_hydro_lens_report.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="w-full bg-surface border border-line rounded-md overflow-hidden shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-sunken/60 border-b border-line">
        <div>
          <h3 className="text-[13px] font-semibold text-ink">Structured Screening Output</h3>
          <p className="text-[11.5px] font-mono text-ink-3">{sampleId}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="btn-secondary px-3 py-1.5 text-[12px] flex items-center gap-1.5 cursor-pointer"
            aria-label="Copy report JSON to clipboard"
          >
            {copied ? (
              <Check size={14} className="text-ok" weight="bold" />
            ) : (
              <Copy size={14} />
            )}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="btn-primary px-3 py-1.5 text-[12px] flex items-center gap-1.5 cursor-pointer"
            aria-label="Download report JSON file"
          >
            <DownloadSimple size={14} weight="bold" />
            <span>Export File</span>
          </button>
        </div>
      </div>

      <pre className="text-[11.5px] font-mono leading-relaxed text-ink bg-page p-4 overflow-x-auto max-h-[460px] m-0 border-t border-line selection:bg-accent-tint">
        {jsonStr}
      </pre>
    </section>
  );
};

export default JsonViewer;
