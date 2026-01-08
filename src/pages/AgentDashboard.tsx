import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, LogOut, Clock, Calendar, Users, DollarSign, 
  Bell, ArrowLeftRight, User, ChevronRight, AlertTriangle,
  Timer, TrendingUp, Info, MessageCircle, ArrowLeft,
  Radio, Siren, Target, Crosshair, FileText, Briefcase,
  Banknote, Repeat, CalendarDays, Building
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TeamSelector from '@/components/plantao/TeamSelector';
import OvertimePanel from '@/components/plantao/OvertimePanel';
import SwapPanel from '@/components/plantao/SwapPanel';
import AlertsPanel from '@/components/plantao/AlertsPanel';
import PlantaoAboutDialog from '@/components/plantao/PlantaoAboutDialog';
import TeamMembersCard from '@/components/plantao/TeamMembersCard';
import WelcomeDialog from '@/components/plantao/WelcomeDialog';
import ChangePasswordDialog from '@/components/plantao/ChangePasswordDialog';
import AgentProfileDialog from '@/components/plantao/AgentProfileDialog';
import TeamChat from '@/components/plantao/TeamChat';
import GlobalChat from '@/components/plantao/GlobalChat';
import ShiftCalendar from '@/components/plantao/ShiftCalendar';
import FirstShiftSetup from '@/components/plantao/FirstShiftSetup';
import ShiftDayCard from '@/components/plantao/ShiftDayCard';
import MonitoringRotation from '@/components/plantao/MonitoringRotation';
import OnlineIndicator from '@/components/plantao/OnlineIndicator';
import LicenseCounter from '@/components/plantao/LicenseCounter';
import LicenseExpiredOverlay from '@/components/plantao/LicenseExpiredOverlay';
import LicenseExpiryAlert from '@/components/plantao/LicenseExpiryAlert';
import TeamBanner from '@/components/plantao/TeamBanner';
import SoundButton from '@/components/plantao/SoundButton';
import UnitTransferPanel from '@/components/plantao/UnitTransferPanel';
import TeamShiftsPanel from '@/components/plantao/TeamShiftsPanel';
import useClickSound from '@/hooks/useClickSound';
import { useOvertimeAlerts } from '@/hooks/useOvertimeAlerts';
import plantaoLogo from '@/assets/plantao-pro-logo-new.png';

interface Shift {
  id: string;
  shift_start: string;
  shift_end: string;
  rest_end: string;
  is_completed: boolean;
}

interface OvertimeSummary {
  total_hours: number;
  total_value: number;
  remaining_hours: number;
}

const getTeamColor = (team: string | null) => {
  switch (team) {
    case 'alfa': return 'bg-team-alfa';
    case 'bravo': return 'bg-team-bravo';
    case 'charlie': return 'bg-team-charlie';
    case 'delta': return 'bg-team-delta';
    default: return 'bg-muted';
  }
};

const getTeamTextColor = (team: string | null) => {
  switch (team) {
    case 'alfa': return 'text-team-alfa';
    case 'bravo': return 'text-team-bravo';
    case 'charlie': return 'text-team-charlie';
    case 'delta': return 'text-team-delta';
    default: return 'text-muted-foreground';
  }
};

