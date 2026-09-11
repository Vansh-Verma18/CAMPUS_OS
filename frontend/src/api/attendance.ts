import { fetchWithAuth } from './client';

export interface AttendanceResponse {
    _id: string;
    event_id: string;
    user_id: string;
    status: string; // "attended" | "excused"
    check_in_timestamp: string;
    check_out_timestamp?: string;
    created_at: string;
    updated_at: string;
}

export interface AttendanceCreate {
    user_id: string;
    status?: string; // defaults to "attended"
}

export const attendanceApi = {
    // Record attendance for a user at an event (organizer/admin only)
    recordAttendance: async (eventId: string, data: AttendanceCreate): Promise<AttendanceResponse> => {
        const response = await fetchWithAuth(`/events/${eventId}/attendance`, {
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

    // Get all attendance records for an event (organizer/admin only)
    getEventAttendance: async (eventId: string): Promise<AttendanceResponse[]> => {
        const response = await fetchWithAuth(`/events/${eventId}/attendance`, {
            method: 'GET',
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw { response: { data: errorData, status: response.status } };
        }
        
        return response.json();
    },

    // Get current user's attendance records
    getMyAttendance: async (): Promise<AttendanceResponse[]> => {
        const response = await fetchWithAuth('/attendance/me', {
            method: 'GET',
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw { response: { data: errorData, status: response.status } };
        }
        
        return response.json();
    },
};
