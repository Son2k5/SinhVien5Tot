import { apiClient } from '../apiClient';
import type { AdminStudentDetail, AdminStudentEvidenceItem } from '../../types/admin/student';
import type { AdminStudentListItem, DeleteStudentRequest, LockStudentRequest } from '../../types/admin/student';
import type { PagedResponse, ReviewStudentEvidenceRequest, StudentFilterParams, UnlockStudentRequest } from '../../types/admin/student';

function toQuery(params: StudentFilterParams) {
  return {
    search: params.search || undefined,
    school: params.school || undefined,
    faculty: params.faculty || undefined,
    major: params.major || undefined,
    class: params.administrativeClass || undefined,
    cohort: params.cohort,
    schoolYear: params.schoolYear || undefined,
    isActive: params.isActive,
    isVerified: params.isVerified,
    includeDeleted: params.includeDeleted ?? false,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    pageIndex: params.pageIndex ?? 1,
    pageSize: params.pageSize ?? 12,
  };
}

export const studentService = {
  async getPaged(params: StudentFilterParams): Promise<PagedResponse<AdminStudentListItem>> {
    const res = await apiClient.get<PagedResponse<AdminStudentListItem>>('/admin/students', {
      params: toQuery(params),
    });
    return res.data;
  },
  async getById(id: string): Promise<AdminStudentDetail> {
    const res = await apiClient.get<AdminStudentDetail>(`/admin/students/${id}`);
    return res.data;
  },
  async remove(id: string, body: DeleteStudentRequest): Promise<void> {
    await apiClient.delete(`/admin/students/${id}`, { data: body });
  },
  async review(id: string, body: ReviewStudentEvidenceRequest): Promise<AdminStudentEvidenceItem> {
    const res = await apiClient.patch<AdminStudentEvidenceItem>(`/admin/students/${id}/review`, body);
    return res.data;
  },
  async lock(id: string, body: LockStudentRequest): Promise<void> {
    await apiClient.post(`/admin/students/${id}/lock`, body);
  },
  async unlock(id: string, body: UnlockStudentRequest): Promise<void> {
    await apiClient.post(`/admin/students/${id}/unlock`, body);
  },
};
