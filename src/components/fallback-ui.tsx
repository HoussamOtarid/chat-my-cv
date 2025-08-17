'use client';

import React from 'react';

import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/registry/new-york-v4/ui/alert';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

import { AlertCircle, FileX, Home, RefreshCw, ServerCrash, ShieldAlert, WifiOff } from 'lucide-react';

interface FallbackProps {
    error?: Error | null;
    retry?: () => void;
    reset?: () => void;
    className?: string;
}

/**
 * Network Error Fallback
 */
export function NetworkErrorFallback({ error, retry, className }: FallbackProps) {
    return (
        <div className={cn('flex items-center justify-center p-4', className)}>
            <Card className='w-full max-w-md'>
                <CardHeader>
                    <div className='flex items-center gap-2'>
                        <WifiOff className='text-destructive h-5 w-5' />
                        <CardTitle>Connection Lost</CardTitle>
                    </div>
                    <CardDescription>
                        Unable to connect to the server. Please check your internet connection and try again.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && process.env.NODE_ENV === 'development' && (
                        <Alert variant='destructive' className='mb-4'>
                            <AlertDescription className='font-mono text-xs'>{error.message}</AlertDescription>
                        </Alert>
                    )}
                    <Button onClick={retry} className='w-full'>
                        <RefreshCw className='mr-2 h-4 w-4' />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * API Error Fallback
 */
export function ApiErrorFallback({ error, retry, className }: FallbackProps) {
    const is429 = error?.message?.includes('429') || error?.message?.includes('rate limit');
    const is401 = error?.message?.includes('401') || error?.message?.includes('unauthorized');
    const is403 = error?.message?.includes('403') || error?.message?.includes('forbidden');
    const is404 = error?.message?.includes('404') || error?.message?.includes('not found');
    const is500 = error?.message?.includes('500') || error?.message?.includes('server error');

    let title = 'Request Failed';
    let description = 'The request could not be completed. Please try again.';
    let icon = <AlertCircle className='text-destructive h-5 w-5' />;

    if (is429) {
        title = 'Too Many Requests';
        description = "You've made too many requests. Please wait a moment before trying again.";
        icon = <ShieldAlert className='text-warning h-5 w-5' />;
    } else if (is401 || is403) {
        title = 'Access Denied';
        description = "You don't have permission to access this resource.";
        icon = <ShieldAlert className='text-destructive h-5 w-5' />;
    } else if (is404) {
        title = 'Not Found';
        description = 'The requested resource could not be found.';
        icon = <FileX className='text-destructive h-5 w-5' />;
    } else if (is500) {
        title = 'Server Error';
        description = 'An error occurred on the server. Please try again later.';
        icon = <ServerCrash className='text-destructive h-5 w-5' />;
    }

    return (
        <div className={cn('flex items-center justify-center p-4', className)}>
            <Card className='w-full max-w-md'>
                <CardHeader>
                    <div className='flex items-center gap-2'>
                        {icon}
                        <CardTitle>{title}</CardTitle>
                    </div>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='flex gap-2'>
                        {!is401 && !is403 && (
                            <Button onClick={retry} variant='default' className='flex-1'>
                                <RefreshCw className='mr-2 h-4 w-4' />
                                Try Again
                            </Button>
                        )}
                        <Button onClick={() => (window.location.href = '/')} variant='outline' className='flex-1'>
                            <Home className='mr-2 h-4 w-4' />
                            Go Home
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Loading Error Fallback
 */
export function LoadingErrorFallback({ retry, className }: FallbackProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center gap-4 p-8', className)}>
            <AlertCircle className='text-muted-foreground h-12 w-12' />
            <div className='text-center'>
                <h3 className='font-semibold'>Failed to Load</h3>
                <p className='text-muted-foreground mt-1 text-sm'>We couldn't load this content. Please try again.</p>
            </div>
            <Button onClick={retry} variant='outline' size='sm'>
                <RefreshCw className='mr-2 h-4 w-4' />
                Retry
            </Button>
        </div>
    );
}

/**
 * Component Error Fallback
 */
export function ComponentErrorFallback({ error, retry, className }: FallbackProps) {
    return (
        <Alert variant='destructive' className={className}>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
                <p>This component failed to load properly.</p>
                {error && process.env.NODE_ENV === 'development' && (
                    <p className='mt-2 font-mono text-xs'>{error.message}</p>
                )}
                {retry && (
                    <Button onClick={retry} variant='outline' size='sm' className='mt-2'>
                        Try Again
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
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

/**
 * Generic Error Fallback
 */
export function GenericErrorFallback({ error, retry, className }: FallbackProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center gap-4 p-8', className)}>
            <div className='bg-destructive/10 rounded-full p-3'>
                <AlertCircle className='text-destructive h-6 w-6' />
            </div>
            <div className='max-w-sm text-center'>
                <h3 className='text-lg font-semibold'>Something went wrong</h3>
                <p className='text-muted-foreground mt-2 text-sm'>
                    An unexpected error occurred. Please try again or contact support if the problem persists.
                </p>
                {error && process.env.NODE_ENV === 'development' && (
                    <p className='text-destructive mt-3 font-mono text-xs'>{error.message}</p>
                )}
            </div>
            <div className='flex gap-2'>
                {retry && (
                    <Button onClick={retry} variant='default'>
                        <RefreshCw className='mr-2 h-4 w-4' />
                        Try Again
                    </Button>
                )}
                <Button onClick={() => (window.location.href = '/')} variant='outline'>
                    Go Home
                </Button>
            </div>
        </div>
    );
}
