'use client';

import React, { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card } from '@/registry/new-york-v4/ui/card';

import { Award, Briefcase, Code, GraduationCap, MessageSquare, RefreshCw, Sparkles } from 'lucide-react';

/**
 * Suggested question interface
 */
interface SuggestedQuestion {
    id: string;
    text: string;
    category: 'experience' | 'skills' | 'education' | 'projects' | 'general';
    icon?: React.ReactNode;
}

/**
 * Props for SuggestedQuestions component
 */
interface SuggestedQuestionsProps {
    onSelectQuestion: (question: string) => void;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
    maxQuestions?: number;
    showCategories?: boolean;
    customQuestions?: SuggestedQuestion[];
}

/**
 * Default suggested questions about resume
 */
const DEFAULT_QUESTIONS: SuggestedQuestion[] = [
    // Experience questions
    {
        id: 'exp-1',
        text: 'What is my most relevant work experience?',
        category: 'experience',
        icon: <Briefcase className='h-4 w-4' />
    },
    {
        id: 'exp-2',
        text: 'Tell me about my professional background',
        category: 'experience',
        icon: <Briefcase className='h-4 w-4' />
    },
    {
        id: 'exp-3',
        text: 'What are my key achievements in my career?',
        category: 'experience',
        icon: <Award className='h-4 w-4' />
    },

    // Skills questions
    {
        id: 'skill-1',
        text: 'What are my main technical skills?',
        category: 'skills',
        icon: <Code className='h-4 w-4' />
    },
    {
        id: 'skill-2',
        text: 'Which programming languages do I know?',
        category: 'skills',
        icon: <Code className='h-4 w-4' />
    },
    {
        id: 'skill-3',
        text: 'What tools and technologies am I proficient in?',
        category: 'skills',
        icon: <Code className='h-4 w-4' />
    },

    // Education questions
    {
        id: 'edu-1',
        text: 'What is my educational background?',
        category: 'education',
        icon: <GraduationCap className='h-4 w-4' />
    },
    {
        id: 'edu-2',
        text: 'What degrees or certifications do I have?',
        category: 'education',
        icon: <GraduationCap className='h-4 w-4' />
    },

    // Project questions
    {
        id: 'proj-1',
        text: 'What notable projects have I worked on?',
        category: 'projects',
        icon: <Sparkles className='h-4 w-4' />
    },
    {
        id: 'proj-2',
        text: 'Can you describe my most significant project?',
        category: 'projects',
        icon: <Sparkles className='h-4 w-4' />
    },

    // General questions
    {
        id: 'gen-1',
        text: 'Give me a brief summary of my resume',
        category: 'general',
        icon: <MessageSquare className='h-4 w-4' />
    },
    {
        id: 'gen-2',
        text: 'What makes me a strong candidate?',
        category: 'general',
        icon: <MessageSquare className='h-4 w-4' />
    },
    {
        id: 'gen-3',
        text: 'How many years of experience do I have?',
        category: 'general',
        icon: <MessageSquare className='h-4 w-4' />
    },
    {
        id: 'gen-4',
        text: 'What type of roles am I qualified for?',
        category: 'general',
        icon: <MessageSquare className='h-4 w-4' />
    }
];

/**
 * Get category color
 */
const getCategoryColor = (category: SuggestedQuestion['category']): string => {
    switch (category) {
        case 'experience':
            return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
        case 'skills':
            return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
        case 'education':
            return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800';
        case 'projects':
            return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800';
        case 'general':
        default:
            return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800';
    }
};

/**
 * Suggested questions component for chat interface
 * Displays clickable question suggestions to help users start conversations
 */
