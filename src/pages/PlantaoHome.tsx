import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Lock, Phone, Mail, IdCard, Loader2, AlertCircle, Shield, MapPin, Building, Info, Users, Crown, ChevronRight, Radio, Siren, Star, Zap, Target, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import plantaoLogo from '@/assets/plantao-logo.png';
import plantaoBg from '@/assets/plantao-bg.png';
import PlantaoAboutDialog from '@/components/plantao/PlantaoAboutDialog';

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
  const { signIn, signInMaster, signUp, isLoading } = usePlantaoAuth();
  const navigate = useNavigate();
  const [showAbout, setShowAbout] = useState(false);
  const [showAuthPanel, setShowAuthPanel] = useState(false);
  const [showMasterLogin, setShowMasterLogin] = useState(false);
  
  // Login state
  const [loginCpf, setLoginCpf] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Master login state
  const [masterUsername, setMasterUsername] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [masterError, setMasterError] = useState('');
  
  // Signup state
  const [signupCpf, setSignupCpf] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupRegistration, setSignupRegistration] = useState('');
  const [signupCity, setSignupCity] = useState('');
  const [signupUnit, setSignupUnit] = useState('');
  const [signupTeam, setSignupTeam] = useState<'alfa' | 'bravo' | 'charlie' | 'delta' | ''>('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupError, setSignupError] = useState('');
  const [cpfError, setCpfError] = useState('');

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (!loginCpf || !loginPassword) {
      setLoginError('Preencha todos os campos');
      return;
    }

    if (!validateCPF(loginCpf)) {
      setLoginError('CPF inválido');
      return;
    }

    const { error } = await signIn(loginCpf, loginPassword);
    
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
      full_name: signupName,
      registration_number: signupRegistration,
      city: signupCity,
      unit: signupUnit,
      current_team: signupTeam,
      phone: signupPhone.replace(/\D/g, '') || undefined,
      email: signupEmail || undefined,
    });
    
    if (error) {
      setSignupError(error);
    } else {
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
      navigate('/dashboard');
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
                <HUDElement>Sistema</HUDElement>
                <div className="flex items-center gap-2">
                  <AlertPulse />
                  <span className="text-xs font-mono text-green-400 uppercase">Online</span>
                </div>
                <HUDElement>v1.0</HUDElement>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-6">
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative mb-6"
              >
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <img 
                  src={plantaoLogo} 
                  alt="PlantãoPro" 
                  className="relative h-24 md:h-28 w-auto object-contain drop-shadow-2xl"
                />
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-6"
              >
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-wider">
                  PLANTÃO<span className="text-primary">PRO</span>
                </h1>
                <p className="text-muted-foreground text-xs font-mono uppercase tracking-widest mt-1">
                  Gestão de Plantões • Segurança
                </p>
              </motion.div>

              {/* Teams Grid - Tactical Style */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full max-w-md mb-8"
              >
                <div className="text-center mb-3">
                  <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">
                    [ Unidades Operacionais ]
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {TEAMS.map((team, index) => (
                    <motion.div
                      key={team.value}
                      initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className={`
                        relative p-4 rounded-none border-l-4 ${team.borderColor}
                        bg-gradient-to-r from-black/40 to-transparent
                        backdrop-blur-sm cursor-default group
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${team.bgColor}`}>
                          <team.icon className={`w-5 h-5 ${team.textColor}`} />
                        </div>
                        <div>
                          <span className={`font-bold text-sm ${team.textColor} block`}>
                            {team.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono uppercase">
                            {team.subtitle}
                          </span>
                        </div>
                      </div>
                      {/* Status indicator */}
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${team.bgColor} animate-pulse`} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* CTA Button - Tactical Style */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="w-full max-w-xs"
              >
                <button
                  onClick={() => setShowAuthPanel(true)}
                  className="w-full relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary group-hover:from-primary group-hover:to-primary/80 transition-all duration-300" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:200%_200%] animate-shimmer" />
                  </div>
                  <div className="relative px-8 py-4 flex items-center justify-center gap-3 text-primary-foreground font-bold uppercase tracking-wider">
                    <Shield className="w-5 h-5" />
                    <span>Acessar Sistema</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-white/30" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-white/30" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-white/30" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-white/30" />
                </button>
              </motion.div>
            </main>

            {/* Bottom HUD Bar */}
            <footer className="py-2 px-4 border-t border-primary/20">
              <div className="container mx-auto flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                <span>© 2024 Franc Denis</span>
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
            {/* Header with Logo */}
            <header className="py-4 px-4">
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="container mx-auto flex flex-col items-center justify-center"
              >
                <img 
                  src={plantaoLogo} 
                  alt="PlantãoPro" 
                  className="h-20 md:h-24 w-auto object-contain drop-shadow-2xl"
                />
              </motion.div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-start justify-center px-4 py-2 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full max-w-md"
              >
                {/* Back Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAuthPanel(false)}
                  className="mb-3 text-muted-foreground hover:text-foreground"
                >
                  ← Voltar
                </Button>

                <Card className="border-primary/20 bg-card/90 backdrop-blur-md shadow-2xl shadow-primary/10">
                  <CardHeader className="text-center pb-3">
                    <CardTitle className="text-lg font-display tracking-wide flex items-center justify-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Acesso ao Sistema
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Gestão de Plantões - Agentes Socioeducativos
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
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
                            <Input
                              id="login-password"
                              type="password"
                              placeholder="••••••"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              className="bg-background/50 border-border/50 h-9"
                            />
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
                            onClick={() => setShowMasterLogin(!showMasterLogin)}
                          >
                            <Crown className="w-3.5 h-3.5 mr-2" />
                            {showMasterLogin ? 'Voltar ao login normal' : 'Acesso Administrador'}
                          </Button>

                          {showMasterLogin && (
                            <form onSubmit={handleMasterLogin} className="space-y-2 mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                              <div className="space-y-1">
                                <Label htmlFor="master-username" className="flex items-center gap-2 text-xs text-amber-500">
                                  <User className="w-3.5 h-3.5" /> Usuário Master
                                </Label>
                                <Input
                                  id="master-username"
                                  type="text"
                                  placeholder="Digite o usuário"
                                  value={masterUsername}
                                  onChange={(e) => setMasterUsername(e.target.value)}
                                  className="bg-background/50 border-amber-500/30 h-9"
                                />
                              </div>
                              
                              <div className="space-y-1">
                                <Label htmlFor="master-password" className="flex items-center gap-2 text-xs text-amber-500">
                                  <Lock className="w-3.5 h-3.5" /> Senha Master
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
                                className="w-full bg-amber-500 hover:bg-amber-600 text-black h-9"
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
                          )}
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
                              onChange={(e) => setSignupName(e.target.value)}
                              className="bg-background/50 border-border/50 h-9"
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

                          {/* Team Selection */}
                          <div className="space-y-1">
                            <Label htmlFor="signup-team" className="flex items-center gap-2 text-xs">
                              <Users className="w-3.5 h-3.5" /> Equipe *
                            </Label>
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
                            {!signupTeam && (
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
                            <Input
                              id="signup-password"
                              type="password"
                              placeholder="Mínimo 6 caracteres"
                              value={signupPassword}
                              onChange={(e) => setSignupPassword(e.target.value)}
                              className="bg-background/50 border-border/50 h-9"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="signup-confirm-password" className="flex items-center gap-2 text-xs">
                              <Lock className="w-3.5 h-3.5" /> Confirmar Senha *
                            </Label>
                            <Input
                              id="signup-confirm-password"
                              type="password"
                              placeholder="Repita a senha"
                              value={signupConfirmPassword}
                              onChange={(e) => setSignupConfirmPassword(e.target.value)}
                              className="bg-background/50 border-border/50 h-9"
                            />
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
                  </CardContent>
                </Card>
              </motion.div>
            </main>

            {/* Footer */}
            <footer className="py-3 text-center text-muted-foreground text-xs space-y-1">
              <p>PlantãoPro v1.0 • Developed by Franc Denis</p>
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
