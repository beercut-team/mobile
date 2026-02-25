import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

import {
  loginUser,
  registerUser,
  getMe,
  logoutUser as apiLogout,
  type UserResponse,
} from '@/lib/auth';
import { getTokens, setTokens, clearTokens } from '@/lib/token-storage';

interface AuthContextValue {
  user: UserResponse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const tokens = await getTokens();
        if (tokens) {
          const me = await getMe();
          setUser(me);
        }
      } catch {
        await clearTokens();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const authRes = await loginUser({ email, password });
    await setTokens({
      accessToken: authRes.access_token,
      refreshToken: authRes.refresh_token,
    });
    const me = await getMe();
    setUser(me);
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const authRes = await registerUser({ email, password, name });
      await setTokens({
        accessToken: authRes.access_token,
        refreshToken: authRes.refresh_token,
      });
      const me = await getMe();
      setUser(me);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Logout API call may fail, that's okay
    }
    await clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
