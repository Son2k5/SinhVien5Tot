import React from 'react';
import { GraduationCap } from 'lucide-react';
import type { ApplicantSnapshot } from '../../types/application.types';

interface ApplicationDetailStudentTabProps {
  snapshot: ApplicantSnapshot;
  avatarUrl: string | null;
}

export const ApplicationDetailStudentTab: React.FC<ApplicationDetailStudentTabProps> = ({
  snapshot,
  avatarUrl,
}) => {
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar bg-slate-50/20">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-xs">
          {/* Top profile avatar header */}
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-blue-50 shadow-md shrink-0 bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
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
                (snapshot.fullName?.charAt(0) || 'S').toUpperCase()
              )}
            </div>
            <div>
              <h4 className="text-[15px] font-semibold text-slate-900 font-inter">
                {snapshot.fullName || '—'}
              </h4>
              <p className="text-[13px] font-normal text-slate-600 mt-0.5 font-inter">
                MSSV: {snapshot.studentCode || '—'}
              </p>
              {snapshot.administrativeClass && (
                <p className="text-[13px] font-normal text-slate-600 font-inter">
                  Lớp: {snapshot.administrativeClass}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pb-2 text-[13px] font-semibold text-slate-800 font-inter">
            <GraduationCap size={16} className="text-blue-600" />
            <span>Thông tin học vụ chi tiết</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px] font-inter">
            <div>
              <span className="text-slate-500 block font-normal font-inter">Họ và tên sinh viên:</span>
              <span className="text-slate-800 font-normal mt-0.5 block font-inter">
                {snapshot.fullName || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-normal font-inter">Mã số sinh viên (MSSV):</span>
              <span className="text-slate-800 font-normal mt-0.5 block font-inter">
                {snapshot.studentCode || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-normal font-inter">Trường:</span>
              <span className="text-slate-800 font-normal mt-0.5 block font-inter">
                {snapshot.school || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-normal font-inter">Khoa / Viện:</span>
              <span className="text-slate-800 font-normal mt-0.5 block font-inter">
                {snapshot.faculty || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-normal font-inter">Chuyên ngành:</span>
              <span className="text-slate-800 font-normal mt-0.5 block font-inter">
                {snapshot.major || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-normal font-inter">Lớp hành chính:</span>
              <span className="text-slate-800 font-normal mt-0.5 block font-inter">
                {snapshot.administrativeClass || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-normal font-inter">Khóa tuyển sinh:</span>
              <span className="text-slate-800 font-normal mt-0.5 block font-inter">
                {snapshot.academicYear ? `K${snapshot.academicYear}` : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-normal font-inter">Email sinh viên:</span>
              <span className="text-slate-800 font-normal mt-0.5 block font-inter">
                {snapshot.email || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
