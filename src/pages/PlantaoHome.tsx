import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { usePlantaoTheme } from '@/contexts/PlantaoThemeContext';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { User, Lock, Phone, Mail, IdCard, Loader2, AlertCircle, Shield, MapPin, Building, Info, Users, Crown, ChevronRight, Radio, Siren, Star, Zap, Target, Crosshair, Ban, CheckCircle, Fingerprint, Eye, EyeOff, Palette, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import plantaoLogo from '@/assets/plantao-logo.png';
import plantaoBg from '@/assets/plantao-bg.png';
import PlantaoAboutDialog from '@/components/plantao/PlantaoAboutDialog';
import ThemeSelector from '@/components/plantao/ThemeSelector';

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

const UNITS = ['CS Feijó', 'CS Juruá', 'CS Rio Branco', 'CS Sena', 'CS Brasiléia'];
const CITIES = ['Feijó', 'Rio Branco', 'Cruzeiro do Sul', 'Tarauacá', 'Sena Madureira'];

const TEAMS = [
  { value: 'alfa', label: 'Equipe Alfa', icon: Shield, color: 'from-blue-600 to-blue-800', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500', textColor: 'text-blue-400', subtitle: 'Força Tática' },
  { value: 'bravo', label: 'Equipe Bravo', icon: Star, color: 'from-amber-500 to-orange-600', bgColor: 'bg-amber-500/20', borderColor: 'border-amber-500', textColor: 'text-amber-400', subtitle: 'Operações Especiais' },
  { value: 'charlie', label: 'Equipe Charlie', icon: Target, color: 'from-emerald-500 to-green-600', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500', textColor: 'text-emerald-400', subtitle: 'Pronta Resposta' },
  { value: 'delta', label: 'Equipe Delta', icon: Crosshair, color: 'from-red-500 to-rose-600', bgColor: 'bg-red-500/20', borderColor: 'border-red-500', textColor: 'text-red-400', subtitle: 'Intervenção Rápida' },
] as const;

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
    <div className="pl-3 text-xs font-mono text-primary/80 uppercase tracking-widest">
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
  const { themeConfig, playSound } = usePlantaoTheme();
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
  const [signupError, setSignupError] = useState('');
  const [cpfError, setCpfError] = useState('');

  // Load saved credentials on mount
  useEffect(() => {
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

  // Handle team click
  const handleTeamClick = async (teamValue: 'alfa' | 'bravo' | 'charlie' | 'delta') => {
    // If user has saved credentials
    if (savedCredentials) {
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
        // Different team - show blocked effect
        setBlockedTeamClicked(teamValue);
        toast.error(`Acesso negado! Você pertence à equipe ${savedCredentials.team.toUpperCase()}`);
        
        // Reset blocked state after animation
        setTimeout(() => setBlockedTeamClicked(null), 1500);
      }
    } else {
      // No saved credentials - show login for this team
      setSelectedTeam(teamValue);
      setSignupTeam(teamValue);
      setShowAuthPanel(true);
    }
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
    
    if (!signupCpf || !signupPassword || !signupName || !signupRegistration || !signupCity || !signupUnit || !signupTeam) {
      setSignupError('Preencha todos os campos obrigatórios');
      return;
    }

    if (!validateCPF(signupCpf)) {
      setSignupError('CPF inválido');
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
      registration_number: signupRegistration.toUpperCase(), // Converter para maiúsculo
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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PlantaoAboutDialog isOpen={showAbout} onClose={() => setShowAbout(false)} />

      {/* About Button */}
      <button
        onClick={() => setShowAbout(true)}
        className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs transition-all duration-300 backdrop-blur-sm"
        title="Sobre o aplicativo"
      >
        <Info className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Sobre</span>
      </button>

      {/* Background Effects */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{ backgroundImage: `url(${plantaoBg})` }}
      />
      <ScanLine />
      <CornerBrackets />
      
      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Vignette effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />

      <AnimatePresence mode="wait">
        {!showAuthPanel ? (
          /* Landing Screen */
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex flex-col min-h-screen"
          >
            {/* Top HUD Bar */}
            <header className="py-3 px-4 border-b border-primary/20">
              <div className="container mx-auto flex items-center justify-between">
                <HUDElement>
                  <span className="flex items-center gap-1">
                    {themeConfig.icon} {themeConfig.name}
                  </span>
                </HUDElement>
                <div className="flex items-center gap-3">
                  <ThemeSelector 
                    trigger={
                      <button className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                        <Palette className="w-4 h-4 text-primary" />
                        <span className="text-xs font-mono">Tema</span>
                      </button>
                    }
                  />
                  <div className="flex items-center gap-2">
                    <AlertPulse />
                    <span className="text-xs font-mono text-green-400 uppercase">Online</span>
                  </div>
                </div>
                <HUDElement>v1.0</HUDElement>
              </div>
            </header>

            {/* Main Content - Moved Up */}
            <main className="flex-1 flex flex-col items-center justify-start pt-2 px-4">
              {/* Logo + Title Combined */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative mb-3 text-center"
              >
                {/* Efeito de brilho suave */}
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                
                <img 
                  src={plantaoLogo} 
                  alt="PlantãoPro" 
                  className="relative h-24 md:h-32 w-auto object-contain drop-shadow-2xl mx-auto"
                />
                <h1 className="text-xl md:text-2xl font-display font-bold text-foreground tracking-wider mt-2">
                  PLANTÃO<span className="text-primary">PRO</span>
                </h1>
                <p className="text-muted-foreground text-[10px] font-mono uppercase tracking-widest mt-0.5">
                  Gestão de Plantões • Segurança
                </p>
              </motion.div>

              {/* Teams Grid - Larger Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-md"
              >
                <div className="text-center mb-3">
                  <span className="text-xs font-mono text-primary/60 uppercase tracking-widest">
                    {savedCredentials 
                      ? `[ ${savedCredentials.team.toUpperCase()} ]` 
                      : '[ Selecione sua Equipe ]'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {TEAMS.map((team, index) => {
                    const isUserTeam = savedCredentials?.team === team.value;
                    const isBlocked = savedCredentials && !isUserTeam;
                    const isBlockedClicked = blockedTeamClicked === team.value;
                    
                    return (
                      <motion.button
                        key={team.value}
                        initial={{ opacity: 0, x: index % 2 === 0 ? -10 : 10 }}
                        animate={{ 
                          opacity: 1, 
                          x: isBlockedClicked ? [0, -4, 4, -4, 4, 0] : 0,
                          scale: isBlockedClicked ? [1, 0.98, 1] : 1,
                        }}
                        transition={{ 
                          delay: 0.3 + index * 0.05,
                          x: isBlockedClicked ? { duration: 0.4 } : undefined,
                        }}
                        whileHover={{ scale: isBlocked ? 1 : 1.02 }}
                        whileTap={{ scale: isBlocked ? 0.98 : 0.96 }}
                        onClick={() => handleTeamClick(team.value)}
                        disabled={isAutoLogging}
                        className={`
                          relative p-4 md:p-5 rounded-lg border-l-4 text-left
                          ${isBlockedClicked ? 'border-red-500' : team.borderColor}
                          ${isBlocked 
                            ? 'bg-gradient-to-r from-red-900/20 to-transparent opacity-40 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-black/50 to-transparent cursor-pointer hover:from-black/70'}
                          backdrop-blur-sm group transition-all duration-200
                          ${isUserTeam ? 'ring-1 ring-primary/50' : ''}
                        `}
                      >
                        {/* Blocked overlay effect */}
                        {isBlockedClicked && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.5, 0] }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 bg-red-500/30 pointer-events-none"
                          />
                        )}
                        
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-md ${isBlocked ? 'bg-red-500/10' : team.bgColor} transition-colors`}>
                            {isBlocked ? (
                              <Ban className="w-6 h-6 text-red-400/60" />
                            ) : isUserTeam ? (
                              <Fingerprint className={`w-6 h-6 ${team.textColor}`} />
                            ) : (
                              <team.icon className={`w-6 h-6 ${team.textColor}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`font-bold text-sm md:text-base block ${isBlocked ? 'text-muted-foreground/50' : team.textColor}`}>
                              {team.label}
                            </span>
                            <span className={`text-[10px] md:text-xs font-mono uppercase ${isBlocked ? 'text-red-400/40' : 'text-muted-foreground/70'}`}>
                              {isUserTeam ? 'Entrar' : isBlocked ? 'Bloqueado' : team.subtitle}
                            </span>
                          </div>
                          {/* Status indicator */}
                          {isUserTeam ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : isBlocked ? (
                            <Lock className="w-4 h-4 text-red-400/50" />
                          ) : (
                            <div className={`w-2 h-2 rounded-full ${team.bgColor} animate-pulse`} />
                          )}
                        </div>

                        {/* Shimmer effect on user's team */}
                        {isUserTeam && (
                          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-sm">
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%)] bg-[length:200%_200%] animate-shimmer" />
                          </div>
                        )}
                      </motion.button>
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
                      <span className="text-xs text-primary font-mono">Autenticando...</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Admin Access - Stylized */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-6 pt-4 border-t border-primary/10"
                >
                  <button
                    onClick={() => {
                      playSound('click');
                      setShowMasterLogin(true);
                      setSelectedTeam(null);
                      setShowAuthPanel(true);
                    }}
                    className="w-full group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-dashed border-primary/20 hover:border-primary/40 transition-all duration-300 bg-gradient-to-r from-transparent via-primary/5 to-transparent">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <Crown className="w-4 h-4 text-amber-500/60 group-hover:text-amber-500 transition-colors" />
                      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                        Acesso Administrativo
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-amber-500/40 group-hover:bg-amber-500 transition-colors" />
                        <div className="w-1 h-1 rounded-full bg-amber-500/40 group-hover:bg-amber-500 transition-colors delay-75" />
                        <div className="w-1 h-1 rounded-full bg-amber-500/40 group-hover:bg-amber-500 transition-colors delay-150" />
                      </div>
                    </div>
                  </button>
                </motion.div>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative z-10 flex flex-col min-h-screen"
          >
            {/* Top Bar with Back Button */}
            <header className="py-2 px-4 border-b border-primary/20">
              <div className="container mx-auto flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAuthPanel(false)}
                  className="text-muted-foreground hover:text-foreground gap-2 px-3"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Voltar
                </Button>
                <img 
                  src={plantaoLogo} 
                  alt="PlantãoPro" 
                  className="h-10 w-auto object-contain"
                />
                <div className="w-20" /> {/* Spacer for centering */}
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-start justify-center px-4 pt-4 pb-2 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="w-full max-w-md"
              >

                <Card className={`border-primary/20 bg-card/90 backdrop-blur-md shadow-2xl shadow-primary/10 ${showMasterLogin ? 'border-amber-500/30' : ''}`}>
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
                              <IdCard className="w-3.5 h-3.5" /> CPF *
                            </Label>
                            <Input
                              id="login-cpf"
                              type="text"
                              placeholder="000.000.000-00"
                              value={loginCpf}
                              onChange={(e) => handleCpfChange(e.target.value, false)}
                              className="bg-background/50 border-border/50 h-9"
                            />
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
                                              playSound('notification');
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
                              <IdCard className="w-3.5 h-3.5" /> CPF *
                            </Label>
                            <Input
                              id="signup-cpf"
                              type="text"
                              placeholder="000.000.000-00"
                              value={signupCpf}
                              onChange={(e) => handleCpfChange(e.target.value, true)}
                              className={`bg-background/50 border-border/50 h-9 ${cpfError ? 'border-destructive' : ''}`}
                            />
                            {cpfError && (
                              <p className="text-destructive text-xs">{cpfError}</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="signup-registration" className="flex items-center gap-2 text-xs">
                              <Shield className="w-3.5 h-3.5" /> Matrícula *
                            </Label>
                            <Input
                              id="signup-registration"
                              type="text"
                              placeholder="Matrícula funcional"
                              value={signupRegistration}
                              onChange={(e) => setSignupRegistration(e.target.value)}
                              className="bg-background/50 border-border/50 h-9"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
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

                            <div className="space-y-1">
                              <Label htmlFor="signup-unit" className="flex items-center gap-2 text-xs">
                                <Building className="w-3.5 h-3.5" /> Unidade *
                              </Label>
                              <Select value={signupUnit} onValueChange={setSignupUnit}>
                                <SelectTrigger className="bg-background/50 border-border/50 h-9">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  {UNITS.map((unit) => (
                                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
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
                                  return (
                                    <>
                                      <div className={`p-1.5 rounded ${team.bgColor}`}>
                                        <team.icon className={`w-4 h-4 ${team.textColor}`} />
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
                                  {TEAMS.map((team) => (
                                    <SelectItem key={team.value} value={team.value}>
                                      <span className="flex items-center gap-2">
                                        <team.icon className={`w-4 h-4 ${team.textColor}`} />
                                        {team.label}
                                      </span>
                                    </SelectItem>
                                  ))}
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
            <footer className="py-3 text-center text-muted-foreground text-xs space-y-1">
              <p>
                © <motion.span
                  className="inline-block text-primary font-bold"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    textShadow: [
                      '0 0 5px hsl(var(--primary)/0.5)',
                      '0 0 15px hsl(var(--primary)/0.9)',
                      '0 0 5px hsl(var(--primary)/0.5)',
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >2026</motion.span> PlantãoPro v1.0 • Developed by Franc Denis
              </p>
              <button 
                onClick={() => setShowAbout(true)}
                className="hover:text-primary transition-colors underline"
              >
                Sobre o Sistema
              </button>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlantaoHome;
