'use client';

import React, { useState } from 'react';
import { ResumeUploader, ResumePreview } from '@/components/admin';
import { Alert, AlertDescription, AlertTitle } from '@/registry/new-york-v4/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/new-york-v4/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { FileText, Upload, Settings, InfoIcon } from 'lucide-react';

export default function ResumeManagementPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeTab, setActiveTab] = useState('manage');

    // Handle successful upload - refresh the preview
    const handleUploadSuccess = () => {
        setRefreshKey(prev => prev + 1);
        // Switch to manage tab after successful upload
        setActiveTab('manage');
    };

    // Handle resume changes (delete, toggle active, reprocess)
    const handleResumeChange = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <div className="space-y-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Resume Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Upload and manage your resume for the AI chat interface
                    </p>
                </div>

                {/* Information Alert */}
                <Alert>
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>How Resume Management Works</AlertTitle>
                    <AlertDescription>
                        Upload a PDF resume to enable AI-powered chat conversations about your professional background.
                        The system extracts text from your resume and uses it as context for answering questions.
                        Only one resume can be active at a time.
                    </AlertDescription>
                </Alert>

                {/* Tabs for Upload and Management */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2 max-w-md">
                        <TabsTrigger value="manage" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Manage Resume
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Upload New
                        </TabsTrigger>
                    </TabsList>

                    {/* Manage Tab - Show current resume */}
                    <TabsContent value="manage" className="space-y-4">
                        <ResumePreview 
                            key={`preview-${refreshKey}`}
                            onResumeChange={handleResumeChange}
                        />
                    </TabsContent>

                    {/* Upload Tab - Upload new resume */}
                    <TabsContent value="upload" className="space-y-4">
                        <ResumeUploader 
                            onUploadSuccess={handleUploadSuccess}
                            onUploadError={(error) => console.error('Upload error:', error)}
                        />
                        
                        {/* Upload Guidelines */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Upload Guidelines
                                </CardTitle>
                                <CardDescription>
                                    Follow these guidelines for best results
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Only PDF files are accepted (maximum 10MB)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Ensure your resume text is selectable (not scanned images)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Avoid password-protected PDFs for proper text extraction</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Include relevant keywords and skills for better AI responses</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Uploading a new resume will replace the existing one</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Status Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Resume Processing Status</CardTitle>
                        <CardDescription>
                            Information about resume text extraction and AI readiness
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Text Extraction</span>
                                <span className="font-medium">
                                    Automatic on upload • Manual reprocess available
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">AI Context</span>
                                <span className="font-medium">
                                    Full resume content used • No chunking in MVP
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Active Resume</span>
                                <span className="font-medium">
                                    Toggle in the Manage tab to activate/deactivate
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}