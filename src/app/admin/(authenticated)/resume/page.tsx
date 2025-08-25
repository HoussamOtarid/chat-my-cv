'use client';

import React, { Suspense, lazy, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/registry/new-york-v4/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Skeleton } from '@/registry/new-york-v4/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/new-york-v4/ui/tabs';

import { FileText, InfoIcon, Settings, Upload } from 'lucide-react';

// Lazy load heavy components
const ResumePreview = lazy(() => import('@/components/admin').then((mod) => ({ default: mod.ResumePreview })));
const ResumeUploader = lazy(() => import('@/components/admin').then((mod) => ({ default: mod.ResumeUploader })));

export default function ResumeManagementPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeTab, setActiveTab] = useState('manage');

    // Handle successful upload - refresh the preview
    const handleUploadSuccess = () => {
        setRefreshKey((prev) => prev + 1);
        // Switch to manage tab after successful upload
        setActiveTab('manage');
    };

    // Handle resume changes (delete, toggle active, reprocess)
    const handleResumeChange = () => {
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <div className='container mx-auto max-w-6xl space-y-6 px-4 py-8'>
            {/* Page Header */}
            <div>
                <h1 className='text-3xl font-bold'>Resume Management</h1>
                <p className='text-muted-foreground'>
                    Upload and manage your resume for the AI chat interface
                </p>
            </div>

                {/* Information Alert */}
                <Alert>
                    <InfoIcon className='h-4 w-4' />
                    <AlertTitle>How Resume Management Works</AlertTitle>
                    <AlertDescription>
                        Upload a PDF resume to enable AI-powered chat conversations about your professional background.
                        The system extracts text from your resume and uses it as context for answering questions. Only
                        one resume can be active at a time.
                    </AlertDescription>
                </Alert>

                {/* Tabs for Upload and Management */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-4'>
                    <TabsList className='grid w-full max-w-md grid-cols-2'>
                        <TabsTrigger value='manage' className='flex items-center gap-2'>
                            <FileText className='h-4 w-4' />
                            Manage Resume
                        </TabsTrigger>
                        <TabsTrigger value='upload' className='flex items-center gap-2'>
                            <Upload className='h-4 w-4' />
                            Upload New
                        </TabsTrigger>
                    </TabsList>

                    {/* Manage Tab - Show current resume */}
                    <TabsContent value='manage' className='space-y-4'>
                        <Suspense fallback={
                            <Card>
                                <CardHeader>
                                    <Skeleton className='h-7 w-32 mb-2' />
                                    <Skeleton className='h-4 w-64' />
                                </CardHeader>
                                <CardContent className='space-y-4'>
                                    {/* Resume Info Skeleton */}
                                    <div className='flex items-start justify-between'>
                                        <div className='space-y-2'>
                                            <Skeleton className='h-5 w-48' />
                                            <Skeleton className='h-4 w-32' />
                                            <Skeleton className='h-4 w-40' />
                                        </div>
                                        <Skeleton className='h-6 w-20' />
                                    </div>
                                    
                                    {/* Preview Section Skeleton */}
                                    <div className='border-t pt-4'>
                                        <Skeleton className='h-5 w-40 mb-3' />
                                        <div className='space-y-2'>
                                            {[...Array(8)].map((_, i) => (
                                                <Skeleton key={i} className='h-4 w-full' />
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Action Buttons Skeleton */}
                                    <div className='flex gap-2 pt-4'>
                                        <Skeleton className='h-10 w-32' />
                                        <Skeleton className='h-10 w-32' />
                                        <Skeleton className='h-10 w-24' />
                                    </div>
                                </CardContent>
                            </Card>
                        }>
                            <ResumePreview key={`preview-${refreshKey}`} onResumeChange={handleResumeChange} />
                        </Suspense>
                    </TabsContent>

                    {/* Upload Tab - Upload new resume */}
                    <TabsContent value='upload' className='space-y-4'>
                        <Suspense fallback={
                            <Card>
                                <CardHeader>
                                    <Skeleton className='h-7 w-40 mb-2' />
                                    <Skeleton className='h-4 w-64' />
                                </CardHeader>
                                <CardContent>
                                    {/* Upload Area Skeleton */}
                                    <div className='border-2 border-dashed rounded-lg p-8'>
                                        <div className='flex flex-col items-center space-y-4'>
                                            <Skeleton className='h-12 w-12 rounded-full' />
                                            <Skeleton className='h-5 w-48' />
                                            <Skeleton className='h-4 w-32' />
                                            <Skeleton className='h-10 w-32' />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        }>
                            <ResumeUploader
                                onUploadSuccess={handleUploadSuccess}
                                onUploadError={(error) => console.error('Upload error:', error)}
                            />
                        </Suspense>

                        {/* Upload Guidelines */}
                        <Card>
                            <CardHeader>
                                <CardTitle className='flex items-center gap-2'>
                                    <Settings className='h-5 w-5' />
                                    Upload Guidelines
                                </CardTitle>
                                <CardDescription>Follow these guidelines for best results</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className='text-muted-foreground space-y-2 text-sm'>
                                    <li className='flex items-start gap-2'>
                                        <span className='text-primary mt-1'>•</span>
                                        <span>Only PDF files are accepted (maximum 10MB)</span>
                                    </li>
                                    <li className='flex items-start gap-2'>
                                        <span className='text-primary mt-1'>•</span>
                                        <span>Ensure your resume text is selectable (not scanned images)</span>
                                    </li>
                                    <li className='flex items-start gap-2'>
                                        <span className='text-primary mt-1'>•</span>
                                        <span>Avoid password-protected PDFs for proper text extraction</span>
                                    </li>
                                    <li className='flex items-start gap-2'>
                                        <span className='text-primary mt-1'>•</span>
                                        <span>Include relevant keywords and skills for better AI responses</span>
                                    </li>
                                    <li className='flex items-start gap-2'>
                                        <span className='text-primary mt-1'>•</span>
                                        <span>Uploading a new resume will replace the existing one</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </TabsContent>
            </Tabs>
        </div>
    );
}
