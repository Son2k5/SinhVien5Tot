import React from 'react';
import { Heart, BookOpen, Dumbbell, Users, Globe, CheckCircle2 } from 'lucide-react';
import type { StudentCriterionItemResponse, StudentEvidenceItemResponse } from '../../types/student';

export interface StandardTabDefinition {
  groupCode: string;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const STANDARD_DEFINITIONS: StandardTabDefinition[] = [
  {
    groupCode: 'Ethics',
    name: 'Đạo đức tốt',
    shortName: 'Đạo đức',
    icon: Heart,
    color: 'text-rose-500',
  },
  {
    groupCode: 'Study',
    name: 'Học tập tốt',
    shortName: 'Học tập',
    icon: BookOpen,
    color: 'text-blue-500',
  },
  {
    groupCode: 'Fitness',
    name: 'Thể lực tốt',
    shortName: 'Thể lực',
    icon: Dumbbell,
    color: 'text-amber-500',
  },
  {
    groupCode: 'Volunteer',
    name: 'Tình nguyện tốt',
    shortName: 'Tình nguyện',
    icon: Users,
    color: 'text-emerald-500',
  },
  {
    groupCode: 'Integration',
    name: 'Hội nhập tốt',
    shortName: 'Hội nhập',
    icon: Globe,
    color: 'text-indigo-500',
  },
];

interface StandardGroupTabsProps {
  activeGroupCode: string;
  onSelectGroup: (groupCode: string) => void;
  criteria: StudentCriterionItemResponse[];
  evidences: StudentEvidenceItemResponse[];
  className?: string;
}

export const StandardGroupTabs: React.FC<StandardGroupTabsProps> = ({
  activeGroupCode,
  onSelectGroup,
  criteria,
  evidences,
  className = '',
}) => {
  // Normalize groupCode matching (case-insensitive or numeric string)
  const isGroupMatch = (cGroup: string, defGroup: string, idx: number) => {
    if (!cGroup) return false;
    const cg = cGroup.trim().toLowerCase();
    const dg = defGroup.trim().toLowerCase();
    const num = (idx + 1).toString();
    return cg === dg || cg === num;
  };

  return (
    <div className={`w-full max-w-5xl mx-auto px-2 sm:px-4 ${className}`}>
      <div className="bg-white rounded-2xl sm:rounded-[28px] p-2 sm:p-2.5 shadow-[0_12px_35px_rgba(0,0,0,0.08)] border border-slate-100 flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
        {STANDARD_DEFINITIONS.map((def, idx) => {
          const Icon = def.icon;
          const isActive = activeGroupCode.toLowerCase() === def.groupCode.toLowerCase();

          // Count criteria and submitted evidences for this group
          const groupCriteria = criteria.filter((c) => isGroupMatch(c.groupCode, def.groupCode, idx));

          const isOptional = (c: StudentCriterionItemResponse) => {
            if (!c.isRequired) return true;
            const t = (c.title || '').toLowerCase();
            return t.includes('tự chọn') || t.includes('(tự chọn)');
          };

          const requiredGroupCriteria = groupCriteria.filter((c) => !isOptional(c));
          const optionalGroupCriteria = groupCriteria.filter((c) => isOptional(c));

          const requiredIds = new Set(requiredGroupCriteria.map((c) => c.id));
          const optionalIds = new Set(optionalGroupCriteria.map((c) => c.id));

          const filledRequired = evidences.filter(
            (e) => requiredIds.has(e.criterionId) && e.dataJson && e.dataJson.length > 2
          ).length;

          const filledOptional = evidences.filter(
            (e) => optionalIds.has(e.criterionId) && e.dataJson && e.dataJson.length > 2
          ).length;

          const totalCount = groupCriteria.length;
          const filledCount = filledRequired + filledOptional;

          const isComplete =
            groupCriteria.length > 0 &&
            filledRequired >= requiredGroupCriteria.length &&
            (optionalGroupCriteria.length === 0 || filledOptional >= 1);

          return (
            <button
              key={def.groupCode}
              type="button"
              onClick={() => onSelectGroup(def.groupCode)}
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer select-none flex-1 ${
                isActive
                  ? 'bg-[#0047AB] text-white shadow-md shadow-blue-900/25 font-bold scale-[1.01]'
                  : 'text-slate-600 hover:text-[#0047AB] hover:bg-slate-50 font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 stroke-[2.2] ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{def.name}</span>
              {isComplete && (
                <CheckCircle2
                  className={`w-3.5 h-3.5 shrink-0 ml-0.5 ${
                    isActive ? 'text-emerald-300' : 'text-emerald-500'
                  }`}
                />
              )}
              {totalCount > 0 && !isComplete && filledCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ml-0.5 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {filledCount}/{totalCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
