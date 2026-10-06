import { axiosClient } from '../../../api/axiosClient';
import type {
  GetMyApplicationsParams,
  GetOpenCampaignsParams,
  PagedResult,
  StudentApplicationDetailResponse,
  StudentApplicationSummaryResponse,
  StudentCampaignDetailResponse,
  StudentCampaignListItemResponse,
  StudentEvidenceItemResponse,
} from '../types/student-portal.types';
import { StudentPortalApiError } from '../types/student-portal.types';

export const studentPortalService = {
  /**
   * Lấy danh sách chiến dịch đang mở để sinh viên nộp hồ sơ
   */
  async getOpenCampaigns(
    params?: GetOpenCampaignsParams
  ): Promise<PagedResult<StudentCampaignListItemResponse>> {
    try {
      const response = await axiosClient.get<PagedResult<StudentCampaignListItemResponse>>(
        '/student/campaigns',
        { params }
      );
      return response.data;
    } catch (err: unknown) {
      throw new StudentPortalApiError('Không thể tải danh sách chiến dịch.', undefined, err);
    }
  },

  /**
   * Lấy chi tiết chiến dịch và danh sách tiêu chuẩn/tiêu chí
   */
  async getCampaignDetail(campaignId: string): Promise<StudentCampaignDetailResponse> {
    try {
      const response = await axiosClient.get<StudentCampaignDetailResponse>(
        `/student/campaigns/${campaignId}`
      );
      return response.data;
    } catch (err: unknown) {
      throw new StudentPortalApiError('Không thể tải thông tin chiến dịch.', undefined, err);
    }
  },

  /**
   * Lấy danh sách các hồ sơ sinh viên đã/đang tạo
   */
  async getMyApplications(
    params?: GetMyApplicationsParams
  ): Promise<PagedResult<StudentApplicationSummaryResponse>> {
    try {
      const response = await axiosClient.get<PagedResult<StudentApplicationSummaryResponse>>(
        '/student/applications',
        { params }
      );
      return response.data;
    } catch (err: unknown) {
      throw new StudentPortalApiError('Không thể tải danh sách hồ sơ của bạn.', undefined, err);
    }
  },

  /**
   * Tạo hồ sơ mới cho một chiến dịch
   */
  async createApplication(campaignId: string): Promise<StudentApplicationDetailResponse> {
    try {
      const response = await axiosClient.post<StudentApplicationDetailResponse>(
        '/student/applications',
        { campaignId }
      );
      return response.data;
    } catch (err: unknown) {
      throw new StudentPortalApiError('Không thể tạo hồ sơ mới.', undefined, err);
    }
  },

  /**
   * Lấy thông tin chi tiết hồ sơ nộp và danh sách minh chứng
   */
  async getApplicationDetail(applicationId: string): Promise<StudentApplicationDetailResponse> {
    try {
      const response = await axiosClient.get<StudentApplicationDetailResponse>(
        `/student/applications/${applicationId}`
      );
      return response.data;
    } catch (err: unknown) {
      throw new StudentPortalApiError('Không thể tải thông tin chi tiết hồ sơ.', undefined, err);
    }
  },

  /**
   * Nộp hồ sơ chính thức cho Admin/Mentor duyệt
   */
  async submitApplication(
    applicationId: string,
    rowVersion: string
  ): Promise<StudentApplicationDetailResponse> {
    try {
      const response = await axiosClient.post<StudentApplicationDetailResponse>(
        `/student/applications/${applicationId}/submit`,
        { rowVersion }
      );
      return response.data;
    } catch (err: unknown) {
      throw new StudentPortalApiError('Không thể nộp hồ sơ xét duyệt.', undefined, err);
    }
  },

  /**
   * Rút hồ sơ về trạng thái Bản nháp để chỉnh sửa
   */
  async withdrawApplication(
    applicationId: string,
    rowVersion: string,
    reason?: string
  ): Promise<StudentApplicationDetailResponse> {
    try {
      const response = await axiosClient.post<StudentApplicationDetailResponse>(
        `/student/applications/${applicationId}/withdraw`,
        { rowVersion, reason }
      );
      return response.data;
    } catch (err: unknown) {
      throw new StudentPortalApiError('Không thể rút hồ sơ.', undefined, err);
    }
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
    try {
      const response = await axiosClient.put<StudentEvidenceItemResponse>(
        `/student/applications/${applicationId}/evidences/${criterionId}`,
        { dataJson, rowVersion }
      );
      return response.data;
    } catch (err: unknown) {
      throw new StudentPortalApiError('Không thể lưu minh chứng.', undefined, err);
    }
  },

  /**
   * Upload tệp đính kèm (ảnh, PDF) cho minh chứng lên Cloudinary
   */
  async uploadEvidenceFile(evidenceId: string, file: File): Promise<StudentEvidenceItemResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosClient.post<StudentEvidenceItemResponse>(
        `/student/evidences/${evidenceId}/files`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (err: unknown) {
      throw new StudentPortalApiError('Không thể tải lên tệp đính kèm.', undefined, err);
    }
  },

  /**
   * Mở lại minh chứng đã nộp để bổ sung khi cần
   */
  async reopenEvidence(evidenceId: string, rowVersion: string): Promise<StudentEvidenceItemResponse> {
    try {
      const response = await axiosClient.post<StudentEvidenceItemResponse>(
        `/student/evidences/${evidenceId}/reopen`,
        { rowVersion }
      );
      return response.data;
    } catch (err: unknown) {
      throw new StudentPortalApiError('Không thể mở lại minh chứng.', undefined, err);
    }
  },

  /**
   * Xóa tệp đính kèm trong minh chứng
   */
  async deleteEvidenceFile(
    evidenceId: string,
    fileIndex: number,
    rowVersion: string
  ): Promise<StudentEvidenceItemResponse> {
    try {
      const response = await axiosClient.delete<StudentEvidenceItemResponse>(
        `/student/evidences/${evidenceId}/files/${fileIndex}`,
        { data: { rowVersion } }
      );
      return response.data;
    } catch (err: unknown) {
      throw new StudentPortalApiError('Không thể xóa tệp đính kèm.', undefined, err);
    }
  },

  /**
   * Nộp riêng lẻ một minh chứng tiêu chí để thẩm định trước (Micro Review)
   */
  async submitEvidence(evidenceId: string, rowVersion: string): Promise<StudentEvidenceItemResponse> {
    try {
      const response = await axiosClient.post<StudentEvidenceItemResponse>(
        `/student/evidences/${evidenceId}/submit`,
        { rowVersion }
      );
      return response.data;
    } catch (err: unknown) {
      throw new StudentPortalApiError('Không thể nộp minh chứng riêng lẻ.', undefined, err);
    }
  },
};

export const studentService = studentPortalService;
