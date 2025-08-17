import type { ChatStreamEvent } from '@/types/api';

/**
 * SSE Client configuration
 */
export interface SSEClientConfig {
    url: string;
    params?: Record<string, string>;
    onMessage?: (event: ChatStreamEvent) => void;
    onError?: (error: Error) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    maxRetries?: number;
    retryDelay?: number;
    retryBackoff?: number;
}

/**
 * SSE connection state
 */
export enum SSEState {
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    DISCONNECTED = 'DISCONNECTED',
    ERROR = 'ERROR',
    CLOSED = 'CLOSED'
}

/**
 * SSE Client for handling Server-Sent Events with reconnection logic
 */
export class SSEClient {
    private config: Required<SSEClientConfig>;
    private eventSource: EventSource | null = null;
    private state: SSEState = SSEState.DISCONNECTED;
    private retryCount = 0;
    private retryTimer: NodeJS.Timeout | null = null;
    private abortController: AbortController | null = null;

    constructor(config: SSEClientConfig) {
        this.config = {
            url: config.url,
            params: config.params || {},
            onMessage: config.onMessage || (() => {}),
            onError: config.onError || (() => {}),
            onConnect: config.onConnect || (() => {}),
            onDisconnect: config.onDisconnect || (() => {}),
            maxRetries: config.maxRetries ?? 5,
            retryDelay: config.retryDelay ?? 1000,
            retryBackoff: config.retryBackoff ?? 2
        };
    }

    /**
     * Connect to the SSE endpoint
     */
    connect(): void {
        if (this.state === SSEState.CONNECTING || this.state === SSEState.CONNECTED) {
            return;
        }

        this.state = SSEState.CONNECTING;
        this.abortController = new AbortController();

        try {
            // Build URL with query params
            const url = new URL(this.config.url, window.location.origin);
            Object.entries(this.config.params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });

            // Create EventSource
            this.eventSource = new EventSource(url.toString());

            // Handle connection open
            this.eventSource.onopen = () => {
                this.state = SSEState.CONNECTED;
                this.retryCount = 0;
                this.config.onConnect();
            };

            // Handle messages
            this.eventSource.onmessage = (event) => {
                try {
                    const data: ChatStreamEvent = JSON.parse(event.data);
                    this.config.onMessage(data);

                    // Close connection on 'done' or 'error' events
                    if (data.type === 'done' || data.type === 'error') {
                        this.disconnect();
                    }
                } catch (error) {
                    console.error('Failed to parse SSE message:', error);
                    this.config.onError(new Error('Invalid message format'));
                }
            };

            // Handle errors
            this.eventSource.onerror = (event) => {
                console.error('SSE error:', event);
                this.state = SSEState.ERROR;

                if (this.eventSource?.readyState === EventSource.CLOSED) {
                    this.handleDisconnect();
                }
            };
        } catch (error) {
            console.error('Failed to create EventSource:', error);
            this.state = SSEState.ERROR;
            this.config.onError(error instanceof Error ? error : new Error('Connection failed'));
            this.handleDisconnect();
        }
    }

    /**
     * Disconnect from the SSE endpoint
     */
    disconnect(): void {
        this.clearRetryTimer();

        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }

        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        if (this.state !== SSEState.CLOSED) {
            this.state = SSEState.DISCONNECTED;
            this.config.onDisconnect();
        }
    }

    /**
     * Close the connection permanently
     */
    close(): void {
        this.state = SSEState.CLOSED;
        this.disconnect();
    }

    /**
     * Handle disconnection with retry logic
     */
    private handleDisconnect(): void {
        this.disconnect();

        // Don't retry if closed manually or max retries reached
        if (this.state === SSEState.CLOSED || this.retryCount >= this.config.maxRetries) {
            this.state = SSEState.CLOSED;
            this.config.onError(new Error('Connection lost. Max retries exceeded.'));

            return;
        }

        // Calculate retry delay with exponential backoff
        const delay = this.config.retryDelay * Math.pow(this.config.retryBackoff, this.retryCount);
        this.retryCount++;

        console.log(`Retrying connection in ${delay}ms (attempt ${this.retryCount}/${this.config.maxRetries})`);

        this.retryTimer = setTimeout(() => {
            this.connect();
        }, delay);
    }

    /**
     * Clear retry timer
     */
    private clearRetryTimer(): void {
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
    }

    /**
     * Get current connection state
     */
    getState(): SSEState {
        return this.state;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.state === SSEState.CONNECTED;
    }
}

