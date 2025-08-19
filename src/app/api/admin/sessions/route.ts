import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-error-handler';
import { authOptions } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase';

import { getServerSession } from 'next-auth/next';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const search = searchParams.get('search') || '';

        const offset = (page - 1) * limit;

        const supabase = await createSupabaseAdmin();

        // Build the query
        let query = supabase
            .from('chat_session')
            .select(`
                id,
                client_id,
                ip_hash,
                created_at,
                chat_message!inner(count)
            `, { count: 'exact' })
            .order('created_at', { ascending: false });

        // Add search filter if provided
        if (search) {
            query = query.ilike('client_id', `%${search}%`);
        }

        // Get total count for pagination
        const { count: totalCount } = await supabase
            .from('chat_session')
            .select('*', { count: 'exact', head: true })
            .ilike('client_id', search ? `%${search}%` : '%');

        // Get paginated results
        const { data: sessions, error } = await query
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Failed to fetch sessions:', error);
            throw error;
        }

        // Get message counts for each session
        const sessionIds = sessions?.map(s => s.id) || [];
        const messageCounts: Record<string, number> = {};

        if (sessionIds.length > 0) {
            const { data: counts, error: countError } = await supabase
                .from('chat_message')
                .select('session_id')
                .in('session_id', sessionIds);

            if (!countError && counts) {
                counts.forEach(msg => {
                    messageCounts[msg.session_id] = (messageCounts[msg.session_id] || 0) + 1;
                });
            }
        }

        // Format the response
        const formattedSessions = sessions?.map(session => ({
            id: session.id,
            clientId: session.client_id,
            ipHash: session.ip_hash,
            createdAt: session.created_at,
            messageCount: messageCounts[session.id] || 0
        })) || [];

        return NextResponse.json({
            sessions: formattedSessions,
            pagination: {
                page,
                limit,
                total: totalCount || 0,
                totalPages: Math.ceil((totalCount || 0) / limit)
            }
        });
    } catch (error) {
        return handleApiError(error, {
            apiRoute: '/api/admin/sessions',
            method: 'GET',
            errorMessage: 'Failed to fetch sessions'
        });
    }
}