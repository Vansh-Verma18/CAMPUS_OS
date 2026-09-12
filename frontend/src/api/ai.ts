import { fetchWithAuth } from './client';

export interface AIClaim {
    type: 'VERIFIED' | 'DERIVED' | 'RECOMMENDATION' | 'INSUFFICIENT_EVIDENCE';
    text: string;
    source?: string | null;
}

export interface AIQueryResponse {
    answer: string;
    claims: AIClaim[];
    recommendations: string[];
    sources: string[];
    processing_time_ms?: number | null;
    role_context?: string | null;
}

export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

export async function queryAI(
    question: string,
    conversation_history: ConversationMessage[] = []
): Promise<AIQueryResponse> {
    const res = await fetchWithAuth('/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, conversation_history }),
    });

    if (res.status === 503) {
        const err = await res.json().catch(() => ({ detail: 'AI service unavailable' }));
        throw new Error(err.detail || 'AI service unavailable');
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Query failed' }));
        throw new Error(err.detail || 'Failed to query AI agent');
    }

    return res.json();
}
