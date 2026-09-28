import React, { useState } from 'react';
import { X, Info, CheckCircle2 } from 'lucide-react';
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

/**
 * Icon Cá nhân: Người dùng màu xanh dương cách điệu với biểu tượng bút viết (chuẩn Mockup 2)
 */
const IndividualAvatarIcon: React.FC = () => (
  <svg
    viewBox="0 0 64 64"
    className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-xs"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Đầu nhân vật */}
    <circle cx="28" cy="18" r="9.5" fill="#2563eb" />
    {/* Thân nhân vật */}
    <path
      d="M12 43C12 35.5 18 30 26 30H30C37.5 30 43.5 35.5 43.5 43V45.5H12V43Z"
      fill="#2563eb"
    />
    {/* Ngòi bút / nét vẽ cách điệu ở góc dưới */}
    <path
      d="M44 32.5L39.5 37L45 42.5L49.5 38L44 32.5Z"
      fill="#3b82f6"
    />
    <path
      d="M37.5 39L35 47.5L43.5 45L45.5 43L40 37.5L37.5 39Z"
      fill="#1d4ed8"
    />
  </svg>
);

/**
 * Icon Tập thể: 3 nhân vật màu xanh lá lục bảo biểu trưng cho tập thể (chuẩn Mockup 2)
 */
const CollectiveGroupIcon: React.FC = () => (
  <svg
    viewBox="0 0 64 64"
    className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-xs"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Người ở giữa */}
    <circle cx="32" cy="17" r="6.5" fill="#10b981" />
    <path
      d="M25 31.5C25 28 28 25.5 32 25.5C36 25.5 39 28 39 31.5V45H25V31.5Z"
      fill="#10b981"
    />
    {/* Người bên trái */}
    <circle cx="19" cy="21" r="5.5" fill="#10b981" />
    <path
      d="M13 34C13 31 15.5 28.5 19 28.5C22.5 28.5 25 31 25 34V45H13V34Z"
      fill="#10b981"
    />
    {/* Người bên phải */}
    <circle cx="45" cy="21" r="5.5" fill="#10b981" />
    <path
      d="M39 34C39 31 41.5 28.5 45 28.5C48.5 28.5 51 31 51 34V45H39V34Z"
      fill="#10b981"
    />
  </svg>
);

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
  const [showLearnMore, setShowLearnMore] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 font-['Inter',_sans-serif]">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-8 sm:p-12 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Nút đóng X ở góc trên bên phải */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tiêu đề chính căn giữa: Chế Độ Minh Chứng */}
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1e293b] tracking-tight">
            Chế Độ Minh Chứng
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Vui lòng chọn loại danh hiệu bạn muốn nộp minh chứng cho đợt xét này
          </p>
        </div>

        {/* Hai chế độ dạng vòng tròn đối xứng đúng chuẩn Mockup 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 max-w-lg mx-auto">
          {/* Chế độ 1: Danh Hiệu Cá Nhân */}
          <button
            type="button"
            disabled={individualDisabled || isCreating}
            onClick={() => onSelect(AwardType.Individual)}
            className={`flex flex-col items-center text-center group transition-all cursor-pointer ${
              individualDisabled
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:scale-105 active:scale-95'
            }`}
          >
            {/* Vòng tròn lớn màu xanh nhạt */}
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-[#eef4ff] group-hover:bg-[#dfeaff] group-hover:shadow-lg group-hover:shadow-blue-500/15 border-2 border-transparent group-hover:border-blue-200 flex items-center justify-center transition-all duration-300">
              <IndividualAvatarIcon />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-4 tracking-tight group-hover:text-blue-700 transition-colors">
              Danh Hiệu Cá Nhân
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Xét danh hiệu đối với mỗi cá nhân
            </p>

            {individualHint && !individualDisabled && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-2 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-3 h-3" />
                <span>{individualHint}</span>
              </span>
            )}

            {individualDisabled && (
              <span className="text-[11px] text-slate-400 mt-2">
                Chưa có đợt xét cá nhân đang mở
              </span>
            )}
          </button>

          {/* Chế độ 2: Danh hiệu tập thể */}
          <button
            type="button"
            disabled={collectiveDisabled || isCreating}
            onClick={() => onSelect(AwardType.Collective)}
            className={`flex flex-col items-center text-center group transition-all cursor-pointer ${
              collectiveDisabled
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:scale-105 active:scale-95'
            }`}
          >
            {/* Vòng tròn lớn màu hồng nhạt */}
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-[#fdf0f3] group-hover:bg-[#fde2e7] group-hover:shadow-lg group-hover:shadow-pink-500/15 border-2 border-transparent group-hover:border-pink-200 flex items-center justify-center transition-all duration-300">
              <CollectiveGroupIcon />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-4 tracking-tight group-hover:text-emerald-700 transition-colors">
              Danh hiệu tập thể
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Xét danh hiệu dưới dạng tập thể
            </p>

            {collectiveHint && !collectiveDisabled && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-2 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-3 h-3" />
                <span>{collectiveHint}</span>
              </span>
            )}

            {collectiveDisabled && (
              <span className="text-[11px] text-slate-400 mt-2">
                Chưa có đợt xét tập thể đang mở
              </span>
            )}
          </button>
        </div>

        {/* Nút hình viên thuốc Learn more ở phía dưới (theo đúng Mockup 2) */}
        <div className="mt-8 sm:mt-10 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowLearnMore(!showLearnMore)}
            className="px-8 py-2 rounded-full border border-indigo-300/80 hover:border-indigo-500 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs"
          >
            {showLearnMore ? 'Thu gọn thông tin' : 'Learn more'}
          </button>

          {/* Phần hướng dẫn mở rộng khi bấm Learn more */}
          {showLearnMore && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2 text-left max-w-md animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Hướng dẫn chọn chế độ minh chứng</span>
              </div>
              <p>
                • <strong>Danh Hiệu Cá Nhân:</strong> Áp dụng cho từng sinh viên tự kê khai thành tích học tập, rèn luyện, tình nguyện, thể lực và hội nhập.
              </p>
              <p>
                • <strong>Danh hiệu tập thể:</strong> Áp dụng cho Ban chấp hành Chi hội / Lớp / Câu lạc bộ đăng ký xét danh hiệu tập thể tiêu biểu.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
