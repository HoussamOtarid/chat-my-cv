import { SystemMessage, HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import type { ChatMessage, Resume } from '@/types';

/**
 * Create the system prompt that includes the full resume content
 * Using Anthropic best practices: XML tags, clear structure, and explicit instructions
 */
export function createSystemPrompt(resume: Resume | null): SystemMessage {
    if (!resume || !resume.content) {
        // No resume available - provide a helpful message with clear structure
        return new SystemMessage(`<role>
You are a professional AI assistant specializing in resume-based conversations.
</role>

<situation>
No resume has been uploaded to the system yet.
</situation>

<instructions>
- Inform users that a resume needs to be uploaded by the administrator
- Be helpful and professional
- Suggest they check back later or contact the administrator
- You may answer general questions about how the system works
</instructions>

<response_guidelines>
- Keep responses concise and friendly
- Do not pretend to have access to a resume
- Do not make up any professional information
</response_guidelines>`);
    }

    // Full resume context with structured XML tags - no chunking in MVP
    const systemPrompt = `<role>
You are an expert AI assistant specializing in analyzing and discussing professional resumes. You have been given exclusive access to a resume and will answer questions about this person's professional background.
</role>

<resume_content>
${resume.content}
</resume_content>

<core_instructions>
1. Answer questions ONLY based on information explicitly stated in the resume above
2. When information is not in the resume, say: "That information is not mentioned in the resume"
3. Reference specific sections or details from the resume in your answers
4. Maintain a professional yet approachable tone
</core_instructions>

<response_format>
- Structure complex answers with bullet points or numbered lists
- Keep responses focused and relevant
- Use specific examples from the resume
- Highlight key achievements and skills when relevant
</response_format>

<constraints>
- NEVER invent or assume information not in the resume
- NEVER provide personal contact information if present
- NEVER answer questions unrelated to the resume content
- If asked about topics outside the resume, politely redirect to resume-related topics
</constraints>

<thinking_process>
Before answering each question:
1. Identify what information the user is seeking
2. Locate relevant sections in the resume
3. Extract specific details and examples
4. Structure a clear, informative response
</thinking_process>`;

    return new SystemMessage(systemPrompt);
}

/**
 * Format conversation history for the LLM
 * Converts our ChatMessage format to LangChain message format
 */
export function formatConversationHistory(messages: ChatMessage[]): BaseMessage[] {
    return messages.map(msg => {
        switch (msg.role) {
            case 'user':
                return new HumanMessage(msg.content);
            case 'assistant':
                return new AIMessage(msg.content);
            case 'system':
                return new SystemMessage(msg.content);
            default:
                // Fallback to human message for unknown roles
                return new HumanMessage(msg.content);
        }
    });
}

/**
 * Create a complete prompt chain for the chat
 * Includes system prompt with resume and conversation history
 */
export function createChatPrompt(
    resume: Resume | null,
    conversationHistory: ChatMessage[],
    currentMessage: string
): BaseMessage[] {
    const messages: BaseMessage[] = [];
    
    // 1. System prompt with full resume
    messages.push(createSystemPrompt(resume));
    
    // 2. Conversation history (from localStorage on client)
    // Keep it simple - no server-side memory optimization in MVP
    const historyMessages = formatConversationHistory(conversationHistory);
    messages.push(...historyMessages);
    
    // 3. Current user message
    messages.push(new HumanMessage(currentMessage));
    
    return messages;
}

/**
 * Generate contextual suggested questions based on resume content
 * Uses pattern matching to create relevant, specific questions
 */
export function generateSuggestedQuestions(resume: Resume | null): string[] {
    if (!resume || !resume.content) {
        return [
            "When will the resume be available?",
            "What kind of questions can I ask once the resume is uploaded?",
            "How does this AI resume assistant work?",
            "What features does this chat interface offer?",
            "Can I upload my own resume?"
        ];
    }

    const resumeLower = resume.content.toLowerCase();
    const suggestions: string[] = [];

    // Analyze resume for key patterns and generate targeted questions
    const patterns = {
        technical: {
            keywords: ['software', 'engineer', 'developer', 'programmer', 'coding', 'technical'],
            questions: [
                "What programming languages and frameworks are you most proficient in?",
                "Can you describe your most challenging technical project?",
                "What is your experience with cloud technologies and DevOps?"
            ]
        },
        leadership: {
            keywords: ['manager', 'lead', 'director', 'head', 'supervisor', 'team'],
            questions: [
                "Can you describe your leadership style and management experience?",
                "What size teams have you managed and what were the outcomes?",
                "How do you approach team building and conflict resolution?"
            ]
        },
        creative: {
            keywords: ['designer', 'creative', 'artist', 'ux', 'ui', 'graphic'],
            questions: [
                "What design tools and methodologies do you specialize in?",
                "Can you describe your design process and philosophy?",
                "What types of design projects have you worked on?"
            ]
        },
        analytical: {
            keywords: ['analyst', 'data', 'research', 'scientist', 'analytics'],
            questions: [
                "What analytical tools and methodologies do you use?",
                "Can you describe a complex analysis you've conducted?",
                "How do you approach data-driven decision making?"
            ]
        }
    };

    // Check which pattern matches best
    let matchedPattern = false;
    for (const [, config] of Object.entries(patterns)) {
        if (config.keywords.some(keyword => resumeLower.includes(keyword))) {
            suggestions.push(...config.questions.slice(0, 2));
            matchedPattern = true;
            break;
        }
    }

    // Always include these universal questions
    const universalQuestions = [
        "Can you provide a summary of your professional experience?",
        "What are your top three professional achievements?",
        "What are your key skills and areas of expertise?"
    ];

    if (!matchedPattern) {
        suggestions.push("What is your current role and primary responsibilities?");
    }

    suggestions.push(...universalQuestions);

    // Add education question if relevant
    if (resumeLower.includes('education') || resumeLower.includes('degree') || 
        resumeLower.includes('university') || resumeLower.includes('college')) {
        suggestions.push("What is your educational background and key qualifications?");
    }

    // Add certification question if relevant
    if (resumeLower.includes('certifi') || resumeLower.includes('license')) {
        suggestions.push("What professional certifications or licenses do you hold?");
    }

    // Return unique questions, max 5
    return [...new Set(suggestions)].slice(0, 5);
}

/**
 * Error response templates
 */
export const ERROR_RESPONSES = {
    NO_RESUME: "I don't have access to a resume at the moment. Please wait for the administrator to upload one.",
    RATE_LIMIT: "You've sent too many messages. Please wait a moment before sending another.",
    API_ERROR: "I'm having trouble processing your request. Please try again in a moment.",
    INVALID_MESSAGE: "I couldn't understand your message. Please try rephrasing it.",
    TOKEN_LIMIT: "Your message is too long. Please try sending a shorter message.",
    CONTEXT_TOO_LONG: "The conversation has become too long. Please start a new conversation.",
} as const;

/**
 * Welcome message for new conversations with structured format
 */
export function getWelcomeMessage(resume: Resume | null): string {
    if (!resume) {
        return `Hello! I'm an AI assistant specialized in analyzing and discussing professional resumes.

<current_status>
⚠️ No resume is currently uploaded to the system.
</current_status>

<capabilities>
Once a resume is available, I can help you explore:
• Professional experience and career progression
• Technical skills and core competencies
• Educational background and certifications
• Key projects and achievements
• Industry expertise and specializations
</capabilities>

<next_steps>
Please check back soon or contact your administrator to upload a resume. Once available, you'll be able to have detailed conversations about the professional background.
</next_steps>`;
    }

    // Analyze resume briefly for personalized welcome
    const resumeLower = resume.content.toLowerCase();
    let roleDescription = "professional";
    
    if (resumeLower.includes('software') || resumeLower.includes('developer')) {
        roleDescription = "software engineering professional";
    } else if (resumeLower.includes('manager') || resumeLower.includes('director')) {
        roleDescription = "management professional";
    } else if (resumeLower.includes('designer')) {
        roleDescription = "design professional";
    } else if (resumeLower.includes('analyst')) {
        roleDescription = "analytical professional";
    }

    return `Welcome! I'm your AI assistant with full access to the resume on file.

<ready_to_discuss>
I have analyzed the resume of this ${roleDescription} and I'm ready to discuss:
• Professional experience and career journey
• Technical expertise and core competencies
• Educational background and qualifications
• Notable achievements and project highlights
• Specific roles, responsibilities, and impact
</ready_to_discuss>

<how_to_interact>
Ask me anything about their professional background. I'll provide detailed, accurate information based solely on what's documented in the resume.
</how_to_interact>

What aspect of their professional background would you like to explore first?`;
}

/**
 * Prefill assistant responses for better guidance (Anthropic best practice)
 * This helps Claude understand the expected response style
 */
export function getPrefillForResponse(messageType: 'analysis' | 'summary' | 'skills' | 'experience'): string {
    const prefills = {
        analysis: "Based on the resume, I can see that",
        summary: "Here's a comprehensive summary of the professional background:\n\n",
        skills: "The key skills and competencies listed in the resume include:\n\n",
        experience: "Regarding the professional experience:\n\n"
    };
    
    return prefills[messageType] || "";
}

/**
 * Create an example-driven prompt for complex queries
 * Uses few-shot learning to improve response quality
 */
export function createExampleDrivenPrompt(queryType: string): BaseMessage[] {
    const examples: BaseMessage[] = [];
    
    if (queryType === 'technical_depth') {
        examples.push(
            new HumanMessage("What technologies does this person work with?"),
            new AIMessage(`<technical_analysis>
Based on the resume, this person works with the following technologies:

<programming_languages>
• [List languages found in resume]
• [Include proficiency levels if mentioned]
</programming_languages>

<frameworks_and_tools>
• [List frameworks explicitly mentioned]
• [Include development tools and platforms]
</frameworks_and_tools>

<specialized_skills>
• [Any domain-specific technologies]
• [Cloud platforms, databases, etc.]
</specialized_skills>
</technical_analysis>`)
        );
    }
    
    return examples;
}

/**
 * Validate if a message is appropriate for the resume context
 */
export function isMessageAppropriate(message: string): boolean {
    const inappropriate = [
        // Completely off-topic
        /recipe/i,
        /weather/i,
        /joke/i,
        /story/i,
        /game/i,
        
        // Potentially harmful
        /password/i,
        /credit card/i,
        /social security/i,
        /ssn/i,
        
        // Spam patterns
        /(.)\1{20,}/,  // Same character repeated 20+ times
        /^\s*$/,        // Empty or whitespace only
    ];

    return !inappropriate.some(pattern => pattern.test(message));
}

/**
 * Format the final response for edge cases
 */
export function formatEdgeCaseResponse(type: keyof typeof ERROR_RESPONSES): AIMessage {
    return new AIMessage(ERROR_RESPONSES[type]);
}