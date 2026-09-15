import { apiClient } from './apiClient';
import type {
  PagedResult,
  StudentApplicationDetailResponse,
  StudentApplicationSummaryResponse,
  StudentCampaignDetailResponse,
  StudentCampaignListItemResponse,
  StudentEvidenceItemResponse,
} from '../types/student';

export interface GetOpenCampaignsParams {
  level?: number;
  schoolYear?: string;
  awardType?: number;
  pageIndex?: number;
  pageSize?: number;
}

export interface GetMyApplicationsParams {
  status?: number;
  pageIndex?: number;
  pageSize?: number;
}

export const studentService = {
  /**
   * Lấy danh sách chiến dịch đang mở để sinh viên nộp hồ sơ
   */
  async getOpenCampaigns(params?: GetOpenCampaignsParams): Promise<PagedResult<StudentCampaignListItemResponse>> {
    const response = await apiClient.get<PagedResult<StudentCampaignListItemResponse>>(
      '/student/campaigns',
      { params }
    );
    return response.data;
  },

  /**
   * Lấy chi tiết chiến dịch và danh sách tiêu chuẩn/tiêu chí
   */
  async getCampaignDetail(campaignId: string): Promise<StudentCampaignDetailResponse> {
    const response = await apiClient.get<StudentCampaignDetailResponse>(
      `/student/campaigns/${campaignId}`
    );
    return response.data;
  },

  /**
   * Lấy danh sách các hồ sơ sinh viên đã/đang tạo
   */
  async getMyApplications(params?: GetMyApplicationsParams): Promise<PagedResult<StudentApplicationSummaryResponse>> {
    const response = await apiClient.get<PagedResult<StudentApplicationSummaryResponse>>(
      '/student/applications',
      { params }
    );
    return response.data;
  },

  /**
   * Tạo hồ sơ mới cho một chiến dịch
   */
  async createApplication(campaignId: string): Promise<StudentApplicationDetailResponse> {
    const response = await apiClient.post<StudentApplicationDetailResponse>(
      '/student/applications',
      { campaignId }
    );
    return response.data;
  },

  /**
   * Lấy thông tin chi tiết hồ sơ nộp và danh sách minh chứng
   */
  async getApplicationDetail(applicationId: string): Promise<StudentApplicationDetailResponse> {
    const response = await apiClient.get<StudentApplicationDetailResponse>(
      `/student/applications/${applicationId}`
    );
    return response.data;
  },

  /**
   * Nộp hồ sơ chính thức cho Admin/Mentor duyệt
   */
  async submitApplication(applicationId: string, rowVersion: string): Promise<StudentApplicationDetailResponse> {
    const response = await apiClient.post<StudentApplicationDetailResponse>(
      `/student/applications/${applicationId}/submit`,
      { rowVersion }
    );
    return response.data;
  },

  /**
   * Rút hồ sơ về trạng thái Bản nháp để chỉnh sửa
   */
  async withdrawApplication(
    applicationId: string,
    rowVersion: string,
    reason?: string
  ): Promise<StudentApplicationDetailResponse> {
    const response = await apiClient.post<StudentApplicationDetailResponse>(
      `/student/applications/${applicationId}/withdraw`,
      { rowVersion, reason }
    );
    return response.data;
  },

  /**
   * Thêm hoặc cập nhật minh chứng cho một tiêu chí cụ thể
   */
  async upsertEvidence(
    applicationId: string,
    criterionId: string,
    dataJson: string,
    rowVersion?: string
  ): Promise<StudentEvidenceItemResponse> {
    const response = await apiClient.put<StudentEvidenceItemResponse>(
      `/student/applications/${applicationId}/evidences/${criterionId}`,
      { dataJson, rowVersion }
    );
    return response.data;
  },

  /**
   * Upload tệp đính kèm (ảnh, PDF) cho minh chứng lên Cloudinary
   */
  async uploadEvidenceFile(evidenceId: string, file: File): Promise<StudentEvidenceItemResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<StudentEvidenceItemResponse>(
      `/student/evidences/${evidenceId}/files`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};
