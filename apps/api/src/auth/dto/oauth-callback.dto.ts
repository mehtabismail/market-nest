import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateIf } from 'class-validator';

export class OauthCallbackDto {
  @ApiProperty({
    description: 'Supabase access token returned after OAuth exchange',
    required: false,
  })
  @ValidateIf((o: OauthCallbackDto) => !o.accessToken)
  @IsString()
  access_token?: string;

  @ApiProperty({
    description: 'Backward-compatible access token field',
    required: false,
  })
  @ValidateIf((o: OauthCallbackDto) => !o.access_token)
  @IsString()
  accessToken?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  refresh_token?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  get resolvedAccessToken(): string {
    return this.access_token ?? this.accessToken ?? '';
  }

  get resolvedRefreshToken(): string | null {
    return this.refresh_token ?? this.refreshToken ?? null;
  }
}
