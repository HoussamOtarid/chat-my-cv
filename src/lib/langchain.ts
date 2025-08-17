import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';

import { Document } from 'langchain/document';

export interface PDFExtractionResult {
    success: boolean;
    content?: string;
    pageCount?: number;
    metadata?: {
        title?: string;
        author?: string;
        subject?: string;
        creator?: string;
        creationDate?: Date;
        modificationDate?: Date;
    };
    error?: {
        message: string;
        details?: any;
    };
}

/**
 * Extract text content from a PDF file
 * @param input - Either a file path string or a Buffer containing PDF data
 * @returns Extracted text content and metadata
 */
export async function extractTextFromPDF(input: string | Buffer): Promise<PDFExtractionResult> {
    try {
        let loader: PDFLoader;

        if (typeof input === 'string') {
            // Input is a file path
            loader = new PDFLoader(input, {
                splitPages: false // We want the full content, not split by pages
            });
        } else {
            // Input is a Buffer - create a Blob from it
            const uint8Array = new Uint8Array(input);
            const blob = new Blob([uint8Array], { type: 'application/pdf' });
            loader = new PDFLoader(blob, {
                splitPages: false
            });
        }

        // Load and parse the PDF
        const docs: Document[] = await loader.load();

        if (!docs || docs.length === 0) {
            return {
                success: false,
                error: {
                    message: 'No content could be extracted from the PDF'
                }
            };
        }

        // Combine all document content
        const content = docs.map((doc) => doc.pageContent).join('\n\n');

        // Extract metadata if available
        const metadata = docs[0]?.metadata || {};

        // Clean up the content - remove excessive whitespace
        const cleanedContent = content
            .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
            .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
            .trim();

        return {
            success: true,
            content: cleanedContent,
            pageCount: docs.length,
            metadata: {
                title: metadata.pdf?.info?.Title,
                author: metadata.pdf?.info?.Author,
                subject: metadata.pdf?.info?.Subject,
                creator: metadata.pdf?.info?.Creator,
                creationDate: metadata.pdf?.info?.CreationDate,
                modificationDate: metadata.pdf?.info?.ModificationDate
            }
        };
    } catch (error) {
        console.error('PDF extraction error:', error);

        // Handle specific error types
        let errorMessage = 'Failed to extract text from PDF';

        if (error instanceof Error) {
            if (error.message.includes('encrypted') || error.message.includes('password')) {
                errorMessage = 'PDF is password protected and cannot be processed';
            } else if (error.message.includes('corrupt') || error.message.includes('invalid')) {
                errorMessage = 'PDF file appears to be corrupted or invalid';
            } else {
                errorMessage = error.message;
            }
        }

        return {
            success: false,
            error: {
                message: errorMessage,
                details: error
            }
        };
    }
}

/**
 * Extract text from PDF with page-by-page processing
 * Useful for large PDFs or when you need page-level control
 */
export async function extractTextFromPDFByPages(input: string | Buffer): Promise<PDFExtractionResult> {
    try {
        let loader: PDFLoader;

        if (typeof input === 'string') {
            loader = new PDFLoader(input, {
                splitPages: true // Split content by pages
            });
        } else {
            const uint8Array = new Uint8Array(input);
            const blob = new Blob([uint8Array], { type: 'application/pdf' });
            loader = new PDFLoader(blob, {
                splitPages: true
            });
        }

        const docs: Document[] = await loader.load();

        if (!docs || docs.length === 0) {
            return {
                success: false,
                error: {
                    message: 'No content could be extracted from the PDF'
                }
            };
        }

        // Process each page and combine
        const pages = docs.map((doc, index) => {
            const pageContent = doc.pageContent.trim();

            return pageContent ? `--- Page ${index + 1} ---\n${pageContent}` : '';
        });

        const content = pages.filter((page) => page.length > 0).join('\n\n');

        // Extract metadata from first document
        const metadata = docs[0]?.metadata || {};

        return {
            success: true,
            content,
            pageCount: docs.length,
            metadata: {
                title: metadata.pdf?.info?.Title,
                author: metadata.pdf?.info?.Author,
                subject: metadata.pdf?.info?.Subject,
                creator: metadata.pdf?.info?.Creator,
                creationDate: metadata.pdf?.info?.CreationDate,
                modificationDate: metadata.pdf?.info?.ModificationDate
            }
        };
    } catch (error) {
        console.error('PDF extraction error:', error);

        return {
            success: false,
            error: {
                message: 'Failed to extract text from PDF',
                details: error
            }
        };
    }
}

/**
 * Validate if a file is a valid PDF
 * @param buffer - Buffer containing file data
 * @returns true if the file appears to be a valid PDF
 */
export function isValidPDF(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 4) {
        return false;
    }

    // Check for PDF magic number (%PDF)
    const pdfMagicNumber = buffer.slice(0, 4).toString('ascii');

    return pdfMagicNumber === '%PDF';
}

/**
 * Get estimated token count for text
 * Rough estimation: ~4 characters per token for English text
 * This is useful for checking if content will fit in LLM context
 */
export function estimateTokenCount(text: string): number {
    if (!text) return 0;

    // Rough estimation: ~4 characters per token
    // This is a simple heuristic and may vary based on the actual tokenizer
    return Math.ceil(text.length / 4);
}

/**
 * Truncate text to fit within token limit
 * @param text - Text to truncate
 * @param maxTokens - Maximum number of tokens
 * @returns Truncated text
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
    const estimatedTokens = estimateTokenCount(text);

    if (estimatedTokens <= maxTokens) {
        return text;
    }

    // Calculate approximate character limit
    const charLimit = maxTokens * 4;

    // Truncate and add ellipsis
    return text.slice(0, charLimit - 3) + '...';
}
