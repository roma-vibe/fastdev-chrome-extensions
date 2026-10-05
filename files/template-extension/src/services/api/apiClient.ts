/**
 * The single place for HTTP requests of this extension (ESLint forbids fetch elsewhere).
 * Requests to other sites need their origins in host_permissions (manifest.config.ts).
 */
export interface ApiClient {
  request<TResponse>(path: string, options?: RequestInit): Promise<TResponse>;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`API request failed with status ${String(status)}`);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function createApiClient({ baseUrl = '' }: { baseUrl?: string } = {}): ApiClient {
  return {
    async request<TResponse>(path: string, options: RequestInit = {}): Promise<TResponse> {
      const headers = new Headers(options.headers);
      headers.set('Content-Type', 'application/json');
      const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
      if (!response.ok) throw new ApiError(response.status);
      return (await response.json()) as TResponse;
    },
  };
}

export const apiClient = createApiClient();
