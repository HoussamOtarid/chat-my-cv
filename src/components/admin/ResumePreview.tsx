'use client';

import React, { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/registry/new-york-v4/ui/alert';
import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/registry/new-york-v4/ui/dialog';
import { Label } from '@/registry/new-york-v4/ui/label';
import { ScrollArea } from '@/registry/new-york-v4/ui/scroll-area';
import { Separator } from '@/registry/new-york-v4/ui/separator';
import { Switch } from '@/registry/new-york-v4/ui/switch';

import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Download,
    FileText,
    HardDrive,
    Loader2,
    RefreshCw,
    Trash2,
    XCircle
} from 'lucide-react';

interface Resume {
    id: string;
    filename: string;
    content: string;
    fileSize: number;
    uploadedAt: string;
    isActive: boolean;
    fileUrl?: string;
}

interface ResumePreviewProps {
    onResumeChange?: () => void;
    className?: string;
}

export function ResumePreview({ onResumeChange, className }: ResumePreviewProps) {
    const [resume, setResume] = useState<Resume | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [isReprocessing, setIsReprocessing] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [processingStatus, setProcessingStatus] = useState<'success' | 'warning' | 'error' | null>(null);
    const [processingMessage, setProcessingMessage] = useState<string>('');

    useEffect(() => {
        fetchResume();
    }, []);

    const fetchResume = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/resume');

            if (!response.ok) {
                if (response.status === 404) {
                    setResume(null);

                    return;
                }
                throw new Error('Failed to fetch resume');
            }

            const data = await response.json();
            if (data.resume) {
                setResume(data.resume);

                // Check if content needs processing
                if (!data.resume.content || data.resume.content.length === 0) {
                    setProcessingStatus('warning');
                    setProcessingMessage('This resume needs text extraction. Click "Reprocess" to extract text.');
                } else {
                    setProcessingStatus(null);
                }
            } else {
                setResume(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load resume');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleActive = async () => {
        if (!resume) return;

        setIsToggling(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/resume', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: resume.id,
                    isActive: !resume.isActive
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update resume status');
            }

            const data = await response.json();
            setResume(data.resume);

            if (onResumeChange) {
                onResumeChange();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update resume');
        } finally {
            setIsToggling(false);
        }
    };

    const handleDelete = async () => {
        if (!resume) return;

        setIsDeleting(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/resume?id=${resume.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete resume');
            }

            setResume(null);
            setShowDeleteDialog(false);

            if (onResumeChange) {
                onResumeChange();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete resume');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleReprocess = async () => {
        if (!resume) return;

        setIsReprocessing(true);
        setError(null);
        setProcessingStatus(null);
        setProcessingMessage('');

        try {
            const response = await fetch('/api/admin/resume/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: resume.id })
            });

            if (!response.ok) {
                throw new Error('Failed to reprocess resume');
            }

            const data = await response.json();

            if (data.extraction?.success) {
                setProcessingStatus('success');
                setProcessingMessage(
                    `Successfully extracted ${data.extraction.charactersExtracted.toLocaleString()} characters`
                );
            } else if (data.extraction?.error) {
                setProcessingStatus('warning');
                setProcessingMessage(`Partial extraction: ${data.extraction.error}`);
            }

            // Refresh resume data
            await fetchResume();

            if (onResumeChange) {
                onResumeChange();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reprocess resume');
            setProcessingStatus('error');
            setProcessingMessage('Failed to reprocess resume');
        } finally {
            setIsReprocessing(false);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <Card className={cn('w-full', className)}>
                <CardContent className='flex items-center justify-center py-12'>
                    <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
                </CardContent>
            </Card>
        );
    }

    if (!resume) {
        return (
            <Card className={cn('w-full', className)}>
                <CardContent className='flex flex-col items-center justify-center space-y-4 py-12'>
                    <FileText className='text-muted-foreground h-12 w-12' />
                    <div className='text-center'>
                        <p className='text-lg font-medium'>No Resume Uploaded</p>
                        <p className='text-muted-foreground mt-1 text-sm'>Upload a resume to get started</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className={cn('w-full', className)}>
                <CardHeader>
                    <div className='flex items-start justify-between'>
                        <div className='space-y-1'>
                            <CardTitle className='flex items-center gap-2'>
                                <FileText className='h-5 w-5' />
                                {resume.filename}
                            </CardTitle>
                            <CardDescription>Manage your uploaded resume</CardDescription>
                        </div>
                        <Badge variant={resume.isActive ? 'default' : 'secondary'}>
                            {resume.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className='space-y-6'>
                    {/* Resume Metadata */}
                    <div className='space-y-3'>
                        <div className='flex items-center justify-between text-sm'>
                            <div className='text-muted-foreground flex items-center gap-2'>
                                <Calendar className='h-4 w-4' />
                                <span>Uploaded</span>
                            </div>
                            <span className='font-medium'>{formatDate(resume.uploadedAt)}</span>
                        </div>
                        <div className='flex items-center justify-between text-sm'>
                            <div className='text-muted-foreground flex items-center gap-2'>
                                <HardDrive className='h-4 w-4' />
                                <span>File Size</span>
                            </div>
                            <span className='font-medium'>{formatFileSize(resume.fileSize)}</span>
                        </div>
                        <div className='flex items-center justify-between text-sm'>
                            <div className='text-muted-foreground flex items-center gap-2'>
                                <FileText className='h-4 w-4' />
                                <span>Extracted Text</span>
                            </div>
                            <span className='font-medium'>
                                {resume.content
                                    ? `${resume.content.length.toLocaleString()} characters`
                                    : 'No text extracted'}
                            </span>
                        </div>
                    </div>

                    <Separator />

                    {/* Active Toggle */}
                    <div className='flex items-center justify-between'>
                        <Label htmlFor='active-toggle' className='flex flex-col space-y-1'>
                            <span>Active Resume</span>
                            <span className='text-muted-foreground text-sm font-normal'>
                                This resume will be used for AI chat responses
                            </span>
                        </Label>
                        <Switch
                            id='active-toggle'
                            checked={resume.isActive}
                            onCheckedChange={handleToggleActive}
                            disabled={isToggling}
                        />
                    </div>

                    <Separator />

                    {/* Processing Status */}
                    {processingStatus && (
                        <Alert
                            className={cn(
                                processingStatus === 'success' &&
                                    'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950',
                                processingStatus === 'warning' &&
                                    'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950',
                                processingStatus === 'error' &&
                                    'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
                            )}>
                            {processingStatus === 'success' && (
                                <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400' />
                            )}
                            {processingStatus === 'warning' && (
                                <AlertCircle className='h-4 w-4 text-yellow-600 dark:text-yellow-400' />
                            )}
                            {processingStatus === 'error' && (
                                <XCircle className='h-4 w-4 text-red-600 dark:text-red-400' />
                            )}
                            <AlertDescription>{processingMessage}</AlertDescription>
                        </Alert>
                    )}

                    {/* Error Display */}
                    {error && (
                        <Alert variant='destructive'>
                            <XCircle className='h-4 w-4' />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Extracted Text Preview */}
                    {resume.content && resume.content.length > 0 && (
                        <div className='space-y-2'>
                            <Label>Extracted Text Preview</Label>
                            <ScrollArea className='h-64 w-full rounded-md border p-4'>
                                <pre className='font-mono text-sm whitespace-pre-wrap'>{resume.content}</pre>
                            </ScrollArea>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className='flex gap-2'>
                        <Button variant='outline' onClick={handleReprocess} disabled={isReprocessing}>
                            {isReprocessing ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className='mr-2 h-4 w-4' />
                                    Reprocess
                                </>
                            )}
                        </Button>

                        {resume.fileUrl && (
                            <Button variant='outline' asChild>
                                <a href={`/api/admin/resume/download?id=${resume.id}`} download>
                                    <Download className='mr-2 h-4 w-4' />
                                    Download
                                </a>
                            </Button>
                        )}

                        <Button variant='destructive' onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
                            <Trash2 className='mr-2 h-4 w-4' />
                            Delete
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Resume</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{resume.filename}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant='destructive' onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Resume'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
