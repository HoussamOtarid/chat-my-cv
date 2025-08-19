'use client';

import React, { useEffect, useState } from 'react';

import { LLM_PROVIDER_NAMES } from '@/constants';
import { Alert, AlertDescription } from '@/registry/new-york-v4/ui/alert';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Input } from '@/registry/new-york-v4/ui/input';
import { Label } from '@/registry/new-york-v4/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/registry/new-york-v4/ui/select';
import type { LLMConfig } from '@/types';

import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface LLMConfigurationProps {
    onSave?: (config: LLMConfig) => Promise<void>;
    initialConfig?: Partial<LLMConfig>;
}

export function LLMConfiguration({ onSave, initialConfig }: LLMConfigurationProps) {
    const [provider, setProvider] = useState<string>(initialConfig?.provider || '');
    const [config, setConfig] = useState<Record<string, any>>({});
    const [models, setModels] = useState<{ value: string; label: string }[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (initialConfig && initialConfig.provider) {
            setProvider(initialConfig.provider);
            setConfig(initialConfig as any);
        }
    }, [initialConfig]);

    // Fetch available models when provider changes
    useEffect(() => {
        if (provider && ['openai', 'anthropic', 'azure-openai', 'bedrock-anthropic'].includes(provider)) {
            fetchModels(provider);
        }
    }, [provider]);

    const fetchModels = async (providerName: string) => {
        setLoadingModels(true);
        try {
            const response = await fetch(`/api/admin/config/models?provider=${providerName}`);
            if (response.ok) {
                const data = await response.json();
                setModels(data.models || []);
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
        } finally {
            setLoadingModels(false);
        }
    };

    const handleProviderChange = (newProvider: string) => {
        setProvider(newProvider);
        setMessage(null);

        // Reset config for new provider
        const baseConfig = {
            provider: newProvider,
            temperature: config.temperature || 0.7,
            maxTokens: config.maxTokens || 4000
        };

        switch (newProvider) {
            case 'openai':
                setConfig({
                    ...baseConfig,
                    apiKey: '',
                    model: 'gpt-4o'
                });
                break;

            case 'anthropic':
                setConfig({
                    ...baseConfig,
                    apiKey: '',
                    model: 'claude-3-5-sonnet-latest'
                });
                break;

            case 'azure-openai':
                setConfig({
                    ...baseConfig,
                    azureEndpoint: '',
                    azureApiKey: '',
                    azureDeploymentName: '',
                    azureApiVersion: '2024-10-01-preview'
                });
                break;

            case 'bedrock-anthropic':
                setConfig({
                    ...baseConfig,
                    awsRegion: 'us-east-1',
                    awsAccessKeyId: '',
                    awsSecretAccessKey: '',
                    model: 'anthropic.claude-3-sonnet-20240229-v1:0'
                });
                break;

            case 'openai-compatible':
                setConfig({
                    ...baseConfig,
                    baseUrl: 'http://localhost:11434/v1',
                    apiKey: '',
                    model: ''
                });
                break;
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setMessage(null);

        try {
            const response = await fetch('/api/admin/config/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            const result = await response.json();

            setMessage({
                type: result.success ? 'success' : 'error',
                text: result.message || result.error || 'Connection test failed'
            });
        } catch (error) {
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Connection test failed'
            });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        if (!onSave) {
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            await onSave(config as LLMConfig);
            setMessage({ type: 'success', text: 'Configuration saved successfully' });
        } catch (error) {
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to save configuration'
            });
        } finally {
            setSaving(false);
        }
    };

    const renderProviderConfig = () => {
        switch (provider) {
            case 'openai':
                return (
                    <>
                        <div className='space-y-2'>
                            <Label htmlFor='api-key'>API Key</Label>
                            <Input
                                id='api-key'
                                type='password'
                                placeholder='sk-...'
                                value={config.apiKey || ''}
                                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                            />
                            <p className='text-muted-foreground text-sm'>
                                Get your API key from{' '}
                                <a
                                    href='https://platform.openai.com/api-keys'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='underline'>
                                    OpenAI Platform
                                </a>
                            </p>
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='model'>Model</Label>
                            <Select
                                value={config.model || ''}
                                onValueChange={(value) => setConfig({ ...config, model: value })}
                                disabled={loadingModels}>
                                <SelectTrigger id='model'>
                                    <SelectValue placeholder={loadingModels ? 'Loading models...' : 'Select a model'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {models.map((model) => (
                                        <SelectItem key={model.value} value={model.value}>
                                            {model.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                );

            case 'anthropic':
                return (
                    <>
                        <div className='space-y-2'>
                            <Label htmlFor='api-key'>API Key</Label>
                            <Input
                                id='api-key'
                                type='password'
                                placeholder='sk-ant-...'
                                value={config.apiKey || ''}
                                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                            />
                            <p className='text-muted-foreground text-sm'>
                                Get your API key from{' '}
                                <a
                                    href='https://console.anthropic.com/'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='underline'>
                                    Anthropic Console
                                </a>
                            </p>
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='model'>Model</Label>
                            <Select
                                value={config.model || ''}
                                onValueChange={(value) => setConfig({ ...config, model: value })}
                                disabled={loadingModels}>
                                <SelectTrigger id='model'>
                                    <SelectValue placeholder={loadingModels ? 'Loading models...' : 'Select a model'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {models.map((model) => (
                                        <SelectItem key={model.value} value={model.value}>
                                            {model.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                );

            case 'azure-openai':
                return (
                    <>
                        <div className='space-y-2'>
                            <Label htmlFor='azure-endpoint'>Azure Endpoint</Label>
                            <Input
                                id='azure-endpoint'
                                type='url'
                                placeholder='https://your-resource.openai.azure.com'
                                value={config.azureEndpoint || ''}
                                onChange={(e) => setConfig({ ...config, azureEndpoint: e.target.value })}
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='azure-key'>API Key</Label>
                            <Input
                                id='azure-key'
                                type='password'
                                placeholder='Your Azure OpenAI API key'
                                value={config.azureApiKey || ''}
                                onChange={(e) => setConfig({ ...config, azureApiKey: e.target.value })}
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='deployment'>Deployment Name</Label>
                            <Input
                                id='deployment'
                                type='text'
                                placeholder='gpt-4-deployment'
                                value={config.azureDeploymentName || ''}
                                onChange={(e) => setConfig({ ...config, azureDeploymentName: e.target.value })}
                            />
                            <p className='text-muted-foreground text-sm'>The name of your Azure OpenAI deployment</p>
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='api-version'>API Version (Optional)</Label>
                            <Input
                                id='api-version'
                                type='text'
                                placeholder='2024-10-01-preview'
                                value={config.azureApiVersion || ''}
                                onChange={(e) => setConfig({ ...config, azureApiVersion: e.target.value })}
                            />
                        </div>
                    </>
                );

            case 'bedrock-anthropic':
                return (
                    <>
                        <div className='space-y-2'>
                            <Label htmlFor='aws-region'>AWS Region</Label>
                            <Select
                                value={config.awsRegion || 'us-east-1'}
                                onValueChange={(value) => setConfig({ ...config, awsRegion: value })}>
                                <SelectTrigger id='aws-region'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='us-east-1'>US East (N. Virginia)</SelectItem>
                                    <SelectItem value='us-west-2'>US West (Oregon)</SelectItem>
                                    <SelectItem value='eu-west-1'>Europe (Ireland)</SelectItem>
                                    <SelectItem value='eu-central-1'>Europe (Frankfurt)</SelectItem>
                                    <SelectItem value='ap-southeast-1'>Asia Pacific (Singapore)</SelectItem>
                                    <SelectItem value='ap-northeast-1'>Asia Pacific (Tokyo)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='access-key'>Access Key ID</Label>
                            <Input
                                id='access-key'
                                type='password'
                                placeholder='AKIA...'
                                value={config.awsAccessKeyId || ''}
                                onChange={(e) => setConfig({ ...config, awsAccessKeyId: e.target.value })}
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='secret-key'>Secret Access Key</Label>
                            <Input
                                id='secret-key'
                                type='password'
                                placeholder='Your AWS secret key'
                                value={config.awsSecretAccessKey || ''}
                                onChange={(e) => setConfig({ ...config, awsSecretAccessKey: e.target.value })}
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='session-token'>Session Token (Optional)</Label>
                            <Input
                                id='session-token'
                                type='password'
                                placeholder='For temporary credentials'
                                value={config.awsSessionToken || ''}
                                onChange={(e) => setConfig({ ...config, awsSessionToken: e.target.value })}
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='model'>Model</Label>
                            <Select
                                value={config.model || ''}
                                onValueChange={(value) => setConfig({ ...config, model: value })}
                                disabled={loadingModels}>
                                <SelectTrigger id='model'>
                                    <SelectValue placeholder={loadingModels ? 'Loading models...' : 'Select a model'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {models.map((model) => (
                                        <SelectItem key={model.value} value={model.value}>
                                            {model.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                );

            case 'openai-compatible':
                return (
                    <>
                        <div className='space-y-2'>
                            <Label htmlFor='base-url'>Base URL</Label>
                            <Input
                                id='base-url'
                                type='url'
                                placeholder='http://localhost:11434/v1'
                                value={config.baseUrl || ''}
                                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                            />
                            <p className='text-muted-foreground text-sm'>
                                The endpoint URL for your OpenAI-compatible service
                            </p>
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='api-key'>API Key (Optional)</Label>
                            <Input
                                id='api-key'
                                type='password'
                                placeholder='Leave empty for local services'
                                value={config.apiKey || ''}
                                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                            />
                            <p className='text-muted-foreground text-sm'>
                                Some services like Ollama don't require authentication
                            </p>
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='model'>Model Name</Label>
                            <Input
                                id='model'
                                type='text'
                                placeholder='llama2, mistral, or custom model name'
                                value={config.model || ''}
                                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                            />
                            <p className='text-muted-foreground text-sm'>
                                Common models: llama2, mistral, mixtral, codellama
                            </p>
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div className='space-y-6'>
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

            <Card>
                <CardHeader>
                    <CardTitle>LLM Provider Configuration</CardTitle>
                    <CardDescription>Choose and configure your language model provider</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='space-y-2'>
                        <Label htmlFor='provider'>Provider</Label>
                        <Select value={provider} onValueChange={handleProviderChange}>
                            <SelectTrigger id='provider'>
                                <SelectValue placeholder='Select a provider' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='openai'>{LLM_PROVIDER_NAMES.openai}</SelectItem>
                                <SelectItem value='anthropic'>{LLM_PROVIDER_NAMES.anthropic}</SelectItem>
                                <SelectItem value='azure-openai'>{LLM_PROVIDER_NAMES['azure-openai']}</SelectItem>
                                <SelectItem value='bedrock-anthropic'>{LLM_PROVIDER_NAMES['bedrock-anthropic']}</SelectItem>
                                <SelectItem value='openai-compatible'>
                                    {LLM_PROVIDER_NAMES['openai-compatible']}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {provider && renderProviderConfig()}

                    {provider && (
                        <>
                            <div className='border-t pt-4'>
                                <h4 className='mb-4 text-sm font-medium'>Advanced Settings</h4>
                                <div className='grid gap-4 md:grid-cols-2'>
                                    <div className='space-y-2'>
                                        <Label htmlFor='temperature'>Temperature</Label>
                                        <Input
                                            id='temperature'
                                            type='number'
                                            min='0'
                                            max='2'
                                            step='0.1'
                                            value={config.temperature || 0.7}
                                            onChange={(e) =>
                                                setConfig({ ...config, temperature: parseFloat(e.target.value) })
                                            }
                                        />
                                        <p className='text-muted-foreground text-xs'>
                                            Controls randomness (0 = deterministic, 2 = very random)
                                        </p>
                                    </div>
                                    <div className='space-y-2'>
                                        <Label htmlFor='max-tokens'>Max Tokens</Label>
                                        <Input
                                            id='max-tokens'
                                            type='number'
                                            min='100'
                                            max='100000'
                                            step='100'
                                            value={config.maxTokens || 4000}
                                            onChange={(e) =>
                                                setConfig({ ...config, maxTokens: parseInt(e.target.value) })
                                            }
                                        />
                                        <p className='text-muted-foreground text-xs'>Maximum length of the response</p>
                                    </div>
                                </div>
                            </div>

                            <div className='flex gap-2 pt-4'>
                                <Button
                                    type='button'
                                    variant='outline'
                                    onClick={handleTestConnection}
                                    disabled={testing}>
                                    {testing ? (
                                        <>
                                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                            Testing...
                                        </>
                                    ) : (
                                        'Test Connection'
                                    )}
                                </Button>
                                {onSave && (
                                    <Button type='button' onClick={handleSave} disabled={saving || !provider}>
                                        {saving ? (
                                            <>
                                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Configuration'
                                        )}
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
