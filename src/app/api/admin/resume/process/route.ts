import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error-handler';
import { extractTextFromPDF } from '@/lib/langchain';
import { downloadResume } from '@/lib/storage';
import { createSupabaseAdmin } from '@/lib/supabase';

import { getServerSession } from 'next-auth';

export const runtime = 'nodejs';

// POST /api/admin/resume/process - Process or re-process a resume
export async function POST(request: NextRequest) {
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

        // Get resume details from database
        const { data: resume, error: fetchError } = await supabase.from('resume').select('*').eq('id', id).single();

        if (fetchError || !resume) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        if (!resume.file_url) {
            return NextResponse.json({ error: 'Resume has no associated file' }, { status: 400 });
        }

        // Download the PDF file from storage
        const downloadResult = await downloadResume(resume.file_url);

        if (!downloadResult.success || !downloadResult.data) {
            return NextResponse.json({ error: 'Failed to download resume file from storage' }, { status: 500 });
        }

        // Convert Blob to Buffer
        const arrayBuffer = await downloadResult.data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract text content from PDF
        let extractedContent = '';
        let extractionError: string | null = null;
        let metadata: any = null;

        try {
            const extractionResult = await extractTextFromPDF(buffer);

            if (extractionResult.success && extractionResult.content) {
                extractedContent = extractionResult.content;
                metadata = extractionResult.metadata;
            } else {
                extractionError = extractionResult.error?.message || 'Failed to extract text from PDF';
                console.error('PDF extraction failed:', extractionError);
            }
        } catch (error) {
            extractionError = 'Unexpected error during PDF text extraction';
            console.error('PDF extraction error:', error);
        }

        // Update the resume with extracted content
        const { data: updatedResume, error: updateError } = await supabase
            .from('resume')
            .update({
                content: extractedContent,
                // Optionally update metadata if you add metadata columns to the database
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Database update error:', updateError);

            return NextResponse.json({ error: 'Failed to update resume with extracted content' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: extractionError ? 'Resume processed with errors' : 'Resume processed successfully',
            resume: {
                id: updatedResume.id,
                filename: updatedResume.filename,
                hasContent: extractedContent.length > 0,
                contentLength: extractedContent.length
            },
            extraction: {
                success: !extractionError,
                error: extractionError,
                charactersExtracted: extractedContent.length,
                metadata
            }
        });
    } catch (error) {
        return handleApiError(error, {
            apiRoute: '/api/admin/resume/process',
            method: 'POST',
            errorMessage: 'Internal server error'
        });
    }
}

// GET /api/admin/resume/process - Get processing status for all resumes
export async function GET(_request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createSupabaseAdmin();

        // Get all resumes and check which ones have content
        const { data: resumes, error } = await supabase
            .from('resume')
            .select('id, filename, content, file_size, uploaded_at, is_active')
            .order('uploaded_at', { ascending: false });

        if (error) {
            console.error('Database query error:', error);

            return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 });
        }

        // Analyze processing status
        const processedResumes =
            resumes?.map((resume) => ({
                id: resume.id,
                filename: resume.filename,
                fileSize: resume.file_size,
                uploadedAt: resume.uploaded_at,
                isActive: resume.is_active,
                isProcessed: resume.content && resume.content.length > 0,
                contentLength: resume.content?.length || 0
            })) || [];

        const stats = {
            total: processedResumes.length,
            processed: processedResumes.filter((r) => r.isProcessed).length,
            unprocessed: processedResumes.filter((r) => !r.isProcessed).length
        };

        return NextResponse.json({
            success: true,
            stats,
            resumes: processedResumes
        });
    } catch (error) {
        return handleApiError(error, {
            apiRoute: '/api/admin/resume/process',
            method: 'GET',
            errorMessage: 'Internal server error'
        });
    }
}
