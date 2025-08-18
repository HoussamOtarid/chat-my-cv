'use client';

import { captureException } from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        captureException(error, {
            tags: {
                section: 'global-error-handler',
                digest: error.digest,
            },
        });
    }, [error]);

    return (
        <html lang="en">
            <head />
            <body>
                <div
                    style={{
                        fontFamily:
                            '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        margin: 0,
                        padding: 0,
                        background: 'linear-gradient(to bottom, #f8f9fa, #e9ecef)',
                    }}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            padding: '2rem',
                            maxWidth: '500px',
                            width: '90%',
                            textAlign: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                margin: '0 auto 1rem',
                                color: '#dc2626',
                            }}
                        >
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        <h1
                            style={{
                                color: '#1f2937',
                                fontSize: '1.875rem',
                                fontWeight: 700,
                                marginBottom: '0.5rem',
                                marginTop: 0,
                            }}
                        >
                            Something went wrong!
                        </h1>

                        <p
                            style={{
                                color: '#6b7280',
                                fontSize: '1rem',
                                lineHeight: 1.5,
                                marginBottom: '1.5rem',
                            }}
                        >
                            We encountered an unexpected error. The error has been reported and we&apos;ll look into it.
                        </p>

                        {process.env.NODE_ENV === 'development' && error?.message && (
                            <div
                                style={{
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '6px',
                                    padding: '0.75rem',
                                    marginBottom: '1.5rem',
                                    textAlign: 'left',
                                }}
                            >
                                <div
                                    style={{
                                        color: '#991b1b',
                                        fontFamily: 'monospace',
                                        fontSize: '0.875rem',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {error.message}
                                </div>
                            </div>
                        )}

                        <div
                            style={{
                                display: 'flex',
                                gap: '0.75rem',
                                justifyContent: 'center',
                            }}
                        >
                            <button
                                onClick={() => reset()}
                                style={{
                                    padding: '0.625rem 1.25rem',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    border: 'none',
                                    background: '#3b82f6',
                                    color: 'white',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#2563eb';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#3b82f6';
                                }}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                Try again
                            </button>

                            <button
                                onClick={() => {
                                    window.location.href = '/';
                                }}
                                style={{
                                    padding: '0.625rem 1.25rem',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    background: 'white',
                                    color: '#374151',
                                    border: '1px solid #d1d5db',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#f9fafb';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'white';
                                }}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                    />
                                </svg>
                                Go home
                            </button>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}