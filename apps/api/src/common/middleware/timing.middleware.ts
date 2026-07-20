import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const SLOW_THRESHOLD_MS = 500;

@Injectable()
export class TimingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      if (duration > SLOW_THRESHOLD_MS) {
        this.logger.warn(
          `SLOW ${method} ${originalUrl} ${statusCode} - ${duration}ms`,
        );
      } else if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
      }
    });

    next();
  }
}
