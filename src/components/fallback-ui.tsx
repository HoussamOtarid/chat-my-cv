'use client';

import React from 'react';

import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/registry/new-york-v4/ui/alert';
import { Button } from '@/registry/new-york-v4/ui/button';

import { AlertCircle, RefreshCw } from 'lucide-react';

interface FallbackProps {
    error?: Error | null;
    retry?: () => void;
    reset?: () => void;
    className?: string;
}


/**
 * Chat Error Fallback
 */
export function ChatErrorFallback({ error, retry, className }: FallbackProps) {
    const isRateLimit = error?.message?.includes('rate limit');
    const isNoResume = error?.message?.includes('resume') || error?.message?.includes('not configured');

    return (
        <div className={cn('bg-muted/50 rounded-lg border p-6', className)}>
            <div className='flex items-start gap-3'>
                <AlertCircle className='text-destructive mt-0.5 h-5 w-5' />
                <div className='flex-1'>
                    <h3 className='font-semibold'>
                        {isRateLimit ? 'Rate Limited' : isNoResume ? 'Not Available' : 'Chat Error'}
                    </h3>
                    <p className='text-muted-foreground mt-1 text-sm'>
                        {isRateLimit
                            ? "You've sent too many messages. Please wait a moment."
                            : isNoResume
                              ? 'The chat system is not configured yet. Please check back later.'
                              : 'Unable to send your message. Please try again.'}
                    </p>
                    {!isNoResume && retry && (
                        <Button onClick={retry} variant='outline' size='sm' className='mt-3'>
                            <RefreshCw className='mr-1 h-3 w-3' />
                            Retry
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Upload Error Fallback
 */
export function UploadErrorFallback({ error, retry, reset, className }: FallbackProps) {
    const isSizeError = error?.message?.includes('size') || error?.message?.includes('too large');
    const isTypeError = error?.message?.includes('type') || error?.message?.includes('PDF');

    return (
        <Alert variant='destructive' className={className}>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
                <p className='font-semibold'>Upload Failed</p>
                <p className='mt-1 text-sm'>
                    {isSizeError
                        ? 'File is too large. Maximum size is 10MB.'
                        : isTypeError
                          ? 'Invalid file type. Only PDF files are accepted.'
                          : 'Failed to upload the file. Please try again.'}
                </p>
                <div className='mt-3 flex gap-2'>
                    {retry && (
                        <Button onClick={retry} variant='outline' size='sm'>
                            Try Again
                        </Button>
                    )}
                    {reset && (
                        <Button onClick={reset} variant='ghost' size='sm'>
                            Choose Different File
                        </Button>
                    )}
                </div>
            </AlertDescription>
        </Alert>
    );
}

