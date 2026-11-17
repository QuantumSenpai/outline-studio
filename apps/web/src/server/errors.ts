import { errorSchema, type ErrorData } from '@outline-studio/schemas';
export class ApiError extends Error {
  constructor(public code: ErrorData['code'], message: string, public status = 400, public retryAfter?: number) {
    super(message); this.name = 'ApiError';
  }
  toJSON(): ErrorData { return errorSchema.parse({ code: this.code, message: this.message, retryAfter: this.retryAfter }); }
}
