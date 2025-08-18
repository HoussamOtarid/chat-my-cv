import { NextRequest } from 'next/server';

import { addRateLimitHeaders, checkRateLimit, rateLimitResponse } from './rate-limit';
import { getToken } from 'next-auth/jwt';

/**
 * Rate limiting middleware configuration
 */
export interface RateLimitMiddlewareConfig {
    skip?: (request: NextRequest) => boolean;
    onRateLimitExceeded?: (request: NextRequest) => void;
    maxRequests?: number;
    windowSeconds?: number;
    prefix?: string;
}

/**
 * Apply rate limiting to an API route handler
 */
export function withRateLimit(
    handler: (request: NextRequest) => Promise<Response> | Response,
    config?: RateLimitMiddlewareConfig
) {
    return async (request: NextRequest): Promise<Response> => {
        // Check if rate limiting should be skipped
        if (config?.skip && config.skip(request)) {
            return handler(request);
        }

        // Check rate limit
        const rateLimitResult = await checkRateLimit(request, {
            maxRequests: config?.maxRequests,
            windowSeconds: config?.windowSeconds,
            prefix: config?.prefix
        });

        // If rate limit exceeded
        if (!rateLimitResult.success) {
            // Call custom handler if provided
            if (config?.onRateLimitExceeded) {
                config.onRateLimitExceeded(request);
            }

            // Return rate limit error response
            return rateLimitResponse(rateLimitResult);
        }

        // Process the request
        const response = await handler(request);

        // Add rate limit headers to successful response
        if (response.ok || response.headers.get('content-type')?.includes('text/event-stream')) {
            const headers = new Headers(response.headers);
            addRateLimitHeaders(headers, rateLimitResult);

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers
            });
        }

        return response;
    };
}

/**
 * Rate limit middleware for specific methods
 */
export function withMethodRateLimit(
    handlers: {
        GET?: (request: NextRequest) => Promise<Response> | Response;
        POST?: (request: NextRequest) => Promise<Response> | Response;
        PUT?: (request: NextRequest) => Promise<Response> | Response;
        DELETE?: (request: NextRequest) => Promise<Response> | Response;
        PATCH?: (request: NextRequest) => Promise<Response> | Response;
    },
    config?: {
        GET?: RateLimitMiddlewareConfig;
        POST?: RateLimitMiddlewareConfig;
        PUT?: RateLimitMiddlewareConfig;
        DELETE?: RateLimitMiddlewareConfig;
        PATCH?: RateLimitMiddlewareConfig;
    }
) {
    return async (request: NextRequest): Promise<Response> => {
        const method = request.method as keyof typeof handlers;
        const handler = handlers[method];
        const methodConfig = config?.[method];

        if (!handler) {
            return new Response('Method not allowed', { status: 405 });
        }

        // Apply rate limiting if config exists for this method
        if (methodConfig) {
            return withRateLimit(handler, methodConfig)(request);
        }

        return handler(request);
    };
}

/**
 * Skip rate limiting for certain conditions
 */
export const skipConditions = {
    // Skip for localhost/development
    isDevelopment: (_request: NextRequest) => {
        return process.env.NODE_ENV === 'development';
    },

    // Skip for specific IPs (e.g., monitoring services)
    isAllowedIP: (allowedIPs: string[]) => (request: NextRequest) => {
        const ip =
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            'unknown';

        return allowedIPs.includes(ip);
    },

    // Skip for authenticated admin requests
    isAdmin: async (request: NextRequest) => {
        // Validate admin token directly from the request
        return validateAdminToken(request);
    },

    // Skip for health checks
    isHealthCheck: (request: NextRequest) => {
        return request.nextUrl.pathname.endsWith('/health') || request.nextUrl.pathname.endsWith('/ping');
    }
};

/**
 * Validate admin JWT token from NextAuth
 */
async function validateAdminToken(request: NextRequest): Promise<boolean> {
    try {
        // Get the JWT token directly from the request
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET
        });

        // Check if token is valid and has admin role
        return token !== null && token.role === 'admin';
    } catch (error) {
        console.error('Token validation error:', error);
        
        return false;
    }
}

/**
 * Create a rate-limited API route
 */
export function createRateLimitedRoute(
    handler: (request: NextRequest) => Promise<Response> | Response,
    options?: {
        maxRequests?: number;
        windowSeconds?: number;
        skipDevelopment?: boolean;
        allowedIPs?: string[];
    }
) {
    const config: RateLimitMiddlewareConfig = {
        maxRequests: options?.maxRequests,
        windowSeconds: options?.windowSeconds
    };

    // Add skip conditions
    if (options?.skipDevelopment || options?.allowedIPs) {
        config.skip = (request: NextRequest) => {
            if (options.skipDevelopment && skipConditions.isDevelopment(request)) {
                return true;
            }
            if (options.allowedIPs && skipConditions.isAllowedIP(options.allowedIPs)(request)) {
                return true;
            }

            return false;
        };
    }

    return withRateLimit(handler, config);
}
