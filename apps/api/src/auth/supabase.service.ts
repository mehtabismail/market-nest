import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient | null = null;

  getClient(): SupabaseClient {
    if (this.client) return this.client;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Supabase URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }

    this.client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
      // Node.js < 22 has no native WebSocket; required for @supabase/supabase-js realtime init
      realtime: { transport: ws as unknown as typeof WebSocket },
    });
    return this.client;
  }
}
