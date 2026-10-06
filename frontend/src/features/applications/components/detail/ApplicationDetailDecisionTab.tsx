import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import type { ReviewApplicationItem } from '../../types/application.types';

interface ApplicationDetailDecisionTabProps {
  application: ReviewApplicationItem;
  decision: 'Approved' | 'Rejected' | 'NeedsRevision';
  onDecisionChange: (val: 'Approved' | 'Rejected' | 'NeedsRevision') => void;
  decisionNote: string;
  onDecisionNoteChange: (val: string) => void;
  decisionError: string | null;
  decisionSuccess: string | null;
  isEligibleForApproval: boolean;
  completedStandardsCount: number;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const QUICK_FEEDBACK_TEMPLATES = [
  'Hồ sơ xuất sắc, hoàn thành đầy đủ 5 tiêu chuẩn SV5T.',
  'Cần bổ sung giấy xác nhận tham gia hoạt động tình nguyện Mùa hè xanh / Tiếp sức mùa thi.',
  'Bảng điểm thiếu dấu xác nhận phòng Đào tạo, vui lòng xin cấp lại và cập nhật trước hạn.',
  'Minh chứng tiêu chuẩn Thể lực tốt chưa rõ ràng, đề nghị nộp giấy chứng nhận đạt chuẩn rèn luyện thể lực.',
];

export const ApplicationDetailDecisionTab: React.FC<ApplicationDetailDecisionTabProps> = ({
  application,
  decision,
  onDecisionChange,
  decisionNote,
  onDecisionNoteChange,
  decisionError,
  decisionSuccess,
  isEligibleForApproval,
  completedStandardsCount,
  isSubmitting,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="flex-1 lg:w-7/12 xl:w-8/12 p-4 sm:p-6 overflow-y-auto custom-scrollbar bg-slate-50/20">
      <form onSubmit={onSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs">
        <div>
          <h4 className="text-base font-bold text-slate-900">
            Quyết định công nhận danh hiệu Sinh viên 5 Tốt
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Kết quả đánh giá và phản hồi sẽ được gửi trực tiếp đến trang cá nhân của sinh viên.
          </p>
        </div>

        {/* Standard Completion Status Alert */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            isEligibleForApproval
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {isEligibleForApproval ? (
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs">
            <span className="font-bold block">
              Tiến độ tiêu chuẩn: {completedStandardsCount} / 5 nhóm hoàn thành
            </span>
            <p className="mt-0.5 text-slate-700 leading-relaxed">
              {isEligibleForApproval
                ? 'Hồ sơ đã đạt đầy đủ 5/5 tiêu chuẩn Sinh viên 5 Tốt. Bạn có thể tiến hành Phê duyệt chính thức.'
                : 'Hồ sơ chưa hoàn thành đủ cả 5 nhóm tiêu chuẩn. Quy định chỉ cho phép Phê duyệt (Approved) khi đủ cả 5 nhóm. Bạn có thể chọn Yêu cầu bổ sung hoặc Từ chối kèm nhận xét hướng dẫn.'}
            </p>
          </div>
        </div>

        {/* Decision Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            Chọn kết quả xét duyệt hồ sơ:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Approved */}
            <label
              className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                decision === 'Approved'
                  ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                  : isEligibleForApproval
                  ? 'border-slate-200 hover:border-slate-300 text-slate-700'
                  : 'border-slate-200 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed'
              }`}
            >
              <input
                type="radio"
                name="final-decision"
                disabled={!isEligibleForApproval}
                className="hidden"
                checked={decision === 'Approved'}
                onChange={() => onDecisionChange('Approved')}
              />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">Phê duyệt</span>
                <CheckCircle2
                  size={18}
                  className={decision === 'Approved' ? 'text-emerald-600' : 'text-slate-400'}
                />
              </div>
              <span className="text-[11px] text-slate-500 leading-tight">
                Công nhận đạt danh hiệu SV5T cấp trường
              </span>
            </label>

            {/* NeedsRevision */}
            <label
              className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                decision === 'NeedsRevision'
                  ? 'border-amber-500 bg-amber-50/70 text-amber-900 ring-2 ring-amber-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="final-decision"
                className="hidden"
                checked={decision === 'NeedsRevision'}
                onChange={() => onDecisionChange('NeedsRevision')}
              />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">Yêu cầu bổ sung</span>
                <Clock
                  size={18}
                  className={decision === 'NeedsRevision' ? 'text-amber-600' : 'text-slate-400'}
                />
              </div>
              <span className="text-[11px] text-slate-500 leading-tight">
                Yêu cầu sinh viên sửa / nộp thêm minh chứng
              </span>
            </label>

            {/* Rejected */}
            <label
              className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                decision === 'Rejected'
                  ? 'border-rose-500 bg-rose-50/70 text-rose-900 ring-2 ring-rose-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="final-decision"
                className="hidden"
                checked={decision === 'Rejected'}
                onChange={() => onDecisionChange('Rejected')}
              />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">Từ chối hồ sơ</span>
                <AlertCircle
                  size={18}
                  className={decision === 'Rejected' ? 'text-rose-600' : 'text-slate-400'}
                />
              </div>
              <span className="text-[11px] text-slate-500 leading-tight">
                Không đạt yêu cầu danh hiệu SV5T đợt này
              </span>
            </label>
          </div>
        </div>

        {/* Feedback Note Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>
              Nhận xét & Hướng dẫn (Feedback gửi sinh viên){' '}
              {decision !== 'Approved' && <span className="text-rose-500">*</span>}
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              {decisionNote.length}/2000 ký tự
            </span>
          </div>
          <textarea
            rows={5}
            value={decisionNote}
            onChange={(e) => onDecisionNoteChange(e.target.value)}
            placeholder={
              decision === 'Approved'
                ? 'Chúc mừng sinh viên! Ghi nhận xét biểu dương hoặc căn dặn thêm (không bắt buộc)...'
                : decision === 'NeedsRevision'
                ? 'Ghi rõ các tiêu chí cần bổ sung, loại giấy tờ yêu cầu, thời hạn sinh viên phải hoàn thành...'
                : 'Ghi rõ lý do hồ sơ chưa đáp ứng tiêu chuẩn Sinh viên 5 Tốt đợt này...'
            }
            className="w-full text-xs rounded-xl border border-slate-200 p-3.5 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors leading-relaxed"
          />
        </div>

        {/* Quick feedback templates */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
            Gợi ý nhận xét nhanh:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {QUICK_FEEDBACK_TEMPLATES.map((tpl) => (
              <button
                key={tpl}
                type="button"
                onClick={() =>
                  onDecisionNoteChange(decisionNote ? `${decisionNote}\n${tpl}` : tpl)
                }
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer text-left"
              >
                {tpl}
              </button>
            ))}
          </div>
        </div>

        {/* Current feedback if already stored */}
        {(application.reviewerGeneralNote || application.rejectionReason) && (
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-700 block">
              Nhận xét đã lưu trước đó:
            </span>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
              {application.reviewerGeneralNote || application.rejectionReason}
            </p>
          </div>
        )}

        {/* Error Banner */}
        {decisionError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{decisionError}</span>
          </div>
        )}

        {/* Success Banner */}
        {decisionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{decisionSuccess}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (decision === 'Approved' && !isEligibleForApproval)}
            className={`px-6 py-2.5 text-xs font-bold text-white rounded-lg shadow-md transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
              decision === 'Approved'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                : decision === 'NeedsRevision'
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
            }`}
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            <span>Lưu kết quả xét duyệt & Gửi phản hồi</span>
          </button>
        </div>
      </form>
    </div>
  );
};
