import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-error-handler';
import { authOptions } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase';

import { getServerSession } from 'next-auth/next';

export const runtime = 'nodejs';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const sessionId = params.id;
        const supabase = await createSupabaseAdmin();

        // Get session details
        const { data: sessionData, error: sessionError } = await supabase
            .from('chat_session')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessionError || !sessionData) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        // Get all messages for this session
        const { data: messages, error: messagesError } = await supabase
            .from('chat_message')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (messagesError) {
            console.error('Failed to fetch messages:', messagesError);
            throw messagesError;
        }

        // Format the response
        const formattedSession = {
            id: sessionData.id,
            clientId: sessionData.client_id,
            ipHash: sessionData.ip_hash,
            createdAt: sessionData.created_at,
            messages: messages?.map(msg => ({
                id: msg.id,
                clientMessageId: msg.client_message_id,
                role: msg.role,
                content: msg.content,
                createdAt: msg.created_at
            })) || []
        };

        return NextResponse.json(formattedSession);
    } catch (error) {
        return handleApiError(error, {
            apiRoute: `/api/admin/sessions/${params.id}`,
            method: 'GET',
            errorMessage: 'Failed to fetch session details'
        });
    }
}