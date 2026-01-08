import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  MessageCircle, Send, Users, User, Search,
  Bell, AlertTriangle, Info, CheckCircle, Megaphone,
  Trash2, Clock
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type TeamType = Database['public']['Enums']['team_type'];

interface Agent {
  id: string;
  full_name: string;
  current_team: TeamType | null;
  is_active: boolean;
}

interface SentMessage {
  id: string;
  sender_id: string;
  content: string;
  message_type: string;
  recipient_team: TeamType | null;
  is_broadcast: boolean | null;
  created_at: string;
}

const messageTemplates = [
  { id: 'payment', icon: Bell, label: 'Lembrete de Pagamento', color: 'text-amber-500', 
    message: '⚠️ Lembrete: Sua mensalidade de R$ 20,00 está pendente. Por favor, efetue o pagamento para manter sua licença ativa.' },
  { id: 'update', icon: Info, label: 'Atualização do Sistema', color: 'text-blue-500',
    message: '📢 Nova atualização disponível! Confira as novidades do sistema.' },
  { id: 'alert', icon: AlertTriangle, label: 'Aviso Importante', color: 'text-red-500',
    message: '🚨 Atenção! Mensagem importante do administrador.' },
  { id: 'success', icon: CheckCircle, label: 'Confirmação', color: 'text-green-500',
    message: '✅ Sua solicitação foi processada com sucesso!' },
];

