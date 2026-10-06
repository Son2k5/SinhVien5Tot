import type { AxiosProgressEvent } from 'axios';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { newsService } from '../services/news.service';
import type {
  CreateArticleRequest,
  NewsFilters,
  UpdateArticleRequest,
} from '../types/news.types';

export const newsKeys = {
  all: ['news'] as const,
  lists: () => [...newsKeys.all, 'list'] as const,
  list: (filters: NewsFilters) => [...newsKeys.lists(), filters] as const,
  details: () => [...newsKeys.all, 'detail'] as const,
  detail: (id: string) => [...newsKeys.details(), id] as const,

  adminAll: ['admin-news'] as const,
  adminLists: () => [...newsKeys.adminAll, 'list'] as const,
  adminList: (filters: NewsFilters) => [...newsKeys.adminLists(), filters] as const,
  adminDetails: () => [...newsKeys.adminAll, 'detail'] as const,
  adminDetail: (id: string) => [...newsKeys.adminDetails(), id] as const,
};

export function usePublishedArticles(filters: NewsFilters) {
  return useQuery({
    queryKey: newsKeys.list(filters),
    queryFn: () => newsService.getPublishedArticles(filters),
    placeholderData: keepPreviousData,
  });
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: newsKeys.detail(id),
    queryFn: () => newsService.getArticle(id),
    enabled: Boolean(id),
  });
}

export function useAdminArticles(filters: NewsFilters) {
  return useQuery({
    queryKey: newsKeys.adminList(filters),
    queryFn: () => newsService.getAdminArticles(filters),
    placeholderData: keepPreviousData,
  });
}

export function useAdminArticle(id: string) {
  return useQuery({
    queryKey: newsKeys.adminDetail(id),
    queryFn: () => newsService.getAdminArticle(id),
    enabled: Boolean(id),
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateArticleRequest) => newsService.createArticle(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: newsKeys.adminLists() });
      void queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateArticleRequest }) =>
      newsService.updateArticle(id, request),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: newsKeys.adminDetail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: newsKeys.adminLists() });
      void queryClient.invalidateQueries({ queryKey: newsKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
    },
  });
}

export function useChangeArticleStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: 'publish' | 'unpublish' | 'archive' | 'restore';
    }) => newsService.changeArticleStatus(id, action),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: newsKeys.adminDetail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: newsKeys.adminLists() });
      void queryClient.invalidateQueries({ queryKey: newsKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => newsService.deleteArticle(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: newsKeys.adminLists() });
      void queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
    },
  });
}

export function useUploadArticleImage() {
  return useMutation({
    mutationFn: ({
      file,
      onUploadProgress,
    }: {
      file: File;
      onUploadProgress?: (e: AxiosProgressEvent) => void;
    }) => newsService.uploadImage(file, onUploadProgress),
  });
}
