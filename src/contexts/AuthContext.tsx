import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, getCurrentUser, loginUser as apiLogin, logoutUser as apiLogout } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isVolunteer: boolean;
  isReporter: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const user = await apiLogin(email, password);
    setUser(user);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isVolunteer = user?.role === 'volunteer';
  const isReporter = user?.role === 'reporter';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isVolunteer, isReporter }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
