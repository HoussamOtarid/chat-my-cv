import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { deleteResume, getSignedUrl } from '@/lib/storage';
import { createSupabaseAdmin } from '@/lib/supabase';

import { getServerSession } from 'next-auth';

export const runtime = 'nodejs';

// GET /api/admin/resume - Get resume details
export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createSupabaseAdmin();

        // Get active resume or all resumes based on query parameter
        const { searchParams } = new URL(request.url);
        const all = searchParams.get('all') === 'true';

        let query = supabase.from('resume').select('*').order('uploaded_at', { ascending: false });

        if (!all) {
            query = query.eq('is_active', true).limit(1);
        }

        const { data: resumes, error } = await query;

        if (error) {
            console.error('Database query error:', error);

            return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 });
        }

        // Generate signed URLs for file access if needed
        const resumesWithUrls = await Promise.all(
            (resumes || []).map(async (resume) => {
                let signedUrl = null;
                if (resume.file_url) {
                    const urlResult = await getSignedUrl(resume.file_url);
                    signedUrl = urlResult.success ? urlResult.url : null;
                }

                return {
                    id: resume.id,
                    filename: resume.filename,
                    content: resume.content,
                    fileSize: resume.file_size,
                    mimeType: resume.mime_type,
                    uploadedAt: resume.uploaded_at,
                    isActive: resume.is_active,
                    signedUrl
                };
            })
        );

        if (!all && resumesWithUrls.length > 0) {
            return NextResponse.json({
                success: true,
                resume: resumesWithUrls[0]
            });
        }

        return NextResponse.json({
            success: true,
            resumes: resumesWithUrls
        });
    } catch (error) {
        console.error('Get resume error:', error);

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/resume - Delete resume
export async function DELETE(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get resume ID from request body
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'Resume ID is required' }, { status: 400 });
        }

        const supabase = await createSupabaseAdmin();

        // Get resume details first
        const { data: resume, error: fetchError } = await supabase.from('resume').select('*').eq('id', id).single();

        if (fetchError || !resume) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        // Delete from storage if file exists
        if (resume.file_url) {
            const deleteResult = await deleteResume(resume.file_url);
            if (!deleteResult.success) {
                console.error('Storage deletion error:', deleteResult.error);
                // Continue anyway - we can still delete from database
            }
        }

        // Delete from database
        const { error: deleteError } = await supabase.from('resume').delete().eq('id', id);

        if (deleteError) {
            console.error('Database deletion error:', deleteError);

            return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Resume deleted successfully'
        });
    } catch (error) {
        console.error('Delete resume error:', error);

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/admin/resume - Update resume (e.g., toggle active status)
export async function PUT(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, isActive } = body;

        if (!id) {
            return NextResponse.json({ error: 'Resume ID is required' }, { status: 400 });
        }

        const supabase = await createSupabaseAdmin();

        // If setting as active, deactivate all others first
        if (isActive) {
            const { error: deactivateError } = await supabase
                .from('resume')
                .update({ is_active: false })
                .eq('is_active', true);

            if (deactivateError) {
                console.error('Error deactivating resumes:', deactivateError);
            }
        }

        // Update the specified resume
        const { data: resume, error: updateError } = await supabase
            .from('resume')
            .update({ is_active: isActive })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Database update error:', updateError);

            return NextResponse.json({ error: 'Failed to update resume' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Resume updated successfully',
            resume: {
                id: resume.id,
                filename: resume.filename,
                isActive: resume.is_active
            }
        });
    } catch (error) {
        console.error('Update resume error:', error);

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
