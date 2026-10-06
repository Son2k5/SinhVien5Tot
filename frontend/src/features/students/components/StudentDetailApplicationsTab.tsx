import { FileText, Award } from 'lucide-react';
import type { AdminStudentApplicationSummary } from '../types/student.types';
import { SubmissionStatusBadge } from './StudentBadges';

interface StudentDetailApplicationsTabProps {
  applications: AdminStudentApplicationSummary[];
  onSelectApplication: (id: string) => void;
}

export function StudentDetailApplicationsTab({
  applications,
  onSelectApplication,
}: StudentDetailApplicationsTabProps) {
  if (applications.length === 0) {
    return (
      <div className="bg-white border border-slate-200/70 rounded-2xl p-10 text-center shadow-[0_10px_30px_-18px_rgba(15,42,82,0.25)]">
        <FileText size={28} className="mx-auto text-sky-200" />
        <p className="mt-2 text-sm text-slate-500">Chưa có đơn đăng ký SV5T.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((a) => (
        <article
          key={a.id}
          className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-[0_10px_30px_-20px_rgba(15,42,82,0.3)] flex flex-col sm:flex-row sm:items-center gap-3 hover:border-sky-200 hover:shadow-[0_14px_34px_-18px_rgba(11,99,214,0.35)] transition-[border-color,box-shadow]"
        >
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 text-[#0b63d6] border border-sky-100 flex items-center justify-center shrink-0">
            <Award size={18} />
          </span>
          <div className="flex-1 min-w-0 font-inter">
            <div className="text-[13px] font-normal text-slate-800 truncate tracking-tight">
              {a.campaignName}
            </div>
            <div className="mt-0.5 text-[12px] text-slate-500 font-normal truncate">
              Năm học {a.schoolYear} • {a.evidenceCount} minh chứng
            </div>
          </div>
          <SubmissionStatusBadge status={a.status} />
          <button
            type="button"
            onClick={() => onSelectApplication(a.id)}
            className="h-8 px-3 inline-flex items-center rounded-xl text-[12px] font-semibold text-[#0b63d6] bg-sky-50 border border-sky-100 hover:bg-[#0b63d6] hover:text-white cursor-pointer transition-colors shrink-0"
          >
            Xem hồ sơ & duyệt
          </button>
        </article>
      ))}
    </div>
  );
}
