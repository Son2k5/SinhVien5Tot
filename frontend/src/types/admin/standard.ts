/**
 * Standard & Criteria Module Types & DTOs
 * Synchronized with backend SV5T.Application.Admin.Dtos & SV5T.Domain.Standards / SV5T.Domain.Criteria
 */

import type { AwardLevel, AwardType } from './campaign';

export const StandardSetStatus = {
  Draft: 'Draft',
  Published: 'Published',
  Archived: 'Archived',
} as const;
export type StandardSetStatus =
  (typeof StandardSetStatus)[keyof typeof StandardSetStatus];

export const StandardGroupCode = {
  Ethics: 'Ethics',      // Đạo đức tốt
  Study: 'Study',       // Học tập tốt
  Fitness: 'Fitness',     // Thể lực tốt
  Volunteer: 'Volunteer',   // Tình nguyện tốt
  Integration: 'Integration', // Hội nhập tốt
} as const;
export type StandardGroupCode =
  (typeof StandardGroupCode)[keyof typeof StandardGroupCode];

export const CriterionType = {
  Group: 'Group',       // Nhóm tiêu chí (chứa tiêu chí con)
  Requirement: 'Requirement', // Tiêu chí cụ thể (cần nộp minh chứng / đánh giá)
} as const;
export type CriterionType =
  (typeof CriterionType)[keyof typeof CriterionType];

export const CriterionOperator = {
  All: 'All',     // Đạt tất cả tiêu chí con
  Any: 'Any',     // Đạt ít nhất một tiêu chí con bất kỳ
  AtLeast: 'AtLeast', // Đạt tối thiểu X tiêu chí con
} as const;
export type CriterionOperator =
  (typeof CriterionOperator)[keyof typeof CriterionOperator];

export const CriterionEvaluationType = {
  Manual: 'Manual',             // Cán bộ xét duyệt thủ công
  Boolean: 'Boolean',            // Đạt / Không đạt dựa trên bằng chứng
  NumericThreshold: 'NumericThreshold',   // Ngưỡng giá trị số (ví dụ: GPA >= 3.2, Điểm rèn luyện >= 80)
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
