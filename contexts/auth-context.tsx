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
  type UserRole,
  type RegisterRequest,
} from '@/lib/auth';
import { getTokens, setTokens, clearTokens } from '@/lib/token-storage';
import { queryClient } from '@/lib/query-client';

interface AuthContextValue {
  user: UserResponse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
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

  const register = useCallback(async (data: RegisterRequest) => {
    const authRes = await registerUser(data);
    await setTokens({
      accessToken: authRes.access_token,
      refreshToken: authRes.refresh_token,
    });
    const me = await getMe();
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // ignore
    }
    await clearTokens();
    queryClient.clear();
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
