import { NextResponse } from 'next/server';

/**
 * Health check endpoint for monitoring
 * Used by Docker, Kubernetes, and monitoring services
 */
export async function GET() {
    try {
        // Check if essential environment variables are set
        const checks = {
            environment: process.env.NODE_ENV || 'development',
            nextAuth: !!process.env.NEXTAUTH_SECRET,
            supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0'
        };

        // Basic health check - service is running
        return NextResponse.json(
            {
                status: 'healthy',
                checks
            },
            { status: 200 }
        );
    } catch (error) {
        // Service is unhealthy
        return NextResponse.json(
            {
                status: 'unhealthy',
                error: 'Health check failed'
            },
            { status: 503 }
        );
    }
}
