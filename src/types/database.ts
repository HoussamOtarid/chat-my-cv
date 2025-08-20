export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
    public: {
        Tables: {
            configuration: {
                Row: {
                    id: string;
                    key: string;
                    value: Json;
                    encrypted: boolean;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    key: string;
                    value: Json;
                    encrypted?: boolean;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    key?: string;
                    value?: Json;
                    encrypted?: boolean;
                    updated_at?: string;
                };
            };
            resume: {
                Row: {
                    id: string;
                    filename: string;
                    content: string;
                    file_size: number;
                    mime_type: string;
                    file_url: string | null;
                    uploaded_at: string;
                    is_active: boolean;
                };
                Insert: {
                    id?: string;
                    filename: string;
                    content: string;
                    file_size: number;
                    mime_type?: string;
                    file_url?: string | null;
                    uploaded_at?: string;
                    is_active?: boolean;
                };
                Update: {
                    id?: string;
                    filename?: string;
                    content?: string;
                    file_size?: number;
                    mime_type?: string;
                    file_url?: string | null;
                    uploaded_at?: string;
                    is_active?: boolean;
                };
            };
            chat_session: {
                Row: {
                    id: string;
                    client_id: string;
                    ip_hash: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    client_id: string;
                    ip_hash?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    client_id?: string;
                    ip_hash?: string | null;
                    created_at?: string;
                };
            };
            chat_message: {
                Row: {
                    id: string;
                    session_id: string;
                    client_message_id: string;
                    role: 'user' | 'assistant' | 'system';
                    content: string;
                    model: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    session_id: string;
                    client_message_id: string;
                    role: 'user' | 'assistant' | 'system';
                    content: string;
                    model?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    session_id?: string;
                    client_message_id?: string;
                    role?: 'user' | 'assistant' | 'system';
                    content?: string;
                    model?: string | null;
                    created_at?: string;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
    };
}
