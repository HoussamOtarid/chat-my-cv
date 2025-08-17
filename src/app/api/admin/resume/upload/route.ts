import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { extractTextFromPDF } from '@/lib/langchain';
import { initializeStorageBucket, uploadResume } from '@/lib/storage';
import { createSupabaseAdmin } from '@/lib/supabase';

import { getServerSession } from 'next-auth';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10); // 10MB default

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse multipart form data
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type (must be PDF)
        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);

            return NextResponse.json({ error: `File size must be less than ${maxSizeMB}MB` }, { status: 400 });
        }

        // Initialize storage bucket if needed
        const bucketInit = await initializeStorageBucket();
        if (!bucketInit.success) {
            console.error('Failed to initialize storage bucket:', bucketInit.error);
            // Continue anyway - bucket might already exist
        }

        // Convert File to Buffer for upload and processing
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload file to Supabase Storage
        const uploadResult = await uploadResume({
            file: buffer,
            filename: file.name,
            contentType: file.type
        });

        if (!uploadResult.success || !uploadResult.path) {
            return NextResponse.json(
                { error: uploadResult.error?.message || 'Failed to upload file' },
                { status: 500 }
            );
        }

        // Extract text content from PDF
        let extractedContent = '';
        let extractionError: string | null = null;

        try {
            const extractionResult = await extractTextFromPDF(buffer);

            if (extractionResult.success && extractionResult.content) {
                extractedContent = extractionResult.content;
                console.log(`Successfully extracted ${extractedContent.length} characters from PDF`);
            } else {
                extractionError = extractionResult.error?.message || 'Failed to extract text from PDF';
                console.error('PDF extraction failed:', extractionError);
            }
        } catch (error) {
            extractionError = 'Unexpected error during PDF text extraction';
            console.error('PDF extraction error:', error);
        }

        // Get Supabase admin client
        const supabase = await createSupabaseAdmin();

        // Deactivate any existing active resumes
        const { error: deactivateError } = await supabase
            .from('resume')
            .update({ is_active: false })
            .eq('is_active', true);

        if (deactivateError) {
            console.error('Error deactivating existing resumes:', deactivateError);
            // Continue anyway - this is not critical
        }

        // Store metadata and extracted content in database
        const resumeData = {
            filename: file.name,
            content: extractedContent, // Store the extracted text content
            file_size: file.size,
            mime_type: file.type,
            file_url: uploadResult.path, // Storage path
            is_active: true
        };

        const { data: resume, error: insertError } = await supabase.from('resume').insert(resumeData).select().single();

        if (insertError) {
            console.error('Database insert error:', insertError);

            return NextResponse.json({ error: 'Failed to save resume metadata' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Resume uploaded successfully',
            resume: {
                id: resume.id,
                filename: resume.filename,
                fileSize: resume.file_size,
                uploadedAt: resume.uploaded_at,
                isActive: resume.is_active,
                hasContent: extractedContent.length > 0,
                contentLength: extractedContent.length
            },
            extraction: {
                success: !extractionError,
                error: extractionError,
                charactersExtracted: extractedContent.length
            }
        });
    } catch (error) {
        console.error('Upload error:', error);

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
