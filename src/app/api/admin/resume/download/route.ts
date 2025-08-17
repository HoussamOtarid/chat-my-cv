import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { getSignedUrl } from '@/lib/storage';
import { createSupabaseAdmin } from '@/lib/supabase';

import { getServerSession } from 'next-auth';

export const runtime = 'nodejs';

// GET /api/admin/resume/download - Download a resume file
export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get resume ID from query params
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Resume ID is required' }, { status: 400 });
        }

        const supabase = await createSupabaseAdmin();

        // Get resume from database
        const { data: resume, error: fetchError } = await supabase.from('resume').select('*').eq('id', id).single();

        if (fetchError || !resume) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        if (!resume.file_url) {
            return NextResponse.json({ error: 'Resume has no associated file' }, { status: 400 });
        }

        // Generate a signed URL for download
        const signedUrlResult = await getSignedUrl(resume.file_url);

        if (!signedUrlResult.success || !signedUrlResult.url) {
            return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
        }

        // Redirect to the signed URL
        return NextResponse.redirect(signedUrlResult.url);
    } catch (error) {
        console.error('Download resume error:', error);

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
