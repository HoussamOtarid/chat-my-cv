import type { ChatMessage, Resume } from '@/types';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

/**
 * Create the system prompt that includes the full resume content
 * Using Anthropic best practices: XML tags, clear structure, and explicit instructions
 */
function createSystemPrompt(resume: Resume | null): SystemMessage {
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

    const systemPrompt = `<role>
You are an expert AI assistant specializing in analyzing and discussing professional resumes. You have been given exclusive access to a resume and will answer questions about this person's professional background.
</role>

<resume_content>
${resume.content}
</resume_content>

<core_instructions>
1. Answer questions ONLY based on information explicitly stated in the resume above
2. When information is not available, respond naturally and appropriately without making up details
3. Be direct and concise - aim for 1-3 sentences unless more detail is specifically requested
4. Provide specific details and examples when answering
5. Maintain a professional yet approachable tone
</core_instructions>

<response_format>
- Keep responses brief and to the point
- Use bullet points only for 3+ items or when specifically listing things
- Lead with the most important information
- Avoid unnecessary elaboration or context
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
function formatConversationHistory(messages: ChatMessage[]): BaseMessage[] {
    return messages.map((msg) => {
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
