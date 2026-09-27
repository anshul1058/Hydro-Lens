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
  disabled = false
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
      <div className="w-full bg-[#E8F8FC] border border-[#6BBFD8]/40 rounded-[14px] p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-[#6BBFD8]/20 flex items-center justify-center text-[#3FA7C4] shrink-0">
            <FileImage className="w-5 h-5" />
          </div>
          <div className="truncate">
            <p className="text-[13px] font-semibold text-[#397C91] truncate">{selectedFile.name}</p>
            <p className="text-[11px] text-[#5294A8]">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="p-1.5 rounded-full hover:bg-[#B9DFEA]/60 text-[#5294A8] transition-all"
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
      className={`w-full border-2 border-dashed rounded-[14px] p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
        isDragOver
          ? 'border-[#6BBFD8] bg-[#6BBFD8]/15'
          : 'border-[#B9DFEA] hover:border-[#6BBFD8] bg-[#E8F8FC]/60 hover:bg-[#E8F8FC]'
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
      <div className="w-12 h-12 rounded-full bg-[#6BBFD8]/20 flex items-center justify-center text-[#3FA7C4] mb-3">
        <UploadCloud className="w-6 h-6" />
      </div>
      <p className="text-[14px] font-semibold text-[#397C91] mb-1">
        Drag &amp; drop optical image or <span className="text-[#3FA7C4]">browse</span>
      </p>
      <p className="text-[12px] text-[#5294A8] uppercase tracking-[0.06em]">
        JPG, PNG, TIFF · max 50 MB
      </p>
    </div>
  );
};
