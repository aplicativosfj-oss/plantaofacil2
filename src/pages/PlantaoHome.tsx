import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { usePlantaoTheme } from '@/contexts/PlantaoThemeContext';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useAgentCpfValidation, useAgentRegistrationValidation } from '@/hooks/useAgentValidation';
import { usePlantaoEffects } from '@/hooks/usePlantaoEffects';
import { useGlobalSound } from '@/hooks/useGlobalSound';
import { usePlantaoEscapeBack } from '@/hooks/usePlantaoEscapeBack';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { User, Lock, Phone, Mail, IdCard, Loader2, AlertCircle, Shield, MapPin, Building, Info, Users, Crown, ChevronRight, Radio, Siren, Star, Zap, Target, Crosshair, Ban, CheckCircle, Fingerprint, Eye, EyeOff, Palette, Save, Calendar, Flame, Truck, AlertTriangle, Ambulance, HeartPulse, Stethoscope, Activity, KeyRound, ShieldAlert, Car, Route, CircleAlert, Radar, ScanEye, Cctv, Building2, UserRoundCheck, BadgeCheck, RotateCcw, Settings, Sparkles, Volume2, VolumeX, icons as LucideIcons, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import plantaoBg from '@/assets/plantao-bg.png';
import teamsHomeBg from '@/assets/teams-home-bg.png';
import PlantaoMusicPlayer from '@/components/plantao/PlantaoMusicPlayer';
import loginBg from '@/assets/login-bg.png';
import plantaoLogo from '@/assets/plantao-pro-logo-new.png';
import PlantaoAboutDialog from '@/components/plantao/PlantaoAboutDialog';
import ThemeSelector from '@/components/plantao/ThemeSelector';
import StyledTeamButton from '@/components/plantao/StyledTeamButton';
import AnimatedPlantaoLogo from '@/components/plantao/AnimatedPlantaoLogo';


// Saved credentials type
interface SavedCredentials {
  cpf: string;
  password: string;
  team: 'alfa' | 'bravo' | 'charlie' | 'delta';
  name?: string;
}

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const validateCPF = (cpf: string): boolean => {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.charAt(10))) return false;
  
  return true;
};

const UNITS = [
  { id: 'cs-feijo', name: 'CS Feijó', active: true },
  { id: 'cs-tarauaca', name: 'CS Tarauacá', active: true },
  { id: 'cs-cruzeiro', name: 'CS Cruzeiro do Sul', active: true },
  { id: 'cs-sena', name: 'CS Sena Madureira', active: true },
  { id: 'cs-rio-branco', name: 'CS Rio Branco', active: true },
];
const CITIES = ['Feijó', 'Rio Branco', 'Cruzeiro do Sul', 'Tarauacá', 'Sena Madureira', 'Brasileia'];

// Função para obter ícone baseado no tema usando contexto
const getTeamIconFromTheme = (teamValue: string, themeConfig: any): LucideIcon => {
  const teamIconData = themeConfig.teamIcons[teamValue];
  return teamIconData?.icon || Shield;
};

const TEAMS = [
  { value: 'alfa', label: 'Equipe Alfa', color: 'from-blue-600 to-blue-800', bgColor: 'bg-team-alfa/20', borderColor: 'border-team-alfa', textColor: 'text-team-alfa', subtitle: 'Força Tática' },
  { value: 'bravo', label: 'Equipe Bravo', color: 'from-amber-500 to-orange-600', bgColor: 'bg-team-bravo/20', borderColor: 'border-team-bravo', textColor: 'text-team-bravo', subtitle: 'Operações Especiais' },
  { value: 'charlie', label: 'Equipe Charlie', color: 'from-emerald-500 to-green-600', bgColor: 'bg-team-charlie/20', borderColor: 'border-team-charlie', textColor: 'text-team-charlie', subtitle: 'Pronta Resposta' },
  { value: 'delta', label: 'Equipe Delta', color: 'from-red-500 to-rose-600', bgColor: 'bg-team-delta/20', borderColor: 'border-team-delta', textColor: 'text-team-delta', subtitle: 'Intervenção Rápida' },
] as const;

// Team Button Component with animations
interface TeamButtonProps {
  team: typeof TEAMS[number];
  index: number;
  isUserTeam: boolean;
  isBlocked: boolean;
  isBlockedClicked: boolean;
  isAutoLogging: boolean;
  themeConfig: any;
  onTeamClick: (value: 'alfa' | 'bravo' | 'charlie' | 'delta') => void;
  onPlaySound?: () => void;
  effectsEnabled?: boolean;
}

