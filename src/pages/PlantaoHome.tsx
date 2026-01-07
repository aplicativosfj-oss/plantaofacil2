import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock, Phone, Mail, IdCard, Loader2, AlertCircle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import plantaoLogo from '@/assets/plantao-logo.png';
import plantaoBg from '@/assets/plantao-bg.png';

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

const PlantaoHome = () => {
  const { signIn, signUp, isLoading } = usePlantaoAuth();
  const navigate = useNavigate();
  
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
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupError, setSignupError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (!loginCpf || !loginPassword) {
      setLoginError('Preencha todos os campos');
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
    
    if (!signupCpf || !signupPassword || !signupName) {
      setSignupError('Preencha os campos obrigatórios');
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
      registration_number: signupRegistration || undefined,
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
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${plantaoBg})` }}
      />
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header with Logo */}
        <header className="py-8 px-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="container mx-auto flex flex-col items-center justify-center"
          >
            <img 
              src={plantaoLogo} 
              alt="PlantãoPro" 
              className="h-32 md:h-40 w-auto object-contain drop-shadow-2xl"
            />
          </motion.div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <Card className="border-primary/20 bg-card/90 backdrop-blur-md shadow-2xl shadow-primary/10">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-display tracking-wide flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Acesso ao Sistema
                </CardTitle>
                <CardDescription className="text-xs">
                  Gestão de Plantões - Agentes Socioeducativos
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="login">Entrar</TabsTrigger>
                    <TabsTrigger value="signup">Cadastrar</TabsTrigger>
                  </TabsList>
                  
                  {/* Login Tab */}
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="login-cpf" className="flex items-center gap-2 text-sm">
                          <IdCard className="w-4 h-4" /> CPF
                        </Label>
                        <Input
                          id="login-cpf"
                          type="text"
                          placeholder="000.000.000-00"
                          value={loginCpf}
                          onChange={(e) => setLoginCpf(formatCPF(e.target.value))}
                          className="bg-background/50 border-border/50"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label htmlFor="login-password" className="flex items-center gap-2 text-sm">
                          <Lock className="w-4 h-4" /> Senha
                        </Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="bg-background/50 border-border/50"
                        />
                      </div>

                      {loginError && (
                        <div className="flex items-center gap-2 text-destructive text-sm">
                          <AlertCircle className="w-4 h-4" />
                          {loginError}
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
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
                    <form onSubmit={handleSignup} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-name" className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4" /> Nome Completo *
                        </Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Seu nome completo"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          className="bg-background/50 border-border/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="signup-cpf" className="flex items-center gap-2 text-sm">
                          <IdCard className="w-4 h-4" /> CPF *
                        </Label>
                        <Input
                          id="signup-cpf"
                          type="text"
                          placeholder="000.000.000-00"
                          value={signupCpf}
                          onChange={(e) => setSignupCpf(formatCPF(e.target.value))}
                          className="bg-background/50 border-border/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="signup-registration" className="flex items-center gap-2 text-sm">
                          <Shield className="w-4 h-4" /> Matrícula
                        </Label>
                        <Input
                          id="signup-registration"
                          type="text"
                          placeholder="Matrícula funcional"
                          value={signupRegistration}
                          onChange={(e) => setSignupRegistration(e.target.value)}
                          className="bg-background/50 border-border/50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="signup-phone" className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4" /> Telefone
                          </Label>
                          <Input
                            id="signup-phone"
                            type="tel"
                            placeholder="(00) 00000-0000"
                            value={signupPhone}
                            onChange={(e) => setSignupPhone(formatPhone(e.target.value))}
                            className="bg-background/50 border-border/50"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="signup-email" className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4" /> Email
                          </Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="seu@email.com"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            className="bg-background/50 border-border/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="signup-password" className="flex items-center gap-2 text-sm">
                          <Lock className="w-4 h-4" /> Senha *
                        </Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="bg-background/50 border-border/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="signup-confirm-password" className="flex items-center gap-2 text-sm">
                          <Lock className="w-4 h-4" /> Confirmar Senha *
                        </Label>
                        <Input
                          id="signup-confirm-password"
                          type="password"
                          placeholder="Repita a senha"
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          className="bg-background/50 border-border/50"
                        />
                      </div>

                      {signupError && (
                        <div className="flex items-center gap-2 text-destructive text-sm">
                          <AlertCircle className="w-4 h-4" />
                          {signupError}
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Criar Conta
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
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
        <footer className="py-4 text-center text-muted-foreground text-xs">
          <p>Unidade de Feijó/AC • PlantãoPro v1.0</p>
        </footer>
      </div>
    </div>
  );
};

export default PlantaoHome;
