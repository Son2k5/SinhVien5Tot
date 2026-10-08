import React, { useRef, useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';

interface EvidenceFileUploadZoneProps {
  onUpload: (file: File) => Promise<void> | void;
  isUploading?: boolean;
  disabled?: boolean;
}

export const EvidenceFileUploadZone: React.FC<EvidenceFileUploadZoneProps> = ({
  onUpload,
  isUploading = false,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void onUpload(file);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isUploading) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void onUpload(file);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />
      <div
        onClick={() => {
          if (!disabled && !isUploading) {
            fileInputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl py-8 sm:py-10 px-4 text-center transition-all select-none ${
          disabled
            ? 'border-slate-200 bg-slate-50/50 cursor-not-allowed opacity-70'
            : isDragging
            ? 'border-sky-500 bg-sky-50/60 ring-4 ring-sky-100 cursor-copy scale-[1.002]'
            : isUploading
            ? 'border-sky-300 bg-sky-50/30 cursor-wait'
            : 'border-sky-300 hover:border-sky-400 bg-white hover:bg-sky-50/15 cursor-pointer shadow-2xs'
        }`}
      >
        <div className="flex flex-col items-center justify-center">
          {isUploading ? (
            <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-2" />
          ) : (
            <UploadCloud className="w-10 h-10 text-slate-400 stroke-[1.5] mb-2" />
          )}

          <p className="text-sm font-bold text-slate-800">
            {isUploading ? 'Đang tải tệp lên...' : 'Drop files here'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supported format: PDF, PNG, JPG
          </p>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider my-1.5">
            OR
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled && !isUploading) {
                fileInputRef.current?.click();
              }
            }}
            disabled={disabled || isUploading}
            className="text-xs sm:text-sm font-semibold text-blue-600 underline hover:text-blue-700 cursor-pointer"
          >
            Browse files
          </button>
        </div>
      </div>
    </div>
  );
};
