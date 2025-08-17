'use client';

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ChatInterface } from '@/components/chat';
import { ConnectionStatusIndicator } from '@/components/connection-status';
import { NoConfigurationEmptyState, NoResumeEmptyState } from '@/components/empty-states';
import { AppLayout } from '@/components/layout';
import { Alert, AlertDescription } from '@/registry/new-york-v4/ui/alert';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Skeleton } from '@/registry/new-york-v4/ui/skeleton';

import { AlertCircle, ArrowLeft } from 'lucide-react';

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

                // Check configuration (simplified check)
                // In production, you might want to check the actual configuration endpoint
                setHasConfiguration(true); // Assume configured for now
            } catch (err) {
                console.error('Requirements check error:', err);
                // Assume everything exists if we can't check (optimistic)
                setHasActiveResume(true);
                setHasConfiguration(true);
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
                    <NoResumeEmptyState className='mx-auto max-w-md' actionHref='/admin/login' />
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
                    <NoConfigurationEmptyState className='mx-auto max-w-md' actionHref='/admin' />
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
            <ConnectionStatusIndicator showBanner position='top' />
            <div className='container mx-auto max-w-4xl px-4 py-4'>
                <div className='bg-background h-[calc(100vh-8rem)] overflow-hidden rounded-lg border shadow-sm'>
                    <ChatInterface
                        className='h-full'
                        welcomeMessage="Welcome! Ask me anything about this person's background, skills, or experience."
                        placeholder='Ask a question about their experience...'
                        showSuggestedQuestions={true}
                        onMessageSent={(message) => {
                            console.log('Message sent:', message);
                        }}
                        onMessageReceived={(message) => {
                            console.log('Message received:', message);
                        }}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
