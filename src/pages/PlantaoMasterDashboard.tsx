import { useEffect, useState, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Shield, LogOut, Users, DollarSign, Calendar, User, Search, 
  Clock, TrendingUp, Key, Eye, EyeOff, Save, AlertTriangle,
  CheckCircle, XCircle, ChevronDown, ChevronUp, Receipt, CreditCard, ArrowLeft,
  Trash2, Edit, Ban, UserCheck, Building2, Crown, Phone, Mail, UserCog
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import OnlineIndicator from '@/components/plantao/OnlineIndicator';
import plantaoLogo from '@/assets/plantao-pro-logo-new.png';

interface AgentWithDetails {
  id: string;
  full_name: string;
  cpf: string;
  registration_number: string | null;
  current_team: string | null;
  created_at: string;
  is_active: boolean;
  phone: string | null;
  email: string | null;
  city: string | null;
  unit: string | null;
  avatar_url: string | null;
  lastAccess?: string | null;
  totalOvertime?: number;
  totalOvertimeValue?: number;
  shiftsCount?: number;
}

interface OvertimeRecord {
  id: string;
  agent_id: string;
  date: string;
  hours_worked: number;
  hour_value: number | null;
  total_value: number | null;
  description: string | null;
  month_year: string;
  agent?: { full_name: string };
}

interface TeamStats {
  alfa: { count: number; overtime: number };
  bravo: { count: number; overtime: number };
  charlie: { count: number; overtime: number };
  delta: { count: number; overtime: number };
}

interface LicensePaymentRecord {
  id: string;
  agent_id: string;
  payment_month: string;
  amount: number;
  status: string;
  payment_date: string | null;
  payment_method: string | null;
  confirmed_at: string | null;
  created_at: string;
  agent?: { full_name: string };
}

interface MonthlyRevenue {
  month: string;
  total: number;
  confirmed: number;
  pending: number;
  count: number;
}

interface UnitLeadership {
  id: string;
  unit_name: string;
  position_type: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_active: boolean;
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

const PlantaoMasterDashboard = forwardRef<HTMLDivElement>((_, ref) => {
  const { master, signOut, isLoading } = usePlantaoAuth();
  const navigate = useNavigate();
  
  const [agents, setAgents] = useState<AgentWithDetails[]>([]);
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats>({
    alfa: { count: 0, overtime: 0 },
    bravo: { count: 0, overtime: 0 },
    charlie: { count: 0, overtime: 0 },
    delta: { count: 0, overtime: 0 },
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [licensePayments, setLicensePayments] = useState<LicensePaymentRecord[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [unitLeadership, setUnitLeadership] = useState<UnitLeadership[]>([]);
  const [editingLeadership, setEditingLeadership] = useState<UnitLeadership | null>(null);
  const [leadershipForm, setLeadershipForm] = useState({ full_name: '', phone: '', email: '', notes: '' });
  const [savingLeadership, setSavingLeadership] = useState(false);
  
  // Navigation filters
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
  
  const UNITS_LIST = [
    { id: 'all', name: 'Todas Unidades' },
    { id: 'CS Feijó', name: 'CS Feijó' },
    { id: 'CS Juruá', name: 'CS Juruá' },
    { id: 'CS Rio Branco', name: 'CS Rio Branco' },
    { id: 'CS Purus', name: 'CS Purus' },
    { id: 'CS Alto Acre', name: 'CS Alto Acre' },
  ];
  
  const TEAMS_LIST = [
    { id: 'all', name: 'Todas Equipes', color: 'bg-muted' },
    { id: 'alfa', name: 'Equipe Alfa', color: 'bg-team-alfa' },
    { id: 'bravo', name: 'Equipe Bravo', color: 'bg-team-bravo' },
    { id: 'charlie', name: 'Equipe Charlie', color: 'bg-team-charlie' },
    { id: 'delta', name: 'Equipe Delta', color: 'bg-team-delta' },
  ];
  
  // Password change dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Agent management dialogs
  const [editingAgent, setEditingAgent] = useState<AgentWithDetails | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<AgentWithDetails | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', email: '', unit: '', city: '' });
  const [savingAgent, setSavingAgent] = useState(false);

  useEffect(() => {
    if (!isLoading && !master) {
      navigate('/');
    }
  }, [isLoading, master, navigate]);

  useEffect(() => {
    if (master) {
      loadData();
    }
  }, [master]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch all agents with their details
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .order('full_name');

      if (agentsError) throw agentsError;

      // Fetch overtime records for current month
      const currentMonth = format(new Date(), 'yyyy-MM');
      const { data: overtimeData, error: overtimeError } = await supabase
        .from('overtime_bank')
        .select('*, agent:agents!overtime_bank_agent_id_fkey(full_name)')
        .eq('month_year', currentMonth)
        .order('date', { ascending: false });

      if (overtimeError) throw overtimeError;

      // Fetch all overtime to calculate totals
      const { data: allOvertime } = await supabase
        .from('overtime_bank')
        .select('agent_id, hours_worked, total_value');

      // Fetch agent presence for last access
      const { data: presenceData } = await supabase
        .from('agent_presence')
        .select('agent_id, last_seen');

      // Fetch license payments
      const { data: paymentsData } = await supabase
        .from('license_payments')
        .select('*, agent:agents!license_payments_agent_id_fkey(full_name)')
        .order('created_at', { ascending: false });

      setLicensePayments(paymentsData || []);

      // Calculate monthly revenue
      const revenueByMonth: Record<string, MonthlyRevenue> = {};
      (paymentsData || []).forEach(payment => {
        const month = payment.payment_month;
        if (!revenueByMonth[month]) {
          revenueByMonth[month] = { month, total: 0, confirmed: 0, pending: 0, count: 0 };
        }
        revenueByMonth[month].total += payment.amount || 0;
        revenueByMonth[month].count++;
        if (payment.status === 'confirmed') {
          revenueByMonth[month].confirmed += payment.amount || 0;
        } else if (payment.status === 'pending') {
          revenueByMonth[month].pending += payment.amount || 0;
        }
      });

      const sortedRevenue = Object.values(revenueByMonth).sort((a, b) => b.month.localeCompare(a.month));
      setMonthlyRevenue(sortedRevenue);

      // Fetch unit leadership
      const { data: leadershipData } = await supabase
        .from('unit_leadership')
        .select('*')
        .order('unit_name');

      setUnitLeadership((leadershipData || []) as UnitLeadership[]);

      // Fetch shifts count
      const { data: shiftsData } = await supabase
        .from('shifts')
        .select('agent_id');

      // Process agents with additional data
      const processedAgents = (agentsData || []).map(agent => {
        const agentOvertime = (allOvertime || []).filter(o => o.agent_id === agent.id);
        const totalOvertime = agentOvertime.reduce((sum, o) => sum + (o.hours_worked || 0), 0);
        const totalOvertimeValue = agentOvertime.reduce((sum, o) => sum + (o.total_value || 0), 0);
        const presence = (presenceData || []).find(p => p.agent_id === agent.id);
        const shiftsCount = (shiftsData || []).filter(s => s.agent_id === agent.id).length;

        return {
          ...agent,
          lastAccess: presence?.last_seen || null,
          totalOvertime,
          totalOvertimeValue,
          shiftsCount,
        };
      });

      setAgents(processedAgents);
      setOvertimeRecords(overtimeData || []);

      // Calculate team stats
      const stats: TeamStats = {
        alfa: { count: 0, overtime: 0 },
        bravo: { count: 0, overtime: 0 },
        charlie: { count: 0, overtime: 0 },
        delta: { count: 0, overtime: 0 },
      };

      processedAgents.forEach(agent => {
        const team = agent.current_team as keyof TeamStats;
        if (team && stats[team]) {
          stats[team].count++;
          stats[team].overtime += agent.totalOvertime || 0;
        }
      });

      setTeamStats(stats);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleChangePassword = async () => {
    if (!master) return;

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setChangingPassword(true);
    try {
      // Validate current password
      const { data: validation, error: validError } = await supabase.rpc('validate_master_credentials', {
        p_username: master.username,
        p_password: currentPassword
      });

      if (validError || !validation || validation.length === 0 || !validation[0].is_valid) {
        toast.error('Senha atual incorreta');
        return;
      }

      // Update password
      const { error: updateError } = await supabase.rpc('update_master_password', {
        p_credential_id: master.id,
        p_new_password: newPassword
      });

      if (updateError) throw updateError;

      toast.success('Senha alterada com sucesso!');
      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Erro ao alterar senha');
    } finally {
      setChangingPassword(false);
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.cpf.includes(searchTerm) ||
      agent.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.current_team?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTeam = selectedTeamFilter === 'all' || agent.current_team === selectedTeamFilter;
    const matchesUnit = selectedUnitFilter === 'all' || agent.unit === selectedUnitFilter;
    
    return matchesSearch && matchesTeam && matchesUnit;
  });

  const totalAgents = agents.length;
  const activeAgents = agents.filter(a => a.is_active).length;
  const totalOvertimeHours = agents.reduce((sum, a) => sum + (a.totalOvertime || 0), 0);
  
  // Calculate billing totals
  const currentMonth = format(new Date(), 'yyyy-MM');
  const currentMonthRevenue = monthlyRevenue.find(r => r.month === currentMonth);
  const totalConfirmedRevenue = monthlyRevenue.reduce((sum, r) => sum + r.confirmed, 0);
  const pendingPayments = licensePayments.filter(p => p.status === 'pending').length;

  const handleConfirmPayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('license_payments')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) throw error;
      toast.success('Pagamento confirmado!');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao confirmar pagamento');
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('license_payments')
        .update({ status: 'rejected' })
        .eq('id', paymentId);

      if (error) throw error;
      toast.success('Pagamento rejeitado');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao rejeitar pagamento');
    }
  };

  // Agent management functions
  const handleToggleAgentStatus = async (agent: AgentWithDetails) => {
    try {
      const { error } = await supabase
        .from('agents')
        .update({ is_active: !agent.is_active })
        .eq('id', agent.id);

      if (error) throw error;
      toast.success(agent.is_active ? 'Agente bloqueado!' : 'Agente desbloqueado!');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao alterar status do agente');
    }
  };

  const handleEditAgent = (agent: AgentWithDetails) => {
    setEditingAgent(agent);
    setEditForm({
      full_name: agent.full_name,
      phone: agent.phone || '',
      email: agent.email || '',
      unit: agent.unit || '',
      city: agent.city || '',
    });
  };

  const handleSaveAgent = async () => {
    if (!editingAgent) return;
    setSavingAgent(true);
    try {
      const { error } = await supabase
        .from('agents')
        .update({
          full_name: editForm.full_name.toUpperCase(),
          phone: editForm.phone || null,
          email: editForm.email || null,
          unit: editForm.unit || null,
          city: editForm.city || null,
        })
        .eq('id', editingAgent.id);

      if (error) throw error;
      toast.success('Agente atualizado com sucesso!');
      setEditingAgent(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar agente');
    } finally {
      setSavingAgent(false);
    }
  };

  const handleDeleteAgent = async () => {
    if (!deletingAgent) return;
    try {
      // Delete related data first
      await supabase.from('agent_presence').delete().eq('agent_id', deletingAgent.id);
      await supabase.from('agent_licenses').delete().eq('agent_id', deletingAgent.id);
      await supabase.from('shifts').delete().eq('agent_id', deletingAgent.id);
      await supabase.from('overtime_bank').delete().eq('agent_id', deletingAgent.id);
      await supabase.from('agent_alerts').delete().eq('agent_id', deletingAgent.id);
      await supabase.from('chat_messages').delete().eq('sender_id', deletingAgent.id);
      await supabase.from('calendar_notes').delete().eq('agent_id', deletingAgent.id);
      
      // Delete the agent
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', deletingAgent.id);

      if (error) throw error;
      toast.success('Agente excluído com sucesso!');
      setDeletingAgent(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir agente');
    }
  };

  // Leadership management functions
  const handleEditLeadership = (leadership: UnitLeadership) => {
    setEditingLeadership(leadership);
    setLeadershipForm({
      full_name: leadership.full_name || '',
      phone: leadership.phone || '',
      email: leadership.email || '',
      notes: leadership.notes || '',
    });
  };

  const handleSaveLeadership = async () => {
    if (!editingLeadership) return;
    setSavingLeadership(true);
    try {
      const { error } = await supabase
        .from('unit_leadership')
        .update({
          full_name: leadershipForm.full_name || null,
          phone: leadershipForm.phone || null,
          email: leadershipForm.email || null,
          notes: leadershipForm.notes || null,
        })
        .eq('id', editingLeadership.id);

      if (error) throw error;
      toast.success('Liderança atualizada com sucesso!');
      setEditingLeadership(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar liderança');
    } finally {
      setSavingLeadership(false);
    }
  };

  const getPositionLabel = (positionType: string) => {
    switch (positionType) {
      case 'diretor': return 'Diretor(a)';
      case 'coordenador_seguranca': return 'Coordenador(a) de Segurança';
      case 'presidente': return 'Presidente';
      default: return positionType;
    }
  };

  const getPositionIcon = (positionType: string) => {
    switch (positionType) {
      case 'diretor': return <Building2 className="w-5 h-5" />;
      case 'coordenador_seguranca': return <Shield className="w-5 h-5" />;
      case 'presidente': return <Crown className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  if (isLoading || !master) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen bg-gradient-dark">
      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Alterar Senha Master
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Senha Atual</Label>
              <div className="relative">
                <Input
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite a senha atual"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Nova Senha</Label>
              <Input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPasswords(!showPasswords)}
              className="gap-2"
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPasswords ? 'Ocultar senhas' : 'Mostrar senhas'}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Agent Dialog */}
      <Dialog open={!!editingAgent} onOpenChange={(open) => !open && setEditingAgent(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Editar Agente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                placeholder="Nome do agente"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Input
                  value={editForm.unit}
                  onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                  placeholder="CS Feijó"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAgent(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAgent} disabled={savingAgent}>
              {savingAgent ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Agent Confirmation Dialog */}
      <Dialog open={!!deletingAgent} onOpenChange={(open) => !open && setDeletingAgent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Excluir Agente
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Tem certeza que deseja excluir o agente <span className="font-bold text-foreground">{deletingAgent?.full_name}</span>?
            </p>
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">
                  Esta ação é irreversível. Todos os dados relacionados ao agente (plantões, BH, mensagens) serão excluídos permanentemente.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingAgent(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteAgent}>
              Excluir Agente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Leadership Dialog */}
      <Dialog open={!!editingLeadership} onOpenChange={(open) => !open && setEditingLeadership(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary" />
              Editar Liderança
            </DialogTitle>
          </DialogHeader>
          {editingLeadership && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                {getPositionIcon(editingLeadership.position_type)}
                <div>
                  <p className="text-xs text-muted-foreground uppercase">{getPositionLabel(editingLeadership.position_type)}</p>
                  <p className="font-medium">{editingLeadership.unit_name}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={leadershipForm.full_name}
                  onChange={(e) => setLeadershipForm({ ...leadershipForm, full_name: e.target.value.toUpperCase() })}
                  placeholder="Nome do ocupante do cargo"
                  className="uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={leadershipForm.phone}
                    onChange={(e) => setLeadershipForm({ ...leadershipForm, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    value={leadershipForm.email}
                    onChange={(e) => setLeadershipForm({ ...leadershipForm, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    type="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input
                  value={leadershipForm.notes}
                  onChange={(e) => setLeadershipForm({ ...leadershipForm, notes: e.target.value })}
                  placeholder="Observações adicionais"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLeadership(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveLeadership} disabled={savingLeadership}>
              {savingLeadership ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="h-8 w-8"
                title="Voltar à tela inicial"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <img src={plantaoLogo} alt="PlantãoPro" className="h-10 w-auto object-contain" />
              <div>
                <h1 className="text-lg font-display tracking-wide">PLANTÃO<span className="text-primary">PRO</span></h1>
                <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/50 text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  MASTER
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <OnlineIndicator compact />
              <Button variant="ghost" size="sm" onClick={() => setShowPasswordDialog(true)} title="Alterar Senha">
                <Key className="w-4 h-4" />
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
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-medium">{master.full_name || master.username}</p>
                <p className="text-sm text-muted-foreground">Administrador Master</p>
              </div>
            </div>
            
            {/* Navigation Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Unit Filter */}
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <select
                  value={selectedUnitFilter}
                  onChange={(e) => setSelectedUnitFilter(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {UNITS_LIST.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Team Filter */}
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div className="flex rounded-lg border border-border overflow-hidden">
                  {TEAMS_LIST.map(team => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeamFilter(team.id)}
                      className={`px-3 py-1.5 text-xs font-medium transition-all ${
                        selectedTeamFilter === team.id 
                          ? team.id === 'all' 
                            ? 'bg-primary text-primary-foreground' 
                            : `${team.color} text-white`
                          : 'bg-background hover:bg-muted'
                      }`}
                    >
                      {team.id === 'all' ? 'Todas' : team.id.charAt(0).toUpperCase() + team.id.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {(selectedTeamFilter !== 'all' || selectedUnitFilter !== 'all') && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 flex items-center gap-2 flex-wrap"
            >
              <span className="text-xs text-muted-foreground">Filtros ativos:</span>
              {selectedUnitFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  <Building2 className="w-3 h-3" />
                  {selectedUnitFilter}
                  <button onClick={() => setSelectedUnitFilter('all')} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              {selectedTeamFilter !== 'all' && (
                <Badge className={`gap-1 ${TEAMS_LIST.find(t => t.id === selectedTeamFilter)?.color} text-white`}>
                  <Users className="w-3 h-3" />
                  Equipe {selectedTeamFilter.charAt(0).toUpperCase() + selectedTeamFilter.slice(1)}
                  <button onClick={() => setSelectedTeamFilter('all')} className="ml-1 hover:text-white/60">×</button>
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setSelectedTeamFilter('all'); setSelectedUnitFilter('all'); }}
                className="text-xs h-6"
              >
                Limpar filtros
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 lg:grid-cols-6">
              <TabsTrigger value="overview" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="gap-2">
                <Receipt className="w-4 h-4" />
                <span className="hidden sm:inline">Faturamento</span>
              </TabsTrigger>
              <TabsTrigger value="agents" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Agentes</span>
              </TabsTrigger>
              <TabsTrigger value="leadership" className="gap-2">
                <Crown className="w-4 h-4" />
                <span className="hidden sm:inline">Lideranças</span>
              </TabsTrigger>
              <TabsTrigger value="overtime" className="gap-2">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">BH</span>
              </TabsTrigger>
              <TabsTrigger value="shifts" className="gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Plantões</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold text-blue-500">{totalAgents}</p>
                        <p className="text-xs text-muted-foreground">Total de Agentes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold text-green-500">{activeAgents}</p>
                        <p className="text-xs text-muted-foreground">Agentes Ativos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-8 h-8 text-amber-500" />
                      <div>
                        <p className="text-2xl font-bold text-amber-500">{totalOvertimeHours.toFixed(1)}h</p>
                        <p className="text-xs text-muted-foreground">BH Total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Receipt className="w-8 h-8 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold text-purple-500">
                          R$ {totalConfirmedRevenue.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Faturamento Total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Team Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Estatísticas por Equipe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {(['alfa', 'bravo', 'charlie', 'delta'] as const).map(team => (
                      <div key={team} className={`p-4 rounded-lg ${getTeamColor(team)}`}>
                        <p className="text-lg font-bold capitalize">{team}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm opacity-90">
                            {teamStats[team].count} agente(s)
                          </p>
                          <p className="text-sm opacity-90">
                            {teamStats[team].overtime.toFixed(1)}h BH
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Overtime */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    BH Recentes (Mês Atual)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {overtimeRecords.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum registro de BH este mês
                    </p>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {overtimeRecords.slice(0, 20).map(record => (
                          <div key={record.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div>
                              <p className="font-medium">{record.agent?.full_name || 'Desconhecido'}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(parseISO(record.date), "dd/MM/yyyy", { locale: ptBR })}
                                {record.description && ` - ${record.description}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">{record.hours_worked}h</p>
                              <p className="text-sm text-muted-foreground">
                                R$ {(record.total_value || 0).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Agents Tab */}
            <TabsContent value="agents" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Todos os Agentes
                    </CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar agente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {filteredAgents.map(agent => (
                        <motion.div
                          key={agent.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border border-border/50 rounded-lg overflow-hidden"
                        >
                          <button
                            className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                            onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                                {agent.avatar_url ? (
                                  <img src={agent.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-5 h-5 text-primary" />
                                )}
                              </div>
                              <div className="text-left">
                                <p className="font-medium">{agent.full_name}</p>
                                <p className="text-sm text-muted-foreground">Mat: {agent.registration_number || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={`${getTeamColor(agent.current_team)} ${!agent.current_team && 'bg-muted text-muted-foreground'}`}>
                                {agent.current_team ? agent.current_team.toUpperCase() : 'SEM EQUIPE'}
                              </Badge>
                              <Badge variant={agent.is_active ? 'default' : 'destructive'}>
                                {agent.is_active ? 'Ativo' : 'Inativo'}
                              </Badge>
                              {expandedAgent === agent.id ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </button>

                          <AnimatePresence>
                            {expandedAgent === agent.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-border/50 bg-muted/10"
                              >
                                <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">CPF</p>
                                    <p className="font-medium">{agent.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Telefone</p>
                                    <p className="font-medium">{agent.phone || 'Não informado'}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Email</p>
                                    <p className="font-medium">{agent.email || 'Não informado'}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Cidade/Unidade</p>
                                    <p className="font-medium">{agent.city || 'N/A'} / {agent.unit || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Cadastrado em</p>
                                    <p className="font-medium">
                                      {format(parseISO(agent.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Último Acesso</p>
                                    <p className="font-medium">
                                      {agent.lastAccess 
                                        ? format(parseISO(agent.lastAccess), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                                        : 'Nunca acessou'
                                      }
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Plantões Registrados</p>
                                    <p className="font-medium">{agent.shiftsCount || 0}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">BH Total</p>
                                    <p className="font-medium text-primary">
                                      {(agent.totalOvertime || 0).toFixed(1)}h (R$ {(agent.totalOvertimeValue || 0).toFixed(2)})
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Agent Management Buttons */}
                                <div className="p-4 pt-0 flex flex-wrap gap-2 border-t border-border/30 mt-4 pt-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2"
                                    onClick={(e) => { e.stopPropagation(); handleEditAgent(agent); }}
                                  >
                                    <Edit className="w-4 h-4" />
                                    Editar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={agent.is_active ? "destructive" : "default"}
                                    className="gap-2"
                                    onClick={(e) => { e.stopPropagation(); handleToggleAgentStatus(agent); }}
                                  >
                                    {agent.is_active ? (
                                      <>
                                        <Ban className="w-4 h-4" />
                                        Bloquear
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="w-4 h-4" />
                                        Desbloquear
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => { e.stopPropagation(); setDeletingAgent(agent); }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Excluir
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Overtime Tab */}
            <TabsContent value="overtime" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Banco de Horas por Agente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {agents
                        .filter(a => (a.totalOvertime || 0) > 0)
                        .sort((a, b) => (b.totalOvertime || 0) - (a.totalOvertime || 0))
                        .map(agent => (
                          <div key={agent.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                                {agent.avatar_url ? (
                                  <img src={agent.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-5 h-5 text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{agent.full_name}</p>
                                <Badge className={getTeamColor(agent.current_team)} variant="outline">
                                  {agent.current_team?.toUpperCase() || 'SEM EQUIPE'}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">{(agent.totalOvertime || 0).toFixed(1)}h</p>
                              <p className="text-sm text-muted-foreground">
                                R$ {(agent.totalOvertimeValue || 0).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))
                      }
                      {agents.every(a => (a.totalOvertime || 0) === 0) && (
                        <p className="text-muted-foreground text-center py-8">
                          Nenhum agente com BH registrado
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shifts Tab */}
            <TabsContent value="shifts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Plantões Programados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {agents
                        .filter(a => (a.shiftsCount || 0) > 0)
                        .sort((a, b) => (b.shiftsCount || 0) - (a.shiftsCount || 0))
                        .map(agent => (
                          <div key={agent.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                                {agent.avatar_url ? (
                                  <img src={agent.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-5 h-5 text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{agent.full_name}</p>
                                <Badge className={getTeamColor(agent.current_team)} variant="outline">
                                  {agent.current_team?.toUpperCase() || 'SEM EQUIPE'}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">{agent.shiftsCount || 0}</p>
                              <p className="text-sm text-muted-foreground">plantões</p>
                            </div>
                          </div>
                        ))
                      }
                      {agents.every(a => (a.shiftsCount || 0) === 0) && (
                        <p className="text-muted-foreground text-center py-8">
                          Nenhum plantão programado ainda
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Leadership Tab */}
            <TabsContent value="leadership" className="space-y-6">
              {/* President Card */}
              <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-500">
                    <Crown className="w-6 h-6" />
                    Presidente do Sistema Socioeducativo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {unitLeadership
                    .filter(l => l.position_type === 'presidente')
                    .map(leadership => (
                      <div key={leadership.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <Crown className="w-7 h-7 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-lg font-bold">
                              {leadership.full_name || <span className="text-muted-foreground italic">Não informado</span>}
                            </p>
                            {leadership.phone && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {leadership.phone}
                              </div>
                            )}
                            {leadership.email && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                {leadership.email}
                              </div>
                            )}
                            {leadership.notes && (
                              <p className="text-sm text-muted-foreground mt-1">{leadership.notes}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditLeadership(leadership)}
                          className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* Units Leadership */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {['CS Feijó', 'CS Juruá', 'CS Rio Branco', 'CS Purus', 'CS Alto Acre'].map(unitName => (
                  <Card key={unitName}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        {unitName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {unitLeadership
                        .filter(l => l.unit_name === unitName)
                        .sort((a, b) => (a.position_type === 'diretor' ? -1 : 1))
                        .map(leadership => (
                          <div key={leadership.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                leadership.position_type === 'diretor' 
                                  ? 'bg-blue-500/20' 
                                  : 'bg-green-500/20'
                              }`}>
                                {getPositionIcon(leadership.position_type)}
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase text-muted-foreground">
                                  {getPositionLabel(leadership.position_type)}
                                </p>
                                <p className="font-medium">
                                  {leadership.full_name || <span className="text-muted-foreground italic text-sm">Não informado</span>}
                                </p>
                                {leadership.phone && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Phone className="w-3 h-3" />
                                    {leadership.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditLeadership(leadership)}
                              className="h-8 w-8"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-6">
              {/* Billing Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold text-green-500">
                          R$ {totalConfirmedRevenue.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Confirmado</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-8 h-8 text-amber-500" />
                      <div>
                        <p className="text-2xl font-bold text-amber-500">{pendingPayments}</p>
                        <p className="text-xs text-muted-foreground">Pendentes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold text-blue-500">
                          R$ {(currentMonthRevenue?.confirmed || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Mês Atual</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Receipt className="w-8 h-8 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold text-purple-500">R$ 20,00</p>
                        <p className="text-xs text-muted-foreground">Mensalidade</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Revenue */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Faturamento Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyRevenue.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum pagamento registrado ainda
                    </p>
                  ) : (
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {monthlyRevenue.map(rev => (
                          <div key={rev.month} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div>
                              <p className="font-medium">
                                {format(parseISO(`${rev.month}-01`), "MMMM 'de' yyyy", { locale: ptBR })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {rev.count} pagamento(s)
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-500">R$ {rev.confirmed.toFixed(2)}</p>
                              {rev.pending > 0 && (
                                <p className="text-sm text-amber-500">+ R$ {rev.pending.toFixed(2)} pendente</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Pending Payments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Pagamentos Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {licensePayments.filter(p => p.status === 'pending').length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum pagamento pendente
                    </p>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {licensePayments
                          .filter(p => p.status === 'pending')
                          .map(payment => (
                            <div key={payment.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-amber-500/30">
                              <div>
                                <p className="font-medium">{payment.agent?.full_name || 'Agente'}</p>
                                <p className="text-sm text-muted-foreground">
                                  Ref: {format(parseISO(`${payment.payment_month}-01`), "MMM/yyyy", { locale: ptBR })}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Enviado em: {format(parseISO(payment.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <p className="font-bold text-primary">R$ {payment.amount.toFixed(2)}</p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-green-500 text-green-500 hover:bg-green-500/20"
                                    onClick={() => handleConfirmPayment(payment.id)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Confirmar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500 text-red-500 hover:bg-red-500/20"
                                    onClick={() => handleRejectPayment(payment.id)}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Rejeitar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Recent Payments History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-primary" />
                    Histórico de Pagamentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {licensePayments.slice(0, 50).map(payment => (
                        <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              payment.status === 'confirmed' ? 'bg-green-500' :
                              payment.status === 'pending' ? 'bg-amber-500' :
                              'bg-red-500'
                            }`} />
                            <div>
                              <p className="font-medium">{payment.agent?.full_name || 'Agente'}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(parseISO(`${payment.payment_month}-01`), "MMM/yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">R$ {payment.amount.toFixed(2)}</p>
                            <Badge variant={
                              payment.status === 'confirmed' ? 'default' :
                              payment.status === 'pending' ? 'secondary' :
                              'destructive'
                            }>
                              {payment.status === 'confirmed' ? 'Confirmado' :
                               payment.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {licensePayments.length === 0 && (
                        <p className="text-muted-foreground text-center py-8">
                          Nenhum pagamento registrado
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
});

PlantaoMasterDashboard.displayName = 'PlantaoMasterDashboard';

export default PlantaoMasterDashboard;
