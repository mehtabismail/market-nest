import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GuestSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<{
      headers: { 'x-guest-session'?: string };
      cookies?: { mn_guest?: string };
    }>();
    return (
      request.headers['x-guest-session'] ??
      request.cookies?.mn_guest ??
      undefined
    );
  },
);
