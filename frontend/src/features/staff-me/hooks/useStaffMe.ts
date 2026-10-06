import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/useAuthStore';
import { staffMeService } from '../services/staff-me.service';
import {
  type StaffProfile,
  type UpdateStaffProfilePayload,
} from '../types/staff-me.types';

export const staffMeKeys = {
  me: ['staff-me'] as const,
};

export function useStaffMe() {
  return useQuery({
    queryKey: staffMeKeys.me,
    queryFn: staffMeService.getProfile,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: unknown) => {
      const status = (error as { status?: number })?.status;
      if (status && [401, 403, 404].includes(status)) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useUpdateStaffMe() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: (payload: UpdateStaffProfilePayload) => staffMeService.updateProfile(payload),
    retry: false,
    onSuccess: (data: StaffProfile) => {
      queryClient.setQueryData(staffMeKeys.me, data);
      updateUser({
        name: data.fullName,
        avatarUrl: data.avatarUrl ?? undefined,
      });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (percent: number) => void }) =>
      staffMeService.uploadAvatar(file, onProgress),
    retry: false,
    onSuccess: (data) => {
      queryClient.setQueryData<StaffProfile>(staffMeKeys.me, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          avatarUrl: data.avatarUrl,
        };
      });
      updateUser({
        avatarUrl: data.avatarUrl ?? undefined,
      });
    },
  });
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: () => staffMeService.removeAvatar(),
    retry: false,
    onSuccess: (data) => {
      queryClient.setQueryData<StaffProfile>(staffMeKeys.me, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          avatarUrl: data.avatarUrl,
        };
      });
      updateUser({
        avatarUrl: data.avatarUrl ?? undefined,
      });
    },
  });
}
