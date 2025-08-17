'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Progress } from '@/registry/new-york-v4/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/registry/new-york-v4/ui/alert';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadErrorFallback } from '@/components/fallback-ui';
import { withRetry } from '@/components/async-error-boundary';

interface UploadResponse {
    success: boolean;
    message?: string;
    resume?: {
        id: string;
        filename: string;
        fileSize: number;
        uploadedAt: string;
        isActive: boolean;
        hasContent: boolean;
        contentLength: number;
    };
    extraction?: {
        success: boolean;
        error?: string | null;
        charactersExtracted: number;
    };
    error?: string;
}

interface ResumeUploaderProps {
    onUploadSuccess?: (response: UploadResponse) => void;
    onUploadError?: (error: string) => void;
    maxFileSize?: number; // in bytes
    className?: string;
}

const MAX_FILE_SIZE_DEFAULT = 10 * 1024 * 1024; // 10MB

export function ResumeUploader({
    onUploadSuccess,
    onUploadError,
    maxFileSize = MAX_FILE_SIZE_DEFAULT,
    className
}: ResumeUploaderProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [extractionInfo, setExtractionInfo] = useState<{ success: boolean; charactersExtracted: number } | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        if (file.type !== 'application/pdf') {
            return 'Only PDF files are allowed';
        }
        
        if (file.size > maxFileSize) {
            const maxSizeMB = maxFileSize / (1024 * 1024);
            
return `File size must be less than ${maxSizeMB}MB`;
        }
        
        return null;
    };

    const handleFileSelect = useCallback((file: File) => {
        const error = validateFile(file);
        if (error) {
            setUploadStatus('error');
            setStatusMessage(error);
            if (onUploadError) {
                onUploadError(error);
            }
            
return;
        }
        
        setSelectedFile(file);
        setUploadStatus('idle');
        setStatusMessage('');
        setExtractionInfo(null);
    }, [maxFileSize, onUploadError]);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file) {
                handleFileSelect(file);
            }
        }
    }, [handleFileSelect]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file) {
                handleFileSelect(file);
            }
        }
    }, [handleFileSelect]);

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadStatus('uploading');
        setStatusMessage('Uploading resume...');
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            // Using XMLHttpRequest for progress tracking
            const xhr = new XMLHttpRequest();
            
            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress(percentComplete);
                    
                    if (percentComplete === 100) {
                        setStatusMessage('Processing PDF...');
                    }
                }
            });

            // Create a promise to handle the request
            const uploadPromise = new Promise<UploadResponse>((resolve, reject) => {
                xhr.onload = () => {
                    if (xhr.status === 200) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve(response);
                        } catch (error) {
                            reject(new Error('Invalid response from server'));
                        }
                    } else {
                        try {
                            const errorResponse = JSON.parse(xhr.responseText);
                            reject(new Error(errorResponse.error || 'Upload failed'));
                        } catch {
                            reject(new Error(`Upload failed with status: ${xhr.status}`));
                        }
                    }
                };

                xhr.onerror = () => {
                    reject(new Error('Network error during upload'));
                };

                xhr.open('POST', '/api/admin/resume/upload');
                xhr.send(formData);
            });

            // Use retry logic for network failures
            const response = await withRetry(
                () => uploadPromise,
                {
                    maxRetries: 2,
                    retryDelay: 2000,
                    shouldRetry: (error) => {
                        // Only retry on network errors
                        return error.message.includes('Network') || 
                               error.message.includes('network');
                    },
                    onRetry: (attempt) => {
                        setStatusMessage(`Retrying upload (attempt ${attempt})...`);
                    }
                }
            );

            if (response.success) {
                setUploadStatus('success');
                setStatusMessage('Resume uploaded successfully!');
                
                if (response.extraction) {
                    setExtractionInfo({
                        success: response.extraction.success,
                        charactersExtracted: response.extraction.charactersExtracted
                    });
                }
                
                if (onUploadSuccess) {
                    onUploadSuccess(response);
                }
                
                // Clear file selection after successful upload
                setTimeout(() => {
                    setSelectedFile(null);
                    setUploadProgress(0);
                }, 2000);
            } else {
                throw new Error(response.error || 'Upload failed');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';
            setUploadStatus('error');
            setStatusMessage(errorMessage);
            
            if (onUploadError) {
                onUploadError(errorMessage);
            }
        } finally {
            setIsUploading(false);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <Card className={cn('w-full', className)}>
            <CardHeader>
                <CardTitle>Upload Resume</CardTitle>
                <CardDescription>
                    Upload a PDF file containing your resume. Maximum file size: {formatFileSize(maxFileSize)}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Drag and drop area */}
                <div
                    className={cn(
                        'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                        isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
                        selectedFile && uploadStatus === 'idle' ? 'bg-muted/50' : '',
                        'hover:border-primary/50 hover:bg-muted/50'
                    )}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileInputChange}
                        className="hidden"
                        disabled={isUploading}
                    />
                    
                    {selectedFile ? (
                        <div className="space-y-3">
                            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{selectedFile.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatFileSize(selectedFile.size)}
                                </p>
                            </div>
                            {uploadStatus === 'idle' && (
                                <div className="flex gap-2 justify-center">
                                    <Button
                                        onClick={handleUpload}
                                        disabled={isUploading}
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setUploadStatus('idle');
                                            setStatusMessage('');
                                        }}
                                        disabled={isUploading}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            <div>
                                <p className="text-lg font-medium">
                                    {isDragActive ? 'Drop your PDF here' : 'Drag and drop your resume'}
                                </p>
                                <p className="text-sm text-muted-foreground">or</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                Browse Files
                            </Button>
                        </div>
                    )}
                </div>

                {/* Upload progress */}
                {isUploading && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
                            </span>
                            <span className="font-medium">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                    </div>
                )}

                {/* Status messages */}
                {uploadStatus === 'success' && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertTitle className="text-green-800 dark:text-green-200">Success!</AlertTitle>
                        <AlertDescription className="text-green-700 dark:text-green-300">
                            {statusMessage}
                            {extractionInfo && (
                                <div className="mt-2">
                                    {extractionInfo.success ? (
                                        <span className="text-sm">
                                            Extracted {extractionInfo.charactersExtracted.toLocaleString()} characters from the PDF.
                                        </span>
                                    ) : (
                                        <span className="text-sm text-yellow-600 dark:text-yellow-400">
                                            Note: Text extraction encountered issues. The file was saved but may need reprocessing.
                                        </span>
                                    )}
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                {uploadStatus === 'error' && (
                    <UploadErrorFallback 
                        error={new Error(statusMessage)}
                        retry={() => handleUpload()}
                        reset={() => {
                            setSelectedFile(null);
                            setUploadStatus('idle');
                            setStatusMessage('');
                            setUploadProgress(0);
                        }}
                    />
                )}

                {uploadStatus === 'uploading' && statusMessage && (
                    <Alert>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertTitle>Processing</AlertTitle>
                        <AlertDescription>{statusMessage}</AlertDescription>
                    </Alert>
                )}

                {/* Instructions */}
                {uploadStatus === 'idle' && !selectedFile && (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Information</AlertTitle>
                        <AlertDescription>
                            Only PDF files are accepted. The resume content will be automatically extracted for use in the chat interface.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