const SendMessagesPanel = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [messageContent, setMessageContent] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [recipientType, setRecipientType] = useState<'all' | 'team' | 'individual'>('all');
  const [selectedTeam, setSelectedTeam] = useState<TeamType | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // Buscar agentes
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('id, full_name, current_team, is_active')
        .eq('is_active', true)
        .order('full_name');

      if (agentsError) throw agentsError;

      // Buscar mensagens enviadas
      const { data: messagesData, error: messagesError } = await supabase
        .from('agent_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (messagesError) throw messagesError;

      setAgents((agentsData || []) as Agent[]);
      setSentMessages((messagesData || []) as SentMessage[]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUseTemplate = (template: typeof messageTemplates[0]) => {
    setMessageContent(template.message);
    setMessageType(template.id);
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    setSending(true);
    try {
      // Determinar destinatários
      let targetAgents: string[] = [];
      
      if (recipientType === 'all') {
        targetAgents = agents.map(a => a.id);
      } else if (recipientType === 'team' && selectedTeam) {
        targetAgents = agents.filter(a => a.current_team === selectedTeam).map(a => a.id);
      } else if (recipientType === 'individual' && selectedAgent) {
        targetAgents = [selectedAgent];
      }

      if (targetAgents.length === 0) {
        toast.error('Selecione pelo menos um destinatário');
        setSending(false);
        return;
      }

      // Criar alertas para cada agente
      const alerts = targetAgents.map(agentId => ({
        agent_id: agentId,
        title: 'Mensagem do Administrador',
        message: messageContent,
        type: messageType,
        is_read: false,
      }));

      const { error } = await supabase
        .from('agent_alerts')
        .insert(alerts);

      if (error) throw error;

      // Registrar mensagem enviada (usando o primeiro agente como sender_id temporário)
      // Idealmente seria um ID de admin, mas usamos o primeiro destinatário
      await supabase.from('agent_messages').insert({
        sender_id: targetAgents[0],
        content: messageContent,
        message_type: messageType,
        recipient_team: recipientType === 'team' ? selectedTeam : null,
        is_broadcast: recipientType === 'all',
      });

      toast.success(`Mensagem enviada para ${targetAgents.length} agente(s)!`);
      setShowComposeDialog(false);
      setMessageContent('');
      setRecipientType('all');
      setSelectedTeam(null);
      setSelectedAgent(null);
      loadData();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('agent_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      toast.success('Mensagem removida');
      loadData();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Erro ao remover mensagem');
    }
  };

  const getTeamColor = (team: TeamType | null) => {
    switch (team) {
      case 'alfa': return 'bg-team-alfa text-white';
      case 'bravo': return 'bg-team-bravo text-white';
      case 'charlie': return 'bg-team-charlie text-white';
      case 'delta': return 'bg-team-delta text-white';
      default: return 'bg-muted';
    }
  };

  const filteredAgents = agents.filter(a => 
    a.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Compose Dialog */}
      <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Enviar Mensagem
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Templates */}
            <div className="space-y-2">
              <Label>Templates Rápidos</Label>
              <div className="grid grid-cols-2 gap-2">
                {messageTemplates.map(template => {
                  const Icon = template.icon;
                  return (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                      className="justify-start gap-2 h-auto py-2"
                    >
                      <Icon className={`w-4 h-4 ${template.color}`} />
                      <span className="text-xs">{template.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Recipient Type */}
            <div className="space-y-2">
              <Label>Destinatários</Label>
              <div className="flex gap-2">
                <Button
                  variant={recipientType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRecipientType('all')}
                  className="gap-1"
                >
                  <Megaphone className="w-4 h-4" />
                  Todos
                </Button>
                <Button
                  variant={recipientType === 'team' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRecipientType('team')}
                  className="gap-1"
                >
                  <Users className="w-4 h-4" />
                  Equipe
                </Button>
                <Button
                  variant={recipientType === 'individual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRecipientType('individual')}
                  className="gap-1"
                >
                  <User className="w-4 h-4" />
                  Individual
                </Button>
              </div>
            </div>

            {/* Team Selection */}
            {recipientType === 'team' && (
              <div className="space-y-2">
                <Label>Selecionar Equipe</Label>
                <div className="flex gap-2">
                  {(['alfa', 'bravo', 'charlie', 'delta'] as const).map(team => (
                    <Button
                      key={team}
                      variant={selectedTeam === team ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTeam(team)}
                      className={selectedTeam === team ? getTeamColor(team) : ''}
                    >
                      {team.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Individual Selection */}
            {recipientType === 'individual' && (
              <div className="space-y-2">
                <Label>Selecionar Agente</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar agente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="h-32 border rounded-lg">
                  <div className="p-2 space-y-1">
                    {filteredAgents.map(agent => (
                      <button
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                          selectedAgent === agent.id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        <span className="text-sm">{agent.full_name}</span>
                        {agent.current_team && (
                          <Badge className={`text-[10px] ${getTeamColor(agent.current_team)}`}>
                            {agent.current_team.toUpperCase()}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Message Content */}
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Digite sua mensagem..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComposeDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendMessage} disabled={sending}>
              {sending ? 'Enviando...' : 'Enviar Mensagem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header with Compose Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Mensagens</h2>
        </div>
        <Button onClick={() => setShowComposeDialog(true)} className="gap-2">
          <Send className="w-4 h-4" />
          Nova Mensagem
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-500">{agents.length}</p>
                <p className="text-xs text-muted-foreground">Agentes Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Send className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-500">{sentMessages.length}</p>
                <p className="text-xs text-muted-foreground">Mensagens Enviadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-purple-500">
                  {sentMessages.filter(m => m.is_broadcast).length}
                </p>
                <p className="text-xs text-muted-foreground">Broadcasts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-amber-500">
                  {sentMessages.filter(m => {
                    const msgDate = new Date(m.created_at);
                    const today = new Date();
                    return msgDate.toDateString() === today.toDateString();
                  }).length}
                </p>
                <p className="text-xs text-muted-foreground">Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sent Messages History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Histórico de Mensagens
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : sentMessages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma mensagem enviada ainda</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                <AnimatePresence>
                  {sentMessages.map(message => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-muted/30 rounded-lg border border-border/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {message.is_broadcast && (
                              <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">
                                <Megaphone className="w-3 h-3 mr-1" />
                                Todos
                              </Badge>
                            )}
                            {message.recipient_team && (
                              <Badge className={getTeamColor(message.recipient_team)}>
                                {message.recipient_team.toUpperCase()}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(message.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive h-8 w-8"
                          onClick={() => handleDeleteMessage(message.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SendMessagesPanel;
