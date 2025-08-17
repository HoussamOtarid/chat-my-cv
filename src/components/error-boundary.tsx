'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/registry/new-york-v4/ui/alert';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

import { AlertCircle, Home, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetKeys?: Array<string | number>;
    resetOnPropsChange?: boolean;
    isolate?: boolean;
    level?: 'page' | 'section' | 'component';
    showDetails?: boolean;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorCount: number;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays a fallback UI
 */
class ErrorBoundary extends Component<Props, State> {
    private resetTimeoutId: NodeJS.Timeout | null = null;

    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error Boundary caught an error:', error, errorInfo);
        }

        // Update state with error details
        this.setState((prevState) => ({
            errorInfo,
            errorCount: prevState.errorCount + 1
        }));

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Log to error reporting service (e.g., Sentry) in production
        if (process.env.NODE_ENV === 'production') {
            // TODO: Add error reporting service integration
            console.error('Production error:', error.message);
        }
    }

    componentDidUpdate(prevProps: Props) {
        const { resetKeys, resetOnPropsChange } = this.props;
        const { hasError } = this.state;

        // Reset error boundary when resetKeys change
        if (hasError && resetKeys && prevProps.resetKeys) {
            const hasResetKeyChanged = resetKeys.some((key, index) => key !== prevProps.resetKeys![index]);

            if (hasResetKeyChanged) {
                this.resetErrorBoundary();
            }
        }

        // Reset on any props change if specified
        if (hasError && resetOnPropsChange && prevProps !== this.props) {
            this.resetErrorBoundary();
        }
    }

    componentWillUnmount() {
        if (this.resetTimeoutId) {
            clearTimeout(this.resetTimeoutId);
        }
    }

    resetErrorBoundary = () => {
        if (this.resetTimeoutId) {
            clearTimeout(this.resetTimeoutId);
        }

        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    handleReset = () => {
        // Prevent rapid resets
        if (this.state.errorCount > 3) {
            if (window.confirm('Multiple errors detected. Reload the page?')) {
                window.location.reload();
            }

            return;
        }

        this.resetErrorBoundary();
    };

    render() {
        const { hasError, error, errorCount } = this.state;
        const { children, fallback, level = 'component', showDetails = false, isolate = false } = this.props;

        if (hasError && error) {
            // Use custom fallback if provided
            if (fallback) {
                return <>{fallback}</>;
            }

            // Different UI based on error boundary level
            if (level === 'page') {
                return (
                    <div className='bg-background flex min-h-screen items-center justify-center p-4'>
                        <Card className='w-full max-w-md'>
                            <CardHeader>
                                <div className='flex items-center gap-2'>
                                    <AlertCircle className='text-destructive h-5 w-5' />
                                    <CardTitle>Something went wrong</CardTitle>
                                </div>
                                <CardDescription>
                                    We encountered an unexpected error. Please try refreshing the page.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {showDetails && (
                                    <Alert variant='destructive' className='mb-4'>
                                        <AlertTitle>Error Details</AlertTitle>
                                        <AlertDescription className='mt-2 font-mono text-xs'>
                                            {error.message}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                {errorCount > 2 && (
                                    <Alert>
                                        <AlertDescription>
                                            Multiple errors detected. If the problem persists, please contact support.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                            <CardFooter className='flex gap-2'>
                                <Button onClick={this.handleReset} variant='default'>
                                    <RefreshCw className='mr-2 h-4 w-4' />
                                    Try Again
                                </Button>
                                <Button onClick={() => (window.location.href = '/')} variant='outline'>
                                    <Home className='mr-2 h-4 w-4' />
                                    Go Home
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                );
            }

            if (level === 'section') {
                return (
                    <div className='border-destructive/50 bg-destructive/5 rounded-lg border p-6'>
                        <div className='flex items-start gap-3'>
                            <AlertCircle className='text-destructive mt-0.5 h-5 w-5' />
                            <div className='flex-1'>
                                <h3 className='font-semibold'>Section Error</h3>
                                <p className='text-muted-foreground mt-1 text-sm'>
                                    This section failed to load properly.
                                </p>
                                {showDetails && (
                                    <p className='text-destructive mt-2 font-mono text-xs'>{error.message}</p>
                                )}
                                <Button onClick={this.handleReset} variant='outline' size='sm' className='mt-3'>
                                    <RefreshCw className='mr-1 h-3 w-3' />
                                    Retry
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            }

            // Component level error (default)
            return (
                <Alert variant='destructive'>
                    <AlertCircle className='h-4 w-4' />
                    <AlertTitle>Component Error</AlertTitle>
                    <AlertDescription>
                        <p>Failed to render this component.</p>
                        {showDetails && <p className='mt-2 font-mono text-xs'>{error.message}</p>}
                        <Button onClick={this.handleReset} variant='outline' size='sm' className='mt-2'>
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            );
        }

        // Isolate errors to prevent cascading failures
        if (isolate) {
            try {
                return <>{children}</>;
            } catch (error) {
                return (
                    <Alert variant='destructive'>
                        <AlertDescription>Failed to render content. Please refresh the page.</AlertDescription>
                    </Alert>
                );
            }
        }

        return <>{children}</>;
    }
}

export default ErrorBoundary;

/**
 * Higher-order component to wrap any component with error boundary
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<Props, 'children'>
) {
    const WrappedComponent = (props: P) => (
        <ErrorBoundary {...errorBoundaryProps}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

    return WrappedComponent;
}
