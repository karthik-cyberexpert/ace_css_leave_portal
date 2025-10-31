// Centralized URL Configuration
// This ensures all frontend components use the same server URL

// Get the API base URL from environment - NO HARDCODED FALLBACKS FOR SECURITY
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// SECURITY NOTE: Never hardcode production IPs or domains in source code
// Always use environment variables and proxy configuration

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
