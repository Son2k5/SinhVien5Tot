import type { AxiosProgressEvent } from 'axios';
import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import type {
  AdminArticleDetail,
  AdminArticleListItem,
  ArticleDetail,
  ArticleListItem,
  CreateArticleRequest,
  NewsFilters,
  PaginatedResult,
  UpdateArticleRequest,
} from '../types/news.types';

export const newsService = {
  getPublishedArticles: async (filters: NewsFilters): Promise<PaginatedResult<ArticleListItem>> => {
    const { data } = await axiosClient.get<PaginatedResult<ArticleListItem>>(ENDPOINTS.NEWS.ARTICLES, {
      params: filters,
    });
    return data;
  },

  getArticle: async (id: string): Promise<ArticleDetail> => {
    const { data } = await axiosClient.get<ArticleDetail>(ENDPOINTS.NEWS.ARTICLE_BY_ID(id));
    return data;
  },

  getAdminArticles: async (filters: NewsFilters): Promise<PaginatedResult<AdminArticleListItem>> => {
    const { data } = await axiosClient.get<PaginatedResult<AdminArticleListItem>>(ENDPOINTS.NEWS.ADMIN_ARTICLES, {
      params: filters,
    });
    return data;
  },

  getAdminArticle: async (id: string): Promise<AdminArticleDetail> => {
    const { data } = await axiosClient.get<AdminArticleDetail>(ENDPOINTS.NEWS.ADMIN_ARTICLE_BY_ID(id));
    return data;
  },

  createArticle: async (request: CreateArticleRequest): Promise<{ id: string; rowVersion: string }> => {
    const { data } = await axiosClient.post<{ id: string; rowVersion: string }>(
      ENDPOINTS.NEWS.ADMIN_ARTICLES,
      request
    );
    return data;
  },

  updateArticle: async (id: string, request: UpdateArticleRequest): Promise<{ rowVersion: string }> => {
    const { data } = await axiosClient.put<{ rowVersion: string }>(
      ENDPOINTS.NEWS.ADMIN_ARTICLE_BY_ID(id),
      request
    );
    return data;
  },

  changeArticleStatus: async (
    id: string,
    action: 'publish' | 'unpublish' | 'archive' | 'restore'
  ): Promise<{ rowVersion: string }> => {
    const { data } = await axiosClient.post<{ rowVersion: string }>(
      ENDPOINTS.NEWS.ADMIN_ARTICLE_STATUS(id, action)
    );
    return data;
  },

  deleteArticle: async (id: string): Promise<void> => {
    await axiosClient.delete(ENDPOINTS.NEWS.ADMIN_ARTICLE_BY_ID(id));
  },

  uploadImage: async (
    file: File,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
  ): Promise<{ id: string; url: string; width: number; height: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await axiosClient.post<{ id: string; url: string; width: number; height: number }>(
      ENDPOINTS.NEWS.UPLOAD_IMAGE,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      }
    );
    return data;
  },
};

export default newsService;
