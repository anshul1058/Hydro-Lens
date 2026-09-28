import React, { useRef, useState, useMemo, useEffect } from 'react';
import { UploadCloud, FileImage, X, Scan, CheckCircle2, RefreshCw } from 'lucide-react';

export interface DemoSelectionInfo {
  id: string;
  title: string;
  filename: string;
  label: string;
  thumbnail: string;
  badge?: string;
  fileSizeText?: string;
}

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  selectedDemo?: DemoSelectionInfo | null;
  onClear: () => void;
  disabled?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFileSelect,
  selectedFile,
  selectedDemo = null,
  onClear,
  disabled = false
}) => {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate memory-safe object URL for uploaded personal files
  const filePreviewUrl = useMemo(() => {
    if (!selectedFile) return null;
    try {
      return URL.createObjectURL(selectedFile);
    } catch {
      return null;
    }
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleTriggerFileInput = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // 1. STATE: Personal Uploaded Image Selected
  if (selectedFile) {
    return (
      <div className="w-full bg-white/95 border-2 border-[#10B981]/50 rounded-[18px] p-3.5 sm:p-4 shadow-[0_6px_20px_rgba(16,185,129,0.08)] transition-all space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.tif,.tiff"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Selected Image Header Bar */}
        <div className="flex items-center justify-between border-b border-[#BBE4F2]/50 pb-2">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
            <span className="text-[12px] font-bold text-[#059669]">Uploaded Sample</span>
            <span className="text-[11px] text-[#4A7F96] font-mono shrink-0">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              type="button"
              onClick={handleTriggerFileInput}
              disabled={disabled}
              className="p-1.5 rounded-lg hover:bg-[#EAF7FC] text-[#56889E] hover:text-[#0891B2] transition-colors cursor-pointer"
              title="Change image file"
              aria-label="Change image file"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClear}
              className="p-1.5 rounded-lg hover:bg-rose-100 text-[#56889E] hover:text-[#DC2626] transition-colors cursor-pointer"
              title="Remove image"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Image Viewport: Prominently Visible in the Upload Section */}
        <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-[#07172B] border border-[#10B981]/40 flex items-center justify-center shadow-inner group">
          {filePreviewUrl ? (
            <img
              src={filePreviewUrl}
              alt={selectedFile.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <FileImage className="w-10 h-10 text-[#0284C7]" />
          )}

          {/* Optical reticle corner accents */}
          <span className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-400 pointer-events-none" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-400 pointer-events-none" />
          <span className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-400 pointer-events-none" />
          <span className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-400 pointer-events-none" />

          {/* Selected File Details Overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] bg-[#07172B]/85 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-emerald-500/30 text-white">
            <span className="font-mono font-bold truncate max-w-[200px]" title={selectedFile.name}>
              {selectedFile.name}
            </span>
            <span className="text-emerald-400 font-bold shrink-0 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Screening
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. STATE: Demo Reference Image Selected
  if (selectedDemo) {
    return (
      <div className="w-full bg-white/95 border-2 border-[#0891B2]/50 rounded-[18px] p-3.5 sm:p-4 shadow-[0_6px_20px_rgba(8,145,178,0.1)] transition-all space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.tif,.tiff"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Selected Image Header Bar */}
        <div className="flex items-center justify-between border-b border-[#BBE4F2]/50 pb-2">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2 h-2 rounded-full bg-[#0891B2] animate-pulse shrink-0" />
            <span className="text-[12px] font-bold text-[#0A2540]">{selectedDemo.title}</span>
            {selectedDemo.badge && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAF7FC] text-[#0891B2] border border-[#0891B2]/25 shrink-0">
                {selectedDemo.badge}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              type="button"
              onClick={handleTriggerFileInput}
              disabled={disabled}
              className="p-1.5 rounded-lg hover:bg-[#EAF7FC] text-[#56889E] hover:text-[#0891B2] transition-colors cursor-pointer"
              title="Upload personal file instead"
              aria-label="Upload personal file instead"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClear}
              className="p-1.5 rounded-lg hover:bg-rose-100 text-[#56889E] hover:text-[#DC2626] transition-colors cursor-pointer"
              title="Remove image"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Image Viewport: Prominently Visible in the Upload Section */}
        <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-[#07172B] border border-[#0891B2]/40 flex items-center justify-center shadow-inner group">
          <img
            src={selectedDemo.thumbnail}
            alt={selectedDemo.filename}
            className="w-full h-full object-contain"
          />

          {/* Optical reticle corner accents */}
          <span className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t-2 border-l-2 border-[#06B6D4] pointer-events-none" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t-2 border-r-2 border-[#06B6D4] pointer-events-none" />
          <span className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b-2 border-l-2 border-[#06B6D4] pointer-events-none" />
          <span className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b-2 border-r-2 border-[#06B6D4] pointer-events-none" />

          {/* Selected File Details Overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] bg-[#07172B]/85 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-cyan-400/30 text-white">
            <span className="font-mono font-bold truncate max-w-[200px]" title={selectedDemo.filename}>
              {selectedDemo.filename}
            </span>
            <span className="text-emerald-400 font-bold shrink-0 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Screening
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 3. STATE: Empty Dropzone (Initial State)
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleTriggerFileInput}
      className={`group relative w-full border-2 border-dashed rounded-[18px] p-7 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center overflow-hidden ${
        isDragOver
          ? 'border-[#0891B2] bg-[#EAF7FC] shadow-[0_0_24px_rgba(8,145,178,0.18)] scale-[1.01]'
          : 'border-[#BBE4F2] hover:border-[#0891B2] bg-white/70 hover:bg-white/95 shadow-xs hover:shadow-[0_8px_24px_rgba(8,145,178,0.08)]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.tif,.tiff"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Optical Reticle Frame Corners */}
      <span className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-[#06B6D4]/60 group-hover:border-[#0891B2] transition-colors" />
      <span className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-[#06B6D4]/60 group-hover:border-[#0891B2] transition-colors" />
      <span className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-[#06B6D4]/60 group-hover:border-[#0891B2] transition-colors" />
      <span className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-[#06B6D4]/60 group-hover:border-[#0891B2] transition-colors" />

      {/* Scanning beam animation when active or hovered */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="animate-scan-beam" />
      </div>

      {/* Center Icon */}
      <div className="relative w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0284C7]/15 via-[#0891B2]/20 to-[#0D9488]/15 border border-[#0891B2]/30 flex items-center justify-center text-[#0891B2] mb-3 group-hover:scale-110 group-hover:bg-[#0891B2] group-hover:text-white transition-all duration-300 shadow-xs">
        <UploadCloud className="w-6 h-6" />
        <Scan className="w-3.5 h-3.5 absolute -top-1 -right-1 text-[#06B6D4] group-hover:text-white transition-colors" />
      </div>

      <p className="text-[14px] font-bold text-[#0A2540] mb-1 group-hover:text-[#0284C7] transition-colors">
        Drag &amp; drop optical image or <span className="text-[#0891B2] underline decoration-cyan-400/50 underline-offset-2">browse</span>
      </p>

      <p className="text-[11.5px] text-[#4A7F96] font-semibold uppercase tracking-[0.06em]">
        JPG, PNG, TIFF · max 50 MB
      </p>

      {/* Optical Imaging Specifications Pill */}
      <div className="mt-3 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#EAF7FC] border border-[#BBE4F2] text-[11px] text-[#2C637A] font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
        <span>Microscope FOV · 640×640 standard</span>
      </div>
    </div>
  );
};

export default Dropzone;
