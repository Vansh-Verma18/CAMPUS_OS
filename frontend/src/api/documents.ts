import { fetchWithAuth } from './client';

export interface DocumentResponse {
    _id: string;
    document_name: string;
    document_type: string;
    department?: string;
    year?: number;
    access_classification: string;
    file_size_bytes: number;
    chunk_count: number;
    uploaded_by: string;
    upload_timestamp: string;
    processing_status: string;
}

export const documentApi = {
    uploadDocument: async (file: File, metadata: Record<string, string | number>) => {
        const formData = new FormData();
        formData.append('file', file);
        
        Object.entries(metadata).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                formData.append(key, String(value));
            }
        });

        const response = await fetchWithAuth('/documents/upload', {
            method: 'POST',
            // Do not set Content-Type for FormData, the browser sets it with the boundary
            body: formData,
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw { response: { data: errorData } };
        }
        return response.json();
    },

    getDocuments: async (skip = 0, limit = 100) => {
        const response = await fetchWithAuth(`/documents?skip=${skip}&limit=${limit}`, {
            method: 'GET',
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw { response: { data: errorData } };
        }
        return response.json();
    },

    getDocument: async (id: string) => {
        const response = await fetchWithAuth(`/documents/${id}`, {
            method: 'GET',
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw { response: { data: errorData } };
        }
        return response.json();
    },

    deleteDocument: async (id: string) => {
        const response = await fetchWithAuth(`/documents/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw { response: { data: errorData } };
        }
    }
};
