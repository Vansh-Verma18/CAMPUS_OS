import { fetchWithAuth } from './client';

export interface EventResponse {
    _id: string;
    title: string;
    description: string;
    category: string;
    organizer_club_id?: string;
    department_id?: string;
    venue_id?: string;
    start_datetime: string;
    end_datetime: string;
    expected_participants: number;
    target_audience: string[];
    required_resource_ids: string[];
    status: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface EventCreate {
    title: string;
    description: string;
    category: string;
    organizer_club_id?: string;
    department_id?: string;
    venue_id?: string;
    start_datetime: string;
    end_datetime: string;
    expected_participants: number;
    target_audience: string[];
    required_resource_ids: string[];
    status?: string;
}

export interface EventFilters {
    category?: string;
    club_id?: string;
    venue_id?: string;
    status?: string;
    skip?: number;
    limit?: number;
}

export const eventsApi = {
    getEvents: async (filters: EventFilters = {}): Promise<EventResponse[]> => {
        const params = new URLSearchParams();
        
        if (filters.category) params.append('category', filters.category);
        if (filters.club_id) params.append('club_id', filters.club_id);
        if (filters.venue_id) params.append('venue_id', filters.venue_id);
        if (filters.status) params.append('status', filters.status);
        if (filters.skip !== undefined) params.append('skip', filters.skip.toString());
        if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
        
        const queryString = params.toString();
        const url = queryString ? `/events?${queryString}` : '/events';
        
        const response = await fetchWithAuth(url, { method: 'GET' });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw { response: { data: errorData, status: response.status } };
        }
        
        return response.json();
    },

    getEvent: async (id: string): Promise<EventResponse> => {
        const response = await fetchWithAuth(`/events/${id}`, { method: 'GET' });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw { response: { data: errorData, status: response.status } };
        }
        
        return response.json();
    },

    createEvent: async (eventData: EventCreate): Promise<EventResponse> => {
        const response = await fetchWithAuth('/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw { response: { data: errorData, status: response.status } };
        }
        
        return response.json();
    }
};
