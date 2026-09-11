import { fetchWithAuth } from './client';

export interface EventStats {
    total: number;
    by_status: Record<string, number>;
    by_category: Record<string, number>;
    upcoming: number;
    ongoing: number;
    completed: number;
    cancelled: number;
}

export interface ClubStats {
    total: number;
    active: number;
    inactive: number;
    by_category: Record<string, number>;
}

export interface ParticipationStats {
    total_registrations: number;
    confirmed_registrations: number;
    cancelled_registrations: number;
    total_attendance_records: number;
    attended: number;
    attendance_rate_pct: number;
}

export interface FeedbackStats {
    total_responses: number;
    average_rating: number;
    rating_distribution: Record<string, number>;
}

export interface FinancialStats {
    total_amount: number;
    currency: string;
    total_records: number;
    by_category: Record<string, number>;
    by_status: Record<string, number>;
    pending_amount: number;
    approved_amount: number;
    paid_amount: number;
}

export interface DocumentStats {
    total: number;
    vectorized: number;
    failed: number;
    by_classification: Record<string, number>;
}

export interface InstitutionalSummary {
    role: string;
    events: EventStats;
    clubs: ClubStats;
    participation: ParticipationStats;
    feedback: FeedbackStats;
    documents: DocumentStats;
    financials: FinancialStats | null;
}

export const analyticsApi = {
    getSummary: async (): Promise<InstitutionalSummary> => {
        const response = await fetchWithAuth('/analytics/summary', { method: 'GET' });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw { response: { data: errorData, status: response.status } };
        }
        return response.json();
    },
};
