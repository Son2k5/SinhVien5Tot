import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  SESSION_EXPIRED_EVENT,
  type SessionEndReason,
} from './sessionInactivity';

const API_BASE = import.meta.env.VITE_API_URL;
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS);

if (!API_BASE) {
  throw new Error('Missing required frontend environment variable: VITE_API_URL');
}

if (!Number.isFinite(API_TIMEOUT_MS) || API_TIMEOUT_MS <= 0) {
  throw new Error('VITE_API_TIMEOUT_MS must be a positive number.');
}

interface AuthTokenResponse {
  accessToken: string;
  expiresAtUtc: string;
}

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;
let refreshRequest: Promise<string> | null = null;

async function requestNewAccessToken(): Promise<string> {
  const response = await axios.post<AuthTokenResponse>(
    `${API_BASE}/auth/refresh`,
    {},
    {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    },
  );
  setApiAccessToken(response.data.accessToken);
  return response.data.accessToken;
}

async function coordinatedRefresh(): Promise<string> {
  if (navigator.locks) {
    return navigator.locks.request(
      'sv5t-refresh-token',
      () => requestNewAccessToken(),
    );
  }
  return requestNewAccessToken();
}

function sessionEndReason(error: unknown): SessionEndReason {
  if (!axios.isAxiosError<{ code?: string }>(error)) return 'expired';
  return error.response?.data?.code === 'idle_timeout'
    ? 'inactive'
    : 'expired';
}

export function setApiAccessToken(token: string): void {
  accessToken = token;
}

export function clearApiAccessToken(): void {
  accessToken = null;
}

export async function refreshApiAccessToken(): Promise<string> {
  if (!refreshRequest) {
    refreshRequest = coordinatedRefresh()
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryableRequest | undefined;
    const isAuthenticationRequest =
      request?.url?.includes('/auth/login') ||
      request?.url?.includes('/auth/refresh');

    if (error.response?.status !== 401 || !request || request._retry || isAuthenticationRequest) {
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      const token = await refreshApiAccessToken();
      request.headers.Authorization = `Bearer ${token}`;
      return apiClient(request);
    } catch (refreshError: unknown) {
      clearApiAccessToken();
      window.dispatchEvent(new CustomEvent<SessionEndReason>(
        SESSION_EXPIRED_EVENT,
        { detail: sessionEndReason(refreshError) },
      ));
      return Promise.reject(refreshError);
    }
  },
);
