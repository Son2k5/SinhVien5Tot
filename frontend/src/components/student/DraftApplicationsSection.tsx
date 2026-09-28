import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, FileText, ArrowRight, AlertTriangle } from 'lucide-react';
import type { StudentApplicationSummaryResponse } from '../../types/student';

interface DraftApplicationsSectionProps {
  draftApplications: StudentApplicationSummaryResponse[];
  isLoading?: boolean;
  onDeleteDraft?: (application: StudentApplicationSummaryResponse) => void;
  isDeleting?: boolean;
}

/**
 * Thumbnail minh họa theo đúng hình mẫu mockup:
 * Đĩa sứ xanh pastel cách điệu cùng kẹo tròn hồng phấn trên nền hồng pastel
 */
const MockupThumbnailGraphic: React.FC = () => (
  <div className="w-32 h-24 sm:w-40 sm:h-28 rounded-2xl bg-[#ffd7dd]/65 border border-pink-200/80 flex items-center justify-center shrink-0 relative overflow-hidden shadow-inner select-none">
    <svg
      viewBox="0 0 160 120"
      className="w-full h-full object-contain p-2 transition-transform hover:scale-105 duration-300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="80" cy="68" rx="46" ry="32" fill="#78bde4" fillOpacity="0.85" />
      <ellipse cx="78" cy="65" rx="42" ry="28" fill="#93ceee" />
      <ellipse cx="76" cy="62" rx="36" ry="23" fill="#b9e4fa" />
      <line x1="80" y1="64" x2="80" y2="88" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      <circle cx="80" cy="62" r="10" fill="url(#pinkBallGrad)" filter="drop-shadow(0 2px 4px rgba(244,114,182,0.4))" />
      <circle cx="77" cy="59" r="3" fill="#ffffff" fillOpacity="0.75" />
      <defs>
        <radialGradient id="pinkBallGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="45%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#db2777" />
        </radialGradient>
      </defs>
    </svg>
  </div>
);

export const DraftApplicationsSection: React.FC<DraftApplicationsSectionProps> = ({
  draftApplications,
  isLoading = false,
  onDeleteDraft,
  isDeleting = false,
}) => {
  const navigate = useNavigate();
  const [appToDelete, setAppToDelete] = useState<StudentApplicationSummaryResponse | null>(null);

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto mt-10 px-4 font-['Inter',_sans-serif]">
        <div className="h-8 w-64 bg-slate-200 rounded-lg mx-auto mb-6 animate-pulse" />
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-36 animate-pulse" />
      </div>
    );
  }

  const handleConfirmDelete = () => {
    if (appToDelete && onDeleteDraft) {
      onDeleteDraft(appToDelete);
      setAppToDelete(null);
    }
  };

  return (
    <section className="w-full max-w-5xl mx-auto mt-10 sm:mt-12 px-4 font-['Inter',_sans-serif]">
      {/* Tiêu đề in hoa căn giữa đúng chuẩn mockup: CÁC MINH CHỨNG ĐANG XÉT */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] tracking-tight uppercase">
          CÁC MINH CHỨNG ĐANG XÉT
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Lịch sử các hồ sơ đã lưu bản nháp nhưng chưa nộp chính thức. Bạn có thể truy cập nhanh để hoàn thiện hoặc xóa bản nháp.
        </p>
      </div>

      {draftApplications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <p className="text-sm font-medium text-slate-600">
            Hiện bạn chưa có bản nháp minh chứng nào đang lưu tạm.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Hãy chọn cấp độ xét duyệt và nhấn nút <strong>"Tạo hồ sơ mới"</strong> bên dưới để bắt đầu kê khai minh chứng.
          </p>
        </div>
      ) : (
        /* Danh sách Card bản nháp đúng chuẩn Mockup 1 */
        <div className="space-y-4">
          {draftApplications.map((app, index) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative"
            >
              {/* Cụm thông tin & Thumbnail bên trái */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 w-full md:w-auto flex-1 min-w-0">
                <MockupThumbnailGraphic />

                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                    Danh hiệu {index + 1}: {app.campaignName || 'Chiến dịch Sinh viên 5 Tốt'}
                  </h3>

                  <p className="text-xs sm:text-sm font-medium text-slate-600">
                    Sinh viên 5 Tốt cá nhân cấp trường.
                  </p>

                  <p className="text-xs text-slate-400 leading-relaxed pt-0.5">
                    Năm học: <span className="font-semibold text-slate-600">{app.schoolYear}</span> • Đã lưu: <span className="font-semibold text-blue-600">{app.totalEvidences} minh chứng</span>
                  </p>

                  {/* Cặp nút thao tác: '+ Truy cập' và 'Xóa' */}
                  <div className="flex items-center gap-2.5 pt-2.5">
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/applications/${app.id}`)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 rounded-lg bg-[#0052cc] hover:bg-[#0747a6] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Truy cập</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAppToDelete(app)}
                      disabled={isDeleting}
                      className="inline-flex items-center justify-center gap-1 px-4 sm:px-5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-[#0052cc] text-[#0052cc] hover:text-[#0747a6] text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Nhãn TRẠNG THÁI bên phải */}
              <div className="flex items-center gap-2 self-start md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto justify-between md:justify-end">
                <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-wider uppercase">
                  TRẠNG THÁI:
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-[#fff0db] border border-[#fed7aa] text-[#c05621] text-xs sm:text-sm font-bold shadow-2xs whitespace-nowrap">
                  Chưa hoàn thành
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nút tiện ích di chuyển sang trang hồ sơ chiến dịch (yêu cầu của người dùng) */}
      <div className="mt-6 sm:mt-8 flex justify-center">
        <Link
          to="/dashboard/applications"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all"
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Di chuyển sang trang Quản lý hồ sơ chiến dịch</span>
          <ArrowRight className="w-4 h-4 ml-0.5" />
        </Link>
      </div>

      {/* Modal xác nhận Xóa bản nháp */}
      {appToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Xác nhận xóa bản nháp</h4>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa bản nháp của chiến dịch{' '}
              <strong className="text-slate-900">{appToDelete.campaignName}</strong>? Bản nháp này sẽ được rút khỏi danh sách minh chứng đang xét.
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setAppToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Đang xóa...' : 'Đồng ý xóa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
