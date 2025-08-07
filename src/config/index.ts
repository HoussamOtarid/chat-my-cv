// ============================================
// Application Configuration
// ============================================

export const config = {
    // Environment
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',

    // Supabase
    supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    },

    // NextAuth
    auth: {
        // Support Auth.js v5 envs with fallback to legacy NEXTAUTH_* names
        url: process.env.AUTH_URL || process.env.NEXTAUTH_URL!,
        secret: (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET)!,
        adminEmail: process.env.ADMIN_EMAIL!,
        adminPassword: process.env.ADMIN_PASSWORD!
    },

    // Encryption
    encryption: {
        key: process.env.ENCRYPTION_KEY!
    },

    // Rate Limiting
    rateLimit: {
        redisUrl: process.env.UPSTASH_REDIS_REST_URL,
        redisToken: process.env.UPSTASH_REDIS_REST_TOKEN
    },

    // Application
    app: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
        ipHashSalt: process.env.IP_HASH_SALT!
    }
} as const;

// Validate required environment variables
export function validateConfig() {
    const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'ADMIN_EMAIL',
        'ADMIN_PASSWORD',
        'ENCRYPTION_KEY'
    ];

    const missing = required.filter((key) => !process.env[key]);
    // AUTH secret can be provided by either AUTH_SECRET (v5) or NEXTAUTH_SECRET (legacy)
    const hasAuthSecret = Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET);
    if (!hasAuthSecret) missing.push('AUTH_SECRET');
    // URL is optional in v5; do not require it

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