export function SuggestedQuestions({
    onSelectQuestion,
    isLoading = false,
    disabled = false,
    className,
    maxQuestions = 4,
    showCategories = false,
    customQuestions
}: SuggestedQuestionsProps) {
    const [questions, setQuestions] = useState<SuggestedQuestion[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<SuggestedQuestion['category'] | 'all'>('all');

    // Initialize questions
    useEffect(() => {
        const allQuestions = customQuestions || DEFAULT_QUESTIONS;

        // Filter by category if selected
        let filteredQuestions =
            selectedCategory === 'all' ? allQuestions : allQuestions.filter((q) => q.category === selectedCategory);

        // Randomly select questions if we have more than maxQuestions
        if (filteredQuestions.length > maxQuestions) {
            const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
            filteredQuestions = shuffled.slice(0, maxQuestions);
        }

        setQuestions(filteredQuestions);
    }, [customQuestions, maxQuestions, selectedCategory]);

    // Handle question click
    const handleQuestionClick = (question: SuggestedQuestion) => {
        if (!disabled && !isLoading) {
            onSelectQuestion(question.text);
        }
    };

    // Refresh questions (get new random selection)
    const handleRefresh = () => {
        // Force re-render by updating state
        setQuestions([]);
        setTimeout(() => {
            const allQuestions = customQuestions || DEFAULT_QUESTIONS;
            let filteredQuestions =
                selectedCategory === 'all' ? allQuestions : allQuestions.filter((q) => q.category === selectedCategory);

            if (filteredQuestions.length > maxQuestions) {
                const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
                filteredQuestions = shuffled.slice(0, maxQuestions);
            }

            setQuestions(filteredQuestions);
        }, 100);
    };

    // Get unique categories
    const categories = Array.from(new Set((customQuestions || DEFAULT_QUESTIONS).map((q) => q.category)));

    return (
        <div className={cn('space-y-3', className)}>
            {/* Header with refresh button */}
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <Sparkles className='text-muted-foreground h-4 w-4' />
                    <span className='text-muted-foreground text-sm font-medium'>Suggested Questions</span>
                </div>

                {questions.length > 0 && (
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={handleRefresh}
                        disabled={disabled || isLoading}
                        className='h-7 px-2'
                        aria-label='Refresh questions'>
                        <RefreshCw className='h-3.5 w-3.5' />
                    </Button>
                )}
            </div>

            {/* Category filters (optional) */}
            {showCategories && categories.length > 1 && (
                <div className='flex flex-wrap gap-2'>
                    <Button
                        variant={selectedCategory === 'all' ? 'default' : 'outline'}
                        size='sm'
                        onClick={() => setSelectedCategory('all')}
                        className='h-7 text-xs'>
                        All
                    </Button>
                    {categories.map((category) => (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? 'default' : 'outline'}
                            size='sm'
                            onClick={() => setSelectedCategory(category)}
                            className='h-7 text-xs capitalize'>
                            {category}
                        </Button>
                    ))}
                </div>
            )}

            {/* Question cards */}
            {questions.length > 0 ? (
                <div className='grid gap-2 sm:grid-cols-2'>
                    {questions.map((question) => (
                        <Card
                            key={question.id}
                            className={cn(
                                'cursor-pointer transition-all duration-200',
                                'hover:scale-[1.02] hover:shadow-md',
                                'border',
                                disabled || isLoading ? 'cursor-not-allowed opacity-50' : 'hover:border-primary/50',
                                showCategories && getCategoryColor(question.category)
                            )}
                            onClick={() => handleQuestionClick(question)}
                            role='button'
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleQuestionClick(question);
                                }
                            }}
                            aria-label={`Ask: ${question.text}`}>
                            <div className='p-3'>
                                <div className='flex items-start gap-2'>
                                    {question.icon && <div className='mt-0.5 flex-shrink-0'>{question.icon}</div>}
                                    <p className='text-sm leading-relaxed'>{question.text}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className='p-4'>
                    <p className='text-muted-foreground text-center text-sm'>No suggested questions available</p>
                </Card>
            )}

            {/* Help text */}
            <p className='text-muted-foreground text-center text-xs'>
                Click on any question above to start the conversation
            </p>
        </div>
    );
}
