export class ApiError extends Error {
  readonly status: number;
  /** Raw message from the API, for logging. Never render this directly. */
  readonly detail: string;

  constructor(status: number, message: string, detail: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    // Required for `instanceof` to survive the CommonJS/ES5 target downlevel.
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  /** No HTTP response at all — offline, DNS failure, server unreachable. */
  get isNetworkError() {
    return this.status === 0;
  }
}

/**
 * Turns a transport failure into copy that is safe to render.
 *
 * Validation errors (400/422) keep the API's message — class-validator produces
 * specific, useful text like "email must be an email". Everything else is
 * replaced: permission and infrastructure failures otherwise surface raw
 * strings such as "Forbidden" to end users.
 */
export function userFacingMessage(status: number, detail: string): string {
  if (status === 400 || status === 422) {
    return detail || 'Please check the details you entered and try again.';
  }
  switch (status) {
    case 0:
      return 'Could not reach the server. Check your connection.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to do that.';
    case 404:
      return 'We could not find what you were looking for.';
    case 409:
      return detail || 'That conflicts with something that already exists.';
    case 429:
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return status >= 500
        ? 'Something went wrong on our end. Please try again in a moment.'
        : detail || 'Request failed. Please try again.';
  }
}
