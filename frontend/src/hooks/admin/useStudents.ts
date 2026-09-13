import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentService } from '../../services/admin/studentService';
import type {
  BatchDeleteStudentsRequest,
  DeleteStudentRequest,
  LockStudentRequest,
  ReviewStudentEvidenceRequest,
  StudentFilterParams,
  UnlockStudentRequest,
} from '../../types/admin/student';

export const studentQueryKeys = {
  all: ['admin', 'students'] as const,
  paged: (p: StudentFilterParams) => ['admin', 'students', 'paged', p] as const,
  detail: (id: string) => ['admin', 'students', 'detail', id] as const,
};

export function useStudentsPaged(params: StudentFilterParams) {
  return useQuery({
    queryKey: studentQueryKeys.paged(params),
    queryFn: () => studentService.getPaged(params),
    staleTime: 30_000,
  });
}

export function useStudentDetail(id: string | undefined) {
  return useQuery({
    queryKey: studentQueryKeys.detail(id ?? ''),
    queryFn: () => studentService.getById(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useStudentMutations() {
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: ({ id, body }: { id: string; body: DeleteStudentRequest }) => studentService.remove(id, body),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: studentQueryKeys.all }); },
  });
  const review = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReviewStudentEvidenceRequest }) =>
      studentService.review(id, body),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: studentQueryKeys.all });
      void qc.invalidateQueries({ queryKey: studentQueryKeys.detail(v.id) });
    },
  });
  const lock = useMutation({
    mutationFn: ({ id, body }: { id: string; body: LockStudentRequest }) => studentService.lock(id, body),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: studentQueryKeys.all });
      void qc.invalidateQueries({ queryKey: studentQueryKeys.detail(v.id) });
    },
  });
  const unlock = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UnlockStudentRequest }) => studentService.unlock(id, body),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: studentQueryKeys.all });
      void qc.invalidateQueries({ queryKey: studentQueryKeys.detail(v.id) });
    },
  });
  const batchDel = useMutation({
    mutationFn: (body: BatchDeleteStudentsRequest) => studentService.batchDelete(body),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: studentQueryKeys.all }); },
  });
  return {
    deleteStudent: del,
    batchDeleteStudents: batchDel,
    reviewEvidence: review,
    lockStudent: lock,
    unlockStudent: unlock,
  };
}
