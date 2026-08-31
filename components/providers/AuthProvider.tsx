'use client';

import { SessionProvider } from 'next-auth/react';
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: true,
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      
      if (data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const refreshUser = async () => {
    await fetchUser();
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    loading,
    refreshUser,
  };

  return (
    <SessionProvider>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </SessionProvider>
  );
}