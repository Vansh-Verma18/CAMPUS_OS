const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const fetchHealth = async () => {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch API health:', error);
    throw error;
  }
};
