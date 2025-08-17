'use client';

import React, { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/registry/new-york-v4/ui/alert';
import { Badge } from '@/registry/new-york-v4/ui/badge';

import { AlertCircle, CheckCircle, Loader2, Wifi, WifiOff } from 'lucide-react';

export type ConnectionStatus = 'online' | 'offline' | 'checking' | 'error';

interface ConnectionStatusIndicatorProps {
    className?: string;
    showBanner?: boolean;
    position?: 'top' | 'bottom' | 'inline';
    compact?: boolean;
}

/**
 * Hook to monitor connection status
 */
export function useConnectionStatus() {
    const [status, setStatus] = useState<ConnectionStatus>('checking');
    const [isOnline, setIsOnline] = useState(true);
    const [lastOnline, setLastOnline] = useState<Date | null>(null);

    useEffect(() => {
        // Check initial online status
        const checkConnection = () => {
            if (typeof window !== 'undefined') {
                const online = window.navigator.onLine;
                setIsOnline(online);
                setStatus(online ? 'online' : 'offline');
                if (online) {
                    setLastOnline(new Date());
                }
            }
        };

        // Event handlers
        const handleOnline = () => {
            setIsOnline(true);
            setStatus('online');
            setLastOnline(new Date());
        };

        const handleOffline = () => {
            setIsOnline(false);
            setStatus('offline');
        };

        // Initial check
        checkConnection();

        // Add event listeners
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Periodic check (every 30 seconds)
        const interval = setInterval(checkConnection, 30000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    return {
        status,
        isOnline,
        lastOnline
    };
}

/**
 * Connection Status Indicator Component
 */
export function ConnectionStatusIndicator({
    className,
    showBanner = false,
    position = 'inline',
    compact = false
}: ConnectionStatusIndicatorProps) {
    const { status } = useConnectionStatus();
    const [isVisible, setIsVisible] = useState(false);
    const [showReconnected, setShowReconnected] = useState(false);

    // Show/hide logic
    useEffect(() => {
        if (status === 'offline') {
            setIsVisible(true);
            setShowReconnected(false);
        } else if (status === 'online' && isVisible) {
            // Show reconnected message briefly
            setShowReconnected(true);
            setTimeout(() => {
                setIsVisible(false);
                setShowReconnected(false);
            }, 3000);
        }
    }, [status, isVisible]);

    // Don't show anything if online and not transitioning
    if (!isVisible && status === 'online') {
        return null;
    }

    // Compact badge version
    if (compact) {
        return (
            <Badge variant={status === 'online' ? 'default' : 'destructive'} className={cn('gap-1', className)}>
                {status === 'online' ? (
                    <>
                        <Wifi className='h-3 w-3' />
                        Connected
                    </>
                ) : status === 'offline' ? (
                    <>
                        <WifiOff className='h-3 w-3' />
                        Offline
                    </>
                ) : (
                    <>
                        <Loader2 className='h-3 w-3 animate-spin' />
                        Checking...
                    </>
                )}
            </Badge>
        );
    }

    // Banner version
    if (showBanner) {
        return (
            <div
                className={cn(
                    'fixed right-0 left-0 z-50 transition-all duration-300',
                    position === 'top' ? 'top-0' : 'bottom-0',
                    !isVisible && 'translate-y-full opacity-0',
                    className
                )}>
                <Alert variant={showReconnected ? 'default' : 'destructive'} className='rounded-none border-x-0'>
                    <div className='flex items-center gap-2'>
                        {showReconnected ? (
                            <>
                                <CheckCircle className='h-4 w-4' />
                                <AlertDescription>Connection restored</AlertDescription>
                            </>
                        ) : status === 'offline' ? (
                            <>
                                <WifiOff className='h-4 w-4' />
                                <AlertDescription>You're offline. Some features may be unavailable.</AlertDescription>
                            </>
                        ) : status === 'checking' ? (
                            <>
                                <Loader2 className='h-4 w-4 animate-spin' />
                                <AlertDescription>Checking connection...</AlertDescription>
                            </>
                        ) : (
                            <>
                                <AlertCircle className='h-4 w-4' />
                                <AlertDescription>Connection error</AlertDescription>
                            </>
                        )}
                    </div>
                </Alert>
            </div>
        );
    }

    // Inline version
    return (
        <div className={cn('flex items-center gap-2', className)}>
            {status === 'online' && showReconnected ? (
                <>
                    <CheckCircle className='h-4 w-4 text-green-500' />
                    <span className='text-muted-foreground text-sm'>Back online</span>
                </>
            ) : status === 'offline' ? (
                <>
                    <WifiOff className='text-destructive h-4 w-4' />
                    <span className='text-muted-foreground text-sm'>No connection</span>
                </>
            ) : status === 'checking' ? (
                <>
                    <Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />
                    <span className='text-muted-foreground text-sm'>Checking...</span>
                </>
            ) : null}
        </div>
    );
}

/**
 * Service Status Component
 * Shows status of various services (API, Database, etc.)
 */
export function ServiceStatus({
    services,
    className
}: {
    services: {
        name: string;
        status: 'operational' | 'degraded' | 'down' | 'checking';
        message?: string;
    }[];
    className?: string;
}) {
    const allOperational = services.every((s) => s.status === 'operational');
    const hasIssues = services.some((s) => s.status === 'down');
    const isDegraded = services.some((s) => s.status === 'degraded');

    return (
        <div className={cn('space-y-2', className)}>
            <div className='flex items-center gap-2'>
                {allOperational ? (
                    <>
                        <CheckCircle className='h-4 w-4 text-green-500' />
                        <span className='text-sm font-medium'>All systems operational</span>
                    </>
                ) : hasIssues ? (
                    <>
                        <AlertCircle className='text-destructive h-4 w-4' />
                        <span className='text-sm font-medium'>Service disruption</span>
                    </>
                ) : isDegraded ? (
                    <>
                        <AlertCircle className='h-4 w-4 text-yellow-500' />
                        <span className='text-sm font-medium'>Degraded performance</span>
                    </>
                ) : (
                    <>
                        <Loader2 className='h-4 w-4 animate-spin' />
                        <span className='text-sm font-medium'>Checking services...</span>
                    </>
                )}
            </div>

            {!allOperational && (
                <div className='space-y-1 pl-6'>
                    {services
                        .filter((s) => s.status !== 'operational')
                        .map((service, index) => (
                            <div key={index} className='flex items-center gap-2 text-xs'>
                                <span
                                    className={cn(
                                        'h-2 w-2 rounded-full',
                                        service.status === 'down' && 'bg-destructive',
                                        service.status === 'degraded' && 'bg-yellow-500',
                                        service.status === 'checking' && 'bg-muted-foreground animate-pulse'
                                    )}
                                />
                                <span className='text-muted-foreground'>
                                    {service.name}: {service.message || service.status}
                                </span>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}
