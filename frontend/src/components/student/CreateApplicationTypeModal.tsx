import React from 'react';
import { User, Users, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AwardType } from '../../types/student';

interface CreateApplicationTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: AwardType) => void;
  isCreating?: boolean;
  individualDisabled?: boolean;
  collectiveDisabled?: boolean;
  individualHint?: string;
  collectiveHint?: string;
}

export const CreateApplicationTypeModal: React.FC<CreateApplicationTypeModalProps> = ({
  open,
  onClose,
  onSelect,
  isCreating = false,
  individualDisabled = false,
  collectiveDisabled = false,
  individualHint,
  collectiveHint,
}) => {
  if (!open) return null;

  const cards = [
    {
      id: AwardType.Individual,
      title: 'Hồ sơ Cá nhân',
      desc: 'Dành cho sinh viên đăng ký xét danh hiệu cá nhân Sinh viên 5 Tốt.',
      icon: User,
      disabled: individualDisabled,
      hint: individualHint,
      accent: 'from-blue-500 to-sky-500',
    },
    {
      id: AwardType.Collective,
      title: 'Hồ sơ Tập thể',
      desc: 'Dành cho chi hội / tập thể lớp đăng ký xét danh hiệu tập thể.',
      icon: Users,
      disabled: collectiveDisabled,
      hint: collectiveHint,
      accent: 'from-violet-500 to-purple-500',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">
              Tạo hồ sơ mới
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Chọn loại hồ sơ bạn muốn lập cho chiến dịch đang mở. Hệ thống sẽ tạo bản nháp để bạn hoàn thiện dần.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 grid sm:grid-cols-2 gap-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                disabled={c.disabled || isCreating}
                onClick={() => onSelect(c.id)}
                className={`text-left rounded-2xl border-2 p-5 transition-all group relative overflow-hidden ${
                  c.disabled
                    ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer active:scale-[0.98]'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.accent} text-white flex items-center justify-center shadow-md mb-3 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  {c.title}
                  {!c.disabled && <ArrowRight className="w-3.5 h-3.5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{c.desc}</p>
                {c.hint && (
                  <p className={`text-[11px] mt-2 font-semibold ${c.disabled ? 'text-slate-400' : 'text-emerald-700 flex items-center gap-1'}`}>
                    {!c.disabled && <CheckCircle2 className="w-3 h-3" />}
                    {c.hint}
                  </p>
                )}
                {c.disabled && (
                  <p className="text-[11px] mt-2 font-medium text-slate-400">
                    Hiện chưa có chiến dịch mở cho loại này.
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-6 pb-6">
          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-[11px] text-slate-500 leading-relaxed">
            Lưu ý: nếu bạn đã có bản nháp cho chiến dịch này, hệ thống sẽ đưa bạn tiếp tục hoàn thiện thay vì tạo mới.
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
