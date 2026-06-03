const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customConfig } = options;
  
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, String(params[key]));
      }
    });
  }

  const token = localStorage.getItem('access_token');
  
  const isAiEndpoint = endpoint.startsWith('/api/v1/ai/') || endpoint.includes('/portfolio/') || endpoint.startsWith('/api/v1/study/');
  const timeoutMs = isAiEndpoint ? 120000 : 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const config: RequestInit = {
    method: customConfig.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    signal: controller.signal,
    ...customConfig,
  };

  try {
    const response = await fetch(url.toString(), config);
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      
      const message = (errorData && typeof errorData === 'object' && 'message' in errorData && typeof errorData.message === 'string') 
        ? errorData.message 
        : '요청 처리 중 오류가 발생했습니다.';

      throw new ApiError(response.status, message, errorData);
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('요청 시간이 초과되었습니다.');
    }
    throw error;
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
