import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  LogIn, Search, Calendar, User, Clock, 
  RefreshCw, Smartphone, Monitor, Activity
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface AppUsageLog {
  id: string;
  agent_id: string | null;
  action_type: string;
  action_details: Record<string, unknown> | null;
  device_info: string | null;
  ip_address: string | null;
  created_at: string;
  agent?: { full_name: string } | null;
}

interface AgentPresence {
  agent_id: string;
  last_seen: string | null;
  is_online: boolean | null;
  device_info: string | null;
  agent?: { full_name: string; current_team: string | null };
}

const AccessLogsPanel = () => {
  const [logs, setLogs] = useState<AppUsageLog[]>([]);
  const [presenceData, setPresenceData] = useState<AgentPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const loadData = async () => {
    setLoading(true);
    try {
      // Calcular data inicial baseado no período
      let startDate = new Date();
      if (period === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        startDate = subDays(new Date(), 7);
      } else {
        startDate = subDays(new Date(), 30);
      }

      // Buscar logs de uso do app
      const { data: logsData, error: logsError } = await supabase
        .from('app_usage_logs')
        .select('*, agent:agents!app_usage_logs_agent_id_fkey(full_name)')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      if (logsError) throw logsError;

      // Buscar dados de presença online
      const { data: presence, error: presenceError } = await supabase
        .from('agent_presence')
        .select('*, agent:agents!agent_presence_agent_id_fkey(full_name, current_team)');

      if (presenceError) throw presenceError;

      setLogs((logsData || []) as AppUsageLog[]);
      setPresenceData((presence || []) as AgentPresence[]);
    } catch (error) {
      console.error('Error loading access logs:', error);
      toast.error('Erro ao carregar logs de acesso');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      'login': { label: 'Login', color: 'bg-green-500' },
      'logout': { label: 'Logout', color: 'bg-gray-500' },
      'view_shift': { label: 'Visualizou Plantão', color: 'bg-blue-500' },
      'register_overtime': { label: 'Registrou BH', color: 'bg-amber-500' },
      'send_message': { label: 'Enviou Mensagem', color: 'bg-purple-500' },
      'update_profile': { label: 'Atualizou Perfil', color: 'bg-cyan-500' },
      'request_swap': { label: 'Solicitou Permuta', color: 'bg-pink-500' },
      'payment_sent': { label: 'Enviou Pagamento', color: 'bg-emerald-500' },
    };
    return labels[actionType] || { label: actionType, color: 'bg-muted' };
  };

  const getDeviceIcon = (deviceInfo: string | null) => {
    if (!deviceInfo) return <Monitor className="w-4 h-4" />;
    const info = deviceInfo.toLowerCase();
    if (info.includes('mobile') || info.includes('android') || info.includes('iphone')) {
      return <Smartphone className="w-4 h-4" />;
    }
    return <Monitor className="w-4 h-4" />;
  };

  const filteredLogs = logs.filter(log => 
    log.agent?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onlineAgents = presenceData.filter(p => p.is_online);
  const recentLogins = logs.filter(l => l.action_type === 'login').length;

  const getTeamColor = (team: string | null) => {
    switch (team) {
      case 'alfa': return 'bg-team-alfa';
      case 'bravo': return 'bg-team-bravo';
      case 'charlie': return 'bg-team-charlie';
      case 'delta': return 'bg-team-delta';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-500">{onlineAgents.length}</p>
                <p className="text-xs text-muted-foreground">Online Agora</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <LogIn className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-500">{recentLogins}</p>
                <p className="text-xs text-muted-foreground">Logins no Período</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-purple-500">{logs.length}</p>
                <p className="text-xs text-muted-foreground">Ações Registradas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-amber-500">{presenceData.length}</p>
                <p className="text-xs text-muted-foreground">Usuários Únicos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Online Users */}
      {onlineAgents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Activity className="w-5 h-5 text-green-500" />
              Usuários Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {onlineAgents.map(presence => (
                <motion.div
                  key={presence.agent_id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/40 rounded-full"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-semibold">{presence.agent?.full_name || 'Agente'}</span>
                  {presence.agent?.current_team && (
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${getTeamColor(presence.agent.current_team)} text-white`}>
                      {presence.agent.current_team.toUpperCase()}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <LogIn className="w-5 h-5 text-primary" />
              Registro de Acessos
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {(['today', 'week', 'month'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 text-xs font-medium transition-all ${
                      period === p 
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted'
                    }`}
                  >
                    {p === 'today' ? 'Hoje' : p === 'week' ? '7 Dias' : '30 Dias'}
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="icon" onClick={loadData}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              Nenhum registro de acesso encontrado
            </p>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredLogs.map(log => {
                  const actionInfo = getActionLabel(log.action_type);
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-card border border-border/50 rounded-lg hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${actionInfo.color}`} />
                        <div>
                          <p className="font-semibold text-sm">
                            {log.agent?.full_name || 'Sistema'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {actionInfo.label}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        {getDeviceIcon(log.device_info)}
                        <span className="text-xs font-medium">
                          {format(parseISO(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessLogsPanel;
