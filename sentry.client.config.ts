import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
        debug: process.env.NODE_ENV === 'development',
        tracesSampleRate: 1.0,
        replaysSessionSampleRate: 1.0,
        replaysOnErrorSampleRate: 1.0,
        environment: process.env.NODE_ENV,
        maxBreadcrumbs: 100,
        
        beforeSend(event) {
            if (event.exception?.values?.[0]?.value?.includes('Failed to fetch')) {
                return null;
            }
            
            if (event.exception?.values?.[0]?.value?.includes('extension://')) {
                return null;
            }
            
            return event;
        },
    });
}
