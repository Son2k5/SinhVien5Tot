/**
 * Standard & Criteria Module Types & DTOs
 * Synchronized with backend SV5T.Application.Admin.Dtos & SV5T.Domain.Standards / SV5T.Domain.Criteria
 */

import type { AwardLevel, AwardType } from '../../campaigns/types/campaign.types';

export const StandardSetStatus = {
  Draft: 'Draft',
  Published: 'Published',
  Archived: 'Archived',
} as const;
export type StandardSetStatus =
  (typeof StandardSetStatus)[keyof typeof StandardSetStatus];

export const StandardGroupCode = {
  Ethics: 'Ethics', // Đạo đức tốt
  Study: 'Study', // Học tập tốt
  Fitness: 'Fitness', // Thể lực tốt
  Volunteer: 'Volunteer', // Tình nguyện tốt
  Integration: 'Integration', // Hội nhập tốt
} as const;
export type StandardGroupCode =
  (typeof StandardGroupCode)[keyof typeof StandardGroupCode];

export const CriterionType = {
  Group: 'Group', // Nhóm tiêu chí (chứa tiêu chí con)
  Requirement: 'Requirement', // Tiêu chí cụ thể (cần nộp minh chứng / đánh giá)
} as const;
export type CriterionType =
  (typeof CriterionType)[keyof typeof CriterionType];

export const CriterionOperator = {
  All: 'All', // Đạt tất cả tiêu chí con
  Any: 'Any', // Đạt ít nhất một tiêu chí con bất kỳ
  AtLeast: 'AtLeast', // Đạt tối thiểu X tiêu chí con
} as const;
export type CriterionOperator =
  (typeof CriterionOperator)[keyof typeof CriterionOperator];

export const CriterionEvaluationType = {
  Manual: 'Manual', // Cán bộ xét duyệt thủ công
  Boolean: 'Boolean', // Đạt / Không đạt dựa trên bằng chứng
  NumericThreshold: 'NumericThreshold', // Ngưỡng giá trị số (ví dụ: GPA >= 3.2, Điểm rèn luyện >= 80)
  AccumulatedNumeric: 'AccumulatedNumeric', // Tích luỹ điểm số qua nhiều hoạt động
} as const;
export type CriterionEvaluationType =
  (typeof CriterionEvaluationType)[keyof typeof CriterionEvaluationType];

export const STANDARD_SET_STATUS_LABELS: Record<StandardSetStatus, string> = {
  [StandardSetStatus.Draft]: 'Bản nháp',
  [StandardSetStatus.Published]: 'Đã công bố',
  [StandardSetStatus.Archived]: 'Đã lưu trữ',
};

export const STANDARD_GROUP_CODE_LABELS: Record<StandardGroupCode, string> = {
  [StandardGroupCode.Ethics]: 'Đạo đức tốt',
  [StandardGroupCode.Study]: 'Học tập tốt',
  [StandardGroupCode.Fitness]: 'Thể lực tốt',
  [StandardGroupCode.Volunteer]: 'Tình nguyện tốt',
  [StandardGroupCode.Integration]: 'Hội nhập tốt',
};

const TITLE_ACCENT_MAP: Record<string, string> = {
  'Dao duc tot': 'Đạo đức tốt',
  'Hoc tap tot': 'Học tập tốt',
  'The luc tot': 'Thể lực tốt',
  'Tinh nguyen tot': 'Tình nguyện tốt',
  'Hoi nhap tot': 'Hội nhập tốt',
};

const DESC_ACCENT_MAP: Record<string, string> = {
  'Danh gia ve tu tuong chinh tri, dao duc, loi song va y thuc chap hanh phap luat, noi quy nha truong.':
    'Đánh giá về tư tưởng chính trị, đạo đức, lối sống và ý thức chấp hành pháp luật, nội quy nhà trường.',
  'Danh gia ve ket qua hoc tap, nghien cuu khoa hoc va tinh than hoc hoi sang tao.':
    'Đánh giá về kết quả học tập, nghiên cứu khoa học và tinh thần học hỏi sáng tạo.',
  'Danh gia ve ren luyen the chat, the duc the thao va chung nhan the luc.':
    'Đánh giá về rèn luyện thể chất, thể dục thể thao và chứng nhận thể lực.',
  'Danh gia ve viec tham gia cac hoat dong tinh nguyen vi cong dong, an sinh xa hoi.':
    'Đánh giá về việc tham gia các hoạt động tình nguyện vì cộng đồng, an sinh xã hội.',
  'Danh gia ve trinh do ngoai ngu, ky nang mem va cac hoat dong giao luu quoc te.':
    'Đánh giá về trình độ ngoại ngữ, kỹ năng mềm và các hoạt động giao lưu quốc tế.',
};

