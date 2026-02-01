import Cookies from 'js-cookie';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  dns: string | null;
  username: string | null;
  password: string | null;
  isAuthenticated: boolean;
  setCredentials: (dns: string, username: string, password: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      dns: null,
      username: null,
      password: null,
      isAuthenticated: false,
      setCredentials: (dns, username, password) => {
        // Sync to cookies for Middleware access
        Cookies.set('nexus_dns', dns, { expires: 365 });
        Cookies.set('nexus_username', username, { expires: 365 });
        Cookies.set('nexus_password', password, { expires: 365 });
        
        set({ dns, username, password, isAuthenticated: true });
      },
      logout: () => {
        Cookies.remove('nexus_dns');
        Cookies.remove('nexus_username');
        Cookies.remove('nexus_password');
        set({ dns: null, username: null, password: null, isAuthenticated: false });
      },
    }),
    {
      name: 'nexus-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
