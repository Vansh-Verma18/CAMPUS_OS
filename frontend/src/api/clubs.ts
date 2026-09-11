import { fetchWithAuth } from './client';

export interface ClubResponse {
    _id: string;
    name: string;
    description?: string;
    category: string;
    department_id?: string;
    coordinator_id?: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export const clubsApi = {
    getClubs: async (): Promise<ClubResponse[]> => {
        const response = await fetchWithAuth('/clubs', { method: 'GET' });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw { response: { data: errorData, status: response.status } };
        }
        
        return response.json();
    },

    getClub: async (id: string): Promise<ClubResponse> => {
        const response = await fetchWithAuth(`/clubs/${id}`, { method: 'GET' });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw { response: { data: errorData, status: response.status } };
        }
        
        return response.json();
    }
};
