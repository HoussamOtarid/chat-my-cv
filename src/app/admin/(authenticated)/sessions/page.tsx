'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Input } from '@/registry/new-york-v4/ui/input';
import { Skeleton } from '@/registry/new-york-v4/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/registry/new-york-v4/ui/table';

import { ChevronLeft, ChevronRight, Loader2, MessageSquare, Search } from 'lucide-react';

interface Session {
    id: string;
    clientId: string;
    ipHash: string | null;
    createdAt: string;
    messageCount: number;
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function SessionsPage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        fetchSessions();
    }, [pagination.page]);

    const fetchSessions = async (search?: string) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...(search && { search })
            });

            const response = await fetch(`/api/admin/sessions?${params}`);
            if (response.ok) {
                const data = await response.json();
                setSessions(data.sessions);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoading(false);
            setSearching(false);
        }
    };

    const handleSearch = () => {
        setSearching(true);
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchSessions(searchQuery);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const truncateId = (id: string) => {
        return `${id.slice(0, 8)}...`;
    };

    if (loading && sessions.length === 0) {
        return (
            <div className='container mx-auto max-w-6xl space-y-6 px-4 py-8'>
                <Skeleton className='h-10 w-48' />
                <Skeleton className='h-96 w-full' />
            </div>
        );
    }

    return (
        <div className='container mx-auto max-w-6xl space-y-6 px-4 py-8'>
            <div>
                <h1 className='text-3xl font-bold'>Chat Sessions</h1>
                <p className='text-muted-foreground'>Browse and review all chat conversations</p>
            </div>

            {/* Search Bar */}
            <div className='flex gap-2'>
                <div className='relative flex-1 max-w-md'>
                    <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                    <Input
                        placeholder='Search by client ID...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className='pl-10'
                    />
                </div>
                <Button onClick={handleSearch} disabled={searching}>
                    {searching ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Search'}
                </Button>
            </div>

            {/* Sessions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Sessions</CardTitle>
                    <CardDescription>
                        Total: {pagination.total} sessions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Session ID</TableHead>
                                <TableHead>Client ID</TableHead>
                                <TableHead className='text-center'>Messages</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className='w-[100px]'></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className='text-center py-8 text-muted-foreground'>
                                        No sessions found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sessions.map((session) => (
                                    <TableRow 
                                        key={session.id}
                                        className='cursor-pointer hover:bg-muted/50'
                                        onClick={() => router.push(`/admin/sessions/${session.id}`)}
                                    >
                                        <TableCell className='font-mono text-sm'>
                                            {truncateId(session.id)}
                                        </TableCell>
                                        <TableCell className='font-mono text-sm'>
                                            {session.clientId.slice(0, 16)}...
                                        </TableCell>
                                        <TableCell className='text-center'>
                                            <div className='flex items-center justify-center gap-1'>
                                                <MessageSquare className='h-4 w-4 text-muted-foreground' />
                                                <span>{session.messageCount}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className='text-sm'>
                                            {formatDate(session.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/admin/sessions/${session.id}`);
                                                }}
                                            >
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className='flex items-center justify-between'>
                    <p className='text-sm text-muted-foreground'>
                        Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className='flex gap-2'>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                        >
                            <ChevronLeft className='h-4 w-4' />
                            Previous
                        </Button>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page === pagination.totalPages}
                        >
                            Next
                            <ChevronRight className='h-4 w-4' />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}