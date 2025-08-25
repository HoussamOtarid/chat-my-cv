'use client';

import { lazy, Suspense, useEffect, useState } from 'react';

import { Card, CardContent, CardHeader } from '@/registry/new-york-v4/ui/card';
import { Skeleton } from '@/registry/new-york-v4/ui/skeleton';
import type { LLMConfig } from '@/types';

// Lazy load heavy components
const LLMConfiguration = lazy(() =>
    import('@/components/admin/LLMConfiguration').then((mod) => ({ default: mod.LLMConfiguration }))
);

interface AppConfiguration {
    llm?: LLMConfig;
}

export default function AdminSettingsPage() {
    const [config, setConfig] = useState<AppConfiguration>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConfiguration();
    }, []);

    const fetchConfiguration = async () => {
        try {
            const response = await fetch('/api/admin/config');
            if (response.ok) {
                const data = await response.json();
                setConfig({ llm: data.llm });
            }
        } catch (error) {
            console.error('Failed to fetch configuration:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLLMConfig = async (llmConfig: LLMConfig) => {
        const response = await fetch('/api/admin/config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                llm: llmConfig
            })
        });

        if (response.ok) {
            setConfig({ llm: llmConfig });
        } else {
            throw new Error('Failed to save configuration');
        }
    };

    if (loading) {
        return (
            <div className='container mx-auto max-w-6xl space-y-6 px-4 py-8'>
                {/* Page Header Skeleton */}
                <div>
                    <Skeleton className='h-9 w-32 mb-2' />
                    <Skeleton className='h-5 w-80' />
                </div>

                {/* LLM Configuration Card Skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className='h-7 w-48 mb-2' />
                        <Skeleton className='h-4 w-64' />
                    </CardHeader>
                    <CardContent className='space-y-6'>
                        {/* Provider Selection Skeleton */}
                        <div className='space-y-2'>
                            <Skeleton className='h-4 w-24 mb-2' />
                            <Skeleton className='h-10 w-full' />
                        </div>

                        {/* API Key Input Skeleton */}
                        <div className='space-y-2'>
                            <Skeleton className='h-4 w-20 mb-2' />
                            <Skeleton className='h-10 w-full' />
                        </div>

                        {/* Model Selection Skeleton */}
                        <div className='space-y-2'>
                            <Skeleton className='h-4 w-16 mb-2' />
                            <Skeleton className='h-10 w-full' />
                        </div>

                        {/* Advanced Settings Skeleton */}
                        <div className='border-t pt-4'>
                            <Skeleton className='h-5 w-40 mb-4' />
                            <div className='grid gap-4 md:grid-cols-2'>
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className='space-y-2'>
                                        <Skeleton className='h-4 w-24' />
                                        <Skeleton className='h-10 w-full' />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons Skeleton */}
                        <div className='flex gap-2 pt-4'>
                            <Skeleton className='h-10 w-32' />
                            <Skeleton className='h-10 w-24' />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className='container mx-auto max-w-6xl space-y-6 px-4 py-8'>
            <div>
                <h1 className='text-3xl font-bold'>Settings</h1>
                <p className='text-muted-foreground'>Configure your LLM provider and API settings</p>
            </div>

            {/* LLM Configuration */}
            <Suspense fallback={<Skeleton className='h-96 w-full' />}>
                <LLMConfiguration initialConfig={config.llm} onSave={handleSaveLLMConfig} />
            </Suspense>
        </div>
    );
}
