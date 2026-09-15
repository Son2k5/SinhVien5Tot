import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileEdit, ArrowRight, Clock, FileText } from 'lucide-react';
import type { StudentApplicationSummaryResponse } from '../../types/student';

interface DraftApplicationsSectionProps {
  draftApplications: StudentApplicationSummaryResponse[];
  isLoading?: boolean;
}

export const DraftApplicationsSection: React.FC<DraftApplicationsSectionProps> = ({
  draftApplications,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-8 px-4 animate-pulse">
        <div className="h-6 w-56 bg-slate-200 rounded-lg mb-4" />
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs h-32" />
      </div>
    );
  }

  if (draftApplications.length === 0) {
    return null;
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 px-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-xs">
            <FileEdit className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight uppercase">
              HỒ SƠ ĐANG THỰC HIỆN & BẢN NHÁP ({draftApplications.length})
            </h2>
            <p className="text-xs text-slate-500">
              Các hồ sơ bạn đang lưu tạm thời và chưa gửi cho Mentor. Hãy tiếp tục cập nhật và nộp chính thức.
            </p>
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-3.5">
        {draftApplications.map((app) => (
          <div
            key={app.id}
            className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-200/80 hover:border-amber-400/80 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden group"
          >
            {/* Top color indicator line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300" />

            {/* Left Content */}
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200/80 flex items-center justify-center text-amber-700 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6 stroke-[2.2]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 tracking-wider">
                    {app.applicationCode}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/60">
                    <Clock className="w-3 h-3 text-amber-700" />
                    Bản nháp / Chưa nộp
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  {app.campaignName || 'Chiến dịch Sinh viên 5 Tốt'}
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                  <span>Năm học: <strong className="text-slate-700">{app.schoolYear}</strong></span>
                  <span>•</span>
                  <span>Đã lưu minh chứng: <strong className="text-blue-700">{app.totalEvidences} tiêu chí</strong></span>
                  {app.updatedAt && (
                    <>
                      <span>•</span>
                      <span>Chỉnh sửa gần nhất: {formatDate(app.updatedAt)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Action Button */}
            <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
              <button
                type="button"
                onClick={() => navigate(`/dashboard/applications/${app.id}`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-[#0052cc] hover:bg-[#0747a6] text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all active:scale-95 cursor-pointer"
              >
                <span>Tiếp tục làm hồ sơ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
