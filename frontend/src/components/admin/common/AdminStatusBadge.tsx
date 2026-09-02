import {
  AwardLevel,
  AwardType,
  AWARD_LEVEL_LABELS,
  AWARD_TYPE_LABELS,
  CampaignStatus,
  CAMPAIGN_STATUS_LABELS,
} from '../../../types/admin/campaign';
import {
  CriterionEvaluationType,
  CriterionOperator,
  CriterionType,
  CRITERION_EVALUATION_TYPE_LABELS,
  CRITERION_OPERATOR_LABELS,
  CRITERION_TYPE_LABELS,
  StandardGroupCode,
  STANDARD_GROUP_CODE_LABELS,
  StandardSetStatus,
  STANDARD_SET_STATUS_LABELS,
} from '../../../types/admin/standard';
import {
  AlertCircle,
  Archive,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock3,
  FileEdit,
  FolderTree,
  GraduationCap,
  Landmark,
  Layers,
  Medal,
  School,
  Sparkles,
  Users,
} from 'lucide-react';

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  switch (status) {
    case CampaignStatus.Draft:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#fff7e6] text-[#b36b00] border border-[#ffe1aa]">
          <FileEdit size={13} className="shrink-0 text-[#d48806]" />
          {CAMPAIGN_STATUS_LABELS[status]}
        </span>
      );
    case CampaignStatus.Open:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#e6fbf4] text-[#0d7c55] border border-[#a8f0d4]">
          <Sparkles size={13} className="shrink-0 text-[#10b981]" />
          {CAMPAIGN_STATUS_LABELS[status]}
        </span>
      );
    case CampaignStatus.Closed:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1]">
          <Clock3 size={13} className="shrink-0 text-[#64748b]" />
          {CAMPAIGN_STATUS_LABELS[status]}
        </span>
      );
    case CampaignStatus.Reviewing:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#e8f4fd] text-[#096dd9] border border-[#b5dbfd]">
          <Clock3 size={13} className="shrink-0 text-[#1890ff]" />
          {CAMPAIGN_STATUS_LABELS[status]}
        </span>
      );
    case CampaignStatus.Published:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#f0f9eb] text-[#389e0d] border border-[#b7eb8f]">
          <CheckCircle2 size={13} className="shrink-0 text-[#52c41a]" />
          {CAMPAIGN_STATUS_LABELS[status]}
        </span>
      );
    case CampaignStatus.Archived:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#f3f4f6] text-[#6b7280] border border-[#d1d5db]">
          <Archive size={13} className="shrink-0 text-[#9ca3af]" />
          {CAMPAIGN_STATUS_LABELS[status]}
        </span>
      );
    default:
      return null;
  }
}

export function StandardSetStatusBadge({ status }: { status: StandardSetStatus }) {
  switch (status) {
    case StandardSetStatus.Draft:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#fff7e6] text-[#b36b00] border border-[#ffe1aa]">
          <FileEdit size={13} className="shrink-0" />
          {STANDARD_SET_STATUS_LABELS[status]}
        </span>
      );
    case StandardSetStatus.Published:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#e6fbf4] text-[#0d7c55] border border-[#a8f0d4]">
          <CheckCircle2 size={13} className="shrink-0 text-[#10b981]" />
          {STANDARD_SET_STATUS_LABELS[status]}
        </span>
      );
    case StandardSetStatus.Archived:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#f3f4f6] text-[#6b7280] border border-[#d1d5db]">
          <Archive size={13} className="shrink-0" />
          {STANDARD_SET_STATUS_LABELS[status]}
        </span>
      );
    default:
      return null;
  }
}

export function AwardLevelBadge({ level }: { level: AwardLevel }) {
  switch (level) {
    case AwardLevel.School:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#eef6fc] text-[#1668a7] border border-[#cbe3f7]">
          <School size={13} className="shrink-0" />
          {AWARD_LEVEL_LABELS[level]}
        </span>
      );
    case AwardLevel.City:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#f4effc] text-[#6b35b8] border border-[#ddccf7]">
          <Building2 size={13} className="shrink-0" />
          {AWARD_LEVEL_LABELS[level]}
        </span>
      );
    case AwardLevel.Central:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#fcf2e8] text-[#b35309] border border-[#fae0c2]">
          <Landmark size={13} className="shrink-0" />
          {AWARD_LEVEL_LABELS[level]}
        </span>
      );
    default:
      return null;
  }
}

export function AwardTypeBadge({ awardType }: { awardType: AwardType }) {
  return awardType === AwardType.Individual ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f0f9ff] text-[#0369a1] border border-[#bae6fd]">
      <GraduationCap size={13} className="shrink-0" />
      {AWARD_TYPE_LABELS[awardType]}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#fdf4ff] text-[#86198f] border border-[#f5d0fe]">
      <Users size={13} className="shrink-0" />
      {AWARD_TYPE_LABELS[awardType]}
    </span>
  );
}

export function StandardGroupBadge({ groupCode }: { groupCode: StandardGroupCode }) {
  const colors: Record<StandardGroupCode, { bg: string; text: string; border: string }> = {
    [StandardGroupCode.Ethics]: { bg: '#eefbf6', text: '#0b7952', border: '#b9f0dc' },
    [StandardGroupCode.Study]: { bg: '#edf6ff', text: '#1367bf', border: '#b8dcfe' },
    [StandardGroupCode.Fitness]: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
    [StandardGroupCode.Volunteer]: { bg: '#fdf2f8', text: '#be185d', border: '#fbcfe8' },
    [StandardGroupCode.Integration]: { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
  };

  const style = colors[groupCode] ?? { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
      style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}
    >
      <Medal size={13} className="shrink-0" />
      {STANDARD_GROUP_CODE_LABELS[groupCode]}
    </span>
  );
}

export function CriterionTypeBadge({ type }: { type: CriterionType }) {
  return type === CriterionType.Group ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]">
      <FolderTree size={13} className="shrink-0" />
      {CRITERION_TYPE_LABELS[type]}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f8fafc] text-[#334155] border border-[#e2e8f0]">
      <BookOpen size={13} className="shrink-0" />
      {CRITERION_TYPE_LABELS[type]}
    </span>
  );
}

export function CriterionOperatorBadge({
  operator,
  minimumSatisfied,
}: {
  operator: CriterionOperator;
  minimumSatisfied?: number | null;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-mono font-medium bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]">
      <Layers size={11} className="shrink-0" />
      {operator === CriterionOperator.AtLeast
        ? `Tối thiểu ${minimumSatisfied ?? 1}`
        : CRITERION_OPERATOR_LABELS[operator]}
    </span>
  );
}

export function CriterionEvaluationTypeBadge({
  evaluationType,
}: {
  evaluationType: CriterionEvaluationType;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-[#f8fafc] text-[#475569] border border-[#e2e8f0]">
      <AlertCircle size={11} className="shrink-0 text-[#64748b]" />
      {CRITERION_EVALUATION_TYPE_LABELS[evaluationType]}
    </span>
  );
}
