import { NextResponse } from 'next/server';

import { createSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

/**
 * GET /api/resume/current
 * Public endpoint to fetch the current active resume content
 * Used by the chat interface to provide context to the AI
 */
export async function GET() {
    try {
        const supabase = await createSupabaseAdmin();

        // Fetch the active resume
        const { data: resume, error } = await supabase
            .from('resume')
            .select('id, filename, content, uploaded_at')
            .eq('is_active', true)
            .limit(1)
            .single();

        if (error) {
            // If no resume found, return 404
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'No active resume found',
                        resume: null
                    },
                    {
                        status: 404,
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate'
                        }
                    }
                );
            }

            console.error('Database query error:', error);

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to fetch resume'
                },
                {
                    status: 500,
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate'
                    }
                }
            );
        }

        if (!resume) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'No active resume found',
                    resume: null
                },
                {
                    status: 404,
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate'
                    }
                }
            );
        }

        // Return the resume content with appropriate caching headers
        // Cache for 5 minutes to reduce database load while allowing updates
        return NextResponse.json(
            {
                success: true,
                resume: {
                    id: resume.id,
                    filename: resume.filename,
                    content: resume.content,
                    uploadedAt: resume.uploaded_at
                }
            },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
                    'X-Resume-Id': resume.id,
                    'X-Resume-Updated': resume.uploaded_at
                }
            }
        );
    } catch (error) {
        console.error('Get current resume error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error'
            },
            {
                status: 500,
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            }
        );
    }
}

/**
 * HEAD /api/resume/current
 * Lightweight endpoint to check if a resume exists without fetching content
 * Useful for health checks and conditional rendering
 */
export async function HEAD() {
    try {
        const supabase = await createSupabaseAdmin();

        // Check if an active resume exists
        const { count, error } = await supabase
            .from('resume')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true);

        if (error) {
            console.error('Database query error:', error);

            return new NextResponse(null, {
                status: 500,
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });
        }

        if (!count || count === 0) {
            return new NextResponse(null, {
                status: 404,
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'X-Resume-Count': '0'
                }
            });
        }

        return new NextResponse(null, {
            status: 200,
            headers: {
                'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
                'X-Resume-Count': count.toString()
            }
        });
    } catch (error) {
        console.error('Head current resume error:', error);

        return new NextResponse(null, {
            status: 500,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    }
}
