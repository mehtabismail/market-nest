import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { OptionalJwtGuard } from '../common/guards/optional-jwt.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { SupabaseService } from './supabase.service';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    SupabaseService,
    JwtAuthGuard,
    RolesGuard,
    OptionalJwtGuard,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthService, SupabaseService, JwtAuthGuard, RolesGuard, OptionalJwtGuard],
})
export class AuthModule {}
