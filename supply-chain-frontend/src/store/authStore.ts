import { create } from 'zustand';
import type { AuthResponse, UserRole } from '../types';

interface AuthUser {
  email: string;
  fullName: string;
  role: UserRole;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (response: AuthResponse) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

const useAuthStore = create<AuthState>((set, get) => ({
  // ── Initial state — rehydrate from localStorage on page refresh ─────────────
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user')!)
    : null,
  isAuthenticated: !!localStorage.getItem('token'),

  // ── Set auth after login/register ────────────────────────────────────────────
  setAuth: (response: AuthResponse) => {
    const user: AuthUser = {
      email: response.email,
      fullName: response.fullName,
      role: response.role,
    };

    // Persist to localStorage so state survives page refresh
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(user));

    set({ token: response.token, user, isAuthenticated: true });
  },

  // ── Logout — clear everything ─────────────────────────────────────────────
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  // ── Helper — check if current user is admin ───────────────────────────────
  isAdmin: () => get().user?.role === 'ADMIN',
}));

export default useAuthStore;
