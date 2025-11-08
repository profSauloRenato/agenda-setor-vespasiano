// src/presentation/context/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { serviceLocator } from '../../config/serviceLocator';
import { IUsuario } from '../../domain/models/IUsuario';

// 1. Definição do Contrato do Contexto
interface AuthContextType {
  user: IUsuario | null;
  isLoading: boolean;
  signIn: (usuario: IUsuario) => void; // Chamado pelo LoginViewModel
  signOut: () => void;
}

// 2. Criação do Contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Provider do Contexto
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // O estado principal é o usuário logado
  const [user, setUser] = useState<IUsuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para logar (chamada pelo View-Model)
  const signIn = (usuario: IUsuario) => {
    setUser(usuario);
    // Aqui poderíamos salvar o usuário em um storage (AsyncStorage, etc.)
  };

  // Função para fazer logout
  const signOut = () => {
    setUser(null);
    serviceLocator.authService.logout(); // Chama o serviço para limpar a sessão no Supabase
  };

  // Efeito para checar o usuário logado no início do app
  useEffect(() => {
    const checkSession = async () => {
      try {
        const loggedUser = await serviceLocator.authService.getLoggedUser();
        setUser(loggedUser);
      } catch (e) {
        console.error("Erro ao checar sessão inicial:", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. Hook de Conveniência
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};