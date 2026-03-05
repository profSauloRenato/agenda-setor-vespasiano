// src/presentation/context/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import { serviceLocator } from '../../config/serviceLocator';
import { IUsuario } from '../../domain/models/IUsuario';

interface AuthContextType {
  user: IUsuario | null;
  isLoading: boolean;
  signIn: (usuario: IUsuario) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUsuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signIn = async (usuario: IUsuario) => {
    setUser(usuario);
    // Registra o token de notificação após login
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
    // Remove o token antes de deslogar
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

  useEffect(() => {
    // 1. Verifica se já existe uma sessão salva ao abrir o app
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

    // 2. Fica escutando mudanças de sessão do Supabase em tempo real
    // Isso garante que se o token expirar ou o usuário for deslogado,
    // o app reage automaticamente — sem precisar reiniciar.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    // 3. Cancela o listener quando o componente for desmontado
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};