/**
 * Application Configuration Constants
 * Central location for all magic numbers and configuration values
 */

// File Size Limits
export const FILE_SIZE_LIMITS = {
    MAX_RESUME_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
    DEFAULT_MAX_FILE_SIZE: 10 * 1024 * 1024 // 10MB
} as const;

// Timing Constants (in milliseconds)
export const TIMING = {
    // Retry and Delays
    DEFAULT_RETRY_DELAY: 1000, // 1 second
    MAX_RETRY_DELAY: 30000, // 30 seconds
    RETRY_MULTIPLIER: 2,
    
    // Intervals
    DEFAULT_FLUSH_INTERVAL: 5000, // 5 seconds
    CONNECTION_CHECK_INTERVAL: 30000, // 30 seconds
    HEARTBEAT_INTERVAL: 30000, // 30 seconds
    
    // Timeouts
    DEFAULT_TIMEOUT: 30000, // 30 seconds
    SSE_TIMEOUT: 120000, // 2 minutes
    API_TIMEOUT: 30000, // 30 seconds
    
    // UI Delays
    NOTIFICATION_AUTO_HIDE_DELAY: 3000, // 3 seconds
    TRANSITION_DURATION: 300, // 0.3 seconds
    DEBOUNCE_DELAY: 300, // 0.3 seconds
    SCROLL_DELAY: 100 // 0.1 seconds
} as const;

// Responsive Breakpoints (in pixels)
export const BREAKPOINTS = {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1280,
    WIDE: 1536
} as const;

// Rate Limiting
export const RATE_LIMITS = {
    MAX_RETRIES: 3,
    MAX_MESSAGES_PER_BATCH: 10,
    MAX_MESSAGES_PER_SESSION: 1000,
    SPAM_THRESHOLD: 5, // messages per second
    DEFAULT_WINDOW_SECONDS: 600 // 10 minutes
} as const;

// Storage Limits
export const STORAGE_LIMITS = {
    MAX_SESSION_STORAGE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_LOCAL_STORAGE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_CACHE_AGE: 24 * 60 * 60 * 1000 // 24 hours
} as const;

// API Configuration
export const API_CONFIG = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    DEFAULT_TEMPERATURE: 0.7,
    DEFAULT_MAX_TOKENS: 2000,
    MAX_CONTEXT_LENGTH: 4000
} as const;