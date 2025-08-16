'use client';

import type { ChatMessage } from '@/types';

/**
 * Message archival configuration
 */
interface ArchivalConfig {
    maxRetries?: number;
    retryDelay?: number;
    batchSize?: number;
    flushInterval?: number;
}

/**
 * Queued message for archival
 */
interface QueuedMessage {
    message: ChatMessage;
    retryCount: number;
    timestamp: number;
}

/**
 * Message archival client with retry queue
 */
export class MessageArchival {
    private static instance: MessageArchival;
    private queue: QueuedMessage[] = [];
    private isProcessing = false;
    private flushTimer: NodeJS.Timeout | null = null;
    private config: Required<ArchivalConfig>;

    private constructor(config: ArchivalConfig = {}) {
        this.config = {
            maxRetries: config.maxRetries ?? 3,
            retryDelay: config.retryDelay ?? 1000,
            batchSize: config.batchSize ?? 10,
            flushInterval: config.flushInterval ?? 5000 // 5 seconds
        };

        // Start periodic flush
        this.startPeriodicFlush();

        // Flush on page unload
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.flushSync();
            });
        }
    }

    /**
     * Get singleton instance
     */
    static getInstance(config?: ArchivalConfig): MessageArchival {
        if (!MessageArchival.instance) {
            MessageArchival.instance = new MessageArchival(config);
        }
        
        return MessageArchival.instance;
    }

    /**
     * Add message to queue
     */
    queueMessage(message: ChatMessage, clientId: string, sessionId?: string): void {
        // Don't queue if we're in SSR
        if (typeof window === 'undefined') {
            return;
        }

        this.queue.push({
            message,
            retryCount: 0,
            timestamp: Date.now()
        });

        // Flush if batch size reached
        if (this.queue.length >= this.config.batchSize) {
            void this.flush(clientId, sessionId);
        }
    }

    /**
     * Add multiple messages to queue
     */
    queueMessages(messages: ChatMessage[], clientId: string, sessionId?: string): void {
        messages.forEach((msg) => this.queueMessage(msg, clientId, sessionId));
    }

    /**
     * Flush message queue asynchronously
     */
    async flush(clientId: string, sessionId?: string): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;

        // Get messages to send (up to batch size)
        const messagesToSend = this.queue.splice(0, this.config.batchSize);

        try {
            const response = await this.sendMessages(
                messagesToSend.map((q) => q.message),
                clientId,
                sessionId
            );

            if (!response.ok) {
                // Put messages back in queue for retry
                this.requeueMessages(messagesToSend);
            }
        } catch (error) {
            console.error('Failed to archive messages:', error);
            // Put messages back in queue for retry
            this.requeueMessages(messagesToSend);
        } finally {
            this.isProcessing = false;

            // Process remaining messages if any
            if (this.queue.length > 0) {
                setTimeout(() => {
                    void this.flush(clientId, sessionId);
                }, this.config.retryDelay);
            }
        }
    }

    /**
     * Flush synchronously (for page unload)
     */
    private flushSync(): void {
        if (this.queue.length === 0) {
            return;
        }

        // Use sendBeacon for reliable delivery on page unload
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
            const clientId = localStorage.getItem('chat_client_id') || '';
            const messages = this.queue.map((q) => ({
                client_message_id: q.message.id,
                role: q.message.role,
                content: q.message.content,
                created_at: q.message.timestamp.toISOString()
            }));

            const payload = JSON.stringify({
                client_id: clientId,
                messages
            });

            navigator.sendBeacon('/api/ingest/messages', payload);
            this.queue = []; // Clear queue
        }
    }

    /**
     * Send messages to archival endpoint
     */
    private async sendMessages(messages: ChatMessage[], clientId: string, sessionId?: string): Promise<Response> {
        const payload = {
            client_id: clientId,
            session_id: sessionId,
            messages: messages.map((msg) => ({
                client_message_id: msg.id,
                role: msg.role,
                content: msg.content,
                created_at: msg.timestamp.toISOString()
            })),
            user_agent: navigator.userAgent
        };

        return fetch('/api/ingest/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    }

    /**
     * Requeue messages for retry
     */
    private requeueMessages(messages: QueuedMessage[]): void {
        const retriableMessages = messages
            .map((msg) => ({
                ...msg,
                retryCount: msg.retryCount + 1
            }))
            .filter((msg) => msg.retryCount < this.config.maxRetries);

        // Add to front of queue for priority
        this.queue.unshift(...retriableMessages);

        // Log dropped messages
        const droppedCount = messages.length - retriableMessages.length;
        if (droppedCount > 0) {
            console.warn(`Dropped ${droppedCount} messages after max retries`);
        }
    }

    /**
     * Start periodic flush timer
     */
    private startPeriodicFlush(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        this.flushTimer = setInterval(() => {
            const clientId = localStorage.getItem('chat_client_id');
            if (clientId && this.queue.length > 0) {
                void this.flush(clientId);
            }
        }, this.config.flushInterval);
    }

    /**
     * Stop periodic flush
     */
    stopPeriodicFlush(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
    }

    /**
     * Get queue size
     */
    getQueueSize(): number {
        return this.queue.length;
    }

    /**
     * Clear queue
     */
    clearQueue(): void {
        this.queue = [];
    }

    /**
     * Get queue status
     */
    getStatus(): {
        queueSize: number;
        isProcessing: boolean;
        oldestMessageAge: number | null;
    } {
        const oldestMessage = this.queue[0];
        const oldestAge = oldestMessage ? Date.now() - oldestMessage.timestamp : null;

        return {
            queueSize: this.queue.length,
            isProcessing: this.isProcessing,
            oldestMessageAge: oldestAge
        };
    }
}

/**
 * Default archival instance
 */
export const messageArchival = typeof window !== 'undefined' ? MessageArchival.getInstance() : null;

/**
 * React hook for message archival
 */
export function useMessageArchival() {
    if (typeof window === 'undefined') {
        return {
            queueMessage: () => {},
            queueMessages: () => {},
            flush: async () => {},
            getQueueSize: () => 0,
            getStatus: () => ({
                queueSize: 0,
                isProcessing: false,
                oldestMessageAge: null
            })
        };
    }

    const archival = MessageArchival.getInstance();

    return {
        queueMessage: archival.queueMessage.bind(archival),
        queueMessages: archival.queueMessages.bind(archival),
        flush: archival.flush.bind(archival),
        getQueueSize: archival.getQueueSize.bind(archival),
        getStatus: archival.getStatus.bind(archival)
    };
}
