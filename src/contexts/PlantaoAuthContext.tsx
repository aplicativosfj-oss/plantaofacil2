import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'agent' | 'master';
export type TeamType = 'alfa' | 'bravo' | 'charlie' | 'delta' | null;

interface MasterInfo {
  id: string;
  username: string;
  full_name: string | null;
}

interface AgentProfile {
  id: string;
  user_id: string;
  cpf: string;
  full_name: string;
  registration_number: string | null;
  phone: string | null;
  email: string | null;
  current_team: TeamType;
  team_joined_at: string | null;
  avatar_url: string | null;
  is_active: boolean;
  city: string | null;
  unit: string | null;
  is_first_login?: boolean;
}

interface PlantaoAuthContextType {
  user: User | null;
  session: Session | null;
  agent: AgentProfile | null;
  role: UserRole | null;
  master: MasterInfo | null;
  isLoading: boolean;
  signIn: (cpf: string, password: string) => Promise<{ error: string | null }>;
  signInMaster: (username: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshAgent: () => Promise<void>;
}

interface SignUpData {
  cpf: string;
  password: string;
  full_name: string;
  registration_number: string;
  city: string;
  unit: string;
  current_team: TeamType;
  phone?: string;
  email?: string;
}

const PlantaoAuthContext = createContext<PlantaoAuthContextType | undefined>(undefined);

export const PlantaoAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [master, setMaster] = useState<MasterInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setSession(null);
    setAgent(null);
    setRole(null);
    setMaster(null);
    sessionStorage.removeItem('masterSession');
  }, []);

  const fetchAgentProfile = useCallback(async (userId: string) => {
    try {
      const { data: agentData, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching agent:', error);
        return null;
      }

      return (agentData ?? null) as AgentProfile | null;
    } catch (err) {
      console.error('Error in fetchAgentProfile:', err);
      return null;
    }
  }, []);

  const fetchUserRole = useCallback(async (userId: string): Promise<UserRole> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return 'agent';
      }

      return data.role === 'admin' || data.role === 'master' ? 'admin' : 'agent';
    } catch {
      return 'agent';
    }
  }, []);

  const hydrateUserContext = useCallback(async (activeSession: Session) => {
    try {
      const userId = activeSession.user.id;
      
      const [agentData, userRole] = await Promise.all([
        fetchAgentProfile(userId),
        fetchUserRole(userId)
      ]);

      if (agentData) {
        setAgent(agentData);
      }
      setRole(userRole);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAgentProfile, fetchUserRole]);

  const refreshAgent = useCallback(async () => {
    if (!user?.id) return;
    const agentData = await fetchAgentProfile(user.id);
    if (agentData) {
      setAgent(agentData);
    }
  }, [user?.id, fetchAgentProfile]);

  // Check for master session on load
  useEffect(() => {
    const storedMaster = sessionStorage.getItem('masterSession');
    if (storedMaster) {
      try {
        const parsed = JSON.parse(storedMaster) as MasterInfo;
        setMaster(parsed);
        setRole('master');
        setIsLoading(false);
      } catch {
        sessionStorage.removeItem('masterSession');
      }
    }
  }, []);

  useEffect(() => {
    // Skip if master is logged in
    if (master) {
      setIsLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (!newSession) {
        clearAuthState();
        setIsLoading(false);
        return;
      }

      setTimeout(() => {
        hydrateUserContext(newSession);
      }, 0);
    });

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession) {
        hydrateUserContext(existingSession);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [clearAuthState, hydrateUserContext, master]);

  const signIn = useCallback(async (cpf: string, password: string): Promise<{ error: string | null }> => {
    try {
      setIsLoading(true);

      // Clean CPF - remove any formatting
      const cleanCpf = cpf.replace(/\D/g, '');

      if (cleanCpf.length !== 11) {
        return { error: 'CPF inválido' };
      }

      // Use CPF as email for Supabase auth
      const email = `${cleanCpf}@plantaopro.local`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'CPF ou senha incorretos' };
        }
        return { error: error.message };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        await hydrateUserContext(data.session);
      }

      return { error: null };
    } catch (err) {
      console.error('SignIn error:', err);
      return { error: 'Erro ao fazer login' };
    } finally {
      setIsLoading(false);
    }
  }, [hydrateUserContext]);

  const signInMaster = useCallback(async (username: string, password: string): Promise<{ error: string | null }> => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.rpc('validate_master_credentials', {
        p_username: username,
        p_password: password
      });

      if (error) {
        console.error('Master login error:', error);
        return { error: 'Erro ao validar credenciais' };
      }

      if (!data || data.length === 0) {
        return { error: 'Usuário não encontrado' };
      }

      const credential = data[0];
      
      if (!credential.is_valid) {
        return { error: 'Senha incorreta' };
      }

      const masterInfo: MasterInfo = {
        id: credential.id,
        username: credential.username,
        full_name: credential.full_name
      };

      sessionStorage.setItem('masterSession', JSON.stringify(masterInfo));
      setMaster(masterInfo);
      setRole('master');

      return { error: null };
    } catch (err) {
      console.error('Master SignIn error:', err);
      return { error: 'Erro ao fazer login' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (data: SignUpData): Promise<{ error: string | null }> => {
    try {
      setIsLoading(true);

      const cleanCpf = data.cpf.replace(/\D/g, '');

      if (cleanCpf.length !== 11) {
        return { error: 'CPF inválido' };
      }

      // Check if CPF already exists as agent
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('cpf', cleanCpf)
        .maybeSingle();

      if (existingAgent) {
        return { error: 'CPF já cadastrado como agente' };
      }
      
      // Note: CPF can exist in master_credentials - admins can also be agents

      const email = `${cleanCpf}@plantaopro.local`;
      const redirectUrl = `${window.location.origin}/`;

      // Tenta criar a conta; se já existir, faz login e completa o perfil.
      let authUser: User | null = null;
      let authSession: Session | null = null;

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.full_name,
            cpf: cleanCpf,
          },
        },
      });

      if (signUpError) {
        console.error('Auth signup error:', signUpError);

        const msg = (signUpError as any)?.message?.toLowerCase?.() ?? '';
        const code = (signUpError as any)?.code ?? '';
        const alreadyExists = msg.includes('already registered') || code === 'user_already_exists';

        if (!alreadyExists) {
          return { error: (signUpError as any)?.message ?? 'Erro ao criar conta' };
        }

        // Conta já existe: tenta login com a senha informada.
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: data.password,
        });

        if (signInError || !signInData.session) {
          return { error: 'CPF já possui conta cadastrada. Use a aba "Entrar".' };
        }

        authUser = signInData.user;
        authSession = signInData.session;
      } else {
        authUser = signUpData.user ?? null;
        authSession = signUpData.session ?? null;
      }

      if (!authUser) {
        return { error: 'Erro ao criar conta' };
      }

      // Se por algum motivo o signUp não retornou sessão, tenta logar.
      if (!authSession) {
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email,
          password: data.password,
        });
        authSession = signInData.session ?? null;
        authUser = signInData.user ?? authUser;
      }

      // Garantir perfil do agente (evita "CPF já existe" quando só a conta auth existia)
      const { data: existingByUserId, error: existingByUserIdError } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (existingByUserIdError) {
        console.error('Error checking existing agent by user_id:', existingByUserIdError);
      }

      if (!existingByUserId) {
        const { error: agentError } = await supabase.from('agents').insert({
          user_id: authUser.id,
          cpf: cleanCpf,
          full_name: data.full_name.toUpperCase(), // Sempre maiúsculo
          registration_number: data.registration_number?.toUpperCase() || null, // Sempre maiúsculo
          city: data.city,
          unit: data.unit,
          current_team: data.current_team,
          team_joined_at: data.current_team ? new Date().toISOString() : null,
          phone: data.phone || null,
          email: data.email || null,
        });

        if (agentError) {
          console.error('Agent creation error:', agentError);
          if ((agentError as any).code === '23505') {
            return { error: 'CPF já cadastrado como agente' };
          }
          return { error: 'Erro ao criar perfil do agente' };
        }
      }

      // Create user role as agent
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: authUser.id,
        role: 'client' as const, // Using 'client' from the existing enum, will treat as 'agent'
      });

      if (roleError) {
        // pode falhar por duplicidade; não bloqueia cadastro
        console.error('Role creation error:', roleError);
      }

      if (authSession) {
        setSession(authSession);
        setUser(authUser);
        await hydrateUserContext(authSession);
      }

      return { error: null };
    } catch (err) {
      console.error('SignUp error:', err);
      return { error: 'Erro ao criar conta' };
    } finally {
      setIsLoading(false);
    }
  }, [hydrateUserContext]);

  const signOut = useCallback(async () => {
    try {
      if (master) {
        // Clear master session
        sessionStorage.removeItem('masterSession');
        setMaster(null);
        setRole(null);
      } else {
        await supabase.auth.signOut();
      }
    } finally {
      clearAuthState();
    }
  }, [clearAuthState, master]);

  return (
    <PlantaoAuthContext.Provider value={{
      user,
      session,
      agent,
      role,
      master,
      isLoading,
      signIn,
      signInMaster,
      signUp,
      signOut,
      refreshAgent,
    }}>
      {children}
    </PlantaoAuthContext.Provider>
  );
};

export const usePlantaoAuth = () => {
  const context = useContext(PlantaoAuthContext);
  if (!context) {
    throw new Error('usePlantaoAuth must be used within PlantaoAuthProvider');
  }
  return context;
};