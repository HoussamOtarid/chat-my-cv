'use client';

import { lazy, Suspense, useEffect, useState } from 'react';

import { Skeleton } from '@/registry/new-york-v4/ui/skeleton';
import type { LLMConfig } from '@/types';

import { Loader2 } from 'lucide-react';

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
            <div className='flex h-64 items-center justify-center'>
                <Loader2 className='h-8 w-8 animate-spin' />
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
