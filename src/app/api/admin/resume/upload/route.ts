import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase';
import { uploadResume, initializeStorageBucket } from '@/lib/storage';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10); // 10MB default

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse multipart form data
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type (must be PDF)
        if (file.type !== 'application/pdf') {
            return NextResponse.json(
                { error: 'Only PDF files are allowed' },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
            
            return NextResponse.json(
                { error: `File size must be less than ${maxSizeMB}MB` },
                { status: 400 }
            );
        }

        // Initialize storage bucket if needed
        const bucketInit = await initializeStorageBucket();
        if (!bucketInit.success) {
            console.error('Failed to initialize storage bucket:', bucketInit.error);
            // Continue anyway - bucket might already exist
        }

        // Convert File to Buffer for upload
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

        // Store metadata in database
        const resumeData = {
            filename: file.name,
            content: '', // Content will be extracted in Step 19 with LangChain
            file_size: file.size,
            mime_type: file.type,
            file_url: uploadResult.path, // Storage path
            is_active: true
        };

        const { data: resume, error: insertError } = await supabase
            .from('resume')
            .insert(resumeData)
            .select()
            .single();

        if (insertError) {
            console.error('Database insert error:', insertError);
            
return NextResponse.json(
                { error: 'Failed to save resume metadata' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Resume uploaded successfully',
            resume: {
                id: resume.id,
                filename: resume.filename,
                fileSize: resume.file_size,
                uploadedAt: resume.uploaded_at,
                isActive: resume.is_active
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        
return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
