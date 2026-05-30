// In development: http://localhost:8000
// In production: set VITE_API_URL in Vercel environment variables
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"
