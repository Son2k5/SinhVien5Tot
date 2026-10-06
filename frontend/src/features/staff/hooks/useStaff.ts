import { useMemo } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '../../../hooks/useDebounce';
import { staffService } from '../services/staff.service';
import {
  type CreateStaffPayload,
  type Staff,
  type StaffApiError,
  type StaffFilterParams,
  type UpdateStaffPayload,
} from '../types/staff.types';

export const staffQueryKeys = {
  list: (filters: StaffFilterParams) => ['admin-staff', 'list', filters] as const,
  detail: (id: string) => ['admin-staff', 'detail', id] as const,
  allLists: ['admin-staff', 'list'] as const,
};

export function useStaffList(filters: StaffFilterParams) {
  const debouncedQ = useDebounce(filters.q ?? '', 300);

  const effectiveQ = debouncedQ.trim().length >= 2 ? debouncedQ.trim() : undefined;

  const effectiveFilters: StaffFilterParams = useMemo(
    () => ({
      role: filters.role?.trim() || undefined,
      status: filters.status,
      q: effectiveQ,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
    }),
    [filters.role, filters.status, filters.page, filters.pageSize, effectiveQ]
  );

  return useQuery({
    queryKey: staffQueryKeys.list(effectiveFilters),
    queryFn: () => staffService.getStaffList(effectiveFilters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: (failureCount, error: unknown) => {
      const err = error as StaffApiError;
      if (err?.isForbidden || err?.status === 403) return false;
      return failureCount < 1;
    },
  });
}

export function useStaff(id: string | undefined) {
  return useQuery({
    queryKey: staffQueryKeys.detail(id ?? ''),
    queryFn: () => staffService.getStaffById(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
    retry: (_count, error: unknown) => {
      const err = error as StaffApiError;
      if (err?.isForbidden || err?.isNotFound || err?.status === 403 || err?.status === 404) {
        return false;
      }
      return false;
    },
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStaffPayload) => staffService.createStaff(payload),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffQueryKeys.allLists });
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStaffPayload }) =>
      staffService.updateStaff(id, payload),
    retry: false,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: staffQueryKeys.allLists });
      void queryClient.invalidateQueries({ queryKey: staffQueryKeys.detail(variables.id) });
    },
  });
}

export function useSetStaffActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      rowVersion,
      active,
    }: {
      id: string;
      rowVersion: string;
      active: boolean;
    }): Promise<Staff> => {
      if (active) {
        return staffService.unlockStaff(id, rowVersion);
      }
      return staffService.lockStaff(id, rowVersion);
    },
    retry: false,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: staffQueryKeys.allLists });
      void queryClient.invalidateQueries({ queryKey: staffQueryKeys.detail(variables.id) });
    },
  });
}

export function useSendInvitation() {
  return useMutation({
    mutationFn: (id: string) => staffService.sendInvitation(id),
    retry: false,
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rowVersion }: { id: string; rowVersion: string }) =>
      staffService.deleteStaff(id, rowVersion),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffQueryKeys.allLists });
    },
  });
}

/**
 * Direct fetch helper to reload fresh staff details without relying on cache (useful in concurrency conflict)
 */
export async function getFreshStaff(id: string): Promise<Staff> {
  return staffService.getStaffById(id);
}
