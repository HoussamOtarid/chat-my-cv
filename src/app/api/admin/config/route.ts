import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-error-handler';
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
            .in('key', ['llm_config']);

        if (error) {
            throw error;
        }

        // Convert array of key-value pairs to object
        const config: any = {
            llm: null
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
                }
            }
        }

        return NextResponse.json(config);
    } catch (error) {
        return handleApiError(error, {
            apiRoute: '/api/admin/config',
            method: 'GET',
            errorMessage: 'Failed to fetch configuration'
        });
    }
}

export async function PUT(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { llm } = body;

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

        // Upsert LLM config
        const { error } = await supabase
            .from('configuration')
            .upsert(
                {
                    key: 'llm_config',
                    value: llmConfigToStore,
                    encrypted: encrypted
                },
                { onConflict: 'key' }
            );

        if (error) {
            throw error;
        }

        // Return the saved configuration (with unencrypted values for display)
        return NextResponse.json({
            llm: llm // Return the original unencrypted config
        });
    } catch (error) {
        return handleApiError(error, {
            apiRoute: '/api/admin/config',
            method: 'PUT',
            errorMessage: 'Failed to update configuration'
        });
    }
}
