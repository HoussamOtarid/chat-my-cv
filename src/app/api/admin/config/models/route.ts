import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAvailableModels, getModelDisplayName } from '@/lib/llm';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const provider = searchParams.get('provider');

        if (!provider) {
            return NextResponse.json(
                { error: 'Provider is required' },
                { status: 400 }
            );
        }

        const models = getAvailableModels(provider);
        const modelOptions = models.map(model => ({
            value: model,
            label: getModelDisplayName(model)
        }));

        return NextResponse.json({ models: modelOptions });
    } catch (error) {
        console.error('Get models error:', error);
        
        return NextResponse.json(
            { error: 'Failed to get models' },
            { status: 500 }
        );
    }
}