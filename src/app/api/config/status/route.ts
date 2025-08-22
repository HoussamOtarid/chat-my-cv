import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import type { LLMConfig } from '@/types';

export const runtime = 'nodejs';

/**
 * Public endpoint to check if the application is properly configured
 * Returns configuration status without exposing sensitive details
 */
export async function GET() {
    try {
        const supabase = await createSupabaseAdmin();

        // Check if LLM configuration exists
        const { data: llmConfigRow, error } = await supabase
            .from('configuration')
            .select('key, value, encrypted')
            .eq('key', 'llm_config')
            .single();

        if (error || !llmConfigRow) {
            return NextResponse.json({
                configured: false,
                hasLLMConfig: false,
                message: 'No LLM configuration found'
            });
        }

        const config = llmConfigRow.value as LLMConfig;

        // Check if credentials are configured based on provider type
        let credentialsConfigured = false;
        switch (config.provider) {
            case 'openai':
            case 'anthropic':
                credentialsConfigured = 'apiKey' in config && !!config.apiKey;
                break;
            case 'azure-openai':
                credentialsConfigured =
                    'azureEndpoint' in config &&
                    !!config.azureEndpoint &&
                    'azureApiKey' in config &&
                    !!config.azureApiKey &&
                    'azureDeploymentName' in config &&
                    !!config.azureDeploymentName;
                break;
            case 'bedrock-anthropic':
                credentialsConfigured =
                    'awsRegion' in config &&
                    !!config.awsRegion &&
                    'awsAccessKeyId' in config &&
                    !!config.awsAccessKeyId &&
                    'awsSecretAccessKey' in config &&
                    !!config.awsSecretAccessKey;
                break;
            case 'openai-compatible':
                credentialsConfigured = 'baseUrl' in config && !!config.baseUrl;
                break;
            default:
                credentialsConfigured = false;
        }

        return NextResponse.json({
            configured: credentialsConfigured,
            hasLLMConfig: true,
            provider: config.provider,
            message: credentialsConfigured 
                ? 'Application is properly configured' 
                : 'LLM configuration incomplete'
        });
    } catch (error) {
        console.error('Configuration status check error:', error);
        
        return NextResponse.json({
            configured: false,
            hasLLMConfig: false,
            message: 'Failed to check configuration'
        }, { status: 500 });
    }
}