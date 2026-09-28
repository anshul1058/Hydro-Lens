import React, { useRef, useState, useMemo, useEffect } from 'react';
import { CloudArrowUp, FileImage, X, ArrowsClockwise, CheckCircle } from '@phosphor-icons/react';

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

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept=".jpg,.jpeg,.png,.tif,.tiff"
      onChange={handleFileChange}
      className="hidden"
      disabled={disabled}
      aria-label="Upload optical microscope sample image"
    />
  );

  const rowActions = (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={handleTriggerFileInput}
        disabled={disabled}
        className="p-1.5 rounded-sm text-ink-3 hover:text-ink hover:bg-sunken transition-colors cursor-pointer"
        title="Choose a different image"
        aria-label="Choose a different image"
      >
        <ArrowsClockwise size={16} />
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={disabled}
        className="p-1.5 rounded-sm text-ink-3 hover:text-err hover:bg-err-tint transition-colors cursor-pointer"
        title="Remove image"
        aria-label="Remove image"
      >
        <X size={16} />
      </button>
    </div>
  );

  // State: uploaded file selected
  if (selectedFile) {
    return (
      <div className="w-full bg-surface border border-ok-border rounded-md p-4 space-y-3">
        {fileInput}
        <div className="flex items-center justify-between border-b border-line pb-2 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[12px] font-semibold text-ok shrink-0">Active Sample</span>
            <span className="text-[11px] font-mono tabular-nums text-ink-3 shrink-0">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>
          {rowActions}
        </div>

        <div className="relative aspect-[16/10] w-full rounded-sm overflow-hidden bg-panel-dark border border-panel-dark-line flex items-center justify-center">
          {filePreviewUrl ? (
            <img
              src={filePreviewUrl}
              alt={selectedFile.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <FileImage size={36} className="text-ink-3" />
          )}
        </div>

        <div className="flex items-center justify-between gap-3 text-[11.5px]">
          <span className="font-mono truncate text-ink-2" title={selectedFile.name}>
            {selectedFile.name}
          </span>
          <span className="text-ok font-medium shrink-0 flex items-center gap-1 text-[11.5px]">
            <CheckCircle size={14} weight="fill" /> Ready for screening
          </span>
        </div>
      </div>
    );
  }

  // State: demo reference image selected
  if (selectedDemo) {
    return (
      <div className="w-full bg-surface border border-accent-border rounded-md p-4 space-y-3">
        {fileInput}
        <div className="flex items-center justify-between border-b border-line pb-2 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[12px] font-semibold text-ink truncate">{selectedDemo.title}</span>
            {selectedDemo.badge && (
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm bg-accent-tint text-accent border border-accent-border shrink-0">
                {selectedDemo.badge}
              </span>
            )}
          </div>
          {rowActions}
        </div>

        <div className="relative aspect-[16/10] w-full rounded-sm overflow-hidden bg-panel-dark border border-panel-dark-line flex items-center justify-center">
          <img
            src={selectedDemo.thumbnail}
            alt={selectedDemo.filename}
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex items-center justify-between gap-3 text-[11.5px]">
          <span className="font-mono truncate text-ink-2" title={selectedDemo.filename}>
            {selectedDemo.filename}
          </span>
          <span className="text-ok font-medium shrink-0 flex items-center gap-1 text-[11.5px]">
            <CheckCircle size={14} weight="fill" /> Reference loaded
          </span>
        </div>
      </div>
    );
  }

  // State: empty dropzone
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleTriggerFileInput}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleTriggerFileInput();
        }
      }}
      className={`w-full border border-dashed rounded-md p-7 text-center cursor-pointer transition-colors duration-150 flex flex-col items-center justify-center gap-1.5 focus-visible:outline-accent ${
        isDragOver
          ? 'border-accent bg-accent-tint'
          : 'border-line-strong bg-sunken/40 hover:bg-sunken'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {fileInput}

      <CloudArrowUp size={28} className="text-accent mb-1" />

      <p className="text-[13.5px] font-medium text-ink">
        Drag microscope micrograph here, or <span className="text-accent underline underline-offset-2 font-semibold">browse files</span>
      </p>
      <p className="text-[11px] font-mono text-ink-3 uppercase tracking-[0.06em]">
        JPG, PNG, TIFF · Max 50 MB
      </p>
      <p className="text-[11px] text-ink-3">Standard optical sensor field: 640 × 640 px</p>
    </div>
  );
};

export default Dropzone;
