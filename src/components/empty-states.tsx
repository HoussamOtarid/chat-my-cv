'use client';

import React from 'react';

import Link from 'next/link';

import { cn } from '@/lib/utils';
import { Button } from '@/registry/new-york-v4/ui/button';

import { FileX, Settings, Upload } from 'lucide-react';

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
