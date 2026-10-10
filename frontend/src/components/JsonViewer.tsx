import React, { useState } from 'react';
import { Download, Check, Copy, Terminal } from 'lucide-react';

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
<<<<<<< HEAD
    <div className="w-full bg-[#0A1E2C] rounded-[20px] border border-[#0891B2]/40 p-5 shadow-xl overflow-hidden flex flex-col text-[#E0F2FE]">
      <div className="flex flex-wrap items-center justify-between pb-3.5 mb-3.5 border-b border-[#0891B2]/30 gap-2">
=======
    <div className="w-full bg-[#1E2A38] rounded-2xl border border-[#9ecae1]/40 p-5 shadow-lg overflow-hidden flex flex-col text-white">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <span className="text-[12px] font-mono font-semibold uppercase tracking-wider text-[#9ecae1]">
          JSON Report Export • {sampleId}
        </span>
>>>>>>> origin/main
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-[#06B6D4]" />
          <span className="text-[12px] font-mono uppercase tracking-[0.08em] text-[#38BDF8] font-bold">
            JSON Report Telemetry Export • {sampleId}
          </span>
        </div>
        
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleCopy}
<<<<<<< HEAD
            className="px-3.5 py-1.5 rounded-lg bg-[#16364D] hover:bg-[#1E4562] text-[#E0F2FE] text-[12px] font-semibold transition-all flex items-center space-x-1.5 border border-[#38BDF8]/20 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
=======
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[12px] font-semibold transition-all flex items-center space-x-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#2ECC91]" /> : <Copy className="w-3.5 h-3.5" />}
>>>>>>> origin/main
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
<<<<<<< HEAD
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] text-white text-[12px] font-bold shadow-sm shadow-cyan-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
=======
            className="px-4 py-1.5 rounded-lg bg-[#4a90d9] hover:bg-[#3a7bc0] active:scale-95 text-white text-[12px] font-semibold shadow-xs transition-all flex items-center space-x-1.5"
>>>>>>> origin/main
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON</span>
          </button>
        </div>
      </div>

<<<<<<< HEAD
      <pre className="text-[12px] font-mono bg-[#061520] p-4 rounded-xl overflow-x-auto max-h-[440px] text-[#34D399] leading-relaxed border border-[#0891B2]/20">
=======
      <pre className="text-[12px] font-mono bg-black/30 p-4 rounded-xl overflow-x-auto max-h-[420px] text-[#2ECC91] leading-relaxed">
>>>>>>> origin/main
        {jsonStr}
      </pre>
    </div>
  );
};
