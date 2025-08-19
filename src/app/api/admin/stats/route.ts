import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-error-handler';
import { authOptions } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase';

import { getServerSession } from 'next-auth/next';

export const runtime = 'nodejs';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = await createSupabaseAdmin();

        // Get total unique sessions
        const { count: sessionCount, error: sessionError } = await supabase
            .from('chat_session')
            .select('*', { count: 'exact', head: true });

        if (sessionError) {
            console.error('Failed to fetch session count:', sessionError);
        }

        // Get total messages
        const { count: messageCount, error: messageError } = await supabase
            .from('chat_message')
            .select('*', { count: 'exact', head: true });

        if (messageError) {
            console.error('Failed to fetch message count:', messageError);
        }

        // Get recent activity stats (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count: recentSessions, error: recentSessionError } = await supabase
            .from('chat_session')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', sevenDaysAgo.toISOString());

        if (recentSessionError) {
            console.error('Failed to fetch recent session count:', recentSessionError);
        }

        const { count: recentMessages, error: recentMessageError } = await supabase
            .from('chat_message')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', sevenDaysAgo.toISOString());

        if (recentMessageError) {
            console.error('Failed to fetch recent message count:', recentMessageError);
        }

        // Get today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count: todaySessions, error: todaySessionError } = await supabase
            .from('chat_session')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());

        if (todaySessionError) {
            console.error('Failed to fetch today session count:', todaySessionError);
        }

        const { count: todayMessages, error: todayMessageError } = await supabase
            .from('chat_message')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());

        if (todayMessageError) {
            console.error('Failed to fetch today message count:', todayMessageError);
        }

        return NextResponse.json({
            totalSessions: sessionCount || 0,
            totalMessages: messageCount || 0,
            recentSessions: recentSessions || 0,
            recentMessages: recentMessages || 0,
            todaySessions: todaySessions || 0,
            todayMessages: todayMessages || 0
        });
    } catch (error) {
        return handleApiError(error, {
            apiRoute: '/api/admin/stats',
            method: 'GET',
            errorMessage: 'Failed to fetch statistics'
        });
    }
}