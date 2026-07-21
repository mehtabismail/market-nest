import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

interface GuardProvider {
  provide?: unknown;
  useClass?: unknown;
}

/**
 * These two registrations are the entire authorisation model.
 *
 * Controllers deliberately do NOT repeat them in @UseGuards — listing a global
 * guard again runs it twice, costing a second Supabase token verification on
 * every request. The trade-off is that removing either line here silently
 * unauthenticates the whole API, with no local signal at any controller. Hence
 * this test.
 */
describe('AuthModule global guards', () => {
  const providers = (Reflect.getMetadata('providers', AuthModule) ?? []) as GuardProvider[];
  const globalGuards = providers
    .filter((p) => p && typeof p === 'object' && p.provide === APP_GUARD)
    .map((p) => p.useClass);

  it('registers JwtAuthGuard globally', () => {
    expect(globalGuards).toContain(JwtAuthGuard);
  });

  it('registers RolesGuard globally', () => {
    expect(globalGuards).toContain(RolesGuard);
  });

  it('registers exactly these two global guards', () => {
    expect(globalGuards).toHaveLength(2);
  });
});
