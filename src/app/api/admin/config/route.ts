import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { decrypt, encrypt } from '@/lib/encryption';
import { createSupabaseAdmin } from '@/lib/supabase';

import { getServerSession } from 'next-auth/next';

export const runtime = 'nodejs';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = await createSupabaseAdmin();

        // Fetch configuration using key-value structure
        const { data: configRows, error } = await supabase
            .from('configuration')
            .select('key, value, encrypted')
            .in('key', ['llm_config', 'system_prompt', 'welcome_message', 'theme_color']);

        if (error) {
            throw error;
        }

        // Convert array of key-value pairs to object
        const config: any = {
            llm: null,
            system_prompt: '',
            welcome_message: 'Hello! Upload your resume to get started.',
            theme_color: '#0ea5e9'
        };

        if (configRows) {
            for (const row of configRows) {
                if (row.key === 'llm_config') {
                    try {
                        const llmConfig = row.value as any;
                        // If the config has encrypted API keys, decrypt them
                        if (row.encrypted) {
                            if (llmConfig.apiKey) {
                                llmConfig.apiKey = await decrypt(llmConfig.apiKey);
                            }
                            if (llmConfig.azureApiKey) {
                                llmConfig.azureApiKey = await decrypt(llmConfig.azureApiKey);
                            }
                            if (llmConfig.awsSecretAccessKey) {
                                llmConfig.awsSecretAccessKey = await decrypt(llmConfig.awsSecretAccessKey);
                            }
                            if (llmConfig.awsSessionToken) {
                                llmConfig.awsSessionToken = await decrypt(llmConfig.awsSessionToken);
                            }
                        }
                        config.llm = llmConfig;
                    } catch (e) {
                        console.error('Failed to parse LLM config:', e);
                    }
                } else if (row.key === 'system_prompt') {
                    config.system_prompt = row.value;
                } else if (row.key === 'welcome_message') {
                    config.welcome_message = row.value;
                } else if (row.key === 'theme_color') {
                    config.theme_color = row.value;
                }
            }
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error('Failed to fetch configuration:', error);
        
        return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { llm, system_prompt, welcome_message, theme_color } = body;

        // Handle the nested LLM config
        if (!llm || !llm.provider) {
            return NextResponse.json({ error: 'Missing LLM configuration' }, { status: 400 });
        }

        const supabase = await createSupabaseAdmin();

        // Prepare the LLM config - encrypt sensitive data if needed
        const llmConfigToStore = { ...llm };
        let encrypted = false;
        
        // Encrypt API keys and sensitive data
        if (llm.apiKey) {
            llmConfigToStore.apiKey = await encrypt(llm.apiKey);
            encrypted = true;
        }
        if (llm.azureApiKey) {
            llmConfigToStore.azureApiKey = await encrypt(llm.azureApiKey);
            encrypted = true;
        }
        if (llm.awsSecretAccessKey) {
            llmConfigToStore.awsSecretAccessKey = await encrypt(llm.awsSecretAccessKey);
            encrypted = true;
        }
        if (llm.awsSessionToken) {
            llmConfigToStore.awsSessionToken = await encrypt(llm.awsSessionToken);
            encrypted = true;
        }

        // Prepare upsert operations for each configuration key
        const upsertPromises = [];

        // Upsert LLM config
        upsertPromises.push(
            supabase.from('configuration')
                .upsert({
                    key: 'llm_config',
                    value: llmConfigToStore,
                    encrypted: encrypted
                })
                .eq('key', 'llm_config')
        );

        // Upsert other settings if provided
        if (system_prompt !== undefined) {
            upsertPromises.push(
                supabase.from('configuration')
                    .upsert({
                        key: 'system_prompt',
                        value: system_prompt,
                        encrypted: false
                    })
                    .eq('key', 'system_prompt')
            );
        }

        if (welcome_message !== undefined) {
            upsertPromises.push(
                supabase.from('configuration')
                    .upsert({
                        key: 'welcome_message',
                        value: welcome_message,
                        encrypted: false
                    })
                    .eq('key', 'welcome_message')
            );
        }

        if (theme_color !== undefined) {
            upsertPromises.push(
                supabase.from('configuration')
                    .upsert({
                        key: 'theme_color',
                        value: theme_color,
                        encrypted: false
                    })
                    .eq('key', 'theme_color')
            );
        }

        // Execute all upserts
        const results = await Promise.all(upsertPromises);
        
        // Check for errors
        for (const result of results) {
            if (result.error) {
                throw result.error;
            }
        }

        // Return the saved configuration (with unencrypted values for display)
        return NextResponse.json({
            llm: llm,  // Return the original unencrypted config
            system_prompt: system_prompt || '',
            welcome_message: welcome_message || 'Hello! Upload your resume to get started.',
            theme_color: theme_color || '#0ea5e9'
        });
    } catch (error) {
        console.error('Failed to update configuration:', error);
        
        return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
    }
}
