import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, LogOut, Clock, Calendar, Users, DollarSign, 
  Bell, ArrowLeftRight, User, ChevronRight, AlertTriangle,
  Timer, TrendingUp, Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow, differenceInHours, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TeamSelector from '@/components/plantao/TeamSelector';
import OvertimePanel from '@/components/plantao/OvertimePanel';
import SwapPanel from '@/components/plantao/SwapPanel';
import AlertsPanel from '@/components/plantao/AlertsPanel';
import PlantaoAboutDialog from '@/components/plantao/PlantaoAboutDialog';
import TeamMembersCard from '@/components/plantao/TeamMembersCard';
import plantaoLogo from '@/assets/plantao-logo.png';

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
  
  const [nextShift, setNextShift] = useState<Shift | null>(null);
  const [overtimeSummary, setOvertimeSummary] = useState<OvertimeSummary | null>(null);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [pendingSwaps, setPendingSwaps] = useState(0);
  const [activePanel, setActivePanel] = useState<'overview' | 'team' | 'overtime' | 'swaps' | 'alerts'>('overview');
  const [countdown, setCountdown] = useState<string>('');
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    if (!isLoading && !agent) {
      navigate('/');
    }
  }, [isLoading, agent, navigate]);

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

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* About Dialog */}
      <PlantaoAboutDialog isOpen={showAbout} onClose={() => setShowAbout(false)} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={plantaoLogo} alt="PlantãoPro" className="h-10 w-auto object-contain" />
              <div>
                <h1 className="text-lg font-display tracking-wide">PLANTÃO<span className="text-primary">PRO</span></h1>
                <p className="text-xs text-muted-foreground">{agent?.unit || 'Unidade não definida'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAbout(true)}
                title="Sobre"
              >
                <Info className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setActivePanel('alerts')}
              >
                <Bell className="w-5 h-5" />
                {unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
                    {unreadAlerts}
                  </span>
                )}
              </Button>

              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* User Info Bar */}
      <div className="border-b border-border/30 bg-card/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{agent.full_name}</p>
                <p className="text-sm text-muted-foreground">Mat: {agent.registration_number || 'N/A'}</p>
              </div>
            </div>

            <Badge 
              variant="outline" 
              className={`${getTeamColor(agent.current_team)} ${agent.current_team ? 'text-white border-transparent' : ''}`}
            >
              {agent.current_team ? `Equipe ${agent.current_team.charAt(0).toUpperCase() + agent.current_team.slice(1)}` : 'Sem equipe'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activePanel === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Next Shift Card */}
            <Card className={`border-2 ${isShiftSoon ? 'border-warning/50 bg-warning/5' : 'border-primary/30'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  Próximo Plantão
                </CardTitle>
              </CardHeader>
              <CardContent>
                {nextShift ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">
                          {format(new Date(nextShift.shift_start), "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <p className="text-muted-foreground">
                          {format(new Date(nextShift.shift_start), 'EEEE', { locale: ptBR })} às{' '}
                          {format(new Date(nextShift.shift_start), 'HH:mm')}
                        </p>
                      </div>
                      <div className={`text-right ${isShiftSoon ? 'animate-countdown' : ''}`}>
                        <p className="text-sm text-muted-foreground">Contagem Regressiva</p>
                        <p className={`text-2xl font-mono font-bold ${isShiftSoon ? 'text-warning' : 'text-primary'}`}>
                          {countdown}
                        </p>
                      </div>
                    </div>

                    {isShiftSoon && (
                      <div className="flex items-center gap-2 text-warning text-sm bg-warning/10 p-3 rounded-lg">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Plantão em menos de 24 horas!</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <Timer className="w-5 h-5 mx-auto mb-1 text-primary" />
                        <p className="text-sm text-muted-foreground">Duração</p>
                        <p className="font-bold">24 horas</p>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <Calendar className="w-5 h-5 mx-auto mb-1 text-accent" />
                        <p className="text-sm text-muted-foreground">Folga até</p>
                        <p className="font-bold">
                          {format(new Date(nextShift.rest_end), 'dd/MM HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum plantão agendado</p>
                    <p className="text-sm">Entre em contato com a administração</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              {/* Overtime Card */}
              <Card 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setActivePanel('overtime')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-5 h-5 text-accent" />
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Banco de Horas</p>
                  <p className="text-xl font-bold">
                    {overtimeSummary?.total_hours.toFixed(1) || '0'}h
                  </p>
                  <p className="text-sm text-accent">
                    R$ {overtimeSummary?.total_value.toFixed(2) || '0,00'}
                  </p>
                </CardContent>
              </Card>

              {/* Swaps Card */}
              <Card 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setActivePanel('swaps')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <ArrowLeftRight className="w-5 h-5 text-primary" />
                    <div className="flex items-center gap-2">
                      {pendingSwaps > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {pendingSwaps}
                        </Badge>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Permutas</p>
                  <p className="text-xl font-bold">
                    {pendingSwaps > 0 ? `${pendingSwaps} pendente${pendingSwaps > 1 ? 's' : ''}` : 'Nenhuma'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Team Members Card */}
            <TeamMembersCard />

            {/* Team Selection */}
            <Card 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setActivePanel('team')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className={`w-6 h-6 ${getTeamTextColor(agent.current_team)}`} />
                    <div>
                      <p className="font-medium">
                        {agent.current_team 
                          ? `Gerenciar Equipe`
                          : 'Selecionar Equipe'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {agent.current_team 
                          ? `Desde ${agent.team_joined_at ? format(new Date(agent.team_joined_at), 'dd/MM/yyyy') : 'N/A'}`
                          : 'Vincule-se a uma equipe'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* Monthly Progress */}
            {overtimeSummary && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    Resumo do Mês
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Horas utilizadas</span>
                        <span className="font-medium">{overtimeSummary.total_hours.toFixed(1)}h / 70h</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min((overtimeSummary.total_hours / 70) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{overtimeSummary.total_hours.toFixed(0)}h</p>
                        <p className="text-xs text-muted-foreground">Trabalhadas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-accent">R$ {overtimeSummary.total_value.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">A receber</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-muted-foreground">{overtimeSummary.remaining_hours.toFixed(0)}h</p>
                        <p className="text-xs text-muted-foreground">Disponíveis</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {activePanel === 'team' && (
          <TeamSelector onBack={() => setActivePanel('overview')} onTeamChanged={refreshAgent} />
        )}

        {activePanel === 'overtime' && (
          <OvertimePanel onBack={() => setActivePanel('overview')} />
        )}

        {activePanel === 'swaps' && (
          <SwapPanel onBack={() => setActivePanel('overview')} />
        )}

        {activePanel === 'alerts' && (
          <AlertsPanel onBack={() => setActivePanel('overview')} />
        )}
      </main>
    </div>
  );
};

export default AgentDashboard;
