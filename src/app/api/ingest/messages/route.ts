import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-error-handler';
import { createSupabaseAdmin } from '@/lib/supabase';

import crypto from 'crypto';
import { z } from 'zod';

// Use Node.js runtime for better performance
export const runtime = 'nodejs';

// Schema for message validation
const MessageSchema = z.object({
    client_message_id: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    created_at: z.string().optional()
});

const IngestRequestSchema = z.object({
    client_id: z.string(),
    session_id: z.string().optional(),
    messages: z.array(MessageSchema),
    user_agent: z.string().optional()
});

type IngestRequest = z.infer<typeof IngestRequestSchema>;
type Message = z.infer<typeof MessageSchema>;

/**
 * Hash IP address for privacy
 */
function hashIP(ip: string | null): string | null {
    if (!ip || !process.env.IP_HASH_SALT) {
        return null;
    }

    try {
        const hash = crypto
            .createHash('sha256')
            .update(ip + process.env.IP_HASH_SALT)
            .digest('hex');

        // Return first 16 chars for brevity
        return hash.substring(0, 16);
    } catch {
        return null;
    }
}

/**
 * Extract client IP from request headers
 */
function getClientIP(request: NextRequest): string | null {
    // Check various headers for IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        // Take first IP if multiple
        const firstIP = forwardedFor.split(',')[0];

        return firstIP ? firstIP.trim() : null;
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    // Vercel specific
    const vercelIP = request.headers.get('x-vercel-forwarded-for');
    if (vercelIP) {
        const firstIP = vercelIP.split(',')[0];

        return firstIP ? firstIP.trim() : null;
    }

    return null;
}

/**
 * POST /api/ingest/messages
 * Async message archival endpoint - responds quickly with 202
 */
export async function POST(request: NextRequest) {
    try {
        // Parse and validate request body
        const body = await request.json();
        const validationResult = IngestRequestSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const data: IngestRequest = validationResult.data;

        // Respond immediately with 202 Accepted
        const response = NextResponse.json(
            {
                status: 'accepted',
                client_id: data.client_id,
                message_count: data.messages.length
            },
            { status: 202 }
        );

        // Perform async database operations
        // Note: In production, you might want to use a queue service
        setImmediate(async () => {
            const supabase = await createSupabaseAdmin();

            try {
                // 1. Upsert chat session
                const clientIP = getClientIP(request);
                const ipHash = hashIP(clientIP);
                const userAgent = data.user_agent || request.headers.get('user-agent') || null;

                // First, try to get existing session
                const { data: existingSession } = await supabase
                    .from('chat_session')
                    .select('id')
                    .eq('client_id', data.client_id)
                    .single();

                let sessionId: string;

                if (existingSession) {
                    sessionId = existingSession.id;

                    // Update session metadata if needed
                    if (ipHash || userAgent) {
                        await supabase
                            .from('chat_session')
                            .update({
                                ip_hash: ipHash
                                // Note: user_agent column doesn't exist in current schema
                                // We'd need to add it to track user agent
                            })
                            .eq('id', sessionId);
                    }
                } else {
                    // Create new session
                    const { data: newSession, error: sessionError } = await supabase
                        .from('chat_session')
                        .insert({
                            client_id: data.client_id,
                            ip_hash: ipHash
                            // user_agent would go here if column existed
                        })
                        .select('id')
                        .single();

                    if (sessionError || !newSession) {
                        console.error('Failed to create session:', sessionError);

                        return;
                    }

                    sessionId = newSession.id;
                }

                // Use provided session_id if it matches
                if (data.session_id && data.session_id === sessionId) {
                    sessionId = data.session_id;
                }

                // 2. Batch insert messages with deduplication
                if (data.messages.length > 0) {
                    // Prepare messages for insertion
                    const messagesToInsert = data.messages.map((msg: Message) => ({
                        session_id: sessionId,
                        client_message_id: msg.client_message_id,
                        role: msg.role,
                        content: msg.content,
                        created_at: msg.created_at || new Date().toISOString()
                    }));

                    // Insert messages with upsert to handle duplicates
                    // Note: Supabase doesn't have native upsert with ON CONFLICT
                    // We'll use the unique constraint to prevent duplicates
                    const { error: messageError } = await supabase.from('chat_message').upsert(messagesToInsert, {
                        onConflict: 'session_id,client_message_id',
                        ignoreDuplicates: true
                    });

                    if (messageError) {
                        // Log error but don't fail - some messages might be duplicates
                        console.error('Message insertion error:', messageError);

                        // Try inserting messages one by one to handle partial failures
                        for (const msg of messagesToInsert) {
                            try {
                                await supabase.from('chat_message').insert(msg);
                            } catch (individualError) {
                                // Likely a duplicate, ignore
                                console.debug('Duplicate message ignored:', msg.client_message_id);
                            }
                        }
                    }
                }

                console.log(`Archived ${data.messages.length} messages for session ${sessionId}`);
            } catch (error) {
                console.error('Async archival error:', error);
                // Don't throw - we already responded to the client
            }
        });

        return response;
    } catch (error) {
        return handleApiError(error, {
            apiRoute: '/api/ingest/messages',
            method: 'POST',
            errorMessage: 'Failed to process request'
        });
    }
}

/**
 * GET /api/ingest/messages
 * Health check endpoint
 */
export async function GET() {
    return NextResponse.json({
        status: 'healthy',
        endpoint: '/api/ingest/messages',
        method: 'POST',
        description: 'Async message archival endpoint'
    });
}
