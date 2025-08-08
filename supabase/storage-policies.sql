-- Storage bucket configuration for resumes
-- This file documents the storage policies but bucket creation is handled via the Storage API

-- The 'resumes' bucket is created with these settings:
-- - public: false (private access only)
-- - fileSizeLimit: 10485760 (10MB)
-- - allowedMimeTypes: ['application/pdf']

-- Storage bucket policies ensure:
-- 1. Files are private by default
-- 2. Access only through signed URLs generated server-side
-- 3. No direct public access to resume files
-- 4. Service role key required for all operations

-- Note: The actual bucket creation is handled programmatically in src/lib/storage.ts
-- using the initializeStorageBucket() function which should be called during setup

-- RLS policies for storage (if needed in future):
-- All bucket operations require service role authentication
-- No public read/write access is allowed
-- Files can only be accessed via signed URLs with expiration