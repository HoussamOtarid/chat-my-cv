import { NextRequest } from 'next/server';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
    maxRequests?: number;
    windowSeconds?: number;
    prefix?: string;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

/**
 * Extract identifier for rate limiting
 */
export function getRateLimitIdentifier(request: NextRequest, useClientId = false): string {
    // Get IP address
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const vercelIP = request.headers.get('x-vercel-forwarded-for');

    let ip = 'unknown';
    if (forwardedFor) {
        const firstIP = forwardedFor.split(',')[0];
        ip = firstIP ? firstIP.trim() : 'unknown';
    } else if (realIP) {
        ip = realIP;
    } else if (vercelIP) {
        const firstIP = vercelIP.split(',')[0];
        ip = firstIP ? firstIP.trim() : 'unknown';
    }

    // Optionally combine with client ID
    if (useClientId) {
        const clientId = request.nextUrl.searchParams.get('clientId') || request.headers.get('x-client-id');
        if (clientId) {
            return `${ip}:${clientId}`;
        }
    }

    return ip;
}

/**
 * Create rate limiter instance
 */
export function createRateLimiter(config?: RateLimitConfig) {
    // Check if Upstash is configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        console.warn('Upstash Redis not configured. Rate limiting disabled.');

        return null;
    }

    try {
        // Create Redis client
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN
        });

        // Get configuration from environment or use defaults
        const maxRequests = config?.maxRequests ?? parseInt(process.env.RATE_LIMIT_MAX || '30', 10);
        const windowSeconds = config?.windowSeconds ?? parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '600', 10);
        const prefix = config?.prefix ?? 'chat';

        // Create rate limiter with sliding window
        const rateLimiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds}s`),
            prefix: `@upstash/ratelimit:${prefix}`,
            analytics: true // Enable analytics for monitoring
        });

        return rateLimiter;
    } catch (error) {
        console.error('Failed to create rate limiter:', error);

        return null;
    }
}

/**
 * Default rate limiter for chat endpoint
 */
let defaultRateLimiter: Ratelimit | null = null;

export function getDefaultRateLimiter(): Ratelimit | null {
    if (!defaultRateLimiter) {
        defaultRateLimiter = createRateLimiter();
    }

    return defaultRateLimiter;
}

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(request: NextRequest, config?: RateLimitConfig): Promise<RateLimitResult> {
    const rateLimiter = config ? createRateLimiter(config) : getDefaultRateLimiter();

    // If rate limiter is not available, allow all requests
    if (!rateLimiter) {
        return {
            success: true,
            limit: 999999,
            remaining: 999999,
            reset: Date.now() + 3600000 // 1 hour from now
        };
    }

    try {
        const identifier = getRateLimitIdentifier(request, true);
        const result = await rateLimiter.limit(identifier);

        return {
            success: result.success,
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset
        };
    } catch (error) {
        console.error('Rate limit check failed:', error);

        // On error, allow the request but log it
        return {
            success: true,
            limit: 999999,
            remaining: 999999,
            reset: Date.now() + 3600000
        };
    }
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(headers: Headers, result: RateLimitResult): void {
    headers.set('X-RateLimit-Limit', result.limit.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString());

    if (!result.success) {
        const retryAfter = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));
        headers.set('Retry-After', retryAfter.toString());
    }
}

/**
 * Rate limit response helper
 */
export function rateLimitResponse(result: RateLimitResult) {
    const headers = new Headers();
    addRateLimitHeaders(headers, result);

    const retryAfter = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));

    return new Response(
        JSON.stringify({
            error: 'Too many requests',
            message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
            retryAfter
        }),
        {
            status: 429,
            headers
        }
    );
}

/**
 * Rate limiter for specific endpoints
 */
export const rateLimiters = {
    chat: () => createRateLimiter({ prefix: 'chat' }),
    admin: () =>
        createRateLimiter({
            maxRequests: 100,
            windowSeconds: 60,
            prefix: 'admin'
        }),
    upload: () =>
        createRateLimiter({
            maxRequests: 10,
            windowSeconds: 3600, // 1 hour
            prefix: 'upload'
        })
} as const;

/**
 * IP-based rate limiter with different tiers
 */
export class TieredRateLimiter {
    private limiters: Map<string, Ratelimit>;

    constructor() {
        this.limiters = new Map();
    }

    async checkLimit(identifier: string, tier: 'free' | 'premium' = 'free'): Promise<RateLimitResult> {
        const config =
            tier === 'premium' ? { maxRequests: 100, windowSeconds: 600 } : { maxRequests: 30, windowSeconds: 600 };

        const key = `${tier}:${config.maxRequests}:${config.windowSeconds}`;

        if (!this.limiters.has(key)) {
            const limiter = createRateLimiter({ ...config, prefix: tier });
            if (limiter) {
                this.limiters.set(key, limiter);
            } else {
                return {
                    success: true,
                    limit: 999999,
                    remaining: 999999,
                    reset: Date.now() + 3600000
                };
            }
        }

        const limiter = this.limiters.get(key)!;
        const result = await limiter.limit(identifier);

        return {
            success: result.success,
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset
        };
    }
}