/**
 * Fetch-based SSE client for environments where EventSource is not available
 * or when more control is needed
 */
export class FetchSSEClient {
    private config: Required<SSEClientConfig>;
    private state: SSEState = SSEState.DISCONNECTED;
    private retryCount = 0;
    private retryTimer: NodeJS.Timeout | null = null;
    private abortController: AbortController | null = null;

    constructor(config: SSEClientConfig) {
        this.config = {
            url: config.url,
            params: config.params || {},
            onMessage: config.onMessage || (() => {}),
            onError: config.onError || (() => {}),
            onConnect: config.onConnect || (() => {}),
            onDisconnect: config.onDisconnect || (() => {}),
            maxRetries: config.maxRetries ?? 5,
            retryDelay: config.retryDelay ?? 1000,
            retryBackoff: config.retryBackoff ?? 2
        };
    }

    /**
     * Connect to the SSE endpoint using fetch
     */
    async connect(): Promise<void> {
        if (this.state === SSEState.CONNECTING || this.state === SSEState.CONNECTED) {
            return;
        }

        this.state = SSEState.CONNECTING;
        this.abortController = new AbortController();

        try {
            // Build URL with query params
            const url = new URL(this.config.url, window.location.origin);
            Object.entries(this.config.params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });

            // Make fetch request
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    Accept: 'text/event-stream'
                },
                signal: this.abortController.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (!response.body) {
                throw new Error('Response body is empty');
            }

            this.state = SSEState.CONNECTED;
            this.retryCount = 0;
            this.config.onConnect();

            // Read the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                buffer += decoder.decode(value, { stream: true });

                // Process complete messages
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data: ChatStreamEvent = JSON.parse(line.slice(6));
                            this.config.onMessage(data);

                            // Close connection on 'done' or 'error' events
                            if (data.type === 'done' || data.type === 'error') {
                                this.disconnect();

                                return;
                            }
                        } catch (error) {
                            console.error('Failed to parse SSE message:', error);
                        }
                    }
                }
            }

            this.handleDisconnect();
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                // Connection was aborted manually

                return;
            }

            console.error('SSE fetch error:', error);
            this.state = SSEState.ERROR;
            this.config.onError(error instanceof Error ? error : new Error('Connection failed'));
            this.handleDisconnect();
        }
    }

    /**
     * Disconnect from the SSE endpoint
     */
    disconnect(): void {
        this.clearRetryTimer();

        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        if (this.state !== SSEState.CLOSED) {
            this.state = SSEState.DISCONNECTED;
            this.config.onDisconnect();
        }
    }

    /**
     * Close the connection permanently
     */
    close(): void {
        this.state = SSEState.CLOSED;
        this.disconnect();
    }

    /**
     * Handle disconnection with retry logic
     */
    private handleDisconnect(): void {
        this.disconnect();

        // Don't retry if closed manually or max retries reached
        if (this.state === SSEState.CLOSED || this.retryCount >= this.config.maxRetries) {
            this.state = SSEState.CLOSED;
            this.config.onError(new Error('Connection lost. Max retries exceeded.'));

            return;
        }

        // Calculate retry delay with exponential backoff
        const delay = this.config.retryDelay * Math.pow(this.config.retryBackoff, this.retryCount);
        this.retryCount++;

        console.log(`Retrying connection in ${delay}ms (attempt ${this.retryCount}/${this.config.maxRetries})`);

        this.retryTimer = setTimeout(() => {
            void this.connect();
        }, delay);
    }

    /**
     * Clear retry timer
     */
    private clearRetryTimer(): void {
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
    }

    /**
     * Get current connection state
     */
    getState(): SSEState {
        return this.state;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.state === SSEState.CONNECTED;
    }
}

/**
 * Create SSE client based on environment support
 */
export function createSSEClient(config: SSEClientConfig): SSEClient | FetchSSEClient {
    // Use EventSource if available (better for SSE)
    if (typeof EventSource !== 'undefined') {
        return new SSEClient(config);
    }

    // Fallback to fetch-based implementation
    return new FetchSSEClient(config);
}
