export const API_BASE_URL = "http://localhost:8000/api/v1";

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem("token");
    const headers = new Headers(options.headers || {});
    
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("token");
        window.location.href = "/login";
    }

    return response;
}
