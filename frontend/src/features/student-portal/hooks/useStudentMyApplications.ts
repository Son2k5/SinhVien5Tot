import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentPortalService } from '../services/student-portal.service';
import {
  isDraftStatus,
  type StudentApplicationSummaryResponse,
  parseStudentPortalApiError,
} from '../types/student-portal.types';

export const studentMyApplicationsQueryKeys = {
  all: ['student-applications', 'my'] as const,
};

export function useStudentMyApplications() {
  const queryClient = useQueryClient();

  const [withdrawModalApp, setWithdrawModalApp] = useState<StudentApplicationSummaryResponse | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Query: Get My Applications
  const {
    data: myApplicationsData,
    isLoading: myApplicationsLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: studentMyApplicationsQueryKeys.all,
    queryFn: () => studentPortalService.getMyApplications({ pageSize: 50 }),
  });

  const allApplications = myApplicationsData?.items ?? [];
  const submittedApplications = allApplications.filter((a) => !isDraftStatus(a.status));
  const draftApplications = allApplications.filter((a) => isDraftStatus(a.status));

  // Withdraw Mutation
  const withdrawMutation = useMutation({
    mutationFn: async ({ appId, reason }: { appId: string; reason: string }) => {
      const detail = await studentPortalService.getApplicationDetail(appId);
      return studentPortalService.withdrawApplication(appId, detail.rowVersion, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentMyApplicationsQueryKeys.all });
      setWithdrawModalApp(null);
      setWithdrawReason('');
    },
    onError: (err: unknown) => {
      setActionError(parseStudentPortalApiError(err));
    },
  });

  const handleConfirmWithdraw = () => {
    if (!withdrawModalApp) return;
    withdrawMutation.mutate({
      appId: withdrawModalApp.id,
      reason: withdrawReason || 'Sinh viên yêu cầu rút hồ sơ',
    });
  };

  return {
    allApplications,
    submittedApplications,
    draftApplications,
    myApplicationsLoading,
    isError,
    error,
    refetch,
    withdrawModalApp,
    setWithdrawModalApp,
    withdrawReason,
    setWithdrawReason,
    actionError,
    setActionError,
    withdrawMutation,
    handleConfirmWithdraw,
  };
}
