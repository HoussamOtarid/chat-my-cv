'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/registry/new-york-v4/ui/alert';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

interface AsyncErrorBoundaryProps {
    children: ReactNode;
    fallback?: (error: Error, retry: () => void) => ReactNode;
    onError?: (error: Error) => void;
    maxRetries?: number;
    retryDelay?: number;
    showError?: boolean;
}

interface ErrorState {
    hasError: boolean;
    error: Error | null;
    retryCount: number;
    isRetrying: boolean;
}

/**
 * Async Error Boundary Hook
 * Handles errors in async operations and provides retry logic
 */
export function useAsyncError() {
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (error) {
            throw error;
        }
    }, [error]);

    return setError;
}

/**
 * Async Error Boundary Component
 * Handles async errors and provides retry mechanisms
 */
export function AsyncErrorBoundary({
    children,
    fallback,
    onError,
    maxRetries = 3,
    retryDelay = 1000,
    showError = true
}: AsyncErrorBoundaryProps) {
    const [errorState, setErrorState] = useState<ErrorState>({
        hasError: false,
        error: null,
        retryCount: 0,
        isRetrying: false
    });

    const resetError = () => {
        setErrorState({
            hasError: false,
            error: null,
            retryCount: 0,
            isRetrying: false
        });
    };

    const retry = async () => {
        const { retryCount } = errorState;

        if (retryCount >= maxRetries) {
            if (window.confirm('Maximum retries reached. Reload the page?')) {
                window.location.reload();
            }

            return;
        }

        setErrorState(prev => ({
            ...prev,
            isRetrying: true,
            retryCount: prev.retryCount + 1
        }));

        // Exponential backoff
        const delay = retryDelay * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));

        resetError();
    };

    // Handle unhandled promise rejections
    useEffect(() => {
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const error = new Error(
                event.reason?.message || 'Unhandled promise rejection'
            );

            setErrorState({
                hasError: true,
                error,
                retryCount: 0,
                isRetrying: false
            });

            if (onError) {
                onError(error);
            }

            event.preventDefault();
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, [onError]);

    if (errorState.hasError && errorState.error) {
        // Use custom fallback if provided
        if (fallback) {
            return <>{fallback(errorState.error, retry)}</>;
        }

        // Check if it's a network error
        const isNetworkError = errorState.error.message.toLowerCase().includes('network') ||
                             errorState.error.message.toLowerCase().includes('fetch');

        if (!showError) {
            return null;
        }

        return (
            <div className="flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            {isNetworkError ? (
                                <WifiOff className="h-5 w-5 text-destructive" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-destructive" />
                            )}
                            <CardTitle>
                                {isNetworkError ? 'Connection Error' : 'Operation Failed'}
                            </CardTitle>
                        </div>
                        <CardDescription>
                            {isNetworkError
                                ? 'Unable to connect to the server. Please check your internet connection.'
                                : 'The operation could not be completed. Please try again.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {process.env.NODE_ENV === 'development' && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertTitle>Error Details</AlertTitle>
                                <AlertDescription className="mt-2 font-mono text-xs">
                                    {errorState.error.message}
                                </AlertDescription>
                            </Alert>
                        )}
                        {errorState.retryCount > 0 && (
                            <p className="text-sm text-muted-foreground mb-4">
                                Retry attempt {errorState.retryCount} of {maxRetries}
                            </p>
                        )}
                        <div className="flex gap-2">
                            <Button
                                onClick={retry}
                                disabled={errorState.isRetrying || errorState.retryCount >= maxRetries}
                                variant="default"
                            >
                                {errorState.isRetrying ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Retrying...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Try Again
                                    </>
                                )}
                            </Button>
                            <Button onClick={resetError} variant="outline">
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
}

/**
 * Async operation wrapper with automatic retry
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    options: {
        maxRetries?: number;
        retryDelay?: number;
        shouldRetry?: (error: Error) => boolean;
        onRetry?: (attempt: number, error: Error) => void;
    } = {}
): Promise<T> {
    const {
        maxRetries = 3,
        retryDelay = 1000,
        shouldRetry = () => true,
        onRetry
    } = options;

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;

            if (attempt === maxRetries || !shouldRetry(lastError)) {
                throw lastError;
            }

            if (onRetry) {
                onRetry(attempt + 1, lastError);
            }

            // Exponential backoff
            const delay = retryDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError!;
}

/**
 * Hook for handling async operations with loading and error states
 */
export function useAsyncOperation<T>() {
    const [state, setState] = useState<{
        loading: boolean;
        error: Error | null;
        data: T | null;
    }>({
        loading: false,
        error: null,
        data: null
    });

    const execute = async (operation: () => Promise<T>) => {
        setState({ loading: true, error: null, data: null });

        try {
            const data = await operation();
            setState({ loading: false, error: null, data });

            return data;
        } catch (error) {
            const err = error as Error;
            setState({ loading: false, error: err, data: null });
            throw err;
        }
    };

    const reset = () => {
        setState({ loading: false, error: null, data: null });
    };

    return {
        ...state,
        execute,
        reset
    };
}