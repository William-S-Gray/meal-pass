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
      // Check if we have a user in localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Verify that we have a valid token
        if (parsedUser && parsedUser.token) {
          setUser(parsedUser);
        } else {
          // Clear invalid user data
          localStorage.removeItem('user');
        }
      } else {
        // Fallback to API check
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear any invalid user data
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const user = await apiLogin(email, password);
      // The apiLogin function already stores the user with token in localStorage
      // So we just need to set the user state
      setUser(user);
    } catch (error) {
      // Clear user data on login failure
      localStorage.removeItem('user');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
    }
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