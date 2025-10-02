// Centralized URL Configuration
// This ensures all frontend components use the same server URL

// Get the API base URL from environment or use default
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';

// Production fallback (when VITE_API_URL is not set)
// export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://210.212.246.131:3009';

/**
 * Get the full URL for server-hosted files (uploads, images, etc.)
 * @param relativePath - The relative path starting with / or /uploads/
 * @returns Full URL to the server file
 */
export function getServerFileUrl(relativePath: string): string {
  if (!relativePath) return '';
  
  // If it's already a full URL, return as-is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  // If it starts with /uploads/, use it directly
  if (relativePath.startsWith('/uploads/')) {
    return `${API_BASE_URL}${relativePath}`;
  }
  
  // Otherwise, add /uploads/ prefix
  return `${API_BASE_URL}/uploads/${relativePath}`;
}

export default {
  API_BASE_URL,
  getServerFileUrl,
};
