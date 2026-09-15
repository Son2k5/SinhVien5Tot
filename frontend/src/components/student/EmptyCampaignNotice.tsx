import React from 'react';
import { CalendarX2, Info } from 'lucide-react';
import { AwardLevel, AwardType } from '../../types/student';

interface EmptyCampaignNoticeProps {
  level: AwardLevel;
  awardType?: AwardType;
}

export const EmptyCampaignNotice: React.FC<EmptyCampaignNoticeProps> = ({ level, awardType }) => {
  const levelLabels: Record<AwardLevel, string> = {
    [AwardLevel.School]: 'Cấp Trường',
    [AwardLevel.City]: 'Cấp Thành Phố',
    [AwardLevel.Central]: 'Cấp Trung Ương',
  };

  const typeLabels: Record<AwardType, string> = {
    [AwardType.Individual]: 'Cá nhân',
    [AwardType.Collective]: 'Tập thể',
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4">
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 mb-4 shadow-sm">
          <CalendarX2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">
          Hiện chưa có chiến dịch xét duyệt cho {levelLabels[level]}
          {awardType ? ` (${typeLabels[awardType]})` : ''}
        </h3>
        <p className="text-sm text-slate-600 max-w-lg mt-2 leading-relaxed">
          Đoàn Thanh niên - Hội Sinh viên hiện chưa mở đợt đăng ký hồ sơ xét chọn Sinh viên 5 Tốt cho cấp này, hoặc thời hạn đăng ký của đợt xét đã kết thúc.
        </p>

        <div className="mt-5 flex items-center gap-2 text-xs text-amber-800 bg-amber-100/70 px-4 py-2 rounded-xl">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Vui lòng chọn cấp độ xét khác hoặc theo dõi thông báo kế hoạch xét duyệt từ ban tổ chức.</span>
        </div>
      </div>
    </div>
  );
};

