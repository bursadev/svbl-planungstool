import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { mapDatabaseError } from './database-errors.js';
import { ValidationException, type FieldError } from './validation.js';

/** The one error shape the API returns. */
export interface ErrorBody {
  statusCode: number;
  message: string;
  errors?: FieldError[];
}

/** German defaults for the Nest exceptions thrown without a message. */
const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Ungültige Anfrage.',
  401: 'Nicht angemeldet.',
  403: 'Keine Berechtigung.',
  404: 'Nicht gefunden.',
  409: 'Der Eintrag steht im Konflikt mit bestehenden Daten.',
};

/**
 * Shapes every error as `{ statusCode, message, errors? }` with German
 * messages the UI shows unchanged. Database errors a write can hit become
 * 409s; anything unexpected is logged and answered with a generic 500.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);
    res.status(body.statusCode).json(body);
  }

  toBody(exception: unknown): ErrorBody {
    if (exception instanceof ValidationException) {
      return {
        statusCode: 400,
        message: exception.message,
        errors: exception.errors,
      };
    }
    const http =
      exception instanceof HttpException
        ? exception
        : mapDatabaseError(exception);
    if (http) {
      const status = http.getStatus();
      return { statusCode: status, message: messageOf(http, status) };
    }
    const cause =
      exception instanceof Error
        ? `${exception.name}: ${exception.message}`
        : String(exception);
    this.logger.error(
      cause,
      exception instanceof Error ? exception.stack : undefined,
    );
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Unerwarteter Fehler.',
    };
  }
}

function messageOf(http: HttpException, status: number): string {
  const response = http.getResponse();
  const raw =
    typeof response === 'string'
      ? response
      : (response as { message?: string | string[] }).message;
  const message = Array.isArray(raw) ? raw.join(' ') : raw;
  // Nest's default texts are English ("Not Found", "Cannot GET /x"); replace them.
  if (
    !message ||
    message === http.name ||
    isNestDefault(message, status) ||
    /^Cannot [A-Z]+ /.test(message)
  ) {
    return DEFAULT_MESSAGES[status] ?? 'Fehler.';
  }
  return message;
}

function isNestDefault(message: string, status: number): boolean {
  const defaults: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
  };
  return defaults[status] === message;
}
