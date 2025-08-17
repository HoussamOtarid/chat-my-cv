import { createSupabaseAdmin } from './supabase';

const RESUME_BUCKET = 'resumes';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10); // 10MB default

export interface UploadResumeOptions {
    file: File | Buffer;
    filename: string;
    contentType?: string;
}

export interface StorageError {
    message: string;
    error?: any;
}

/**
 * Initialize the storage bucket for resumes if it doesn't exist
 * This should be called during application setup
 */
export async function initializeStorageBucket(): Promise<{ success: boolean; error?: StorageError }> {
    try {
        const supabase = await createSupabaseAdmin();

        // Check if bucket exists
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            return {
                success: false,
                error: { message: 'Failed to list buckets', error: listError }
            };
        }

        const bucketExists = buckets?.some((bucket) => bucket.name === RESUME_BUCKET);

        if (!bucketExists) {
            // Create the bucket with private access
            const { error: createError } = await supabase.storage.createBucket(RESUME_BUCKET, {
                public: false, // Private bucket - files served via signed URLs only
                fileSizeLimit: MAX_FILE_SIZE,
                allowedMimeTypes: ['application/pdf']
            });

            if (createError) {
                return {
                    success: false,
                    error: { message: 'Failed to create bucket', error: createError }
                };
            }
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: { message: 'Unexpected error initializing storage', error }
        };
    }
}

/**
 * Upload a resume file to Supabase Storage
 */
export async function uploadResume(
    options: UploadResumeOptions
): Promise<{ success: boolean; path?: string; error?: StorageError }> {
    try {
        const supabase = await createSupabaseAdmin();

        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const sanitizedFilename = options.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${timestamp}_${sanitizedFilename}`;

        // Upload file to storage
        const { data, error } = await supabase.storage.from(RESUME_BUCKET).upload(storagePath, options.file, {
            contentType: options.contentType || 'application/pdf',
            upsert: false
        });

        if (error) {
            return {
                success: false,
                error: { message: 'Failed to upload file', error }
            };
        }

        return {
            success: true,
            path: data.path
        };
    } catch (error) {
        return {
            success: false,
            error: { message: 'Unexpected error uploading file', error }
        };
    }
}

/**
 * Generate a signed URL for temporary access to a resume file
 * URLs expire after 1 hour by default
 */
export async function getSignedUrl(
    path: string,
    expiresIn: number = 3600
): Promise<{ success: boolean; url?: string; error?: StorageError }> {
    try {
        const supabase = await createSupabaseAdmin();

        const { data, error } = await supabase.storage.from(RESUME_BUCKET).createSignedUrl(path, expiresIn);

        if (error) {
            return {
                success: false,
                error: { message: 'Failed to generate signed URL', error }
            };
        }

        return {
            success: true,
            url: data.signedUrl
        };
    } catch (error) {
        return {
            success: false,
            error: { message: 'Unexpected error generating signed URL', error }
        };
    }
}

/**
 * Download a resume file from storage
 */
export async function downloadResume(path: string): Promise<{ success: boolean; data?: Blob; error?: StorageError }> {
    try {
        const supabase = await createSupabaseAdmin();

        const { data, error } = await supabase.storage.from(RESUME_BUCKET).download(path);

        if (error) {
            return {
                success: false,
                error: { message: 'Failed to download file', error }
            };
        }

        return {
            success: true,
            data
        };
    } catch (error) {
        return {
            success: false,
            error: { message: 'Unexpected error downloading file', error }
        };
    }
}

/**
 * Delete a resume file from storage
 */
export async function deleteResume(path: string): Promise<{ success: boolean; error?: StorageError }> {
    try {
        const supabase = await createSupabaseAdmin();

        const { error } = await supabase.storage.from(RESUME_BUCKET).remove([path]);

        if (error) {
            return {
                success: false,
                error: { message: 'Failed to delete file', error }
            };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: { message: 'Unexpected error deleting file', error }
        };
    }
}

/**
 * List all resume files in storage
 */
export async function listResumes(): Promise<{
    success: boolean;
    files?: Array<{ name: string; id: string; created_at: string; updated_at: string }>;
    error?: StorageError;
}> {
    try {
        const supabase = await createSupabaseAdmin();

        const { data, error } = await supabase.storage.from(RESUME_BUCKET).list();

        if (error) {
            return {
                success: false,
                error: { message: 'Failed to list files', error }
            };
        }

        return {
            success: true,
            files: data || []
        };
    } catch (error) {
        return {
            success: false,
            error: { message: 'Unexpected error listing files', error }
        };
    }
}

/**
 * Validate file before upload
 */
export function validateResumeFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (file.type !== 'application/pdf') {
        return {
            valid: false,
            error: 'Only PDF files are allowed'
        };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);

        return {
            valid: false,
            error: `File size must be less than ${maxSizeMB}MB`
        };
    }

    return { valid: true };
}
