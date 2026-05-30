import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';

type AuthContextType = {
  isAuthenticated: boolean;
  isReady: boolean;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isReady: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const [isReady, setIsReady] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (isReady) return;
    const unsub = useAuthStore.persist.onFinishHydration(() => setIsReady(true));
    return unsub;
  }, [isReady]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
