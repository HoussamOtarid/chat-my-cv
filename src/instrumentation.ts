import { captureException } from '@sentry/nextjs';

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('../sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
        await import('../sentry.edge.config');
    }
}

export const onRequestError = async (
    error: { digest: string } & Error,
    request: {
        path: string;
        method: string;
        headers: { [key: string]: string };
    }
) => {
    captureException(error, {
        tags: {
            path: request.path,
            method: request.method,
            digest: error.digest,
        },
    });
};
