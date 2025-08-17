import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { testLLMConnection, validateLLMConfig } from '@/lib/llm';
import type { LLMConfig } from '@/types';

import { getServerSession } from 'next-auth/next';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const config = (await request.json()) as LLMConfig;

        // Validate configuration
        const validation = validateLLMConfig(config);
        if (!validation.valid) {
            return NextResponse.json(
                {
                    success: false,
                    error: validation.error || 'Invalid configuration'
                },
                { status: 400 }
            );
        }

        // Test connection
        const result = await testLLMConnection(config);

        return NextResponse.json({
            success: result.success,
            message: result.message,
            error: result.error
        });
    } catch (error) {
        console.error('Test connection error:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to test connection'
            },
            { status: 500 }
        );
    }
}
