import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Lock, Phone, Mail, IdCard, Loader2, AlertCircle, Shield, Volume2, VolumeX, MapPin, Building, Info } from 'lucide-react';
import { motion } from 'framer-motion';
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

// Validação de CPF usando algoritmo oficial
const validateCPF = (cpf: string): boolean => {
  const cleanCpf = cpf.replace(/\D/g, '');
  
  if (cleanCpf.length !== 11) return false;
  
  // Check for known invalid CPFs
  if (/^(\d)\1+$/.test(cleanCpf)) return false;
  
  // Validate first digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.charAt(9))) return false;
  
  // Validate second digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.charAt(10))) return false;
  
  return true;
};

// Lista de unidades socioeducativas
const UNITS = [
  'CASE Feijó',
  'CASE Rio Branco',
  'CSE Feijó',
  'CSE Rio Branco',
  'ISE Feijó',
  'ISE Rio Branco',
];

// Lista de cidades
const CITIES = [
  'Feijó',
  'Rio Branco',
  'Cruzeiro do Sul',
  'Tarauacá',
  'Sena Madureira',
];

const PlantaoHome = () => {
  const { signIn, signUp, isLoading } = usePlantaoAuth();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  
  // Login state
  const [loginCpf, setLoginCpf] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Signup state
  const [signupCpf, setSignupCpf] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupRegistration, setSignupRegistration] = useState('');
  const [signupCity, setSignupCity] = useState('');
  const [signupUnit, setSignupUnit] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupError, setSignupError] = useState('');
  const [cpfError, setCpfError] = useState('');

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  const handleCpfChange = (value: string, isSignup: boolean) => {
    const formatted = formatCPF(value);
    if (isSignup) {
      setSignupCpf(formatted);
      // Validate when complete
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
    
    // Validate required fields
    if (!signupCpf || !signupPassword || !signupName || !signupRegistration || !signupCity || !signupUnit) {
      setSignupError('Preencha todos os campos obrigatórios');
      return;
    }

    // Validate CPF
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

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Audio */}
      <audio ref={audioRef} loop>
        <source src="/audio/cidade-vigilancia.mp3" type="audio/mpeg" />
      </audio>

      {/* About Dialog */}
      <PlantaoAboutDialog isOpen={showAbout} onClose={() => setShowAbout(false)} />

      {/* Music Toggle Button */}
      <button
        onClick={toggleMusic}
        className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-primary/80 hover:bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:scale-110"
        title={isMusicPlaying ? 'Pausar música' : 'Tocar música'}
      >
        {isMusicPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </button>

      {/* About Button */}
      <button
        onClick={() => setShowAbout(true)}
        className="fixed bottom-4 left-4 z-50 p-3 rounded-full bg-muted/80 hover:bg-muted text-foreground shadow-lg transition-all duration-300 hover:scale-110"
        title="Sobre o sistema"
      >
        <Info className="w-5 h-5" />
      </button>

      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${plantaoBg})` }}
      />
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header with Logo */}
        <header className="py-6 px-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="container mx-auto flex flex-col items-center justify-center"
          >
            <img 
              src={plantaoLogo} 
              alt="PlantãoPro" 
              className="h-28 md:h-36 w-auto object-contain drop-shadow-2xl"
            />
          </motion.div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md"
          >
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
      </div>
    </div>
  );
};

export default PlantaoHome;
