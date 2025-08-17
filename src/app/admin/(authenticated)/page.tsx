'use client';

import { useEffect, useState } from 'react';

import { LLMConfiguration } from '@/components/admin/LLMConfiguration';
import { Alert, AlertDescription } from '@/registry/new-york-v4/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Label } from '@/registry/new-york-v4/ui/label';
import { Textarea } from '@/registry/new-york-v4/ui/textarea';
import type { LLMConfig } from '@/types';

import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface AppConfiguration {
    llm?: LLMConfig;
    system_prompt?: string;
    welcome_message?: string;
}

export default function AdminDashboard() {
    const [config, setConfig] = useState<AppConfiguration>({
        welcome_message: 'Welcome! Ask me anything about my professional background, skills, or experience.'
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchConfiguration();
    }, []);

    const fetchConfiguration = async () => {
        try {
            const response = await fetch('/api/admin/config');
            if (response.ok) {
                const data = await response.json();
                setConfig(data);
            }
        } catch (error) {
            console.error('Failed to fetch configuration:', error);
            setMessage({ type: 'error', text: 'Failed to load configuration' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLLMConfig = async (llmConfig: LLMConfig) => {
        const response = await fetch('/api/admin/config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...config,
                llm: llmConfig
            })
        });

        if (response.ok) {
            setConfig({ ...config, llm: llmConfig });
        } else {
            throw new Error('Failed to save configuration');
        }
    };

    const handleSaveChatSettings = async () => {
        setMessage(null);

        try {
            const response = await fetch('/api/admin/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Chat settings saved successfully' });
            } else {
                throw new Error('Failed to save configuration');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save chat settings' });
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
        <div className='space-y-6'>
            <div>
                <h1 className='text-3xl font-bold'>Dashboard</h1>
                <p className='text-muted-foreground'>Configure your Chat My CV application</p>
            </div>

            {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                    {message.type === 'error' ? (
                        <AlertCircle className='h-4 w-4' />
                    ) : (
                        <CheckCircle2 className='h-4 w-4' />
                    )}
                    <AlertDescription>{message.text}</AlertDescription>
                </Alert>
            )}

            {/* LLM Configuration */}
            <LLMConfiguration initialConfig={config.llm} onSave={handleSaveLLMConfig} />

            {/* Chat Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Chat Settings</CardTitle>
                    <CardDescription>Customize the chat interface and AI behavior</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='space-y-2'>
                        <Label htmlFor='system-prompt'>System Prompt (Optional)</Label>
                        <Textarea
                            id='system-prompt'
                            placeholder='Enter custom system prompt for the AI assistant...'
                            value={config.system_prompt || ''}
                            onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                            rows={4}
                            className='font-mono text-sm'
                        />
                        <p className='text-muted-foreground text-sm'>
                            Override the default system prompt to customize AI behavior
                        </p>
                    </div>

                    <div className='space-y-2'>
                        <Label htmlFor='welcome-message'>Welcome Message</Label>
                        <Textarea
                            id='welcome-message'
                            placeholder='Enter welcome message for users...'
                            value={config.welcome_message || ''}
                            onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
                            rows={2}
                        />
                        <p className='text-muted-foreground text-sm'>
                            The first message users see in the chat interface
                        </p>
                    </div>

                    <div className='flex justify-end'>
                        <button
                            type='button'
                            onClick={handleSaveChatSettings}
                            className='ring-offset-background focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'>
                            Save Chat Settings
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
