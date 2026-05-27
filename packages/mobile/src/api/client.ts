/**
 * Thin fetch-based API client.
 *
 * Usage:
 *   const client = new ApiClient('https://api.trustnest.in/v1');
 *   const me = await client.get<UserProfile>('/users/me');
 */

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly serverMessage: string | string[];
  public readonly code?: string;

  constructor(statusCode: number, message: string | string[], code?: string) {
    super(Array.isArray(message) ? message.join('; ') : message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.serverMessage = message;
    this.code = code;
  }
}

export class ApiClient {
  private accessToken: string | null = null;

  constructor(private readonly baseUrl: string) {}

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const hasBody = body !== undefined;
    const headers: Record<string, string> = {
      // Only set Content-Type when we're actually sending a body.
      // Sending Content-Type: application/json with no body causes React
      // Native's native HTTP layer to forward an empty payload, which
      // express's body-parser tries to parse and throws a JSON syntax error.
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...extraHeaders,
    };
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
    });

    let json: unknown;
    const text = await res.text();
    try {
      json = text ? (JSON.parse(text) as unknown) : undefined;
    } catch {
      json = undefined;
    }

    if (!res.ok) {
      const err = json as {
        statusCode?: number;
        message?: string | string[];
        code?: string;
      } | undefined;
      throw new ApiError(
        err?.statusCode ?? res.status,
        err?.message ?? res.statusText,
        err?.code,
      );
    }

    return json as T;
  }

  get<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, undefined, headers);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  /**
   * POST a FormData payload (for file uploads). Does NOT set Content-Type —
   * the browser/RN fetch runtime sets it automatically with the correct boundary.
   */
  async postFormData<T>(path: string, formData: FormData): Promise<T> {
    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    let json: unknown;
    const text = await res.text();
    try {
      json = text ? (JSON.parse(text) as unknown) : undefined;
    } catch {
      json = undefined;
    }

    if (!res.ok) {
      const err = json as {
        statusCode?: number;
        message?: string | string[];
        code?: string;
      } | undefined;
      throw new ApiError(
        err?.statusCode ?? res.status,
        err?.message ?? res.statusText,
        err?.code,
      );
    }

    return json as T;
  }
}

/** Singleton client — configure baseUrl from env / constants */
export const apiClient = new ApiClient(
  // Replace with actual API URL; can be overridden via env-aware config
  process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000/v1',
);
