import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ProfileCacheService } from './profile-cache.service';
import { SupabaseService } from './supabase.service';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    SupabaseService,
    ProfileCacheService,
    JwtAuthGuard,
    RolesGuard,
    OptionalJwtGuard,
    // Global. Every route is authenticated and role-checked unless it opts out
    // with @Public(). Controllers must NOT also list these in @UseGuards —
    // that runs them a second time, costing an extra Supabase token
    // verification per request.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [
    AuthService,
    SupabaseService,
    ProfileCacheService,
    JwtAuthGuard,
    RolesGuard,
    OptionalJwtGuard,
  ],
})
export class AuthModule {}
