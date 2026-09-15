import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, RotateCcw, Clock, CheckCircle, AlertCircle, FileEdit, Send, ArrowRight } from 'lucide-react';
import {
  SubmissionStatus,
  type StudentApplicationSummaryResponse,
} from '../../types/student';

interface MyApplicationCardsProps {
  applications: StudentApplicationSummaryResponse[];
  onWithdraw: (application: StudentApplicationSummaryResponse) => void;
  isLoading?: boolean;
}

export const MyApplicationCards: React.FC<MyApplicationCardsProps> = ({
  applications,
  onWithdraw,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.Draft:
        return {
          label: 'Chưa hoàn thành',
          bg: 'bg-amber-100/90 text-amber-800 border-amber-200',
          icon: FileEdit,
        };
      case SubmissionStatus.Submitted:
        return {
          label: 'Đã nộp hồ sơ',
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Send,
        };
      case SubmissionStatus.UnderReview:
        return {
          label: 'Đang xét duyệt',
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: Clock,
        };
      case SubmissionStatus.NeedsRevision:
        return {
          label: 'Cần bổ sung',
          bg: 'bg-orange-100 text-orange-800 border-orange-200 animate-pulse',
          icon: AlertCircle,
        };
      case SubmissionStatus.Resubmitted:
        return {
          label: 'Đã nộp lại',
          bg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
          icon: Send,
        };
      case SubmissionStatus.Approved:
        return {
          label: 'Đạt danh hiệu',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: CheckCircle,
        };
      case SubmissionStatus.Rejected:
        return {
          label: 'Không đạt',
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: AlertCircle,
        };
      case SubmissionStatus.Withdrawn:
        return {
          label: 'Đã rút hồ sơ',
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: RotateCcw,
        };
      default:
        return {
          label: 'Chờ xét',
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Clock,
        };
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">
          DANH SÁCH HỒ SƠ ĐÃ NỘP
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý hồ sơ đã nộp, theo dõi tiến độ xét duyệt và phản hồi (feedback) từ Mentor
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse h-36 flex items-center gap-6">
              <div className="w-28 h-24 bg-slate-200 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="w-1/3 h-5 bg-slate-200 rounded" />
                <div className="w-2/3 h-4 bg-slate-200 rounded" />
                <div className="w-1/4 h-8 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="font-semibold text-slate-700 text-base">Bạn chưa có hồ sơ nào đã nộp</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            Chưa tìm thấy hồ sơ dự xét Sinh viên 5 Tốt. Hãy chuyển sang mục Chiến dịch để chọn cấp xét và nộp hồ sơ mới.
          </p>
          <div className="mt-5">
            <button
              onClick={() => navigate('/dashboard/campaigns')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0052cc] hover:bg-[#0747a6] text-white shadow-sm transition-all cursor-pointer"
            >
              <span>Đến trang Chiến dịch & Nộp hồ sơ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app, index) => {
            const badge = getStatusBadge(app.status);
            const StatusIcon = badge.icon;
            const canWithdraw = app.status === SubmissionStatus.Submitted || app.status === SubmissionStatus.UnderReview;
            const hasFeedback = app.status === SubmissionStatus.NeedsRevision;

            return (
              <div
                key={app.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100/90 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  {/* Left Thumbnail Graphic (Theo đúng thiết kế mockup) */}
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-24 h-20 sm:w-28 sm:h-24 rounded-2xl bg-gradient-to-br from-pink-100 via-rose-50 to-pink-200/70 border border-pink-200/60 flex items-center justify-center shrink-0 shadow-inner relative overflow-hidden group">
                      <div className="w-10 h-10 rounded-full bg-sky-200 border-2 border-sky-300 flex items-center justify-center shadow-md transform group-hover:scale-105 transition-transform">
                        <div className="w-3 h-3 rounded-full bg-rose-400 shadow-sm" />
                      </div>
                    </div>

                    {/* Title & Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {app.applicationCode}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-800 mt-1 truncate">
                        {app.campaignName || `Danh hiệu ${index + 1}`}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Năm học: {app.schoolYear} • Tổng: {app.totalEvidences} minh chứng • Đã duyệt:{' '}
                        <strong className="text-emerald-700">{app.approvedEvidences}</strong> • Đang xét:{' '}
                        <strong className="text-amber-700">{app.pendingEvidences}</strong>
                      </p>

                      {/* Tiến độ minh chứng: Đã duyệt / Đang xét / Tổng */}
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-slate-500">
                            Tiến độ duyệt: {app.approvedEvidences}/{app.totalEvidences} đạt
                          </span>
                          <span className="text-amber-700">
                            {app.pendingEvidences} minh chứng đang xét
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all"
                            style={{
                              width: `${app.totalEvidences > 0 ? Math.round((app.approvedEvidences / app.totalEvidences) * 100) : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Action buttons (Theo đúng mockup: + Truy cập, Xóa/Rút) */}
                      <div className="flex items-center gap-2 mt-3.5">
                        <button
                          onClick={() => navigate(`/dashboard/applications/${app.id}`)}
                          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-[#0052cc] hover:bg-[#0747a6] text-white shadow-sm transition-colors cursor-pointer"
                        >
                          <span>+ Truy cập</span>
                        </button>

                        {canWithdraw && (
                          <button
                            onClick={() => onWithdraw(app)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Rút hồ sơ</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Status Badge (Theo đúng mockup: TRẠNG THÁI: [Badge]) */}
                  <div className="flex items-center gap-2 self-start md:self-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      TRẠNG THÁI:
                    </span>
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${badge.bg}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </div>
                  </div>
                </div>

                {/* Mentor Feedback alert row on card */}
                {hasFeedback && (
                  <div className="pt-3 border-t border-amber-100 flex items-center justify-between gap-3 text-xs bg-amber-50/80 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-3 sm:px-6 rounded-b-3xl text-amber-900">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      <span className="font-medium">
                        Mentor đã nhận xét & yêu cầu bổ sung minh chứng. Bấm <strong>"+ Truy cập"</strong> để xem chi tiết feedback.
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/dashboard/applications/${app.id}`)}
                      className="text-xs font-bold text-amber-800 hover:text-amber-950 underline shrink-0 cursor-pointer"
                    >
                      Xem feedback &rarr;
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
