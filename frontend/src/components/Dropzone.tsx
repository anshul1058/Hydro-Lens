import React, { useRef, useState } from 'react';
import { UploadCloud, FileImage, X } from 'lucide-react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  disabled?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFileSelect,
  selectedFile,
  onClear,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  if (selectedFile) {
    return (
      <div className="w-full bg-[#eff3ff]/70 border border-[#4a90d9]/40 rounded-xl p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-[#4a90d9]/15 flex items-center justify-center text-[#4a90d9] shrink-0 border border-[#9ecae1]">
            <FileImage className="w-5 h-5" />
          </div>
          <div className="truncate">
            <p className="text-[13px] font-bold text-[#1E2A38] truncate">{selectedFile.name}</p>
            <p className="text-[11px] text-[#6b7a90] font-medium">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="p-1.5 rounded-full hover:bg-white text-[#6b7a90] hover:text-[#FF6B6B] transition-colors"
          title="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      className={`w-full border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
        isDragOver
          ? 'border-[#4a90d9] bg-[#4a90d9]/10'
          : 'border-[#9ecae1] hover:border-[#4a90d9] bg-[#eff3ff]/50 hover:bg-[#eff3ff]'
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
      <div className="w-12 h-12 rounded-2xl bg-white border border-[#9ecae1] shadow-xs flex items-center justify-center text-[#4a90d9] mb-3">
        <UploadCloud className="w-6 h-6" />
      </div>
      <p className="text-[14px] font-bold text-[#1E2A38] mb-1">
        Drag &amp; drop optical image or <span className="text-[#4a90d9]">browse</span>
      </p>
      <p className="text-[11px] font-semibold text-[#6b7a90] uppercase tracking-wider">
        JPG, PNG, TIFF · max 50 MB
      </p>
    </div>
  );
};
