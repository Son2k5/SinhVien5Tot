import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, Clock, AlertCircle } from 'lucide-react';
import { SubmissionStatus, normalizeSubmissionStatus } from '../types/student-portal.types';

interface EvidenceSubNavbarProps {
  status: SubmissionStatus | number | string;
}

export const EvidenceSubNavbar: React.FC<EvidenceSubNavbarProps> = ({ status }) => {
  const navigate = useNavigate();
  const normStatus = normalizeSubmissionStatus(status);

  const isApproved = normStatus === SubmissionStatus.Approved;
  const isNeedsRevision = normStatus === SubmissionStatus.NeedsRevision;
  const isSubmitted =
    normStatus === SubmissionStatus.Submitted || normStatus === SubmissionStatus.Resubmitted;
  const isUnderReview = normStatus === SubmissionStatus.UnderReview;
  const isRejected = normStatus === SubmissionStatus.Rejected;

  return (
    <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-xs">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/dashboard/campaigns')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trang chiến dịch</span>
          </button>
          <span className="text-slate-300">/</span>
          <button
            onClick={() => navigate('/dashboard/applications')}
            className="text-xs font-semibold text-slate-500 hover:text-blue-700 transition cursor-pointer"
          >
            <span>Quản lý hồ sơ</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isApproved ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800">
              <CheckCircle className="w-3.5 h-3.5" /> Đạt danh hiệu SV5T
            </span>
          ) : isNeedsRevision ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-orange-100 text-orange-800 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" /> Cần bổ sung minh chứng
            </span>
          ) : isSubmitted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-100 text-blue-800">
              <Clock className="w-3.5 h-3.5" /> Đã nộp - Chờ xét duyệt
            </span>
          ) : isUnderReview ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-purple-100 text-purple-800">
              <Clock className="w-3.5 h-3.5" /> Đang chấm điểm
            </span>
          ) : isRejected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-100 text-rose-800">
              <AlertCircle className="w-3.5 h-3.5" /> Không đạt
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">
              Bản nháp
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
