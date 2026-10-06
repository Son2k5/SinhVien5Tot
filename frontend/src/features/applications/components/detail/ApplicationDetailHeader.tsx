import React from 'react';
import { X } from 'lucide-react';
import type { ApplicantSnapshot, ReviewApplicationItem } from '../../types/application.types';
import { DETAIL_STATUS_CONFIG } from './detail.types';

interface ApplicationDetailHeaderProps {
  application: ReviewApplicationItem | null;
  snapshot: ApplicantSnapshot;
  avatarUrl: string | null;
  onClose: () => void;
}

export const ApplicationDetailHeader: React.FC<ApplicationDetailHeaderProps> = ({
  application,
  snapshot,
  avatarUrl,
  onClose,
}) => {
  const currentStatusConf =
    DETAIL_STATUS_CONFIG[application?.status ?? 'Submitted'] || DETAIL_STATUS_CONFIG.Submitted;
  const StatusIcon = currentStatusConf.icon;

  return (
    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-white shrink-0">
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Student Circular Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-blue-500/20 shadow-md bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={snapshot.fullName || 'Sinh viên'}
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="font-bold text-lg">
              {(snapshot.fullName?.charAt(0) || 'S').toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap font-inter">
            <h3 className="text-sm font-semibold text-slate-900 font-inter truncate">
              {snapshot.fullName || 'Hồ sơ sinh viên'}
            </h3>
            {snapshot.studentCode && (
              <span className="text-sm font-semibold text-slate-600 font-inter">
                MSSV: {snapshot.studentCode}
              </span>
            )}
          </div>

          <div className="flex items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-1 flex-wrap font-inter">
            {application?.campaignName && (
              <span className="font-normal text-slate-500 truncate font-inter">
                Chiến dịch: <span className="text-slate-700 font-normal">{application.campaignName}</span>
              </span>
            )}
            {application?.submittedAt && (
              <>
                <span>•</span>
                <span className="text-slate-500 font-normal font-inter">
                  Nộp: {new Date(application.submittedAt).toLocaleDateString('vi-VN')}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Status and Close button */}
      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${currentStatusConf.bg} ${currentStatusConf.color} ${currentStatusConf.border} font-inter`}
        >
          <StatusIcon size={14} />
          <span>{currentStatusConf.label}</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};
