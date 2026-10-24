import { ApiError } from "./errors.js";

export interface ClientOptions {
  /**
   * Home Assistant base URL, e.g. `http://homeassistant.local:8123`
   * or `https://xxxxx.ui.nabu.casa`
   */
  baseUrl: string;
  /** Long-lived access token from HA profile */
  token: string;
  /** Retries on 5xx only — 4xx never retried. Default 2. */
  maxRetries?: number;
  /** Optional fetch override (tests / edge runtimes) */
  fetch?: typeof fetch;
}

export class BaseClient {
  readonly baseUrl: string;
  private token: string;
  private maxRetries: number;
  private fetchImpl: typeof fetch;

  constructor(options: ClientOptions) {
    if (!options.baseUrl) throw new Error("baseUrl is required");
    if (!options.token) throw new Error("token is required");
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.token = options.token;
    this.maxRetries = options.maxRetries ?? 2;
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${this.token}`);
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    headers.set("Accept", "application/json");

    const url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;

    for (let attempt = 0; ; attempt++) {
      const response = await this.fetchImpl(url, { ...init, headers });

      if (response.ok) {
        if (response.status === 204) return undefined as T;
        const text = await response.text();
        if (!text) return undefined as T;
        return JSON.parse(text) as T;
      }

      const isServerError = response.status >= 500;
      if (!isServerError || attempt >= this.maxRetries) {
        const body = await response.text().catch(() => response.statusText);
        throw new ApiError(response.status, body);
      }

      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 250));
    }
  }
}
