import { NextResponse } from 'next/server';

import { captureException } from '@sentry/nextjs';

interface ErrorHandlerOptions {
    apiRoute: string;
    method: string;
    statusCode?: number;
    errorMessage?: string;
}

export function handleApiError(
    error: unknown,
    options: ErrorHandlerOptions
): NextResponse {
    const {
        apiRoute,
        method,
        statusCode = 500,
        errorMessage = 'Internal server error'
    } = options;

    console.error(`[${method} ${apiRoute}] Error:`, error);

    captureException(error, {
        tags: {
            api_route: apiRoute,
            method: method,
            type: 'api_error',
        },
        level: 'error',
        extra: {
            statusCode,
            errorMessage,
        },
    });

    return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
    );
}