import React from 'react';
import { Plus, UserCheck, Send, CheckCircle2, FilePlus2 } from 'lucide-react';

interface ApplicationProcessStepperProps {
  onCreateApplication: () => void;
  canCreate: boolean;
  isCreating?: boolean;
  hasExistingDraft?: boolean;
}

export const ApplicationProcessStepper: React.FC<ApplicationProcessStepperProps> = ({
  onCreateApplication,
  canCreate,
  isCreating = false,
  hasExistingDraft = false,
}) => {
  const steps = [
    {
      id: 1,
      title: '1. Chọn Tiêu Chí',
      desc: 'Xem 5 tiêu chuẩn & các tiêu chí bắt buộc',
      icon: Plus,
      color: 'bg-blue-500 text-white border-blue-200',
    },
    {
      id: 2,
      title: '2. Thêm Minh Chứng',
      desc: 'Nhập thông tin & upload tệp chứng nhận',
      icon: UserCheck,
      color: 'bg-sky-500 text-white border-sky-200',
    },
    {
      id: 3,
      title: '3. Xác nhận',
      desc: 'Kiểm tra hồ sơ & gửi cho Mentor chấm',
      icon: Send,
      color: 'bg-indigo-500 text-white border-indigo-200',
    },
    {
      id: 4,
      title: '4. Hoàn Tất',
      desc: 'Theo dõi phản hồi & nhận kết quả xét duyệt',
      icon: CheckCircle2,
      color: 'bg-emerald-500 text-white border-emerald-200',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto my-12 px-4 font-['Inter',_sans-serif]">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1e293b] uppercase">
          CÁC BƯỚC XÉT MINH CHỨNG
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
          Quy trình nộp và thẩm định minh chứng danh hiệu Sinh viên 5 Tốt chuẩn hóa
        </p>
      </div>

      {/* Stepper Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs border border-slate-200/90 relative">
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-7 left-12 right-12 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-500 -z-0" />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className="flex flex-col items-center text-center z-10 w-full md:w-44"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md border-4 border-white ${step.color} transition-transform duration-200 hover:scale-110`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="mt-3 font-bold text-slate-800 text-sm tracking-tight">{step.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">{step.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Nút bấm duy nhất: "Tạo hồ sơ mới" mở popup Chế Độ Minh Chứng (thay vì để 2 nút sẵn) */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-2.5">
          <button
            type="button"
            onClick={onCreateApplication}
            disabled={!canCreate || isCreating}
            className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer ${
              canCreate && !isCreating
                ? 'bg-[#0052cc] hover:bg-[#0747a6] text-white shadow-blue-500/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <FilePlus2 className="w-4 h-4 stroke-[2.2]" />
            <span>{isCreating ? 'Đang khởi tạo hồ sơ...' : 'Tạo hồ sơ mới'}</span>
          </button>
          <p className="text-xs text-slate-500">
            {canCreate
              ? hasExistingDraft
                ? 'Nhấn nút để mở popup chọn chế độ Cá nhân / Tập thể, hoặc tiếp tục các bản nháp bên trên.'
                : 'Nhấn nút để mở popup chọn chế độ Cá nhân hoặc Tập thể theo nhu cầu.'
              : 'Hiện chưa có đợt xét mở đăng ký cho cấp độ được chọn.'}
          </p>
        </div>
      </div>
    </div>
  );
};
