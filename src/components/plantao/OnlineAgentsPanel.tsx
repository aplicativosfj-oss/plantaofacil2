import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Clock, User, Calendar, Timer } from 'lucide-react';
import { format, parseISO, differenceInMinutes, differenceInHours, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentPresence {
  id: string;
  agent_id: string;
  is_online: boolean;
  last_seen: string;
  device_info: string | null;
  agent: {
    full_name: string;
    current_team: string | null;
    avatar_url: string | null;
  };
}

const getTeamColor = (team: string | null) => {
  switch (team) {
    case 'alfa': return 'bg-team-alfa text-white';
    case 'bravo': return 'bg-team-bravo text-white';
    case 'charlie': return 'bg-team-charlie text-white';
    case 'delta': return 'bg-team-delta text-white';
    default: return 'bg-muted';
  }
};

const formatTimeAgo = (dateStr: string) => {
  const date = parseISO(dateStr);
  const now = new Date();
  const diffMinutes = differenceInMinutes(now, date);
  const diffHours = differenceInHours(now, date);
  
  if (diffMinutes < 1) return 'Agora';
  if (diffMinutes < 60) return `${diffMinutes}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  return format(date, "dd/MM 'às' HH:mm", { locale: ptBR });
};

const formatSessionDuration = (dateStr: string) => {
  const date = parseISO(dateStr);
  const now = new Date();
  const diffMinutes = differenceInMinutes(now, date);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
};

const formatDateGroup = (dateStr: string) => {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Hoje';
  if (isYesterday(date)) return 'Ontem';
  return format(date, "dd 'de' MMMM", { locale: ptBR });
};

const OnlineAgentsPanel = () => {
  const [presences, setPresences] = useState<AgentPresence[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPresences = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_presence')
        .select(`
          *,
          agent:agents!agent_presence_agent_id_fkey(full_name, current_team, avatar_url)
        `)
        .order('last_seen', { ascending: false });

      if (error) throw error;
      setPresences((data || []) as AgentPresence[]);
    } catch (error) {
      console.error('Error loading presences:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPresences();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadPresences, 30000);
    
    // Realtime subscription
    const channel = supabase
      .channel('agent_presence_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'agent_presence' },
        () => loadPresences()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Considerar online se last_seen < 5 minutos
  const isAgentOnline = (lastSeen: string) => {
    const date = parseISO(lastSeen);
    const diffMinutes = differenceInMinutes(new Date(), date);
    return diffMinutes < 5;
  };

  const onlineAgents = presences.filter(p => isAgentOnline(p.last_seen));
  const offlineAgents = presences.filter(p => !isAgentOnline(p.last_seen));

  // Agrupar por data
  const groupByDate = (agents: AgentPresence[]) => {
    const groups: Record<string, AgentPresence[]> = {};
    agents.forEach(agent => {
      const dateKey = format(parseISO(agent.last_seen), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(agent);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 px-3 pt-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-green-500" />
            Status Agentes
          </div>
          <Badge variant="outline" className="gap-1 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {onlineAgents.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <ScrollArea className="h-[280px] pr-2">
          {/* Agentes Online */}
          {onlineAgents.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-green-500">Online ({onlineAgents.length})</span>
              </div>
              <div className="space-y-1.5">
                <AnimatePresence>
                  {onlineAgents.map((presence) => (
                    <motion.div
                      key={presence.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center justify-between p-2 bg-green-500/10 border border-green-500/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center overflow-hidden">
                            {presence.agent?.avatar_url ? (
                              <img src={presence.agent.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                        </div>
                        <div>
                          <p className="font-medium text-xs">{presence.agent?.full_name || 'Desconhecido'}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatTimeAgo(presence.last_seen)}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${getTeamColor(presence.agent?.current_team)} text-[10px]`}>
                        {presence.agent?.current_team?.toUpperCase() || 'N/A'}
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Agentes Offline agrupados por data */}
          {offlineAgents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 mt-3">
                <WifiOff className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Histórico</span>
              </div>
              
              {groupByDate(offlineAgents).slice(0, 2).map(([dateKey, agents]) => (
                <div key={dateKey} className="mb-3">
                  <div className="flex items-center gap-1 mb-1.5">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                      {formatDateGroup(agents[0].last_seen)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {agents.slice(0, 5).map((presence) => (
                      <div
                        key={presence.id}
                        className="flex items-center justify-between p-1.5 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                              {presence.agent?.avatar_url ? (
                                <img src={presence.agent.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-3 h-3 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-xs">{presence.agent?.full_name || 'Desconhecido'}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {format(parseISO(presence.last_seen), "HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`${getTeamColor(presence.agent?.current_team)} text-[10px]`}>
                          {presence.agent?.current_team?.toUpperCase() || 'N/A'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {presences.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <WifiOff className="w-8 h-8 mx-auto mb-1 opacity-50" />
              <p className="text-xs">Nenhum registro</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default OnlineAgentsPanel;
