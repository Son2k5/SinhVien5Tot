import React from 'react';
import { FileText, Image as ImageIcon, ExternalLink, Trash2 } from 'lucide-react';
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

  const isPdf = (fileName?: string) => fileName?.toLowerCase().endsWith('.pdf');

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2 mt-3">
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        Tệp đính kèm đã tải lên ({attachments.length}):
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {attachments.map((att, idx) => {
          const url = att.secure_url || att.url || att.fileUrl;
          const name = att.fileName || att.name || `Tệp minh chứng ${idx + 1}`;
          const isPdfFile = isPdf(name);

          return (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-white hover:border-blue-200 transition-all text-xs"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isPdfFile ? (
                  <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 truncate" title={name}>
                    {name}
                  </p>
                  {att.bytes ? (
                    <span className="text-[10px] text-slate-400">{formatFileSize(att.bytes)}</span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                    title="Xem tệp"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {canDelete && onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(idx)}
                    className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                    title="Xóa tệp"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
