import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Key, Search, Calendar, Clock, AlertTriangle, CheckCircle, 
  XCircle, Plus, Ban, UserCheck, Edit, Trash2, RefreshCw
} from 'lucide-react';
import { format, addDays, addMonths, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentWithLicense {
  id: string;
  full_name: string;
  cpf: string;
  registration_number: string | null;
  current_team: string | null;
  is_active: boolean;
  unit: string | null;
  license?: {
    id: string;
    license_key: string;
    license_type: string;
    status: string;
    expires_at: string;
    monthly_fee: number;
    is_trial: boolean;
  };
}

interface LicenseManagementProps {
  onRefresh?: () => void;
}

const LicenseManagement = ({ onRefresh }: LicenseManagementProps) => {
  const [agents, setAgents] = useState<AgentWithLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Dialog states
  const [extendingLicense, setExtendingLicense] = useState<AgentWithLicense | null>(null);
  const [extendDays, setExtendDays] = useState('30');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAgentsWithLicenses();
  }, []);

  const loadAgentsWithLicenses = async () => {
    setLoading(true);
    try {
      // Fetch agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .order('full_name');

      if (agentsError) throw agentsError;

      // Fetch licenses
      const { data: licensesData, error: licensesError } = await supabase
        .from('agent_licenses')
        .select('*');

      if (licensesError) throw licensesError;

      // Combine data
      const combined = (agentsData || []).map(agent => {
        const license = (licensesData || []).find(l => l.agent_id === agent.id);
        return { ...agent, license };
      });

      setAgents(combined);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (agent: AgentWithLicense) => {
    if (!agent.license) {
      return <Badge variant="outline" className="text-muted-foreground">Sem licença</Badge>;
    }

    const daysRemaining = differenceInDays(new Date(agent.license.expires_at), new Date());

    if (agent.license.status === 'blocked') {
      return <Badge variant="destructive">Bloqueado</Badge>;
    }

    if (agent.license.status === 'expired' || daysRemaining < 0) {
      return <Badge variant="destructive">Expirada</Badge>;
    }

    if (daysRemaining <= 7) {
      return <Badge className="bg-amber-500">Expira em {daysRemaining}d</Badge>;
    }

    if (agent.license.is_trial) {
      return <Badge className="bg-blue-500">Trial - {daysRemaining}d</Badge>;
    }

    return <Badge className="bg-green-500">Ativa - {daysRemaining}d</Badge>;
  };

  const handleExtendLicense = async () => {
    if (!extendingLicense?.license) return;
    setSaving(true);

    try {
      const currentExpiry = new Date(extendingLicense.license.expires_at);
      const baseDate = currentExpiry < new Date() ? new Date() : currentExpiry;
      const newExpiry = addDays(baseDate, parseInt(extendDays));

      const { error } = await supabase
        .from('agent_licenses')
        .update({
          expires_at: newExpiry.toISOString(),
          status: 'active',
        })
        .eq('id', extendingLicense.license.id);

      if (error) throw error;

      toast.success(`Licença estendida por ${extendDays} dias!`);
      setExtendingLicense(null);
      loadAgentsWithLicenses();
      onRefresh?.();
    } catch (error) {
      console.error('Error extending license:', error);
      toast.error('Erro ao estender licença');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBlock = async (agent: AgentWithLicense) => {
    if (!agent.license) return;

    const newStatus = agent.license.status === 'blocked' ? 'active' : 'blocked';

    try {
      const { error } = await supabase
        .from('agent_licenses')
        .update({ status: newStatus })
        .eq('id', agent.license.id);

      if (error) throw error;

      toast.success(newStatus === 'blocked' ? 'Licença bloqueada!' : 'Licença desbloqueada!');
      loadAgentsWithLicenses();
      onRefresh?.();
    } catch (error) {
      console.error('Error toggling block:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const handleActivateLicense = async (agent: AgentWithLicense) => {
    if (!agent.license) return;

    try {
      const { error } = await supabase
        .from('agent_licenses')
        .update({ 
          status: 'active',
          expires_at: addDays(new Date(), 30).toISOString(),
        })
        .eq('id', agent.license.id);

      if (error) throw error;

      toast.success('Licença ativada por 30 dias!');
      loadAgentsWithLicenses();
      onRefresh?.();
    } catch (error) {
      console.error('Error activating license:', error);
      toast.error('Erro ao ativar licença');
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      agent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.cpf.includes(searchTerm) ||
      agent.registration_number?.includes(searchTerm);

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'expired') {
      return matchesSearch && agent.license && 
        (agent.license.status === 'expired' || differenceInDays(new Date(agent.license.expires_at), new Date()) < 0);
    }
    if (filterStatus === 'blocked') {
      return matchesSearch && agent.license?.status === 'blocked';
    }
    if (filterStatus === 'expiring') {
      const days = agent.license ? differenceInDays(new Date(agent.license.expires_at), new Date()) : -1;
      return matchesSearch && days >= 0 && days <= 7;
    }
    if (filterStatus === 'active') {
      const days = agent.license ? differenceInDays(new Date(agent.license.expires_at), new Date()) : -1;
      return matchesSearch && agent.license?.status === 'active' && days > 7;
    }
    return matchesSearch;
  });

  const expiredCount = agents.filter(a => a.license && 
    (a.license.status === 'expired' || differenceInDays(new Date(a.license.expires_at), new Date()) < 0)
  ).length;

  const blockedCount = agents.filter(a => a.license?.status === 'blocked').length;

  const expiringCount = agents.filter(a => {
    if (!a.license) return false;
    const days = differenceInDays(new Date(a.license.expires_at), new Date());
    return days >= 0 && days <= 7;
  }).length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">{agents.length - expiredCount - blockedCount} Ativas</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">{expiringCount} Expirando</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">{expiredCount} Expiradas</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-500/10 border-gray-500/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">{blockedCount} Bloqueadas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="expiring">Expirando (7 dias)</SelectItem>
            <SelectItem value="expired">Expiradas</SelectItem>
            <SelectItem value="blocked">Bloqueadas</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={loadAgentsWithLicenses}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Agents List */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-2">
          <AnimatePresence>
            {filteredAgents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className="hover:bg-muted/30 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">{agent.full_name}</span>
                          {getStatusBadge(agent)}
                          {agent.current_team && (
                            <Badge variant="outline" className="text-xs">
                              {agent.current_team.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Mat: {agent.registration_number || 'N/A'} • {agent.unit || 'Sem unidade'}
                          {agent.license && (
                            <span className="ml-2">
                              • Expira: {format(new Date(agent.license.expires_at), 'dd/MM/yyyy')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {agent.license && (
                          <>
                            {/* Extend License */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setExtendingLicense(agent);
                                setExtendDays('30');
                              }}
                              className="h-8 px-2"
                              title="Estender licença"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>

                            {/* Toggle Block */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleBlock(agent)}
                              className={`h-8 px-2 ${agent.license.status === 'blocked' ? 'text-green-500' : 'text-red-500'}`}
                              title={agent.license.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                            >
                              {agent.license.status === 'blocked' ? (
                                <UserCheck className="w-4 h-4" />
                              ) : (
                                <Ban className="w-4 h-4" />
                              )}
                            </Button>

                            {/* Quick Activate (for expired) */}
                            {(agent.license.status === 'expired' || 
                              differenceInDays(new Date(agent.license.expires_at), new Date()) < 0) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleActivateLicense(agent)}
                                className="h-8 px-2 text-green-500"
                                title="Ativar por 30 dias"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredAgents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum agente encontrado' : 'Nenhum agente cadastrado'}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Extend License Dialog */}
      <Dialog open={!!extendingLicense} onOpenChange={() => setExtendingLicense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Estender Licença
            </DialogTitle>
          </DialogHeader>

          {extendingLicense && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium">{extendingLicense.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  Expira em: {extendingLicense.license && format(new Date(extendingLicense.license.expires_at), 'dd/MM/yyyy')}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Dias para estender</Label>
                <Select value={extendDays} onValueChange={setExtendDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="30">30 dias (1 mês)</SelectItem>
                    <SelectItem value="60">60 dias (2 meses)</SelectItem>
                    <SelectItem value="90">90 dias (3 meses)</SelectItem>
                    <SelectItem value="180">180 dias (6 meses)</SelectItem>
                    <SelectItem value="365">365 dias (1 ano)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-primary/10 rounded-lg text-sm">
                <p>Nova data de expiração:</p>
                <p className="font-bold text-primary">
                  {extendingLicense.license && format(
                    addDays(
                      new Date(extendingLicense.license.expires_at) < new Date() 
                        ? new Date() 
                        : new Date(extendingLicense.license.expires_at),
                      parseInt(extendDays)
                    ),
                    "dd 'de' MMMM 'de' yyyy",
                    { locale: ptBR }
                  )}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendingLicense(null)}>
              Cancelar
            </Button>
            <Button onClick={handleExtendLicense} disabled={saving}>
              {saving ? 'Salvando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LicenseManagement;
