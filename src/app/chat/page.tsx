'use client';

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ChatInterface } from '@/components/chat';
import { AppLayout } from '@/components/layout';
import { Alert, AlertDescription } from '@/registry/new-york-v4/ui/alert';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Skeleton } from '@/registry/new-york-v4/ui/skeleton';

import { AlertCircle, ArrowLeft, FileText, Settings } from 'lucide-react';

/**
 * Public chat page component
 * Main interface for users to interact with the AI resume chat
 */
export default function ChatPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [hasActiveResume, setHasActiveResume] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Check if there's an active resume
    useEffect(() => {
        const checkResume = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Check if resume endpoint exists and has active resume
                const response = await fetch('/api/resume/current', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setHasActiveResume(!!data.resume);
                } else if (response.status === 404) {
                    // Endpoint doesn't exist yet or no active resume
                    setHasActiveResume(false);
                } else {
                    throw new Error('Failed to check resume status');
                }
            } catch (err) {
                console.error('Resume check error:', err);
                // Assume resume exists if we can't check (optimistic)
                setHasActiveResume(true);
            } finally {
                setIsLoading(false);
            }
        };

        checkResume();
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
                    <div className='mx-auto max-w-md space-y-6 text-center'>
                        <div className='bg-muted mx-auto flex h-20 w-20 items-center justify-center rounded-full p-4'>
                            <FileText className='text-muted-foreground h-10 w-10' />
                        </div>
                        <h2 className='text-2xl font-semibold'>No Resume Available</h2>
                        <p className='text-muted-foreground'>
                            The administrator hasn't uploaded a resume yet. Please check back later or contact the site
                            owner.
                        </p>
                        <div className='flex flex-col justify-center gap-4 sm:flex-row'>
                            <Button onClick={() => router.push('/')}>
                                <ArrowLeft className='mr-2 h-4 w-4' />
                                Back to Home
                            </Button>
                            <Button variant='outline' onClick={() => router.push('/admin/login')}>
                                <Settings className='mr-2 h-4 w-4' />
                                Admin Login
                            </Button>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className='container mx-auto max-w-4xl px-4 py-4'>
                <div className='h-[calc(100vh-8rem)] overflow-hidden rounded-lg border bg-background shadow-sm'>
                    <ChatInterface
                        className='h-full'
                        welcomeMessage="Welcome! Ask me anything about this person's background, skills, or experience."
                        placeholder="Ask a question about their experience..."
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
