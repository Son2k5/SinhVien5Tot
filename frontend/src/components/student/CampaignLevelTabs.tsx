import React from 'react';
import { AwardLevel } from '../../types/student';
import { School, Building2, Landmark } from 'lucide-react';

interface CampaignLevelTabsProps {
  selectedLevel: AwardLevel;
  onSelectLevel: (level: AwardLevel) => void;
}

export const CampaignLevelTabs: React.FC<CampaignLevelTabsProps> = ({
  selectedLevel,
  onSelectLevel,
}) => {
  const levels = [
    { id: AwardLevel.School, label: 'Cấp trường', icon: School },
    { id: AwardLevel.City, label: 'Cấp thành phố', icon: Building2 },
    { id: AwardLevel.Central, label: 'Cấp trung ương', icon: Landmark },
  ];

  return (
    <div className="flex flex-col items-center gap-4 -mt-7 z-10 relative px-4">
      {/* Level Selector Bar (Theo đúng mockup) */}
      <div className="inline-flex items-center bg-white p-1.5 rounded-2xl shadow-lg shadow-blue-900/10 border border-slate-100 max-w-full overflow-x-auto">
        {levels.map((level) => {
          const isActive = selectedLevel === level.id;
          const Icon = level.icon;
          return (
            <button
              key={level.id}
              onClick={() => onSelectLevel(level.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-[#0052cc] text-white shadow-md shadow-blue-700/25 font-semibold'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{level.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

