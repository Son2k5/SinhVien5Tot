import React from 'react';
import { FileText, Image as ImageIcon, ExternalLink, X } from 'lucide-react';
import type { EvidenceAttachment } from '../types/student-portal.types';

interface EvidenceAttachmentListProps {
  attachments: EvidenceAttachment[];
  onDelete?: (index: number) => void;
  canDelete?: boolean;
}

export const EvidenceAttachmentList: React.FC<EvidenceAttachmentListProps> = ({
  attachments,
  onDelete,
  canDelete = false,
}) => {
  if (attachments.length === 0) return null;

  const isPdf = (fileName?: string, url?: string) =>
    fileName?.toLowerCase().endsWith('.pdf') || url?.toLowerCase().includes('.pdf');

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null || bytes === 0) return '0';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2 mt-4">
      <h6 className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">
        TỆP MINH CHỨNG ĐÃ TẢI ({attachments.length}):
      </h6>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {attachments.map((att, idx) => {
          const url = att.secure_url || att.url || att.fileUrl;
          const name = att.fileName || att.name || `Tệp minh chứng ${idx + 1}`;
          const isPdfFile = isPdf(name, url);
          const sizeLabel = formatFileSize(att.bytes);

          return (
            <div
              key={idx}
              className="p-2.5 sm:p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 hover:border-slate-300 flex items-center justify-between gap-3 shadow-2xs transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                  {isPdfFile ? (
                    <FileText className="w-4 h-4 text-rose-500" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate" title={name}>
                    {name}
                  </p>
                  <p className="text-[11px] text-slate-500 font-normal">
                    {sizeLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                    title="Mở tệp xem"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {canDelete && onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(idx)}
                    className="p-1.5 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Xóa tệp minh chứng"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