const AgentDashboard = () => {
  const { agent, signOut, isLoading, refreshAgent } = usePlantaoAuth();
  const navigate = useNavigate();
  const { playClick } = useClickSound();
  
  // Initialize overtime alerts hook
  useOvertimeAlerts(agent?.id);
  
  const [nextShift, setNextShift] = useState<Shift | null>(null);
  const [overtimeSummary, setOvertimeSummary] = useState<OvertimeSummary | null>(null);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [pendingSwaps, setPendingSwaps] = useState(0);
  const [activePanel, setActivePanel] = useState<'overview' | 'team' | 'overtime' | 'swaps' | 'alerts' | 'calendar' | 'monitoring' | 'unit' | 'team-shifts'>('overview');
  const [countdown, setCountdown] = useState<string>('');
  const [showAbout, setShowAbout] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showGlobalChat, setShowGlobalChat] = useState(false);
  const [hasShiftSchedule, setHasShiftSchedule] = useState<boolean | null>(null);
  const [isLicenseExpired, setIsLicenseExpired] = useState(false);

  // Helper to handle panel change with sound
  const handlePanelChange = (panel: typeof activePanel) => {
    playClick();
    setActivePanel(panel);
  };

  // Show welcome only once every 24 hours
  useEffect(() => {
    if (agent) {
      const now = Date.now();
      const lastWelcomeTimestamp = localStorage.getItem('plantao_welcome_timestamp');
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      // Check if 24 hours have passed since last welcome
      if (!lastWelcomeTimestamp || (now - parseInt(lastWelcomeTimestamp, 10)) >= TWENTY_FOUR_HOURS) {
        setShowWelcome(true);
        localStorage.setItem('plantao_welcome_timestamp', now.toString());
      }
    }
  }, [agent]);

  useEffect(() => {
    if (!isLoading && !agent) {
      navigate('/');
    }
  }, [isLoading, agent, navigate]);

  // Check if agent has shift schedule
  useEffect(() => {
    if (!agent?.id) return;

    const checkShiftSchedule = async () => {
      const { data } = await supabase
        .from('shift_schedules')
        .select('id')
        .eq('agent_id', agent.id)
        .single();

      setHasShiftSchedule(!!data);
    };

    checkShiftSchedule();
  }, [agent?.id]);

  // Fetch next shift
  useEffect(() => {
    if (!agent?.id) return;

    const fetchNextShift = async () => {
      const { data } = await supabase
        .from('shifts')
        .select('*')
        .eq('agent_id', agent.id)
        .gte('shift_start', new Date().toISOString())
        .order('shift_start', { ascending: true })
        .limit(1)
        .single();

      if (data) {
        setNextShift(data);
      }
    };

    fetchNextShift();
  }, [agent?.id]);

  // Countdown timer
  useEffect(() => {
    if (!nextShift?.shift_start) return;

    const updateCountdown = () => {
      const now = new Date();
      const shiftStart = new Date(nextShift.shift_start);
      const diff = shiftStart.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('EM ANDAMENTO');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nextShift?.shift_start]);

  // Fetch overtime summary
  useEffect(() => {
    if (!agent?.id) return;

    const fetchOvertimeSummary = async () => {
      const monthYear = format(new Date(), 'yyyy-MM');
      const { data } = await supabase.rpc('get_monthly_overtime', {
        p_agent_id: agent.id,
        p_month_year: monthYear,
      });

      if (data && data.length > 0) {
        setOvertimeSummary(data[0]);
      }
    };

    fetchOvertimeSummary();
  }, [agent?.id]);

  // Fetch unread alerts count
  useEffect(() => {
    if (!agent?.id) return;

    const fetchAlerts = async () => {
      const { count } = await supabase
        .from('agent_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
        .eq('is_read', false);

      setUnreadAlerts(count || 0);
    };

    fetchAlerts();

    // Subscribe to new alerts
    const channel = supabase
      .channel('agent-alerts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_alerts',
        filter: `agent_id=eq.${agent.id}`,
      }, fetchAlerts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agent?.id]);

  // Fetch pending swaps count
  useEffect(() => {
    if (!agent?.id) return;

    const fetchPendingSwaps = async () => {
      const { count } = await supabase
        .from('shift_swaps')
        .select('*', { count: 'exact', head: true })
        .eq('requested_id', agent.id)
        .eq('status', 'pending');

      setPendingSwaps(count || 0);
    };

    fetchPendingSwaps();
  }, [agent?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading || !agent) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isShiftSoon = nextShift && differenceInHours(new Date(nextShift.shift_start), new Date()) < 24;

  // Handle license expiration
  if (isLicenseExpired) {
    return <LicenseExpiredOverlay onLogout={handleSignOut} />;
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* License Expiry Alert (shows when license is about to expire) */}
      <LicenseExpiryAlert />
      
      {/* Dialogs */}
      <PlantaoAboutDialog isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <WelcomeDialog 
        isOpen={showWelcome} 
        onClose={() => setShowWelcome(false)} 
        agentName={agent.full_name}
        isFirstLogin={agent.is_first_login}
        onChangePassword={() => {
          setShowWelcome(false);
          setShowChangePassword(true);
        }}
      />
      <ChangePasswordDialog 
        isOpen={showChangePassword} 
        onClose={() => setShowChangePassword(false)}
        onSuccess={async () => {
          await supabase.from('agents').update({ is_first_login: false }).eq('id', agent.id);
          refreshAgent();
        }}
      />
      <AgentProfileDialog 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)}
        onChangePassword={() => {
          setShowProfile(false);
          setShowChangePassword(true);
        }}
      />
      <TeamChat isOpen={showChat} onClose={() => setShowChat(false)} />
      <GlobalChat isOpen={showGlobalChat} onClose={() => setShowGlobalChat(false)} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-2 sm:px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activePanel === 'overview' && (
                <SoundButton
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/')}
                  className="h-7 w-7"
                  title="Voltar para Início"
                >
                  <ArrowLeft className="w-4 h-4" />
                </SoundButton>
              )}
              <img src={plantaoLogo} alt="PlantãoPro" className="h-8 w-auto object-contain" />
              <div className="hidden sm:block">
                <h1 className="text-sm font-display tracking-wide">PLANTÃO<span className="text-primary">PRO</span></h1>
                <p className="text-[10px] text-muted-foreground">{agent?.unit || 'Unidade'}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <SoundButton
                variant="ghost"
                size="icon"
                onClick={() => setShowGlobalChat(true)}
                className="h-7 w-7"
              >
                <MessageCircle className="w-4 h-4" />
              </SoundButton>
              <OnlineIndicator compact />
              <SoundButton
                variant="ghost"
                size="icon"
                onClick={() => setShowAbout(true)}
                className="h-7 w-7"
                title="Sobre"
              >
                <Info className="w-4 h-4" />
              </SoundButton>

              <SoundButton
                variant="ghost"
                size="icon"
                className="relative h-7 w-7"
                onClick={() => handlePanelChange('alerts')}
              >
                <Bell className="w-4 h-4" />
                {unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white text-[10px] rounded-full flex items-center justify-center">
                    {unreadAlerts}
                  </span>
                )}
              </SoundButton>

              <SoundButton variant="ghost" size="icon" className="h-7 w-7" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </SoundButton>
              <LicenseCounter onExpired={() => setIsLicenseExpired(true)} />
            </div>
          </div>
        </div>
      </header>

      {/* User Info Bar */}
      <div className="border-b border-border/30 bg-card/50">
        <div className="container mx-auto px-2 sm:px-4 py-2">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => {
                playClick();
                setShowProfile(true);
              }}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/30"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {agent.avatar_url ? (
                  <img src={agent.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">{agent.full_name}</p>
                <p className="text-[10px] text-muted-foreground">Mat: {agent.registration_number || 'N/A'}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-primary ml-1" />
            </button>

            <div className="flex items-center gap-1">
              <SoundButton
                variant="ghost"
                size="icon"
                onClick={() => setShowChat(true)}
                className="relative h-7 w-7"
                title="Chat da Equipe"
              >
                <MessageCircle className="w-4 h-4" />
              </SoundButton>
              <Badge 
                variant="outline" 
                className={`${getTeamColor(agent.current_team)} ${agent.current_team ? 'text-white border-transparent' : ''} text-[10px] px-1.5 py-0.5`}
              >
                {agent.current_team ? agent.current_team.charAt(0).toUpperCase() + agent.current_team.slice(1) : 'N/A'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 lg:px-6 py-2 max-w-3xl pb-6">
        {activePanel === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Team Banner */}
            <TeamBanner />

            {/* Today's Shift Card */}
            <ShiftDayCard />

            {/* Next Shift Card - Compact */}
            <Card className={`border ${isShiftSoon ? 'border-warning/50 bg-warning/5' : 'border-primary/20'}`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Próximo Plantão</span>
                </div>
                {nextShift ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold">
                          {format(new Date(nextShift.shift_start), "dd/MM", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {format(new Date(nextShift.shift_start), 'EEEE', { locale: ptBR })} • {format(new Date(nextShift.shift_start), 'HH:mm')}
                        </p>
                      </div>
                      <div className={`text-right ${isShiftSoon ? 'animate-pulse' : ''}`}>
                        <p className={`text-lg font-mono font-bold ${isShiftSoon ? 'text-warning' : 'text-primary'}`}>
                          {countdown}
                        </p>
                        <p className="text-[10px] text-muted-foreground">restantes</p>
                      </div>
                    </div>

                    {isShiftSoon && (
                      <div className="flex items-center gap-1.5 text-warning text-xs bg-warning/10 px-2 py-1.5 rounded">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Menos de 24h!</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-muted/30 rounded">
                        <p className="text-[10px] text-muted-foreground">Duração</p>
                        <p className="text-sm font-semibold">24h</p>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded">
                        <p className="text-[10px] text-muted-foreground">Folga até</p>
                        <p className="text-sm font-semibold">
                          {format(new Date(nextShift.rest_end), 'dd/MM')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="flex items-center gap-3 p-2 bg-muted/20 rounded cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => handlePanelChange('calendar')}
                  >
                    <Calendar className="w-8 h-8 text-muted-foreground/50" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Configure seu plantão</p>
                      <p className="text-xs text-muted-foreground">Toque para acessar o calendário</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions - Enhanced Grid with unique effects */}
            <div className="grid grid-cols-4 gap-2">
              {/* Calendário - Azul pulsante */}
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card 
                  className="cursor-pointer border-primary/30 hover:border-primary/60 transition-all bg-gradient-to-br from-primary/10 to-transparent relative overflow-hidden group"
                  onClick={() => handlePanelChange('calendar')}
                >
                  <motion.div
                    className="absolute inset-0 bg-primary/5"
                    animate={{ opacity: [0, 0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <CardContent className="p-2.5 text-center relative">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <CalendarDays className="w-5 h-5 mx-auto text-primary mb-1" />
                    </motion.div>
                    <p className="text-[10px] font-semibold">Calendário</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Rondas - Verde com efeito radar */}
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card 
                  className="cursor-pointer border-accent/30 hover:border-accent/60 transition-all bg-gradient-to-br from-accent/10 to-transparent relative overflow-hidden group"
                  onClick={() => handlePanelChange('monitoring')}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.2) 0%, transparent 70%)' }}
                    animate={{ scale: [0.5, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <CardContent className="p-2.5 text-center relative">
                    <Crosshair className="w-5 h-5 mx-auto text-accent mb-1" />
                    <p className="text-[10px] font-semibold">Rondas</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Permutas - Laranja com efeito de troca */}
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card 
                  className="cursor-pointer border-orange-500/30 hover:border-orange-500/60 transition-all bg-gradient-to-br from-orange-500/10 to-transparent relative overflow-hidden"
                  onClick={() => handlePanelChange('swaps')}
                >
                  <CardContent className="p-2.5 text-center relative">
                    <motion.div
                      animate={{ x: [-2, 2, -2] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Repeat className="w-5 h-5 mx-auto text-orange-400 mb-1" />
                    </motion.div>
                    <p className="text-[10px] font-semibold">Permutas</p>
                    {pendingSwaps > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white text-[10px] rounded-full flex items-center justify-center"
                      >
                        {pendingSwaps}
                      </motion.span>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Banco de Horas - Amarelo com efeito de moeda */}
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card 
                  className="cursor-pointer border-yellow-500/30 hover:border-yellow-500/60 transition-all bg-gradient-to-br from-yellow-500/10 to-transparent relative overflow-hidden"
                  onClick={() => handlePanelChange('overtime')}
                >
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-full bg-gradient-to-b from-yellow-500/10 to-transparent"
                    animate={{ y: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                  <CardContent className="p-2.5 text-center relative">
                    <motion.div
                      animate={{ rotateY: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                    >
                      <Banknote className="w-5 h-5 mx-auto text-yellow-400 mb-1" />
                    </motion.div>
                    <p className="text-[10px] font-semibold">B. Horas</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Stats Summary - Enhanced with glow effects */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-border/30 bg-gradient-to-br from-card to-card/50 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
                <CardContent className="p-3 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Resumo Mensal
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 capitalize">
                      {format(new Date(), "MMM/yy", { locale: ptBR })}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="text-center p-2.5 bg-primary/10 rounded-lg border border-primary/20 relative overflow-hidden"
                    >
                      <motion.div
                        className="absolute inset-0 bg-primary/10"
                        animate={{ opacity: [0, 0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <p className="text-lg font-bold text-primary relative">
                        {overtimeSummary?.total_hours.toFixed(0) || '0'}h
                      </p>
                      <p className="text-[10px] text-muted-foreground">Horas</p>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="text-center p-2.5 bg-accent/10 rounded-lg border border-accent/20 relative overflow-hidden"
                    >
                      <motion.div
                        className="absolute inset-0 bg-accent/10"
                        animate={{ opacity: [0, 0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      />
                      <p className="text-lg font-bold text-accent relative">
                        R${overtimeSummary?.total_value.toFixed(0) || '0'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Valor</p>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="text-center p-2.5 bg-muted/30 rounded-lg border border-border/30"
                    >
                      <p className="text-lg font-bold text-muted-foreground">
                        {overtimeSummary?.remaining_hours.toFixed(0) || '70'}h
                      </p>
                      <p className="text-[10px] text-muted-foreground">Disponível</p>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Team Management - Compact */}
            <Card 
              className={`cursor-pointer transition-colors ${
                agent.current_team 
                  ? 'border-border/50 hover:border-primary/50'
                  : 'border-warning/50'
              }`}
              onClick={() => handlePanelChange('team')}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${agent.current_team ? getTeamColor(agent.current_team) : 'bg-warning/20'}`}>
                      {agent.current_team ? (
                        <Users className="w-4 h-4 text-white" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {agent.current_team 
                          ? `Equipe ${agent.current_team.charAt(0).toUpperCase() + agent.current_team.slice(1)}`
                          : 'Selecionar Equipe'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {agent.current_team ? 'Gerenciar equipe' : 'Vincule-se a uma equipe'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* Unit Management - Compact */}
            <Card 
              className="cursor-pointer transition-colors border-border/50 hover:border-amber-500/50"
              onClick={() => handlePanelChange('unit')}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-amber-500/20">
                      <Building className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {agent.unit || 'Unidade'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Transferência e matrícula
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* Team Shifts - Escala da Equipe */}
            {agent.current_team && (
              <Card 
                className="cursor-pointer transition-colors border-border/50 hover:border-cyan-500/50"
                onClick={() => handlePanelChange('team-shifts')}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-cyan-500/20">
                        <Calendar className="w-4 h-4 text-cyan-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Escala da Equipe</p>
                        <p className="text-[10px] text-muted-foreground">
                          Plantões e folgas do time
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Team Members Card */}
            <TeamMembersCard />
          </motion.div>
        )}

        {activePanel === 'team' && (
          <TeamSelector onBack={() => handlePanelChange('overview')} onTeamChanged={refreshAgent} />
        )}

        {activePanel === 'overtime' && (
          <OvertimePanel onBack={() => handlePanelChange('overview')} />
        )}

        {activePanel === 'swaps' && agent && (
          <SwapPanel 
            onBack={() => handlePanelChange('overview')} 
            agentId={agent.id} 
            agentTeam={agent.current_team} 
          />
        )}

        {activePanel === 'alerts' && (
          <AlertsPanel onBack={() => handlePanelChange('overview')} />
        )}

        {activePanel === 'calendar' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <SoundButton variant="ghost" size="icon" onClick={() => handlePanelChange('overview')}>
                <ArrowLeft className="w-4 h-4" />
              </SoundButton>
              <h2 className="text-xl font-bold">Calendário de Plantões</h2>
            </div>

            {hasShiftSchedule === false ? (
              <FirstShiftSetup onComplete={() => setHasShiftSchedule(true)} />
            ) : (
              <ShiftCalendar />
            )}
          </motion.div>
        )}

        {activePanel === 'monitoring' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <SoundButton variant="ghost" size="icon" onClick={() => handlePanelChange('overview')}>
                <ArrowLeft className="w-4 h-4" />
              </SoundButton>
              <h2 className="text-xl font-bold">Divisão de Monitoramento</h2>
            </div>

            <MonitoringRotation />
          </motion.div>
        )}

        {activePanel === 'unit' && (
          <UnitTransferPanel 
            onBack={() => handlePanelChange('overview')} 
            onAccountDeleted={() => {
              signOut();
              navigate('/');
            }}
          />
        )}

        {activePanel === 'team-shifts' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <SoundButton variant="ghost" size="icon" onClick={() => handlePanelChange('overview')}>
                <ArrowLeft className="w-4 h-4" />
              </SoundButton>
              <h2 className="text-xl font-bold">Escala da Equipe</h2>
            </div>

            <TeamShiftsPanel />
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default AgentDashboard;
