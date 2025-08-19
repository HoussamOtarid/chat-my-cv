'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { getLLMProviderDisplayName } from '@/constants';
import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

import {
    AlertCircle,
    CheckCircle2,
    FileText,
    Loader2,
    MessageSquare,
    Settings,
    Upload,
    Users
} from 'lucide-react';

interface DashboardStats {
    hasActiveResume: boolean;
    resumeInfo?: {
        filename: string;
        uploadedAt: string;
        fileSize: number;
    };
    llmConfigured: boolean;
    llmProvider?: string;
    totalSessions?: number;
    totalMessages?: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        hasActiveResume: false,
        llmConfigured: false
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch configuration
            const configResponse = await fetch('/api/admin/config');
            if (configResponse.ok) {
                const configData = await configResponse.json();
                setStats((prev) => ({
                    ...prev,
                    llmConfigured: !!configData.llm?.provider,
                    llmProvider: configData.llm?.provider
                }));
            }

            // Fetch resume info
            const resumeResponse = await fetch('/api/admin/resume');
            if (resumeResponse.ok) {
                const resumeData = await resumeResponse.json();
                if (resumeData.resume) {
                    setStats((prev) => ({
                        ...prev,
                        hasActiveResume: true,
                        resumeInfo: {
                            filename: resumeData.resume.filename,
                            uploadedAt: resumeData.resume.uploadedAt,
                            fileSize: resumeData.resume.fileSize
                        }
                    }));
                }
            }

            // Fetch chat statistics
            const statsResponse = await fetch('/api/admin/stats');
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats((prev) => ({
                    ...prev,
                    totalSessions: statsData.totalSessions,
                    totalMessages: statsData.totalMessages
                }));
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        const mb = bytes / (1024 * 1024);
        
        return mb.toFixed(2) + ' MB';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className='flex h-64 items-center justify-center'>
                <Loader2 className='h-8 w-8 animate-spin' />
            </div>
        );
    }

    return (
        <div className='container mx-auto max-w-6xl space-y-6 px-4 py-8'>
            <div>
                <h1 className='text-3xl font-bold'>Dashboard</h1>
                <p className='text-muted-foreground'>Overview of your Chat My CV application</p>
            </div>

            {/* Status Cards */}
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Resume Status</CardTitle>
                        <FileText className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                        <div className='flex items-center space-x-2'>
                            {stats.hasActiveResume ? (
                                <>
                                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                                    <span className='text-sm font-medium'>Active</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className='h-4 w-4 text-yellow-500' />
                                    <span className='text-sm font-medium'>Not Uploaded</span>
                                </>
                            )}
                        </div>
                        {stats.resumeInfo && (
                            <p className='text-muted-foreground mt-1 text-xs'>
                                {stats.resumeInfo.filename}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>LLM Provider</CardTitle>
                        <Settings className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                        <div className='flex items-center space-x-2'>
                            {stats.llmConfigured ? (
                                <>
                                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                                    <span className='text-sm font-medium'>Configured</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className='h-4 w-4 text-yellow-500' />
                                    <span className='text-sm font-medium'>Not Configured</span>
                                </>
                            )}
                        </div>
                        {stats.llmProvider && (
                            <p className='text-muted-foreground mt-1 text-xs'>
                                {getLLMProviderDisplayName(stats.llmProvider)}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Chat Sessions</CardTitle>
                        <Users className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>{stats.totalSessions || 0}</div>
                        <p className='text-muted-foreground text-xs'>Total sessions</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Messages</CardTitle>
                        <MessageSquare className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>{stats.totalMessages || 0}</div>
                        <p className='text-muted-foreground text-xs'>Total messages</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className='grid gap-4 md:grid-cols-3'>
                    <Button asChild variant={stats.hasActiveResume ? 'outline' : 'default'}>
                        <Link href='/admin/resume'>
                            <Upload className='mr-2 h-4 w-4' />
                            {stats.hasActiveResume ? 'Update Resume' : 'Upload Resume'}
                        </Link>
                    </Button>
                    <Button asChild variant={stats.llmConfigured ? 'outline' : 'default'}>
                        <Link href='/admin/settings'>
                            <Settings className='mr-2 h-4 w-4' />
                            {stats.llmConfigured ? 'Update Settings' : 'Configure LLM'}
                        </Link>
                    </Button>
                    <Button asChild variant='outline'>
                        <Link href='/chat' target='_blank'>
                            <MessageSquare className='mr-2 h-4 w-4' />
                            Test Chat
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            {/* System Status */}
            <Card>
                <CardHeader>
                    <CardTitle>System Status</CardTitle>
                    <CardDescription>Current configuration and setup status</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='space-y-4'>
                        {/* Resume Info */}
                        {stats.resumeInfo && (
                            <div className='flex items-start justify-between'>
                                <div>
                                    <p className='text-sm font-medium'>Active Resume</p>
                                    <p className='text-muted-foreground text-sm'>
                                        {stats.resumeInfo.filename} • {formatFileSize(stats.resumeInfo.fileSize)}
                                    </p>
                                    <p className='text-muted-foreground text-xs'>
                                        Uploaded {formatDate(stats.resumeInfo.uploadedAt)}
                                    </p>
                                </div>
                                <Badge variant='default'>
                                    Active
                                </Badge>
                            </div>
                        )}

                        {/* LLM Config */}
                        {stats.llmProvider && (
                            <div className='flex items-start justify-between'>
                                <div>
                                    <p className='text-sm font-medium'>LLM Provider</p>
                                    <p className='text-muted-foreground text-sm'>
                                        {getLLMProviderDisplayName(stats.llmProvider)}
                                    </p>
                                </div>
                                <Badge variant='default'>
                                    Configured
                                </Badge>
                            </div>
                        )}

                        {/* Setup Checklist */}
                        {(!stats.hasActiveResume || !stats.llmConfigured) && (
                            <div className='border-t pt-4'>
                                <p className='mb-2 text-sm font-medium'>Setup Checklist</p>
                                <div className='space-y-2'>
                                    {!stats.llmConfigured && (
                                        <div className='flex items-center space-x-2'>
                                            <AlertCircle className='h-4 w-4 text-yellow-500' />
                                            <span className='text-sm'>
                                                <Link href='/admin/settings' className='underline'>
                                                    Configure LLM provider
                                                </Link>
                                            </span>
                                        </div>
                                    )}
                                    {!stats.hasActiveResume && (
                                        <div className='flex items-center space-x-2'>
                                            <AlertCircle className='h-4 w-4 text-yellow-500' />
                                            <span className='text-sm'>
                                                <Link href='/admin/resume' className='underline'>
                                                    Upload a resume
                                                </Link>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
