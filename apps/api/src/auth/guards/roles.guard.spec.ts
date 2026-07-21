import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@marketnest/shared-types';
import { RolesGuard } from './roles.guard';
import type { RequestUser } from '../auth.types';

function contextFor(user?: Partial<RequestUser>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function guardWithRequiredRoles(roles: UserRole[] | undefined) {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(roles) } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  it('allows the request when the route declares no roles', () => {
    const guard = guardWithRequiredRoles(undefined);

    expect(guard.canActivate(contextFor({ role: 'buyer' }))).toBe(true);
  });

  it('allows the request when the user holds a required role', () => {
    const guard = guardWithRequiredRoles(['seller', 'superadmin']);

    expect(guard.canActivate(contextFor({ role: 'seller' }))).toBe(true);
  });

  it('rejects a buyer attempting a seller-only route', () => {
    const guard = guardWithRequiredRoles(['seller']);

    expect(() => guard.canActivate(contextFor({ role: 'buyer' }))).toThrow(ForbiddenException);
  });

  it('rejects a seller attempting a superadmin-only route', () => {
    const guard = guardWithRequiredRoles(['superadmin']);

    expect(() => guard.canActivate(contextFor({ role: 'seller' }))).toThrow(ForbiddenException);
  });

  // Guards downstream of JwtAuthGuard must still fail closed if `user` is absent —
  // otherwise a misordered guard chain would silently grant access.
  it('rejects when no user is attached to the request', () => {
    const guard = guardWithRequiredRoles(['buyer']);

    expect(() => guard.canActivate(contextFor(undefined))).toThrow(ForbiddenException);
  });
});
