import React, { useState } from 'react';
import { Download, Check, Copy } from 'lucide-react';

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
    <div className="w-full bg-[#1E2A38] rounded-2xl border border-[#9ecae1]/40 p-5 shadow-lg overflow-hidden flex flex-col text-white">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <span className="text-[12px] font-mono font-semibold uppercase tracking-wider text-[#9ecae1]">
          JSON Report Export • {sampleId}
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[12px] font-semibold transition-all flex items-center space-x-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#2ECC91]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-1.5 rounded-lg bg-[#4a90d9] hover:bg-[#3a7bc0] active:scale-95 text-white text-[12px] font-semibold shadow-xs transition-all flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON</span>
          </button>
        </div>
      </div>

      <pre className="text-[12px] font-mono bg-black/30 p-4 rounded-xl overflow-x-auto max-h-[420px] text-[#2ECC91] leading-relaxed">
        {jsonStr}
      </pre>
    </div>
  );
};
