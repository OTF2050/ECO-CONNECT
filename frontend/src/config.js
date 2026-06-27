// Central API base URL for the Eco Connect frontend.
// All components import API_BASE from here so the backend host stays in sync.
// Override at build/dev time with VITE_API_BASE (e.g. in frontend/.env).
export const API_BASE =
  (import.meta.env && import.meta.env.VITE_API_BASE) || 'http://127.0.0.1:8000';

export default API_BASE;
