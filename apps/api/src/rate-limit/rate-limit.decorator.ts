import { SetMetadata } from '@nestjs/common';
import { RATE_LIMIT_KEY, SKIP_RATE_LIMIT_KEY, type RateLimitTier } from './rate-limit.constants';

export const RateLimit = (tier: RateLimitTier) => SetMetadata(RATE_LIMIT_KEY, tier);

export const SkipRateLimit = () => SetMetadata(SKIP_RATE_LIMIT_KEY, true);
