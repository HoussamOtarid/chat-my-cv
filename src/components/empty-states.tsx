'use client';

import React from 'react';

import Link from 'next/link';

import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/registry/new-york-v4/ui/alert';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

import { AlertCircle, Bot, FileX, MessageSquareOff, Settings, Upload, WifiOff } from 'lucide-react';

interface EmptyStateProps {
    className?: string;
    action?: () => void;
    actionLabel?: string;
    actionHref?: string;
}

/**
 * No Resume Empty State
 * Shown when no resume is uploaded in the system
 */
export function NoResumeEmptyState({ className, actionHref = '/admin/resume' }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
            <div className='bg-muted mb-4 rounded-full p-4'>
                <FileX className='text-muted-foreground h-8 w-8' />
            </div>
            <h3 className='mb-2 text-lg font-semibold'>No Resume Available</h3>
            <p className='text-muted-foreground mb-6 max-w-sm text-sm'>
                The chat system needs a resume to be uploaded before it can answer questions.
            </p>
            {actionHref && (
                <Button asChild variant='default'>
                    <Link href={actionHref}>
                        <Upload className='mr-2 h-4 w-4' />
                        Upload Resume
                    </Link>
                </Button>
            )}
        </div>
    );
}

/**
 * No Configuration Empty State
 * Shown when LLM is not configured
 */
export function NoConfigurationEmptyState({ className, actionHref = '/admin' }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
            <div className='bg-muted mb-4 rounded-full p-4'>
                <Settings className='text-muted-foreground h-8 w-8' />
            </div>
            <h3 className='mb-2 text-lg font-semibold'>Configuration Required</h3>
            <p className='text-muted-foreground mb-6 max-w-sm text-sm'>
                Please configure an LLM provider and API key to enable the chat functionality.
            </p>
            {actionHref && (
                <Button asChild variant='default'>
                    <Link href={actionHref}>
                        <Settings className='mr-2 h-4 w-4' />
                        Configure Settings
                    </Link>
                </Button>
            )}
        </div>
    );
}

/**
 * Chat Unavailable Empty State
 * Shown when chat is temporarily unavailable
 */
export function ChatUnavailableEmptyState({ className, action }: EmptyStateProps) {
    return (
        <Card className={cn('border-dashed', className)}>
            <CardHeader>
                <div className='flex items-center gap-2'>
                    <MessageSquareOff className='text-muted-foreground h-5 w-5' />
                    <CardTitle>Chat Temporarily Unavailable</CardTitle>
                </div>
                <CardDescription>The chat service is currently unavailable. This could be due to:</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className='text-muted-foreground mb-4 space-y-2 text-sm'>
                    <li className='flex items-start gap-2'>
                        <span className='text-muted-foreground mt-0.5'>•</span>
                        <span>No resume has been uploaded yet</span>
                    </li>
                    <li className='flex items-start gap-2'>
                        <span className='text-muted-foreground mt-0.5'>•</span>
                        <span>LLM provider is not configured</span>
                    </li>
                    <li className='flex items-start gap-2'>
                        <span className='text-muted-foreground mt-0.5'>•</span>
                        <span>API key is invalid or expired</span>
                    </li>
                    <li className='flex items-start gap-2'>
                        <span className='text-muted-foreground mt-0.5'>•</span>
                        <span>Service is undergoing maintenance</span>
                    </li>
                </ul>
                {action && (
                    <Button onClick={action} variant='outline' className='w-full'>
                        Try Again
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * No Messages Empty State
 * Shown when conversation is empty
 */
export function NoMessagesEmptyState({ className }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
            <div className='bg-primary/10 mb-4 rounded-full p-4'>
                <Bot className='text-primary h-8 w-8' />
            </div>
            <h3 className='mb-2 text-lg font-semibold'>Ready to Chat</h3>
            <p className='text-muted-foreground max-w-sm text-sm'>
                Ask me anything about the resume. I can help with experience, skills, education, and more.
            </p>
        </div>
    );
}

/**
 * API Error Empty State
 * Shown when LLM API fails
 */
export function ApiErrorEmptyState({ className, error, action }: EmptyStateProps & { error?: string }) {
    const isRateLimit = error?.toLowerCase().includes('rate') || error?.toLowerCase().includes('429');
    const isQuota = error?.toLowerCase().includes('quota') || error?.toLowerCase().includes('limit exceeded');
    const isAuth =
        error?.toLowerCase().includes('401') ||
        error?.toLowerCase().includes('403') ||
        error?.toLowerCase().includes('unauthorized');

    let title = 'API Error';
    let description = 'The AI service encountered an error. Please try again.';
    const icon = <AlertCircle className='text-destructive h-8 w-8' />;

    if (isRateLimit) {
        title = 'Rate Limited';
        description = 'Too many requests. Please wait a moment before trying again.';
    } else if (isQuota) {
        title = 'Quota Exceeded';
        description = 'The API quota has been exceeded. Please contact the administrator.';
    } else if (isAuth) {
        title = 'Authentication Failed';
        description = 'The API key is invalid or expired. Please check the configuration.';
    }

    return (
        <Alert variant='destructive' className={cn('', className)}>
            <div className='flex items-start gap-3'>
                <div className='mt-0.5'>{icon}</div>
                <div className='flex-1'>
                    <h3 className='mb-1 text-sm font-semibold'>{title}</h3>
                    <AlertDescription className='text-xs'>
                        {description}
                        {error && process.env.NODE_ENV === 'development' && (
                            <div className='mt-2 font-mono text-xs opacity-70'>{error}</div>
                        )}
                    </AlertDescription>
                    {action && !isAuth && (
                        <Button onClick={action} variant='outline' size='sm' className='mt-3'>
                            Try Again
                        </Button>
                    )}
                </div>
            </div>
        </Alert>
    );
}

/**
 * Offline Empty State
 * Shown when the app is offline
 */
export function OfflineEmptyState({ className, action }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
            <div className='bg-muted mb-4 rounded-full p-4'>
                <WifiOff className='text-muted-foreground h-8 w-8' />
            </div>
            <h3 className='mb-2 text-lg font-semibold'>You're Offline</h3>
            <p className='text-muted-foreground mb-6 max-w-sm text-sm'>
                Please check your internet connection and try again.
            </p>
            {action && (
                <Button onClick={action} variant='outline'>
                    Retry Connection
                </Button>
            )}
        </div>
    );
}

/**
 * Generic Empty State
 * Customizable empty state for any scenario
 */
export function EmptyState({
    icon,
    title,
    description,
    action,
    actionLabel = 'Try Again',
    actionHref,
    className
}: EmptyStateProps & {
    icon?: React.ReactNode;
    title: string;
    description?: string;
}) {
    return (
        <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
            {icon && <div className='bg-muted mb-4 rounded-full p-4'>{icon}</div>}
            <h3 className='mb-2 text-lg font-semibold'>{title}</h3>
            {description && <p className='text-muted-foreground mb-6 max-w-sm text-sm'>{description}</p>}
            {actionHref ? (
                <Button asChild variant='default'>
                    <Link href={actionHref}>{actionLabel}</Link>
                </Button>
            ) : action ? (
                <Button onClick={action} variant='default'>
                    {actionLabel}
                </Button>
            ) : null}
        </div>
    );
}
