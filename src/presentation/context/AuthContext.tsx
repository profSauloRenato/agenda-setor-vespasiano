// src/presentation/context/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import { serviceLocator } from '../../config/serviceLocator';
import { IUsuario } from '../../domain/models/IUsuario';

interface AuthContextType {
  user: IUsuario | null;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  clearPasswordRecovery: () => void;
  signIn: (usuario: IUsuario) => void;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUsuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const signIn = async (usuario: IUsuario) => {
    setUser(usuario);
    try {
      const token = await serviceLocator.notificationService.registerForPushNotifications();
      if (token) {
        await serviceLocator.notificationService.saveDeviceToken(usuario.id, token);
      }
    } catch (e) {
      console.error("Erro ao registrar token de notificação:", e);
    }
  };

  const signOut = async () => {
    if (user) {
      try {
        await serviceLocator.notificationService.removeDeviceToken(user.id);
      } catch (e) {
        console.error("Erro ao remover token:", e);
      }
    }
    setUser(null);
    serviceLocator.authService.logout();
  };

  const refreshUser = async () => {
    try {
      const loggedUser = await serviceLocator.authService.getLoggedUser();
      setUser(loggedUser);
    } catch (e) {
      console.error("Erro ao atualizar usuário:", e);
    }
  };

  const clearPasswordRecovery = () => setIsPasswordRecovery(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const loggedUser = await serviceLocator.authService.getLoggedUser();
        setUser(loggedUser);
      } catch (e) {
        console.error("Erro ao checar sessão inicial:", e);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isPasswordRecovery, clearPasswordRecovery, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};