export function formatStandardTitle(title?: string | null): string {
  if (!title) return '';
  return TITLE_ACCENT_MAP[title.trim()] ?? title;
}

export function formatStandardDescription(desc?: string | null): string {
  if (!desc) return '';
  return DESC_ACCENT_MAP[desc.trim()] ?? desc;
}

export const CRITERION_TYPE_LABELS: Record<CriterionType, string> = {
  [CriterionType.Group]: 'Nhóm tiêu chuẩn',
  [CriterionType.Requirement]: 'Tiêu chí đánh giá',
};

export const CRITERION_OPERATOR_LABELS: Record<CriterionOperator, string> = {
  [CriterionOperator.All]: 'Đạt tất cả',
  [CriterionOperator.Any]: 'Đạt bất kỳ (ít nhất 1)',
  [CriterionOperator.AtLeast]: 'Đạt số lượng tối thiểu',
};

export const CRITERION_EVALUATION_TYPE_LABELS: Record<CriterionEvaluationType, string> = {
  [CriterionEvaluationType.Manual]: 'Đánh giá thủ công',
  [CriterionEvaluationType.Boolean]: 'Đạt / Không đạt (Boolean)',
  [CriterionEvaluationType.NumericThreshold]: 'Ngưỡng điểm / Số lượng',
  [CriterionEvaluationType.AccumulatedNumeric]: 'Điểm tích luỹ tổng',
};

// 1. Criterion Types (Tiêu chí con)

export interface CriterionResponse {
  id: string;
  standardId: string;
  parentCriterionId?: string | null;
  type: CriterionType;
  code: string;
  title: string;
  description?: string | null;
  displayOrder: number;
  operator: CriterionOperator;
  minimumSatisfied?: number | null;
  evaluationType: CriterionEvaluationType;
  definitionJson: string;
  reviewGuidance?: string | null;
}

export interface CreateCriterionRequest {
  parentCriterionId?: string | null;
  type: CriterionType;
  code?: string;
  title: string;
  description?: string | null;
  displayOrder: number;
  operator: CriterionOperator;
  minimumSatisfied?: number | null;
  evaluationType: CriterionEvaluationType;
  definitionJson: string;
  reviewGuidance?: string | null;
}

export interface UpdateCriterionRequest {
  parentCriterionId?: string | null;
  type: CriterionType;
  code?: string;
  title: string;
  description?: string | null;
  displayOrder: number;
  operator: CriterionOperator;
  minimumSatisfied?: number | null;
  evaluationType: CriterionEvaluationType;
  definitionJson: string;
  reviewGuidance?: string | null;
}

// 2. Standard Types (Tiêu chuẩn lớn)

export interface StandardResponse {
  id: string;
  standardSetId: string;
  groupCode?: StandardGroupCode | null;
  code: string;
  title: string;
  description?: string | null;
  displayOrder: number;
  operator: CriterionOperator;
  minimumSatisfied?: number | null;
  criteria?: CriterionResponse[] | null;
}

export interface CreateStandardRequest {
  groupCode?: StandardGroupCode | null;
  code?: string;
  title: string;
  description?: string | null;
  displayOrder: number;
  operator: CriterionOperator;
  minimumSatisfied?: number | null;
}

export interface UpdateStandardRequest {
  groupCode?: StandardGroupCode | null;
  code?: string;
  title: string;
  description?: string | null;
  displayOrder: number;
  operator: CriterionOperator;
  minimumSatisfied?: number | null;
}

// 3. Standard Set Types (Bộ tiêu chuẩn)

export interface StandardSetResponse {
  id: string;
  name: string;
  academicYear: string;
  level: AwardLevel;
  awardType: AwardType;
  status: StandardSetStatus;
  version: number;
  previousVersionId?: string | null;
  createdAt: string;
  publishedAt?: string | null;
  standards?: StandardResponse[] | null;
}

export interface CreateStandardSetRequest {
  name: string;
  academicYear: string;
  level: AwardLevel;
  awardType: AwardType;
  templateStandardSetId?: string | null;
}

export interface UpdateStandardSetRequest {
  name: string;
  academicYear: string;
  level: AwardLevel;
  awardType: AwardType;
}
