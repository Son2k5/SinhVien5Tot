import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { STANDARD_DEFINITIONS } from './StandardGroupTabs';

interface SubmissionGuideModalProps {
  open: boolean;
  onClose: () => void;
}

export const SubmissionGuideModal: React.FC<SubmissionGuideModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 font-['Inter',_sans-serif]">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Sổ tay hướng dẫn tiêu chuẩn Sinh viên 5 Tốt
              </h3>
              <p className="text-xs text-slate-500">Quy định và cách chuẩn bị minh chứng hợp lệ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto pr-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs">
            <p className="font-semibold mb-1">Quy định chung về hồ sơ:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              <li>Sinh viên cần đạt đủ cả 5 tiêu chuẩn để được xét tặng danh hiệu.</li>
              <li>Mỗi tiêu chí bắt buộc phải có ít nhất 1 tệp minh chứng hoặc đường link hợp lệ.</li>
              <li>Đối với tiêu chí tự chọn, sinh viên chỉ cần hoàn thành tối thiểu 1 tiêu chí trong nhóm.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wide">
              5 Tiêu chuẩn cốt lõi:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STANDARD_DEFINITIONS.map((def) => {
                const Icon = def.icon;
                return (
                  <div
                    key={def.groupCode}
                    className="p-3 rounded-2xl border border-slate-200/90 bg-slate-50/50 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center shrink-0 border border-slate-100">
                      <Icon className={`w-4 h-4 ${def.color}`} />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">{def.name}</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {def.groupCode === 'Ethics' && 'Đánh giá điểm rèn luyện, tư tưởng chính trị, đạo đức tác phong.'}
                        {def.groupCode === 'Study' && 'Đánh giá điểm GPA học tập, nghiên cứu khoa học, cuộc thi học thuật.'}
                        {def.groupCode === 'Fitness' && 'Đánh giá giấy chứng nhận thanh niên khỏe, giải thể thao các cấp.'}
                        {def.groupCode === 'Volunteer' && 'Đánh giá hoạt động tình nguyện, hiến máu nhân đạo, công tác xã hội.'}
                        {def.groupCode === 'Integration' && 'Đánh giá chứng chỉ ngoại ngữ, tin học, kỹ năng mềm, giao lưu quốc tế.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <p className="font-bold text-slate-800">Lưu ý về định dạng tệp:</p>
            <p>
              Hệ thống chấp nhận các định dạng tệp ảnh (.png, .jpg, .jpeg) và tài liệu (.pdf) với
              dung lượng không quá 10MB/tệp. Đối với video hoặc bài báo cáo dài, vui lòng tải lên
              Google Drive và dán đường link công khai vào ô liên kết.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 mt-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#0047AB] hover:bg-[#003882] text-white shadow-sm transition active:scale-95 cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
