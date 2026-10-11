import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  labCode?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password?: string; labCode?: string; remember?: boolean; name?: string; avatarUrl?: string }) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = 'hydrolens_auth_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, [user]);

  const login = async ({
    email,
    labCode,
    name,
    avatarUrl,
  }: {
    email: string;
    password?: string;
    labCode?: string;
    remember?: boolean;
    name?: string;
    avatarUrl?: string;
  }) => {
    // Simulating authentication response
    const namePart = email.split('@')[0] || 'Operator';
    const formattedName = namePart
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    const newUser: AuthUser = {
      id: `OP-${Math.floor(1000 + Math.random() * 9000)}`,
      email,
      name: name || formattedName || 'Chief Analyst',
      role: 'Microplastics Analyst',
      labCode: labCode || 'LAB-09-MAIN',
      avatarUrl,
    };

    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
