import { fetchWithAuth } from './client';

export interface FeedbackResponse {
    _id: string;
    event_id: string;
    submitted_by: string;
    rating?: number; // 1-5
    comments?: string;
    tags: string[];
    submitted_timestamp: string;
}

export interface FeedbackCreate {
    rating?: number; // 1-5
    comments?: string;
    tags?: string[];
}

export const feedbackApi = {
    // Submit feedback for an event (any authenticated user)
    submitFeedback: async (eventId: string, data: FeedbackCreate): Promise<FeedbackResponse> => {
        const response = await fetchWithAuth(`/events/${eventId}/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw { response: { data: errorData, status: response.status } };
        }
        
        return response.json();
    },

    // Get all feedback for an event (organizer/admin/faculty only)
    getEventFeedback: async (eventId: string): Promise<FeedbackResponse[]> => {
        const response = await fetchWithAuth(`/events/${eventId}/feedback`, {
            method: 'GET',
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw { response: { data: errorData, status: response.status } };
        }
        
        return response.json();
    },
};
