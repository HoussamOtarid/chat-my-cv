import { NextRequest } from 'next/server';

import { createChatModel } from '@/lib/llm';
import { createChatPrompt } from '@/lib/prompts';
import { withRateLimit } from '@/lib/rate-limit-middleware';
import { createSupabaseAdmin } from '@/lib/supabase';
import type { ChatMessage, ChatStreamEvent, ChatStreamRequest, LLMConfig } from '@/types';

// Use Node.js runtime for streaming
export const runtime = 'nodejs';

// Configure dynamic behavior
export const dynamic = 'force-dynamic';

/**
 * GET /api/chat/stream
 * Server-Sent Events endpoint for streaming chat responses
 */
async function handleGET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const message = searchParams.get('message');
    const clientId = searchParams.get('clientId');
    const clientMessageId = searchParams.get('clientMessageId');
    const sessionId = searchParams.get('sessionId');

    // Validate required parameters
    if (!message || !clientId || !clientMessageId) {
        return new Response('Missing required parameters', { status: 400 });
    }

    // Create SSE response with proper headers
    const headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no' // Disable nginx buffering
    };

    // Create a TransformStream for SSE
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Helper to send SSE events
    const sendEvent = async (event: ChatStreamEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        await writer.write(encoder.encode(data));
    };

    // Start async processing
    (async () => {
        const supabase = await createSupabaseAdmin();
        let fullResponse = '';
        let sessionIdToUse = sessionId;

        try {
            // 1. Get active resume
            const { data: resume, error: resumeError } = await supabase
                .from('resume')
                .select('*')
                .eq('is_active', true)
                .single();

            if (resumeError || !resume) {
                await sendEvent({
                    type: 'error',
                    error: 'No active resume found. Please ask the administrator to upload one.'
                });

                return;
            }

            // 2. Get LLM configuration
            const { data: llmConfig, error: configError } = await supabase
                .from('configuration')
                .select('value')
                .eq('key', 'llm_config')
                .single();

            if (configError || !llmConfig) {
                await sendEvent({
                    type: 'error',
                    error: 'LLM not configured. Please contact the administrator.'
                });

                return;
            }

            // 3. Decrypt API key if needed
            const config = llmConfig.value as LLMConfig;
            if (!config.apiKey) {
                // Try to get encrypted API key
                const { data: encryptedKey } = await supabase
                    .from('configuration')
                    .select('value')
                    .eq('key', `${config.provider}_api_key`)
                    .single();

                if (encryptedKey) {
                    // Import encryption utilities
                    const { decrypt } = await import('@/lib/encryption');
                    config.apiKey = await decrypt(encryptedKey.value as string);
                }
            }

            if (!config.apiKey) {
                await sendEvent({
                    type: 'error',
                    error: 'API key not configured. Please contact the administrator.'
                });

                return;
            }

            // 4. Get or create session
            if (!sessionIdToUse) {
                const { data: existingSession } = await supabase
                    .from('chat_session')
                    .select('id')
                    .eq('client_id', clientId)
                    .single();

                if (existingSession) {
                    sessionIdToUse = existingSession.id;
                } else {
                    // Create new session
                    const { data: newSession, error: sessionError } = await supabase
                        .from('chat_session')
                        .insert({
                            client_id: clientId,
                            user_agent: request.headers.get('user-agent') || null,
                            ip_hash: null // Could add IP hashing if needed
                        })
                        .select('id')
                        .single();

                    if (sessionError || !newSession) {
                        console.error('Failed to create session:', sessionError);
                        // Continue without session logging
                    } else {
                        sessionIdToUse = newSession.id;
                    }
                }
            }

            // 5. Log user message (async, non-blocking)
            if (sessionIdToUse) {
                void supabase
                    .from('chat_message')
                    .insert({
                        session_id: sessionIdToUse,
                        client_message_id: clientMessageId,
                        role: 'user',
                        content: message,
                        seq: 0 // Could be incremented based on conversation
                    })
                    .then(({ error }) => {
                        if (error) console.error('Failed to log user message:', error);

                        return undefined;
                    });
            }

            // 6. Get conversation history (optional - for context)
            // In MVP, we rely on client-side localStorage for history
            const conversationHistory: ChatMessage[] = [];

            // 7. Create LLM and stream response
            const model = createChatModel(config);
            const messages = createChatPrompt(resume, conversationHistory, message);

            // Stream the response
            const response = await model.stream(messages);

            for await (const chunk of response) {
                const token = chunk.content as string;
                if (token) {
                    fullResponse += token;
                    await sendEvent({ type: 'token', content: token });
                }
            }

            // 8. Send completion event
            await sendEvent({ type: 'done' });

            // 9. Log assistant message (async, non-blocking)
            if (sessionIdToUse && fullResponse) {
                void supabase
                    .from('chat_message')
                    .insert({
                        session_id: sessionIdToUse,
                        client_message_id: `${clientMessageId}-response`,
                        role: 'assistant',
                        content: fullResponse,
                        seq: 1, // Could be incremented
                        model: config.model || config.provider
                    })
                    .then(({ error }) => {
                        if (error) console.error('Failed to log assistant message:', error);

                        return undefined;
                    });
            }
        } catch (error) {
            console.error('Streaming error:', error);
            const errorMessage = error instanceof Error ? error.message : 'An error occurred';

            // Send error event
            await sendEvent({
                type: 'error',
                error: errorMessage
            });
        } finally {
            // Close the stream
            await writer.close();
        }
    })();

    // Return the readable stream as response
    return new Response(stream.readable, { headers });
}

/**
 * POST /api/chat/stream
 * Alternative endpoint that accepts JSON body
 */
async function handlePOST(request: NextRequest) {
    try {
        const body: ChatStreamRequest = await request.json();

        // Convert to query params and delegate to GET
        const params = new URLSearchParams({
            message: body.message,
            clientId: body.clientId,
            clientMessageId: body.clientMessageId
        });

        if (body.sessionId) {
            params.append('sessionId', body.sessionId);
        }

        // Create a new request with query params
        const url = new URL(request.url);
        url.search = params.toString();

        const newRequest = new NextRequest(url, {
            method: 'GET',
            headers: request.headers
        });

        return handleGET(newRequest);
    } catch (error) {
        console.error('POST error:', error);

        return new Response('Invalid request body', { status: 400 });
    }
}

/**
 * Export rate-limited handlers
 * Rate limiting is configured via environment variables:
 * - RATE_LIMIT_MAX: Maximum requests per window (default: 30)
 * - RATE_LIMIT_WINDOW_SECONDS: Window duration in seconds (default: 600)
 */
export const GET = withRateLimit(handleGET, {
    // Use default configuration from environment variables
    // Key on IP address (optionally combined with clientId)
    onRateLimitExceeded: (request) => {
        // Log rate limit exceeded events for monitoring
        const ip =
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const clientId = request.nextUrl.searchParams.get('clientId');
        console.warn(`Rate limit exceeded for IP: ${ip}, clientId: ${clientId}`);
    }
});

export const POST = withRateLimit(handlePOST, {
    // Use same configuration as GET
    onRateLimitExceeded: (request) => {
        const ip =
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            'unknown';
        console.warn(`Rate limit exceeded for IP: ${ip} on POST endpoint`);
    }
});