const TeamButton = ({ team, index, isUserTeam, isBlocked, isBlockedClicked, isAutoLogging, themeConfig, onTeamClick, onPlaySound, effectsEnabled = true }: TeamButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<{x: number, y: number, id: number}[]>([]);
  const TeamIcon = getTeamIconFromTheme(team.value, themeConfig);
  
  const handlePress = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Play sound effect
    onPlaySound?.();
    
    if (effectsEnabled) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newRipple = { x, y, id: Date.now() };
      setRipples(prev => [...prev, newRipple]);
      setIsPressed(true);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 800);
      
      setTimeout(() => setIsPressed(false), 150);
    }
    onTeamClick(team.value);
  };
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        x: isBlockedClicked ? [0, -3, 3, -3, 3, 0] : 0,
      }}
      transition={{ 
        delay: 0.2 + index * 0.05,
        x: isBlockedClicked ? { duration: 0.3 } : undefined,
      }}
      whileHover={{ scale: isBlocked ? 1 : 1.03, y: isBlocked ? 0 : -2 }}
      onClick={handlePress}
      disabled={isAutoLogging}
      className={`
        relative px-3 py-2.5 rounded-xl text-left overflow-hidden
        ${isBlockedClicked ? 'ring-1 ring-red-500' : ''}
        ${isBlocked 
          ? 'opacity-30 cursor-not-allowed' 
          : 'cursor-pointer'}
        ${isUserTeam ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''}
        bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-md
        border border-white/5 hover:border-white/10
        transition-all duration-300
      `}
    >
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ left: ripple.x, top: ripple.y }}
            className={`absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r ${team.color} pointer-events-none`}
          />
        ))}
      </AnimatePresence>
      
      {/* Press flash effect */}
      <motion.div
        initial={false}
        animate={{ 
          opacity: isPressed ? 0.3 : 0,
          scale: isPressed ? 1.1 : 1
        }}
        transition={{ duration: 0.15 }}
        className={`absolute inset-0 bg-gradient-to-r ${team.color} pointer-events-none rounded-xl`}
      />
      
      {/* Gradient accent bar with pulse on press */}
      <motion.div 
        className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${team.color}`}
        animate={{ 
          width: isPressed ? '3px' : '4px',
          opacity: isPressed ? 1 : 0.8
        }}
      />
      
      {/* Blocked overlay */}
      {isBlockedClicked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 bg-red-500/20 pointer-events-none"
        />
      )}
      
      <div className="flex items-center gap-2.5 pl-2 relative z-10">
        <motion.div 
          className={`
            p-1.5 rounded-lg 
            ${isBlocked ? 'bg-red-500/10' : `bg-gradient-to-br ${team.color}`}
            shadow-sm
          `}
          animate={{ 
            scale: isPressed ? 0.9 : 1,
            rotate: isPressed ? -5 : 0
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          {isBlocked ? (
            <Ban className="w-4 h-4 text-red-400/60" />
          ) : isUserTeam ? (
            <Fingerprint className="w-4 h-4 text-white" />
          ) : (
            <TeamIcon className="w-4 h-4 text-white" />
          )}
        </motion.div>
        <div className="flex-1 min-w-0">
          <span
            className={`font-semibold text-sm block ${isBlocked ? 'text-muted-foreground/50' : 'text-foreground'}`}
          >
            {team.label}
          </span>
          <span
            className={`text-[10px] uppercase tracking-wide ${isBlocked ? 'text-red-400/50' : isUserTeam ? 'text-green-400' : 'text-muted-foreground'}`}
          >
            {isUserTeam ? '● Online' : isBlocked ? 'Bloqueado' : team.subtitle}
          </span>
        </div>
        {isUserTeam && (
          <motion.div
            animate={{ scale: isPressed ? 1.2 : 1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <CheckCircle className="w-4 h-4 text-green-400" />
          </motion.div>
        )}
      </div>

      {/* Shimmer effect */}
      {isUserTeam && (
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </motion.div>
      )}
      
      {/* Corner glow on hover */}
      <motion.div
        className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br ${team.color} blur-xl opacity-0`}
        whileHover={{ opacity: 0.3 }}
      />
    </motion.button>
  );
};

// Scanning line effect
const ScanLine = () => (
  <motion.div
    className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent pointer-events-none z-20"
    animate={{ top: ['0%', '100%', '0%'] }}
    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
  />
);

// Corner brackets decoration
const CornerBrackets = () => (
  <>
    <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary/50" />
    <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-primary/50" />
    <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-primary/50" />
    <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary/50" />
  </>
);

// Tactical HUD element
const HUDElement = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="absolute -left-1 top-0 bottom-0 w-[2px] bg-primary/50" />
    <div className="pl-3 text-sm font-medium text-foreground/80 uppercase tracking-wide">
      {children}
    </div>
  </div>
);

// Pulsing alert indicator
const AlertPulse = () => (
  <div className="relative flex items-center justify-center">
    <div className="absolute w-3 h-3 bg-green-500/30 rounded-full animate-ping" />
    <div className="w-2 h-2 bg-green-500 rounded-full" />
  </div>
);

