import { fetchWithAuth } from './client';

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link: string | null;
    read: boolean;
    created_at: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export const notificationsApi = {
    getMyNotifications: async (): Promise<NotificationItem[]> => {
        const res = await fetchWithAuth('/notifications/my');
        return handleResponse<NotificationItem[]>(res);
    },

    getUnreadCount: async (): Promise<number> => {
        const res = await fetchWithAuth('/notifications/unread-count');
        const data = await handleResponse<{ count: number }>(res);
        return data.count;
    },

    markAsRead: async (id: string): Promise<void> => {
        await fetchWithAuth(`/notifications/${id}/read`, { method: 'PATCH' });
    },

    markAllAsRead: async (): Promise<void> => {
        await fetchWithAuth('/notifications/read-all', { method: 'PATCH' });
    },
};
