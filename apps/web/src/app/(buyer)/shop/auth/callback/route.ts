import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/shop';
  }
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));
  const oauthError =
    searchParams.get('error_description') ?? searchParams.get('error');

  const completeUrl = new URL('/shop/auth/complete', origin);
  completeUrl.searchParams.set('next', next);

  if (oauthError) {
    completeUrl.searchParams.set('error', oauthError);
    return NextResponse.redirect(completeUrl);
  }

  if (!code) {
    completeUrl.searchParams.set('error', 'Missing authorization code');
    return NextResponse.redirect(completeUrl);
  }

  const cookieStore = cookies();
  let response = NextResponse.redirect(completeUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
          response = NextResponse.redirect(completeUrl);
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    completeUrl.searchParams.set('error', error.message);
    return NextResponse.redirect(completeUrl);
  }

  return response;
}
