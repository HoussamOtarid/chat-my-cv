import { cookies } from 'next/headers';

import { createBrowserClient } from '@supabase/ssr';
import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// ============================================
// Browser Client
// ============================================
export function createSupabaseBrowser() {
    return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

// ============================================
// Server Client (for API routes and server components)
// ============================================
export async function createSupabaseServer() {
    const cookieStore = await cookies();

    return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
                try {
                    cookieStore.set({ name, value, ...options });
                } catch (error) {
                    // The `set` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing
                    // user sessions.
                }
            },
            remove(name: string, options: CookieOptions) {
                try {
                    cookieStore.set({ name, value: '', ...options });
                } catch (error) {
                    // The `delete` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing
                    // user sessions.
                }
            }
        }
    });
}

// ============================================
// Service Role Client (for admin operations)
// ============================================
export async function createSupabaseAdmin() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

// ============================================
// Server Client for Middleware
// ============================================
export function createSupabaseMiddleware(request: Request) {
    const response = new Response();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.headers.get('cookie')?.match(new RegExp(`(^| )${name}=([^;]+)`))?.[2];
                },
                set(name: string, value: string, options: CookieOptions) {
                    response.headers.append(
                        'set-cookie',
                        `${name}=${value}; Path=/; ${options.maxAge ? `Max-Age=${options.maxAge};` : ''}`
                    );
                },
                remove(name: string, _options: CookieOptions) {
                    response.headers.append('set-cookie', `${name}=; Path=/; Max-Age=0`);
                }
            }
        }
    );

    return { supabase, response };
}
