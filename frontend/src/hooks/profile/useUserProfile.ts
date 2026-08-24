import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userProfileService } from '../../services/userProfileService';
import { useAuthStore } from '../../store/useAuthStore';
import type { UpdateUserProfilePayload } from '../../types/userProfile';

export const userProfileKeys = {
  all: ['user-profile'] as const,
  current: () => [...userProfileKeys.all, 'current'] as const,
};

export function useMyProfile() {
  return useQuery({
    queryKey: userProfileKeys.current(),
    queryFn: userProfileService.getMyProfile,
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);
  return useMutation({
    mutationFn: (payload: UpdateUserProfilePayload) =>
      userProfileService.updateMyProfile(payload),
    onSuccess: (profile) => {
      updateUser({ name: profile.fullName });
      queryClient.setQueryData(userProfileKeys.current(), profile);
      void queryClient.invalidateQueries({ queryKey: ['welcome-dashboard'] });
    },
  });
}

export function useUpdateMyAvatar() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);
  return useMutation({
    mutationFn: (file: File) => userProfileService.updateMyAvatar(file),
    onSuccess: (user) => {
      updateUser({ avatarUrl: user.avatarUrl ?? undefined });
      void queryClient.invalidateQueries({ queryKey: ['welcome-dashboard'] });
    },
  });
}
