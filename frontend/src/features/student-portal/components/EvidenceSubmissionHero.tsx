import React from 'react';
import { HelpCircle, Clock } from 'lucide-react';
import type { StudentApplicationDetailResponse, StudentCampaignDetailResponse } from '../types/student-portal.types';

interface EvidenceSubmissionHeroProps {
  application: StudentApplicationDetailResponse;
  campaign?: StudentCampaignDetailResponse | null;
  completedCount: number;
  totalCriteria: number;
  progressPercent: number;
  onOpenGuide: () => void;
}

export const EvidenceSubmissionHero: React.FC<EvidenceSubmissionHeroProps> = ({
  application,
  campaign: _campaign,
  completedCount,
  totalCriteria,
  progressPercent,
  onOpenGuide,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 mt-6">
      <div className="relative rounded-3xl bg-gradient-to-r from-[#1e40af] via-[#3b82f6] to-[#0ea5e9] text-white p-6 sm:p-8 shadow-xl shadow-blue-500/15 border border-white/20 overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wider uppercase border border-white/20">
                {application.applicationCode}
              </span>
              <span className="text-xs text-blue-100 font-medium">
                Năm học: <strong>{application.schoolYear}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {application.campaignName || 'Hồ sơ minh chứng Sinh viên 5 Tốt'}
            </h1>

            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed max-w-xl">
              Kê khai đầy đủ 5 tiêu chuẩn chuẩn hóa. Minh chứng tải lên có thể được Mentor phản hồi
              và thẩm định trực tiếp trước khi nộp toàn bộ hồ sơ.
            </p>

            {application.submitDeadline && (
              <div className="flex items-center gap-1.5 text-xs text-blue-100/90 pt-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  Hạn chót nộp hồ sơ:{' '}
                  <strong className="text-white">
                    {new Date(application.submitDeadline).toLocaleDateString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Right box: Progress circle / Bar & Guide button */}
          <div className="flex flex-col items-start md:items-end justify-between shrink-0 gap-3">
            <button
              type="button"
              onClick={onOpenGuide}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-xs font-bold border border-white/25 transition active:scale-95 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-300" />
              <span>Xem hướng dẫn tiêu chuẩn</span>
            </button>

            <div className="w-full md:w-56 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-left">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-blue-100">Tiến độ kê khai:</span>
                <span className="font-bold text-amber-300">
                  {completedCount}/{totalCriteria} ({progressPercent}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-black/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 to-emerald-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
