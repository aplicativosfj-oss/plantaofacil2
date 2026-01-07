import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Bell, BellRing, Check, CheckCheck, Clock, 
  AlertTriangle, Info, DollarSign, ArrowLeftRight, Trash2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { toast } from 'sonner';
import plantaoLogo from '@/assets/plantao-pro-logo-new.png';
import PushNotificationSetup from './PushNotificationSetup';

interface Props { 
  onBack: () => void; 
}

interface Alert {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const AlertsPanel = ({ onBack }: Props) => {
  const { agent } = usePlantaoAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch alerts
  useEffect(() => {
    if (!agent?.id) return;

    const fetchAlerts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('agent_alerts')
        .select('*')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) setAlerts(data);
      setLoading(false);
    };

    fetchAlerts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('alerts-panel-realtime')
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

  const markAsRead = async (alertId: string) => {
    const { error } = await supabase
      .from('agent_alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    if (!error) {
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, is_read: true } : a
      ));
    }
  };

  const markAllAsRead = async () => {
    if (!agent?.id) return;

    const { error } = await supabase
      .from('agent_alerts')
      .update({ is_read: true })
      .eq('agent_id', agent.id)
      .eq('is_read', false);

    if (!error) {
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      toast.success('Todos os alertas foram marcados como lidos');
    }
  };

  const deleteAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('agent_alerts')
      .delete()
      .eq('id', alertId);

    if (!error) {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('Alerta removido');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'shift_reminder':
        return <Clock className="w-4 h-4 text-primary" />;
      case 'swap_request':
      case 'swap_response':
        return <ArrowLeftRight className="w-4 h-4 text-accent" />;
      case 'overtime':
        return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeBg = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-muted/30';
    switch (type) {
      case 'urgent':
        return 'bg-destructive/10 border-destructive/30';
      case 'shift_reminder':
        return 'bg-primary/10 border-primary/30';
      case 'swap_request':
      case 'swap_response':
        return 'bg-accent/10 border-accent/30';
      case 'overtime':
        return 'bg-green-500/10 border-green-500/30';
      default:
        return 'bg-card border-border';
    }
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <img src={plantaoLogo} alt="PlantãoPro" className="h-8 w-auto object-contain opacity-70" />
      </div>

      {/* Push Notification Setup Card */}
      {agent?.id && <PushNotificationSetup agentId={agent.id} />}

      {/* Alerts Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BellRing className="w-5 h-5 text-warning" />
              Alertas
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} {unreadCount === 1 ? 'novo' : 'novos'}
                </Badge>
              )}
            </CardTitle>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                Marcar todos
              </Button>
            )}
          </div>
          <CardDescription>
            Histórico de notificações e lembretes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              Carregando alertas...
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum alerta no momento</p>
              <p className="text-xs mt-1">Você receberá notificações sobre plantões e permutas aqui</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-2">
              <AnimatePresence>
                {alerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-lg border mb-2 ${getTypeBg(alert.type, alert.is_read)} ${
                      !alert.is_read ? 'cursor-pointer hover:opacity-80' : ''
                    }`}
                    onClick={() => !alert.is_read && markAsRead(alert.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getTypeIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium text-sm ${!alert.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {alert.title}
                            </p>
                            {!alert.is_read && (
                              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {alert.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1">
                            {formatDistanceToNow(new Date(alert.created_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {alert.is_read && (
                          <Check className="w-4 h-4 text-muted-foreground/50" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-50 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAlert(alert.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">Developed by Franc Denis</p>
    </div>
  );
};

export default AlertsPanel;
