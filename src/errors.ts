export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(`Home Assistant API failed (${status}): ${message}`);
    this.name = "ApiError";
  }
}

/** Alias for HA-focused call sites */
export class HassError extends ApiError {
  constructor(status: number, message: string) {
    super(status, message);
    this.name = "HassError";
  }
}
