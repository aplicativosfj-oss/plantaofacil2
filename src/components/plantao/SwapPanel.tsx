import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowLeftRight, CalendarIcon, Send, Clock, User, CheckCircle, XCircle, Loader2, Calendar as CalendarDays, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import plantaoLogo from '@/assets/plantao-logo.png';

interface Props { 
  onBack: () => void;
  agentId: string;
  agentTeam: string | null;
}

interface Agent {
  id: string;
  full_name: string;
  current_team: string | null;
}

interface SwapRequest {
  id: string;
  requester_id: string;
  requested_id: string;
  original_shift_date: string;
  compensation_date: string;
  status: string;
  requester_notes: string | null;
  created_at: string;
  requester?: Agent;
  requested?: Agent;
}

const SwapPanel = ({ onBack, agentId, agentTeam }: Props) => {
  const [originalDate, setOriginalDate] = useState<Date>();
  const [compensationDate, setCompensationDate] = useState<Date>();
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [myRequests, setMyRequests] = useState<SwapRequest[]>([]);
  const [pendingForMe, setPendingForMe] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [lastCreatedSwap, setLastCreatedSwap] = useState<{
    originalDate: Date;
    compensationDate: Date;
    agent: Agent | null;
  } | null>(null);

  useEffect(() => {
    fetchAgents();
    fetchSwapRequests();

    const channel = supabase
      .channel('swap-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_swaps' }, () => {
        fetchSwapRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [agentId, agentTeam]);

  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('id, full_name, current_team')
      .eq('is_active', true)
      .neq('id', agentId);

    if (!error && data) {
      setAgents(data);
    }
  };

  const fetchSwapRequests = async () => {
    setLoadingData(true);
    
    // Minhas solicitações enviadas
    const { data: sent } = await supabase
      .from('shift_swaps')
      .select(`
        *,
        requested:agents!shift_swaps_requested_id_fkey(id, full_name, current_team)
      `)
      .eq('requester_id', agentId)
      .order('created_at', { ascending: false });

    // Solicitações pendentes para mim
    const { data: received } = await supabase
      .from('shift_swaps')
      .select(`
        *,
        requester:agents!shift_swaps_requester_id_fkey(id, full_name, current_team)
      `)
      .eq('requested_id', agentId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (sent) setMyRequests(sent as SwapRequest[]);
    if (received) setPendingForMe(received as SwapRequest[]);
    
    setLoadingData(false);
  };

  const handleCreateSwap = async () => {
    if (!originalDate || !compensationDate || !selectedAgentId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (originalDate >= compensationDate) {
      toast.error('A data de compensação deve ser posterior à data do plantão');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('shift_swaps').insert({
      requester_id: agentId,
      requested_id: selectedAgentId,
      original_shift_date: format(originalDate, 'yyyy-MM-dd'),
      compensation_date: format(compensationDate, 'yyyy-MM-dd'),
      requester_notes: notes || null,
      status: 'pending'
    });

    if (error) {
      toast.error('Erro ao criar solicitação de permuta');
      console.error(error);
    } else {
      // Store swap details for summary
      const selectedAgent = agents.find(a => a.id === selectedAgentId) || null;
      setLastCreatedSwap({
        originalDate: originalDate,
        compensationDate: compensationDate,
        agent: selectedAgent
      });
      setShowSummary(true);
      
      toast.success('Solicitação de permuta enviada!');
      setOriginalDate(undefined);
      setCompensationDate(undefined);
      setSelectedAgentId('');
      setNotes('');
      fetchSwapRequests();
    }
    setLoading(false);
  };

  const getTeamColor = (team: string | null) => {
    switch (team) {
      case 'alfa': return 'bg-blue-500';
      case 'bravo': return 'bg-amber-500';
      case 'charlie': return 'bg-emerald-500';
      case 'delta': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getTeamName = (team: string | null) => {
    if (!team) return 'Sem equipe';
    return `Equipe ${team.charAt(0).toUpperCase() + team.slice(1)}`;
  };

  const handleRespondSwap = async (swapId: string, accept: boolean) => {
    setLoading(true);
    const { error } = await supabase
      .from('shift_swaps')
      .update({
        status: accept ? 'accepted' : 'rejected',
        responded_at: new Date().toISOString(),
        completed_at: accept ? new Date().toISOString() : null
      })
      .eq('id', swapId);

    if (error) {
      toast.error('Erro ao responder solicitação');
    } else {
      toast.success(accept ? 'Permuta aceita!' : 'Permuta recusada');
      fetchSwapRequests();
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50"><CheckCircle className="w-3 h-3 mr-1" /> Aceita</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50"><XCircle className="w-3 h-3 mr-1" /> Recusada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const sameTeamAgents = agents.filter(a => a.current_team === agentTeam);
  const otherTeamAgents = agents.filter(a => a.current_team !== agentTeam);

  return (
    <div className="space-y-4">
      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-500">
              <CheckCircle className="w-5 h-5" />
              Permuta Solicitada!
            </DialogTitle>
          </DialogHeader>

          {lastCreatedSwap && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
              className="space-y-4"
            >
              {/* Agent Info */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${getTeamColor(lastCreatedSwap.agent?.current_team || null)}`}>
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">{lastCreatedSwap.agent?.full_name || 'Agente'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {getTeamName(lastCreatedSwap.agent?.current_team || null)}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dates Summary */}
              <div className="grid grid-cols-2 gap-4">
                {/* Original Date */}
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-primary">SEU PLANTÃO</span>
                  </div>
                  <p className="text-xl font-bold">
                    {format(lastCreatedSwap.originalDate, 'dd/MM', { locale: ptBR })}
                  </p>
                  <p className="text-sm font-medium capitalize">
                    {format(lastCreatedSwap.originalDate, 'EEEE', { locale: ptBR })}
                  </p>
                </div>

                {/* Compensation Date */}
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowLeftRight className="w-4 h-4 text-accent" />
                    <span className="text-xs font-medium text-accent">COMPENSAÇÃO</span>
                  </div>
                  <p className="text-xl font-bold">
                    {format(lastCreatedSwap.compensationDate, 'dd/MM', { locale: ptBR })}
                  </p>
                  <p className="text-sm font-medium capitalize">
                    {format(lastCreatedSwap.compensationDate, 'EEEE', { locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-yellow-500 font-medium">Aguardando resposta do agente</span>
              </div>

              <Button className="w-full" onClick={() => setShowSummary(false)}>
                Entendido
              </Button>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
        <img src={plantaoLogo} alt="PlantãoPro" className="h-8 w-auto object-contain opacity-70" />
      </div>

      {/* Formulário de Nova Permuta */}
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowLeftRight className="w-5 h-5 text-primary" /> Nova Solicitação de Permuta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data do Plantão */}
            <div className="space-y-2">
              <Label>Data do Plantão a Permutar *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !originalDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {originalDate ? format(originalDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={originalDate}
                    onSelect={setOriginalDate}
                    locale={ptBR}
                    className="pointer-events-auto"
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data de Compensação */}
            <div className="space-y-2">
              <Label>Data de Compensação *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !compensationDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {compensationDate ? format(compensationDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={compensationDate}
                    onSelect={setCompensationDate}
                    locale={ptBR}
                    className="pointer-events-auto"
                    disabled={(date) => date < new Date() || (originalDate && date <= originalDate)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Seleção de Agente */}
          <div className="space-y-2">
            <Label>Agente para Permuta *</Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o agente" />
              </SelectTrigger>
              <SelectContent>
                {sameTeamAgents.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Mesma Equipe ({agentTeam})</div>
                    {sameTeamAgents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {agent.full_name}
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
                {otherTeamAgents.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Outras Equipes</div>
                    {otherTeamAgents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {agent.full_name}
                          <Badge variant="outline" className="text-xs">{agent.current_team || 'Sem equipe'}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              placeholder="Motivo da permuta ou informações adicionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button onClick={handleCreateSwap} disabled={loading || !originalDate || !compensationDate || !selectedAgentId} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Enviar Solicitação
          </Button>
        </CardContent>
      </Card>

      {/* Solicitações Pendentes para Mim */}
      {pendingForMe.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-yellow-400">
              <Clock className="w-5 h-5" /> Solicitações Pendentes ({pendingForMe.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AnimatePresence>
              {pendingForMe.map((swap) => (
                <motion.div
                  key={swap.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-4 rounded-lg bg-card border border-yellow-500/30 cursor-pointer hover:border-yellow-500/60 transition-colors"
                  onClick={() => handleRespondSwap(swap.id, true)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        {swap.requester?.full_name || 'Agente'}
                        {swap.requester?.current_team && (
                          <Badge variant="outline" className="text-xs">{swap.requester.current_team}</Badge>
                        )}
                      </p>
                      <div className="mt-2 text-sm text-muted-foreground space-y-1">
                        <p><strong>Data do Plantão:</strong> {format(new Date(swap.original_shift_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                        <p><strong>Compensação:</strong> {format(new Date(swap.compensation_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                        {swap.requester_notes && <p className="italic">"{swap.requester_notes}"</p>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="default" onClick={(e) => { e.stopPropagation(); handleRespondSwap(swap.id, true); }} disabled={loading}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Aceitar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleRespondSwap(swap.id, false); }} disabled={loading}>
                        <XCircle className="w-4 h-4 mr-1" /> Recusar
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Clique no card para aceitar rapidamente</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Minhas Solicitações Enviadas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Send className="w-5 h-5 text-primary" /> Minhas Solicitações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : myRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma solicitação enviada</p>
          ) : (
            <div className="space-y-3">
              {myRequests.map((swap) => (
                <motion.div 
                  key={swap.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-lg bg-muted/50 border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getTeamColor(swap.requested?.current_team || null)}`}>
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{swap.requested?.full_name || 'Agente'}</p>
                          <p className="text-xs text-muted-foreground">{getTeamName(swap.requested?.current_team || null)}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="p-2 rounded bg-background/50">
                          <p className="text-[10px] text-muted-foreground uppercase">Seu Plantão</p>
                          <p className="font-medium">{format(new Date(swap.original_shift_date), "dd/MM", { locale: ptBR })}</p>
                          <p className="text-xs text-muted-foreground capitalize">{format(new Date(swap.original_shift_date), "EEEE", { locale: ptBR })}</p>
                        </div>
                        <div className="p-2 rounded bg-background/50">
                          <p className="text-[10px] text-muted-foreground uppercase">Compensação</p>
                          <p className="font-medium">{format(new Date(swap.compensation_date), "dd/MM", { locale: ptBR })}</p>
                          <p className="text-xs text-muted-foreground capitalize">{format(new Date(swap.compensation_date), "EEEE", { locale: ptBR })}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="shrink-0">
                      {getStatusBadge(swap.status)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">Developed by Franc Denis</p>
    </div>
  );
};

export default SwapPanel;
