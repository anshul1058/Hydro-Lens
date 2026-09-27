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
    <div className="w-full bg-[#1F3E48] rounded-[18px] border border-[#397C91]/30 p-5 shadow-lg overflow-hidden flex flex-col text-[#E8F8FC]">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#397C91]/40">
        <span className="text-[12px] font-mono uppercase tracking-[0.06em] text-[#A2D8E6]">
          JSON Report Export • {sampleId}
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-[#2B5462] hover:bg-[#346272] text-[#E8F8FC] text-[12px] font-medium transition-all flex items-center space-x-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#65C99A]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-1.5 rounded-lg bg-[#6BBFD8] hover:bg-[#5AAEC7] text-white text-[12px] font-semibold shadow-xs transition-all flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON</span>
          </button>
        </div>
      </div>

      <pre className="text-[12px] font-mono bg-[#162D35] p-4 rounded-xl overflow-x-auto max-h-[420px] text-[#65C99A] leading-relaxed">
        {jsonStr}
      </pre>
    </div>
  );
};
