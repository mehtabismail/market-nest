import type { UserRole } from './enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  sellerId?: string;
}

export interface AuthSession {
  accessToken: string;
  /** Present after password login/register/refresh. OAuth may omit until wired. */
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    fullName: string | null;
  };
}

/** Payload accepted by clients when establishing a session. */
export interface AuthTokenPair {
  accessToken: string;
  refreshToken?: string | null;
}

