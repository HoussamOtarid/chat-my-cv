import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';

import { getServerSession } from 'next-auth/next';

async function validateOpenAI(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });

        return response.ok;
    } catch {
        return false;
    }
}

async function validateAnthropic(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1,
                messages: [{ role: 'user', content: 'Hi' }]
            })
        });

        return response.status !== 401;
    } catch {
        return false;
    }
}

async function validateGoogle(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        return response.ok;
    } catch {
        return false;
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { provider, apiKey } = await request.json();

        if (!provider || !apiKey) {
            return NextResponse.json({ error: 'Provider and API key are required' }, { status: 400 });
        }

        let isValid = false;

        switch (provider) {
            case 'openai':
                isValid = await validateOpenAI(apiKey);
                break;
            case 'anthropic':
                isValid = await validateAnthropic(apiKey);
                break;
            case 'google':
                isValid = await validateGoogle(apiKey);
                break;
            default:
                return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
        }

        return NextResponse.json({ valid: isValid });
    } catch (error) {
        console.error('Failed to validate API key:', error);

        return NextResponse.json({ error: 'Failed to validate API key' }, { status: 500 });
    }
}
