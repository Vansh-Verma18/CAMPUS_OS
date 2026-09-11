import { fetchWithAuth } from './client';

export interface RegistrationResponse {
    _id: string;
    event_id: string;
    user_id: string;
    status: string;
    attendance_status: string;
    registration_timestamp: string;
    updated_at: string;
}

export const registrationsApi = {
    // Register current user for an event
    registerForEvent: async (eventId: string): Promise<RegistrationResponse> => {
        const response = await fetchWithAuth(`/events/${eventId}/registrations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw { response: { data: errorData, status: response.status } };
        }
        
        return response.json();
    },

    // Get current user's registrations
    getMyRegistrations: async (): Promise<RegistrationResponse[]> => {
        const response = await fetchWithAuth('/registrations/me', {
            method: 'GET',
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw { response: { data: errorData, status: response.status } };
        }
        
        return response.json();
    },

    // Cancel current user's registration for an event
    cancelRegistration: async (eventId: string): Promise<void> => {
        const response = await fetchWithAuth(`/events/${eventId}/registrations/me`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw { response: { data: errorData, status: response.status } };
        }
    },

    // Get all registrations for an event (for organizers/admins)
    getEventRegistrations: async (eventId: string): Promise<RegistrationResponse[]> => {
        const response = await fetchWithAuth(`/events/${eventId}/registrations`, {
            method: 'GET',
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw { response: { data: errorData, status: response.status } };
        }
        
        return response.json();
    },
};
