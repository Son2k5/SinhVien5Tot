import React, { useRef } from 'react';
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void onUpload(file);
      e.target.value = '';
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
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
        className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition-all ${
          disabled
            ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
            : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 cursor-pointer'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-1.5">
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          ) : (
            <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" />
          )}
          <div className="text-xs font-semibold text-slate-700">
            {isUploading ? 'Đang tải tệp lên máy chủ...' : 'Nhấn để tải lên tệp minh chứng từ máy tính'}
          </div>
          <div className="text-[11px] text-slate-400">
            Hỗ trợ hình ảnh (PNG, JPG, JPEG) hoặc PDF • Tối đa 10 MB/tệp
          </div>
        </div>
      </div>
    </div>
  );
};
