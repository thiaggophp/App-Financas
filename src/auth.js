const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "";
export const isAdmin = (email) => email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
export const ADMIN = ADMIN_EMAIL;
