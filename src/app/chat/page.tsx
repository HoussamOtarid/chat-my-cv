'use client';

import React, { Suspense, lazy, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { AppLayout } from '@/components/layout';
import { Alert, AlertDescription } from '@/registry/new-york-v4/ui/alert';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Skeleton } from '@/registry/new-york-v4/ui/skeleton';

import { AlertCircle, ArrowLeft } from 'lucide-react';

// Lazy load heavy components
const ChatInterface = lazy(() => import('@/components/chat').then((mod) => ({ default: mod.ChatInterface })));
const ConnectionStatusIndicator = lazy(() =>
    import('@/components/connection-status').then((mod) => ({ default: mod.ConnectionStatusIndicator }))
);
const NoResumeEmptyState = lazy(() =>
    import('@/components/empty-states').then((mod) => ({ default: mod.NoResumeEmptyState }))
);
const NoConfigurationEmptyState = lazy(() =>
    import('@/components/empty-states').then((mod) => ({ default: mod.NoConfigurationEmptyState }))
);

/**
 * Public chat page component
 * Main interface for users to interact with the AI resume chat
 */
export default function ChatPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [hasActiveResume, setHasActiveResume] = useState<boolean | null>(null);
    const [hasConfiguration, setHasConfiguration] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Check if there's an active resume and configuration
    useEffect(() => {
        const checkRequirements = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Check if resume endpoint exists and has active resume
                const resumeResponse = await fetch('/api/resume/current', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (resumeResponse.ok) {
                    const data = await resumeResponse.json();
                    setHasActiveResume(!!data.resume);
                } else if (resumeResponse.status === 404) {
                    // Endpoint doesn't exist yet or no active resume
                    setHasActiveResume(false);
                } else {
                    throw new Error('Failed to check resume status');
                }

                // Check configuration status
                const configResponse = await fetch('/api/config/status', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (configResponse.ok) {
                    const configData = await configResponse.json();
                    setHasConfiguration(configData.configured);
                } else {
                    // If we can't check, assume it's not configured
                    setHasConfiguration(false);
                }
            } catch (err) {
                console.error('Requirements check error:', err);
                // If we can't check requirements, show an error
                setError('Unable to verify application requirements. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        checkRequirements();
    }, []);

    // Loading state
    if (isLoading) {
        return (
            <AppLayout>
                <div className='container mx-auto px-4 py-8'>
                    <Skeleton className='h-[600px] w-full rounded-lg' />
                </div>
            </AppLayout>
        );
    }

    // Error state
    if (error) {
        return (
            <AppLayout>
                <div className='container mx-auto px-4 py-16'>
                    <Alert variant='destructive' className='mx-auto max-w-2xl'>
                        <AlertCircle className='h-4 w-4' />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <div className='mt-4 flex justify-center'>
                        <Button onClick={() => router.push('/')}>
                            <ArrowLeft className='mr-2 h-4 w-4' />
                            Back to Home
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // No resume state
    if (hasActiveResume === false) {
        return (
            <AppLayout>
                <div className='container mx-auto px-4 py-16'>
                    <Suspense fallback={<Skeleton className='mx-auto h-64 max-w-md' />}>
                        <NoResumeEmptyState className='mx-auto max-w-md' actionHref='/admin/login' />
                    </Suspense>
                    <div className='mt-4 flex justify-center'>
                        <Button onClick={() => router.push('/')} variant='outline'>
                            <ArrowLeft className='mr-2 h-4 w-4' />
                            Back to Home
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // No configuration state
    if (hasConfiguration === false) {
        return (
            <AppLayout>
                <div className='container mx-auto px-4 py-16'>
                    <Suspense fallback={<Skeleton className='mx-auto h-64 max-w-md' />}>
                        <NoConfigurationEmptyState className='mx-auto max-w-md' actionHref='/admin/settings' />
                    </Suspense>
                    <div className='mt-4 flex justify-center'>
                        <Button onClick={() => router.push('/')} variant='outline'>
                            <ArrowLeft className='mr-2 h-4 w-4' />
                            Back to Home
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Suspense fallback={null}>
                <ConnectionStatusIndicator showBanner position='top' />
            </Suspense>
            <div className='container mx-auto flex h-full max-w-4xl flex-col px-4 py-4'>
                <div className='bg-background flex flex-1 flex-col overflow-hidden rounded-lg border shadow-sm'>
                    <Suspense fallback={<Skeleton className='h-full' />}>
                        <ChatInterface
                            className='h-full'
                            welcomeMessage="Welcome! Ask me anything about this person's background, skills, or experience."
                            placeholder='Ask a question about their experience...'
                            showSuggestedQuestions={true}
                            onMessageSent={() => {
                            }}
                            onMessageReceived={() => {
                            }}
                        />
                    </Suspense>
                </div>
            </div>
        </AppLayout>
    );
}