const PlantaoHome = () => {
  const { signIn, signInMaster, signUp, isLoading, agent } = usePlantaoAuth();
  const { themeConfig, soundEnabled, setSoundEnabled, playSound } = usePlantaoTheme();
  const { effectsEnabled, toggleEffects, soundEnabled: effectsSoundEnabled, toggleSound } = usePlantaoEffects();
  const { playClick } = useGlobalSound();
  const { isSupported: biometricSupported, isRegistered: biometricRegistered, authenticateWithBiometric, registerBiometric } = useBiometricAuth();
  const navigate = useNavigate();
  const [showAbout, setShowAbout] = useState(false);
  const [showAuthPanel, setShowAuthPanel] = useState(false);
  const [showMasterLogin, setShowMasterLogin] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<'alfa' | 'bravo' | 'charlie' | 'delta' | null>(null);
  const [savedCredentials, setSavedCredentials] = useState<SavedCredentials | null>(null);
  const [isAutoLogging, setIsAutoLogging] = useState(false);
  const [blockedTeamClicked, setBlockedTeamClicked] = useState<string | null>(null);
  const [rememberPassword, setRememberPassword] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState('CS Feijó');
  const [showUnitSelector, setShowUnitSelector] = useState(false);

  // Login state
  const [loginCpf, setLoginCpf] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Master login state
  const [masterUsername, setMasterUsername] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [masterError, setMasterError] = useState('');
  
  // Signup state
  const [signupCpf, setSignupCpf] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [signupRegistration, setSignupRegistration] = useState('');
  const [signupCity, setSignupCity] = useState('');
  const [signupUnit, setSignupUnit] = useState('');
  const [signupTeam, setSignupTeam] = useState<'alfa' | 'bravo' | 'charlie' | 'delta' | ''>('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupBirthDate, setSignupBirthDate] = useState('');
  const [signupError, setSignupError] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [registrationError, setRegistrationError] = useState('');

  // Real-time validation hooks
  const cpfValidation = useAgentCpfValidation(signupCpf.replace(/\D/g, ''));
  const registrationValidation = useAgentRegistrationValidation(signupRegistration);

  // Fechar painéis de login com ESC
  const closeAuthPanels = useCallback(() => {
    if (showMasterLogin) {
      setShowMasterLogin(false);
      setMasterUsername('');
      setMasterPassword('');
      setMasterError('');
      return;
    }
    if (showAuthPanel) {
      setShowAuthPanel(false);
      setLoginCpf('');
      setLoginPassword('');
      setLoginError('');
      return;
    }
    if (showAbout) {
      setShowAbout(false);
      return;
    }
    if (showUnitSelector) {
      setShowUnitSelector(false);
      return;
    }
  }, [showMasterLogin, showAuthPanel, showAbout, showUnitSelector]);

  usePlantaoEscapeBack({
    enabled: showMasterLogin || showAuthPanel || showAbout || showUnitSelector,
    onEscape: closeAuthPanels,
  });
  
  // Limpeza de credenciais antigas (reset v3 - NÃO limpa intro_shown para carregar rápido)
  useEffect(() => {
    const RESET_KEY = 'plantao_full_reset_v3';
    if (!localStorage.getItem(RESET_KEY)) {
      // Limpa apenas credenciais de login, NÃO limpa intro_shown
      localStorage.removeItem('plantao_credentials');
      localStorage.removeItem('plantao_master_session');
      localStorage.removeItem('plantao_biometric_registered');
      localStorage.removeItem('plantao_full_reset_v1');
      localStorage.removeItem('plantao_full_reset_v2');
      // Marca intro como já vista para carregamento rápido
      localStorage.setItem('plantao_intro_shown', '1');
      localStorage.setItem(RESET_KEY, '1');
    }
    
    // Carrega credenciais salvas (se existirem após reset)
    const stored = localStorage.getItem('plantao_credentials');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SavedCredentials;
        setSavedCredentials(parsed);
      } catch {
        localStorage.removeItem('plantao_credentials');
      }
    }
  }, []);

  // CPF administrativo para acesso a qualquer equipe
  const ADMIN_BYPASS_CPF = '00000000000';
  const ADMIN_BYPASS_PASSWORD = 'franc2015';

  // Verificar se é acesso admin bypass
  const isAdminBypass = (cpf: string, password: string) => {
    const cleanCpf = cpf.replace(/\D/g, '');
    return cleanCpf === ADMIN_BYPASS_CPF && password === ADMIN_BYPASS_PASSWORD;
  };

  // Handle team click
  const handleTeamClick = async (teamValue: 'alfa' | 'bravo' | 'charlie' | 'delta') => {
    // If user has saved credentials
    if (savedCredentials) {
      // Check if it's admin bypass credentials
      if (isAdminBypass(savedCredentials.cpf, savedCredentials.password)) {
        // Admin bypass - allow access to any team
        setIsAutoLogging(true);
        setSelectedTeam(teamValue);
        toast.success(`🔑 Acesso administrativo - Equipe ${teamValue.toUpperCase()}`);
        setTimeout(() => {
          setIsAutoLogging(false);
          setShowAuthPanel(true);
        }, 500);
        return;
      }
      
      if (savedCredentials.team === teamValue) {
        // Same team - auto login
        setIsAutoLogging(true);
        setSelectedTeam(teamValue);
        
        const { error } = await signIn(savedCredentials.cpf, savedCredentials.password);
        
        if (error) {
          // Credentials expired or invalid
          localStorage.removeItem('plantao_credentials');
          setSavedCredentials(null);
          setIsAutoLogging(false);
          setShowAuthPanel(true);
          toast.error('Sessão expirada. Faça login novamente.');
        } else {
          toast.success(`Bem-vindo de volta!`);
          navigate('/dashboard');
        }
      } else {
        // Different team - BLOCK ACCESS - show inline message via StyledTeamButton
        setBlockedTeamClicked(teamValue);
        setTimeout(() => setBlockedTeamClicked(null), 3000); // Keep message visible for 3 seconds
      }
    } else {
      // No saved credentials - show login for this team
      setSelectedTeam(teamValue);
      setSignupTeam(teamValue);
      setShowAuthPanel(true);
    }
  };

  // Reset saved credentials
  const handleResetCredentials = () => {
    localStorage.removeItem('plantao_credentials');
    setSavedCredentials(null);
    toast.success('Dados de acesso limpos! Você pode fazer login novamente.');
  };

  // Save credentials after successful login
  const saveCredentialsAndLogin = async (cpf: string, password: string) => {
    const { error } = await signIn(cpf, password);
    
    if (error) {
      return { error };
    }
    
    // Fetch the agent's team after login
    // We'll save after navigation since agent context will be updated
    const credentialsToSave: SavedCredentials = {
      cpf,
      password,
      team: selectedTeam || signupTeam as 'alfa' | 'bravo' | 'charlie' | 'delta',
    };
    
    localStorage.setItem('plantao_credentials', JSON.stringify(credentialsToSave));
    return { error: null };
  };

  const handleCpfChange = (value: string, isSignup: boolean) => {
    const formatted = formatCPF(value);
    if (isSignup) {
      setSignupCpf(formatted);
      const clean = formatted.replace(/\D/g, '');
      if (clean.length === 11) {
        if (!validateCPF(clean)) {
          setCpfError('CPF inválido');
        } else {
          setCpfError('');
        }
      } else {
        setCpfError('');
      }
    } else {
      setLoginCpf(formatted);
    }
  };

  // CPF master para acesso administrativo em qualquer painel
  // Obs: NÃO armazenamos senha no front-end (segurança). Apenas usamos o CPF como atalho para abrir/validar o acesso master.
  const MASTER_CPF = '69598293268';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginCpf || !loginPassword) {
      setLoginError('Preencha todos os campos');
      return;
    }

    const cleanCpf = loginCpf.replace(/\D/g, '');

    // Admin bypass - CPF 000.000.000-00 com senha franc2015
    if (isAdminBypass(cleanCpf, loginPassword)) {
      // Save admin bypass credentials with selected team
      const credentialsToSave: SavedCredentials = {
        cpf: loginCpf,
        password: loginPassword,
        team: selectedTeam || 'alfa',
        name: 'Administrador',
      };
      localStorage.setItem('plantao_credentials', JSON.stringify(credentialsToSave));
      setSavedCredentials(credentialsToSave);
      
      // Admin bypass - navigate directly to dashboard with selected team context
      toast.success(`🔑 Acesso administrativo - Equipe ${(selectedTeam || 'alfa').toUpperCase()}`);
      navigate('/dashboard');
      return;
    }

    // Trial access - password "trial" for 30 days free
    if (loginPassword.toLowerCase() === 'trial') {
      // Check if this CPF already used trial
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('cpf', cleanCpf)
        .maybeSingle();

      if (existingAgent) {
        // Check if already had trial
        const { data: existingLicense } = await supabase
          .from('agent_licenses')
          .select('is_trial, trial_started_at')
          .eq('agent_id', existingAgent.id)
          .maybeSingle();

        if (existingLicense?.is_trial) {
          setLoginError('Você já utilizou o período trial. Faça login com sua senha ou entre em contato para renovar.');
          return;
        }
      }

      toast.info('🎉 Bem-vindo ao período Trial de 30 dias! Complete seu cadastro para continuar.', { duration: 5000 });
      // Pre-fill and go to signup
      setSignupCpf(loginCpf);
      return;
    }

    // Acesso master via CPF especial (usa a senha digitada, sem senha fixa no código)
    if (cleanCpf === MASTER_CPF) {
      const { error } = await signInMaster('franc', loginPassword);
      if (error) {
        setLoginError(error);
      } else {
        toast.success('Acesso Master autorizado!');
        navigate('/master');
      }
      return;
    }

    if (!validateCPF(loginCpf)) {
      setLoginError('CPF inválido');
      return;
    }

    const { error } = await saveCredentialsAndLogin(loginCpf, loginPassword);
    
    if (error) {
      setLoginError(error);
    } else {
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    
    // Block registration for units other than CS Feijó
    if (signupUnit && signupUnit !== 'CS Feijó') {
      toast.error(
        '🚫 Cadastro indisponível para sua unidade no momento. Entre em contato com o administrador para mais informações.',
        { duration: 6000 }
      );
      setSignupError('Cadastro disponível apenas para CS Feijó. Entre em contato com o administrador.');
      return;
    }
    
    if (!signupCpf || !signupPassword || !signupName || !signupRegistration || !signupCity || !signupUnit || !signupTeam) {
      setSignupError('Preencha todos os campos obrigatórios');
      return;
    }

    if (!validateCPF(signupCpf)) {
      setSignupError('CPF inválido');
      return;
    }

    // Check for duplicate CPF
    if (cpfValidation.isDuplicate) {
      setSignupError(`CPF já cadastrado para: ${cpfValidation.duplicateName}`);
      return;
    }

    if (signupRegistration.length !== 9 || !/^\d{9}$/.test(signupRegistration)) {
      setSignupError('Matrícula deve ter exatamente 9 dígitos numéricos');
      return;
    }

    // Check for duplicate registration
    if (registrationValidation.isDuplicate) {
      setSignupError(`Matrícula já cadastrada para: ${registrationValidation.duplicateName}`);
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('As senhas não conferem');
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    const { error } = await signUp({
      cpf: signupCpf,
      password: signupPassword,
      full_name: signupName.toUpperCase(), // Converter para maiúsculo
      registration_number: signupRegistration, // Já é numérico, não precisa converter
      city: signupCity,
      unit: signupUnit,
      current_team: signupTeam,
      phone: signupPhone.replace(/\D/g, '') || undefined,
      email: signupEmail || undefined,
    });
    
    if (error) {
      setSignupError(error);
    } else {
      // Save credentials for auto-login
      const credentialsToSave: SavedCredentials = {
        cpf: signupCpf,
        password: signupPassword,
        team: signupTeam as 'alfa' | 'bravo' | 'charlie' | 'delta',
        name: signupName,
      };
      localStorage.setItem('plantao_credentials', JSON.stringify(credentialsToSave));
      
      toast.success('Cadastro realizado com sucesso!');
      navigate('/dashboard');
    }
  };

  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMasterError('');
    
    if (!masterUsername || !masterPassword) {
      setMasterError('Preencha usuário e senha');
      return;
    }

    const { error } = await signInMaster(masterUsername, masterPassword);
    
    if (error) {
      setMasterError(error);
    } else {
      toast.success('Login master realizado!');
      navigate('/master');
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-900 transition-none">
      {/* Fallback text: garante visibilidade mínima mesmo se estilos/fontes falharem */}
      <noscript>
        <div style={{ color: 'white', padding: '20px' }}>PlantãoPRO - JavaScript desativado</div>
      </noscript>
      <PlantaoAboutDialog isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <PlantaoMusicPlayer />

      {/* Background Effects (somente quando efeitos estiverem habilitados) */}
      {effectsEnabled && (
        <>
          {/* FORÇA BRUTA: removido fundo em imagem para evitar travamentos em alguns aparelhos */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
          <ScanLine />
          <CornerBrackets />


          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Vignette effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
        </>
      )}

      <AnimatePresence mode="wait">
        {!showAuthPanel ? (
          /* Landing Screen */
          <motion.div
            key="landing"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }}
            className="relative z-10 flex flex-col min-h-screen"
          >
            {/* Top HUD Bar */}
            <header className="py-3 px-4 border-b border-primary/20">
              <div className="container mx-auto flex items-center justify-between">
                <div /> {/* Empty spacer for balance */}
                <HUDElement>
                  <span className="flex items-center gap-1">
                    {themeConfig.emoji} {themeConfig.name}
                  </span>
                </HUDElement>
                <div className="flex items-center gap-2">
                  {/* Sound Toggle */}
                  <motion.button
                    onClick={() => {
                      toggleSound();
                      if (!effectsSoundEnabled) {
                        playClick();
                      }
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-2 rounded-lg border transition-all duration-200 ${
                      effectsSoundEnabled 
                        ? 'bg-primary/20 border-primary/40 hover:bg-primary/30' 
                        : 'bg-muted/50 border-transparent hover:bg-muted'
                    }`}
                    title={effectsSoundEnabled ? 'Desativar som' : 'Ativar som'}
                  >
                    {effectsSoundEnabled ? (
                      <Volume2 className="w-4 h-4 text-primary" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-muted-foreground" />
                    )}
                  </motion.button>

                  <ThemeSelector 
                    trigger={
                      <button 
                        onClick={playClick}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors hover:scale-105 active:scale-95 duration-200"
                      >
                        <Palette className="w-4 h-4 text-primary" />
                        <span className="text-xs font-mono">Tema</span>
                      </button>
                    }
                  />
                  
                  {/* Settings/Clear Access - Only show if has saved credentials */}
                  {savedCredentials && (
                    <motion.button
                      onClick={() => {
                        playClick();
                        handleResetCredentials();
                      }}
                      whileHover={{ scale: effectsEnabled ? 1.1 : 1 }}
                      whileTap={{ scale: effectsEnabled ? 0.9 : 1 }}
                      className="p-2 rounded-lg bg-muted/50 hover:bg-red-500/20 border border-transparent hover:border-red-500/40 transition-all duration-200 group"
                      title="Limpar acesso salvo para trocar de equipe"
                    >
                      <RotateCcw className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" />
                    </motion.button>
                  )}
                  
                  {/* Admin Access Button */}
                  <motion.button
                    onClick={() => {
                      playClick();
                      setShowMasterLogin(true);
                      setSelectedTeam(null);
                      setShowAuthPanel(true);
                    }}
                    whileHover={{ scale: effectsEnabled ? 1.1 : 1 }}
                    whileTap={{ scale: effectsEnabled ? 0.9 : 1 }}
                    className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 hover:border-amber-400 transition-all duration-200"
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                  </motion.button>
                  <div className="flex items-center gap-2">
                    <AlertPulse />
                    <span className="text-xs font-medium text-green-400">Online</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs text-muted-foreground">v1.0</span>
                  <button 
                    onClick={() => {
                      playClick();
                      setShowAbout(true);
                    }}
                    className="text-[10px] text-muted-foreground/60 hover:text-primary transition-colors"
                  >
                    Sobre
                  </button>
                </div>
              </div>
            </header>

            {/* Main Content - Moved Up */}
            <main className="flex-1 flex flex-col items-center justify-start pt-2 px-4">
              {/* Animated Logo Component */}
              <AnimatedPlantaoLogo />

              {/* Teams Grid - Larger Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-md"
              >
                <div className="text-center mb-3">
                  <span className="text-sm font-medium text-foreground/80">
                    {savedCredentials 
                      ? `Equipe ${savedCredentials.team.charAt(0).toUpperCase() + savedCredentials.team.slice(1)}` 
                      : 'Selecione sua Equipe'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {TEAMS.map((team, index) => {
                    const teamLabels: Record<string, string> = {
                      alfa: 'ALFA',
                      bravo: 'BRAVO',
                      charlie: 'CHARLIE',
                      delta: 'DELTA'
                    };
                    return (
                      <StyledTeamButton
                        key={team.value}
                        team={team}
                        index={index}
                        isUserTeam={savedCredentials?.team === team.value}
                        isBlocked={false}
                        isBlockedClicked={blockedTeamClicked === team.value}
                        isAutoLogging={isAutoLogging}
                        userTeamLabel={savedCredentials ? teamLabels[savedCredentials.team] : undefined}
                        onTeamClick={handleTeamClick}
                      />
                    );
                  })}
                </div>
                
                {/* Loading indicator for auto-login */}
                <AnimatePresence>
                  {isAutoLogging && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-center gap-2 mt-3 py-2"
                    >
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <span className="text-sm text-foreground/80">Autenticando...</span>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>

              {/* Unit Selector Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="w-full max-w-md mt-4"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground/80">
                    Unidade Socioeducativa
                  </span>
                </div>
                
                <motion.button
                  onClick={() => setShowUnitSelector(!showUnitSelector)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-3 rounded-xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-md border border-primary/20 hover:border-primary/40 transition-all duration-300 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">{selectedUnit}</p>
                      <p className="text-[10px] text-muted-foreground">Sistema Ativo</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${showUnitSelector ? 'rotate-90' : ''}`} />
                </motion.button>
                
                <AnimatePresence>
                  {showUnitSelector && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 overflow-hidden"
                    >
                      <div className="bg-card/90 backdrop-blur-md rounded-xl border border-border/50 p-2 space-y-1">
                        {UNITS.map((unit) => (
                          <motion.button
                            key={unit.id}
                            onClick={() => {
                              setSelectedUnit(unit.name);
                              setShowUnitSelector(false);
                            }}
                            whileHover={{ x: 4 }}
                            className={`w-full p-2 rounded-lg flex items-center justify-between transition-colors ${
                              selectedUnit === unit.name 
                                ? 'bg-primary/20 border border-primary/30' 
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className={`w-4 h-4 ${selectedUnit === unit.name ? 'text-primary' : 'text-muted-foreground'}`} />
                              <span className={`text-sm ${selectedUnit === unit.name ? 'font-semibold text-primary' : ''}`}>
                                {unit.name}
                              </span>
                            </div>
                            {selectedUnit === unit.name && (
                              <CheckCircle className="w-4 h-4 text-primary" />
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Decorative scan line effect */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-20 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
              />
            </main>

            {/* Bottom HUD Bar */}
            <footer className="py-2 px-4 border-t border-primary/20">
              <div className="container mx-auto flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                <motion.span
                  animate={{ 
                    color: ['hsl(var(--primary))', 'hsl(var(--muted-foreground))', 'hsl(var(--primary))'],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  © 2026 Franc Denis
                </motion.span>
                
                
                <div className="flex items-center gap-4">
                  <span className="text-primary/60">SYS::READY</span>
                  <span className="text-green-500/60">SEC::ACTIVE</span>
                </div>
              </div>
            </footer>
          </motion.div>
        ) : (
          /* Auth Panel */
          <motion.div
            key="auth"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }}
            className="relative z-10 flex flex-col min-h-screen"
            style={{
              backgroundImage: `url(${loginBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Top Bar with Back Button */}
            {/* Dark overlay for better readability */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
            <header className="relative z-10 py-3 px-4 border-b border-primary/30 bg-black/50 backdrop-blur-md">
              <div className="container mx-auto flex items-center justify-between">
                <motion.button
                  onClick={() => {
                    playClick();
                    setShowAuthPanel(false);
                    setShowMasterLogin(false);
                    setSelectedTeam(null);
                  }}
                  whileHover={{ scale: 1.05, x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-primary/50 text-white hover:text-primary transition-all duration-200 backdrop-blur-sm"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                  <span className="font-medium text-sm">Voltar</span>
                </motion.button>
                <img 
                  src={plantaoLogo} 
                  alt="PlantãoPro" 
                  className="h-10 w-auto object-contain"
                />
                <div className="w-24" /> {/* Spacer for centering */}
              </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex items-start justify-center px-4 pt-4 pb-2 overflow-y-auto">
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.02 }}
                className="w-full max-w-md"
              >

                {/* Warning banner if viewing different team */}
                {savedCredentials && selectedTeam && savedCredentials.team !== selectedTeam && !showMasterLogin && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-3"
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-semibold text-amber-500">Apenas visualização</p>
                      <p className="text-muted-foreground">
                        Você pertence à equipe <span className="font-bold text-foreground">{savedCredentials.team.toUpperCase()}</span>. 
                        Para trocar de equipe, acesse seu painel.
                      </p>
                    </div>
                  </motion.div>
                )}

                <Card className={`border-primary/30 bg-card/95 backdrop-blur-lg shadow-2xl shadow-primary/20 ${showMasterLogin ? 'border-amber-500/40' : ''}`}>
                  <CardHeader className="text-center pb-3">
                    <CardTitle className={`text-lg font-display tracking-wide flex items-center justify-center gap-2 ${showMasterLogin ? 'text-amber-500' : ''}`}>
                      {showMasterLogin ? (
                        <>
                          <Crown className="w-5 h-5 text-amber-500" />
                          Painel Administrativo
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5 text-primary" />
                          Acesso ao Sistema
                        </>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {showMasterLogin ? 'Acesso exclusivo para administradores' : 'Gestão de Plantões - Agentes Socioeducativos'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {showMasterLogin ? (
                      /* Master Login Form */
                      <div className="space-y-4">
                        <form onSubmit={handleMasterLogin} className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="master-username" className="flex items-center gap-2 text-xs text-amber-500">
                              <User className="w-3.5 h-3.5" /> Usuário Master *
                            </Label>
                            <Input
                              id="master-username"
                              type="text"
                              placeholder="Digite o usuário"
                              value={masterUsername}
                              onChange={(e) => setMasterUsername(e.target.value)}
                              className="bg-background/50 border-amber-500/30 h-9"
                              autoFocus
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <Label htmlFor="master-password" className="flex items-center gap-2 text-xs text-amber-500">
                              <Lock className="w-3.5 h-3.5" /> Senha Master *
                            </Label>
                            <Input
                              id="master-password"
                              type="password"
                              placeholder="••••••"
                              value={masterPassword}
                              onChange={(e) => setMasterPassword(e.target.value)}
                              className="bg-background/50 border-amber-500/30 h-9"
                            />
                          </div>

                          {masterError && (
                            <div className="flex items-center gap-2 text-destructive text-xs">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {masterError}
                            </div>
                          )}

                          <Button
                            type="submit"
                            className="w-full bg-amber-500 hover:bg-amber-600 text-black h-10 font-bold"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Crown className="w-4 h-4 mr-2" />
                            )}
                            Entrar como Administrador
                          </Button>
                        </form>

                        <div className="relative my-3">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/50" />
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="bg-card px-2 text-muted-foreground">ou</span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-9 text-xs"
                          onClick={() => setShowMasterLogin(false)}
                        >
                          <ChevronRight className="w-3.5 h-3.5 mr-2 rotate-180" />
                          Voltar ao login de agente
                        </Button>
                      </div>
                    ) : (
                    <Tabs defaultValue="login" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-3">
                        <TabsTrigger value="login">Entrar</TabsTrigger>
                        <TabsTrigger value="signup">Cadastrar</TabsTrigger>
                      </TabsList>
                      
                      {/* Login Tab */}
                      <TabsContent value="login">
                        <form onSubmit={handleLogin} className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="login-cpf" className="flex items-center gap-2 text-xs">
                              <IdCard className="w-3.5 h-3.5" /> CPF (Login) *
                            </Label>
                            <Input
                              id="login-cpf"
                              type="text"
                              placeholder="Seu CPF é seu login"
                              value={loginCpf}
                              onChange={(e) => handleCpfChange(e.target.value, false)}
                              className="bg-background/50 border-border/50 h-9"
                            />
                            <p className="text-[10px] text-muted-foreground">Use seu CPF cadastrado para entrar</p>
                          </div>
                          
                          <div className="space-y-1">
                            <Label htmlFor="login-password" className="flex items-center gap-2 text-xs">
                              <Lock className="w-3.5 h-3.5" /> Senha *
                            </Label>
                            <div className="relative">
                              <Input
                                id="login-password"
                                type={showLoginPassword ? "text" : "password"}
                                placeholder="••••••"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                className="bg-background/50 border-border/50 h-9 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Opções de lembrar senha e biometria */}
                          <div className="flex flex-col gap-2 py-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="remember-password" className="flex items-center gap-2 text-xs cursor-pointer">
                                <Save className="w-3.5 h-3.5 text-primary" />
                                Lembrar senha
                              </Label>
                              <Switch
                                id="remember-password"
                                checked={rememberPassword}
                                onCheckedChange={setRememberPassword}
                              />
                            </div>
                            
                            {biometricSupported && (
                              <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2 text-xs">
                                  <Fingerprint className="w-3.5 h-3.5 text-primary" />
                                  {biometricRegistered ? 'Biometria ativada' : 'Ativar biometria'}
                                </Label>
                                {biometricRegistered ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      const result = await authenticateWithBiometric();
                                      if (result.success && result.cpf) {
                                        const creds = localStorage.getItem('plantao_credentials');
                                        if (creds) {
                                          const parsed = JSON.parse(creds);
                                          if (parsed.cpf.replace(/\D/g, '') === result.cpf.replace(/\D/g, '')) {
                                            const { error } = await signIn(parsed.cpf, parsed.password);
                                            if (!error) {
                                              navigate('/dashboard');
                                            }
                                          }
                                        }
                                      }
                                    }}
                                    className="h-7 text-xs gap-1"
                                  >
                                    <Fingerprint className="w-3 h-3" />
                                    Usar
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (loginCpf) {
                                        registerBiometric(loginCpf.replace(/\D/g, ''));
                                      } else {
                                        toast.error('Preencha o CPF primeiro');
                                      }
                                    }}
                                    className="h-7 text-xs"
                                  >
                                    Ativar
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          {loginError && (
                            <div className="flex items-center gap-2 text-destructive text-xs">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {loginError}
                            </div>
                          )}

                          {/* Disable login if viewing different team */}
                          {savedCredentials && selectedTeam && savedCredentials.team !== selectedTeam ? (
                            <div className="p-3 rounded-lg bg-muted/50 text-center">
                              <p className="text-xs text-muted-foreground">
                                Entre na sua equipe ({savedCredentials.team.toUpperCase()}) para fazer login
                              </p>
                            </div>
                          ) : (
                            <Button
                              type="submit"
                              className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 h-9"
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : null}
                              Entrar
                            </Button>
                          )}

                          <div className="relative my-3">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-border/50" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                              <span className="bg-card px-2 text-muted-foreground">ou</span>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-9 text-xs border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                            onClick={() => setShowMasterLogin(true)}
                          >
                            <Crown className="w-3.5 h-3.5 mr-2" />
                            Acesso Administrador
                          </Button>
                        </form>
                      </TabsContent>

                      {/* Signup Tab */}
                      <TabsContent value="signup">
                        <form onSubmit={handleSignup} className="space-y-2">
                          <div className="space-y-1">
                            <Label htmlFor="signup-name" className="flex items-center gap-2 text-xs">
                              <User className="w-3.5 h-3.5" /> Nome Completo *
                            </Label>
                            <Input
                              id="signup-name"
                              type="text"
                              placeholder="Seu nome completo"
                              value={signupName}
                              onChange={(e) => setSignupName(e.target.value.toUpperCase())}
                              className="bg-background/50 border-border/50 h-9 uppercase"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="signup-cpf" className="flex items-center gap-2 text-xs">
                              <IdCard className="w-3.5 h-3.5" /> CPF (Será seu login) *
                              {cpfValidation.isChecking && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                            </Label>
                            <Input
                              id="signup-cpf"
                              type="text"
                              placeholder="000.000.000-00"
                              value={signupCpf}
                              onChange={(e) => handleCpfChange(e.target.value, true)}
                              className={`bg-background/50 border-border/50 h-9 ${cpfError || cpfValidation.isDuplicate ? 'border-destructive ring-1 ring-destructive/50' : ''}`}
                            />
                            {cpfError ? (
                              <p className="text-destructive text-xs flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {cpfError}
                              </p>
                            ) : cpfValidation.isDuplicate ? (
                              <p className="text-destructive text-xs flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {cpfValidation.error}
                              </p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground">Seu CPF será usado para fazer login</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="signup-registration" className="flex items-center gap-2 text-xs">
                              <Shield className="w-3.5 h-3.5" /> Matrícula * (9 dígitos)
                              {registrationValidation.isChecking && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                            </Label>
                            <Input
                              id="signup-registration"
                              type="text"
                              inputMode="numeric"
                              placeholder="000000000"
                              maxLength={9}
                              value={signupRegistration}
                              onChange={(e) => {
                                const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 9);
                                setSignupRegistration(numericOnly);
                              }}
                              className={`bg-background/50 border-border/50 h-9 ${registrationValidation.isDuplicate ? 'border-destructive ring-1 ring-destructive/50' : ''}`}
                            />
                            {registrationValidation.isDuplicate ? (
                              <p className="text-destructive text-xs flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {registrationValidation.error}
                              </p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground">Sua matrícula funcional de 9 dígitos</p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label htmlFor="signup-birthdate" className="flex items-center gap-2 text-xs">
                                <Calendar className="w-3.5 h-3.5" /> Data Nascimento
                              </Label>
                              <Input
                                id="signup-birthdate"
                                type="date"
                                value={signupBirthDate}
                                onChange={(e) => setSignupBirthDate(e.target.value)}
                                className="bg-background/50 border-border/50 h-9"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <Label htmlFor="signup-city" className="flex items-center gap-2 text-xs">
                                <MapPin className="w-3.5 h-3.5" /> Cidade *
                              </Label>
                              <Select value={signupCity} onValueChange={setSignupCity}>
                                <SelectTrigger className="bg-background/50 border-border/50 h-9">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  {CITIES.map((city) => (
                                    <SelectItem key={city} value={city}>{city}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="signup-unit" className="flex items-center gap-2 text-xs">
                              <Building className="w-3.5 h-3.5" /> Unidade *
                            </Label>
                            <Select value={signupUnit} onValueChange={setSignupUnit}>
                              <SelectTrigger className="bg-background/50 border-border/50 h-9">
                                <SelectValue placeholder="Selecione sua unidade" />
                              </SelectTrigger>
                              <SelectContent>
                                {UNITS.filter(u => u.active).map((unit) => (
                                  <SelectItem key={unit.id} value={unit.name}>
                                    <span className="flex items-center gap-2">
                                      <Building className="w-3.5 h-3.5 text-primary" />
                                      {unit.name}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Team Selection - show pre-selected team or selector */}
                          <div className="space-y-1">
                            <Label htmlFor="signup-team" className="flex items-center gap-2 text-xs">
                              <Users className="w-3.5 h-3.5" /> Equipe *
                            </Label>
                            {selectedTeam ? (
                              // Show pre-selected team with visual indicator
                              <div className="flex items-center gap-3 p-2 rounded bg-primary/10 border border-primary/30">
                                {(() => {
                                  const team = TEAMS.find(t => t.value === selectedTeam);
                                  if (!team) return null;
                                      const TeamIcon = getTeamIconFromTheme(team.value, themeConfig);
                                      return (
                                        <>
                                          <div className={`p-1.5 rounded ${team.bgColor}`}>
                                            <TeamIcon className={`w-4 h-4 ${team.textColor}`} />
                                          </div>
                                          <span className={`font-bold text-sm ${team.textColor}`}>
                                            {team.label}
                                          </span>
                                          <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                                        </>
                                      );
                                    })()}
                              </div>
                            ) : (
                              <Select value={signupTeam} onValueChange={(v) => setSignupTeam(v as typeof signupTeam)}>
                                <SelectTrigger className={`bg-background/50 border-border/50 h-9 ${!signupTeam ? 'border-amber-500/50' : 'border-primary/50'}`}>
                                  <SelectValue placeholder="Selecione sua equipe" />
                                </SelectTrigger>
                                <SelectContent>
                                  {TEAMS.map((team) => {
                                    const TeamIcon = getTeamIconFromTheme(team.value, themeConfig);
                                    return (
                                      <SelectItem key={team.value} value={team.value}>
                                        <span className="flex items-center gap-2">
                                          <TeamIcon className={`w-4 h-4 ${team.textColor}`} />
                                          {team.label}
                                        </span>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            )}
                            {!signupTeam && !selectedTeam && (
                              <p className="text-amber-500 text-[10px] flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Selecione sua equipe para continuar
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label htmlFor="signup-phone" className="flex items-center gap-2 text-xs">
                                <Phone className="w-3.5 h-3.5" /> Telefone
                              </Label>
                              <Input
                                id="signup-phone"
                                type="tel"
                                placeholder="(00) 00000-0000"
                                value={signupPhone}
                                onChange={(e) => setSignupPhone(formatPhone(e.target.value))}
                                className="bg-background/50 border-border/50 h-9"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor="signup-email" className="flex items-center gap-2 text-xs">
                                <Mail className="w-3.5 h-3.5" /> Email
                              </Label>
                              <Input
                                id="signup-email"
                                type="email"
                                placeholder="seu@email.com"
                                value={signupEmail}
                                onChange={(e) => setSignupEmail(e.target.value)}
                                className="bg-background/50 border-border/50 h-9"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="signup-password" className="flex items-center gap-2 text-xs">
                              <Lock className="w-3.5 h-3.5" /> Senha *
                            </Label>
                            <div className="relative">
                              <Input
                                id="signup-password"
                                type={showSignupPassword ? "text" : "password"}
                                placeholder="Mínimo 6 caracteres"
                                value={signupPassword}
                                onChange={(e) => setSignupPassword(e.target.value)}
                                className="bg-background/50 border-border/50 h-9 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowSignupPassword(!showSignupPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="signup-confirm-password" className="flex items-center gap-2 text-xs">
                              <Lock className="w-3.5 h-3.5" /> Confirmar Senha *
                            </Label>
                            <div className="relative">
                              <Input
                                id="signup-confirm-password"
                                type={showSignupConfirmPassword ? "text" : "password"}
                                placeholder="Repita a senha"
                                value={signupConfirmPassword}
                                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                                className="bg-background/50 border-border/50 h-9 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {signupError && (
                            <div className="flex items-center gap-2 text-destructive text-xs">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {signupError}
                            </div>
                          )}

                          <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 h-9"
                            disabled={isLoading || !!cpfError}
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            Criar Conta
                          </Button>

                          <p className="text-[10px] text-muted-foreground text-center">
                            * Campos obrigatórios
                          </p>
                        </form>
                      </TabsContent>
                    </Tabs>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </main>

            {/* Footer */}
            <div className="relative z-10">
              <footer className="py-3 text-center text-muted-foreground text-sm space-y-1">
                <p>© 2026 Franc Denis</p>
                <button 
                  onClick={() => setShowAbout(true)}
                  className="text-xs hover:text-primary transition-colors underline"
                >
                  Sobre o Sistema
                </button>
              </footer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlantaoHome;
