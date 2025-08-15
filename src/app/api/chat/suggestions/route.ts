import { NextResponse } from 'next/server';

import { createSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

/**
 * Suggested question interface
 */
interface SuggestedQuestion {
    id: string;
    text: string;
    category: 'experience' | 'skills' | 'education' | 'projects' | 'general' | 'specific';
    priority?: number;
}

/**
 * Base question templates that can be used regardless of resume content
 */
const BASE_QUESTIONS: SuggestedQuestion[] = [
    // Experience questions
    { id: 'exp-1', text: 'What is my most relevant work experience?', category: 'experience', priority: 1 },
    { id: 'exp-2', text: 'Tell me about my professional background', category: 'experience', priority: 2 },
    { id: 'exp-3', text: 'What are my key achievements in my career?', category: 'experience', priority: 2 },
    { id: 'exp-4', text: 'How many years of experience do I have?', category: 'experience', priority: 1 },
    { id: 'exp-5', text: 'What companies have I worked for?', category: 'experience', priority: 2 },
    { id: 'exp-6', text: 'What were my main responsibilities in my last role?', category: 'experience', priority: 1 },

    // Skills questions
    { id: 'skill-1', text: 'What are my main technical skills?', category: 'skills', priority: 1 },
    { id: 'skill-2', text: 'Which programming languages do I know?', category: 'skills', priority: 1 },
    { id: 'skill-3', text: 'What tools and technologies am I proficient in?', category: 'skills', priority: 2 },
    { id: 'skill-4', text: 'What are my strongest competencies?', category: 'skills', priority: 2 },
    { id: 'skill-5', text: 'Do I have any specialized certifications?', category: 'skills', priority: 3 },
    { id: 'skill-6', text: 'What soft skills do I possess?', category: 'skills', priority: 3 },

    // Education questions
    { id: 'edu-1', text: 'What is my educational background?', category: 'education', priority: 1 },
    { id: 'edu-2', text: 'What degrees or certifications do I have?', category: 'education', priority: 1 },
    { id: 'edu-3', text: 'Where did I study?', category: 'education', priority: 2 },
    { id: 'edu-4', text: 'What was my field of study?', category: 'education', priority: 2 },
    { id: 'edu-5', text: 'Did I receive any academic honors?', category: 'education', priority: 3 },

    // Project questions
    { id: 'proj-1', text: 'What notable projects have I worked on?', category: 'projects', priority: 1 },
    { id: 'proj-2', text: 'Can you describe my most significant project?', category: 'projects', priority: 1 },
    { id: 'proj-3', text: 'What technologies did I use in my projects?', category: 'projects', priority: 2 },
    { id: 'proj-4', text: 'What was the impact of my project work?', category: 'projects', priority: 2 },
    { id: 'proj-5', text: 'Have I led any major initiatives?', category: 'projects', priority: 3 },

    // General questions
    { id: 'gen-1', text: 'Give me a brief summary of my resume', category: 'general', priority: 1 },
    { id: 'gen-2', text: 'What makes me a strong candidate?', category: 'general', priority: 1 },
    { id: 'gen-3', text: 'What type of roles am I qualified for?', category: 'general', priority: 1 },
    { id: 'gen-4', text: 'What are my career highlights?', category: 'general', priority: 2 },
    { id: 'gen-5', text: 'How would you describe my professional profile?', category: 'general', priority: 2 },
    { id: 'gen-6', text: 'What industries have I worked in?', category: 'general', priority: 3 },
    { id: 'gen-7', text: 'What are my areas of expertise?', category: 'general', priority: 2 },
    { id: 'gen-8', text: 'Am I a good fit for remote work?', category: 'general', priority: 3 }
];

/**
 * Generate contextual questions based on resume content
 * These are specific questions that relate to the actual resume
 */
function generateContextualQuestions(resumeContent: string): SuggestedQuestion[] {
    const contextualQuestions: SuggestedQuestion[] = [];
    const content = resumeContent.toLowerCase();

    // Check for specific keywords and generate relevant questions
    if (content.includes('manager') || content.includes('lead') || content.includes('senior')) {
        contextualQuestions.push({
            id: 'ctx-1',
            text: 'Tell me about my leadership and management experience',
            category: 'specific',
            priority: 1
        });
    }

    if (content.includes('python') || content.includes('java') || content.includes('javascript')) {
        contextualQuestions.push({
            id: 'ctx-2',
            text: 'What programming languages am I most experienced with?',
            category: 'specific',
            priority: 1
        });
    }

    if (content.includes('aws') || content.includes('azure') || content.includes('cloud')) {
        contextualQuestions.push({
            id: 'ctx-3',
            text: 'What is my experience with cloud technologies?',
            category: 'specific',
            priority: 1
        });
    }

    if (content.includes('agile') || content.includes('scrum')) {
        contextualQuestions.push({
            id: 'ctx-4',
            text: 'What is my experience with Agile methodologies?',
            category: 'specific',
            priority: 2
        });
    }

    if (content.includes('database') || content.includes('sql')) {
        contextualQuestions.push({
            id: 'ctx-5',
            text: 'What database technologies have I worked with?',
            category: 'specific',
            priority: 2
        });
    }

    if (content.includes('machine learning') || content.includes('ai') || content.includes('data science')) {
        contextualQuestions.push({
            id: 'ctx-6',
            text: 'What is my experience with AI and machine learning?',
            category: 'specific',
            priority: 1
        });
    }

    if (content.includes('startup') || content.includes('entrepreneur')) {
        contextualQuestions.push({
            id: 'ctx-7',
            text: 'Tell me about my startup or entrepreneurial experience',
            category: 'specific',
            priority: 2
        });
    }

    if (content.includes('international') || content.includes('global')) {
        contextualQuestions.push({
            id: 'ctx-8',
            text: 'What international or global experience do I have?',
            category: 'specific',
            priority: 3
        });
    }

    return contextualQuestions;
}

/**
 * Select diverse questions from different categories
 */
function selectDiverseQuestions(
    allQuestions: SuggestedQuestion[],
    count: number,
    includeContextual: boolean = true
): SuggestedQuestion[] {
    // Group questions by category
    const questionsByCategory = allQuestions.reduce((acc, q) => {
        if (!acc[q.category]) {
            acc[q.category] = [];
        }
        const categoryList = acc[q.category];
        if (categoryList) {
            categoryList.push(q);
        }

        return acc;
    }, {} as Record<string, SuggestedQuestion[]>);

    // Sort questions within each category by priority
    Object.keys(questionsByCategory).forEach((category) => {
        const questions = questionsByCategory[category];
        if (questions) {
            questions.sort((a, b) => (a.priority || 999) - (b.priority || 999));
        }
    });

    const selected: SuggestedQuestion[] = [];
    const categories = Object.keys(questionsByCategory);

    // If we have contextual questions and they should be included, prioritize them
    const specificQuestions = questionsByCategory['specific'];
    if (includeContextual && specificQuestions && specificQuestions.length > 0) {
        // Add 1-2 contextual questions first
        const contextualCount = Math.min(2, specificQuestions.length);
        selected.push(...specificQuestions.slice(0, contextualCount));
    }

    // Calculate how many more questions we need
    const remainingCount = count - selected.length;

    // Distribute remaining slots among other categories
    if (remainingCount > 0) {
        const otherCategories = categories.filter((c) => c !== 'specific');
        let categoryIndex = 0;

        while (selected.length < count && otherCategories.length > 0) {
            const categoryName = otherCategories[categoryIndex % otherCategories.length];
            if (!categoryName) break;
            
            const categoryQuestions = questionsByCategory[categoryName];

            if (categoryQuestions && categoryQuestions.length > 0) {
                // Take the next question from this category
                const nextQuestion = categoryQuestions.shift();
                if (nextQuestion && !selected.find((q) => q.id === nextQuestion.id)) {
                    selected.push(nextQuestion);
                }

                // Remove category if no more questions
                if (categoryQuestions.length === 0) {
                    const indexToRemove = otherCategories.indexOf(categoryName);
                    if (indexToRemove !== -1) {
                        otherCategories.splice(indexToRemove, 1);
                    }
                }
            }

            categoryIndex++;

            // Break if we've cycled through all categories without finding new questions
            if (categoryIndex >= otherCategories.length * 2) {
                break;
            }
        }
    }

    // Shuffle the selected questions for variety
    return selected.sort(() => Math.random() - 0.5);
}

/**
 * GET /api/chat/suggestions
 * Returns suggested questions for the chat interface
 * Provides both generic and contextual questions based on resume content
 */
export async function GET(request: Request) {
    try {
        // Get query parameters
        const url = new URL(request.url);
        const count = parseInt(url.searchParams.get('count') || '6', 10);
        const includeContextual = url.searchParams.get('contextual') !== 'false';
        const category = url.searchParams.get('category') as SuggestedQuestion['category'] | null;

        // Validate count parameter
        const validCount = Math.min(Math.max(count, 1), 20);

        let allQuestions = [...BASE_QUESTIONS];
        let resumeAvailable = false;

        // Try to fetch the active resume for contextual questions
        if (includeContextual) {
            try {
                const supabase = await createSupabaseAdmin();
                const { data: resume } = await supabase
                    .from('resume')
                    .select('content')
                    .eq('is_active', true)
                    .limit(1)
                    .single();

                if (resume?.content) {
                    resumeAvailable = true;
                    // Generate contextual questions based on resume content
                    const contextualQuestions = generateContextualQuestions(resume.content);
                    allQuestions = [...contextualQuestions, ...allQuestions];
                }
            } catch (error) {
                // Resume not available, continue with base questions only
                console.log('Resume not available for contextual questions');
            }
        }

        // Filter by category if specified
        if (category) {
            allQuestions = allQuestions.filter((q) => q.category === category);
        }

        // Select diverse questions
        const selectedQuestions = selectDiverseQuestions(allQuestions, validCount, includeContextual);

        // Return the suggestions with metadata
        return NextResponse.json(
            {
                success: true,
                questions: selectedQuestions,
                metadata: {
                    total: selectedQuestions.length,
                    hasContextual: resumeAvailable && includeContextual,
                    categories: Array.from(new Set(selectedQuestions.map((q) => q.category)))
                }
            },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
                    'X-Questions-Count': selectedQuestions.length.toString()
                }
            }
        );
    } catch (error) {
        console.error('Get suggestions error:', error);

        // Return default questions on error
        const fallbackQuestions = BASE_QUESTIONS.slice(0, 6).sort(() => Math.random() - 0.5);

        return NextResponse.json(
            {
                success: false,
                questions: fallbackQuestions,
                metadata: {
                    total: fallbackQuestions.length,
                    hasContextual: false,
                    categories: Array.from(new Set(fallbackQuestions.map((q) => q.category)))
                },
                error: 'Failed to generate suggestions, using defaults'
            },
            {
                status: 200, // Still return 200 with fallback data
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            }
        );
    }
}