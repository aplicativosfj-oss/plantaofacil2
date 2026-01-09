import { useState, useEffect } from 'react';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Building, ArrowRightLeft, Trash2, Loader2, AlertTriangle, CheckCircle, MapPin, IdCard, Ban, Send, Clock, Phone, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransferRequest {
  id: string;
  current_unit: string;
  requested_unit: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  review_notes?: string;
  created_at: string;
}

interface Props {
  onBack: () => void;
  onAccountDeleted?: () => void;
}

const UnitTransferPanel = ({ onBack, onAccountDeleted }: Props) => {
  const { agent, refreshAgent, signOut } = usePlantaoAuth();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransferRequest, setShowTransferRequest] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [targetUnit, setTargetUnit] = useState('');
  const [pendingRequest, setPendingRequest] = useState<TransferRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [units, setUnits] = useState<{ id: string; name: string; is_active: boolean }[]>([]);

  // Fetch units and pending transfer request
  useEffect(() => {
    const fetchData = async () => {
      if (!agent?.id) return;
      
      // Fetch units
      const { data: unitsData } = await supabase
        .from('units')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name');
      
      if (unitsData) {
        setUnits(unitsData);
      }

      // Fetch pending request
      const { data: requestData } = await supabase
        .from('unit_transfer_requests')
        .select('*')
        .eq('agent_id', agent.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (requestData) {
        setPendingRequest(requestData as TransferRequest);
      }
      
      setLoadingRequest(false);
    };

    fetchData();
  }, [agent?.id]);

  const handleSubmitTransferRequest = async () => {
    if (!agent?.id || !targetUnit || !transferReason.trim()) {
      toast.error('Preencha a unidade destino e o motivo da transferência');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('unit_transfer_requests')
        .insert({
          agent_id: agent.id,
          current_unit: agent.unit || 'Não definida',
          requested_unit: targetUnit,
          reason: transferReason.trim(),
        });

      if (error) throw error;

      toast.success(
        <div className="space-y-1">
          <p className="font-bold">✅ Solicitação Enviada</p>
          <p>Sua solicitação de transferência foi enviada para análise do administrador.</p>
        </div>,
        { duration: 5000 }
      );

      // Refresh pending request
      const { data: newRequest } = await supabase
        .from('unit_transfer_requests')
        .select('*')
        .eq('agent_id', agent.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (newRequest) {
        setPendingRequest(newRequest as TransferRequest);
      }

      setShowTransferRequest(false);
      setTransferReason('');
      setTargetUnit('');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar solicitação de transferência');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!pendingRequest?.id) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('unit_transfer_requests')
        .delete()
        .eq('id', pendingRequest.id);

      if (error) throw error;

      toast.success('Solicitação cancelada');
      setPendingRequest(null);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao cancelar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!agent?.id || deleteConfirmText !== 'EXCLUIR') return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('agents')
        .update({ 
          is_active: false,
          current_team: null,
          team_joined_at: null
        })
        .eq('id', agent.id);

      if (error) throw error;

      localStorage.removeItem('plantao_credentials');

      toast.success(
        <div className="space-y-1">
          <p className="font-bold">✅ Conta Desativada</p>
          <p>Sua conta foi desativada com sucesso.</p>
          <p className="text-xs opacity-80">Entre em contato com o administrador caso queira reativar.</p>
        </div>,
        { duration: 5000 }
      );

      if (onAccountDeleted) {
        onAccountDeleted();
      } else {
        signOut();
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao desativar conta');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />Aguardando</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Aprovada</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30"><Ban className="w-3 h-3 mr-1" />Rejeitada</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Desativar Conta
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Você está prestes a desativar sua conta. Esta ação irá:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Desvinculá-lo de sua equipe atual</li>
                <li>Impedir seu acesso ao sistema</li>
                <li>Liberar sua matrícula para outro uso</li>
              </ul>
              <p className="text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Para reativar, entre em contato com o administrador.
              </p>
              <div className="pt-2">
                <Label htmlFor="confirm-delete" className="text-xs">
                  Digite <strong>EXCLUIR</strong> para confirmar:
                </Label>
                <Input
                  id="confirm-delete"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="EXCLUIR"
                  className="mt-1"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              disabled={loading || deleteConfirmText !== 'EXCLUIR'}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? 'Desativando...' : 'Desativar Conta'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Request Dialog */}
      <AlertDialog open={showTransferRequest} onOpenChange={setShowTransferRequest}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Solicitar Transferência de Unidade
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="text-amber-500 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Transferências de unidade precisam de autorização do administrador.</span>
              </p>
              
              <div className="space-y-2">
                <Label>Unidade de destino</Label>
                <Select value={targetUnit} onValueChange={setTargetUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.filter(u => u.name !== agent?.unit).map((unit) => (
                      <SelectItem key={unit.id} value={unit.name}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Motivo da transferência *</Label>
                <Textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="Descreva o motivo da sua solicitação de transferência..."
                  rows={3}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSubmitTransferRequest}
              disabled={loading || !targetUnit || !transferReason.trim()}
            >
              {loading ? 'Enviando...' : 'Enviar Solicitação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <h2 className="text-lg font-semibold">Gerenciar Unidade</h2>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" />
            Sua Unidade Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{agent?.unit || 'Não definida'}</p>
                <p className="text-xs text-muted-foreground">{agent?.city || 'Cidade não definida'}</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ativa
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <IdCard className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-medium font-mono">{agent?.registration_number || 'Sem matrícula'}</p>
                <p className="text-xs text-muted-foreground">Matrícula funcional</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Transfer Request */}
      {loadingRequest ? (
        <Card>
          <CardContent className="py-6 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : pendingRequest ? (
        <Card className="border-amber-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Solicitação de Transferência Pendente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Unidade solicitada:</span>
                {getStatusBadge(pendingRequest.status)}
              </div>
              <p className="font-medium">{pendingRequest.requested_unit}</p>
              <p className="text-xs text-muted-foreground mt-2">Motivo: {pendingRequest.reason}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Enviado em: {new Date(pendingRequest.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={handleCancelRequest}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Cancelar Solicitação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              Transferência de Unidade
            </CardTitle>
            <CardDescription>
              Precisa trocar de unidade? Envie uma solicitação ao administrador.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Atenção:</strong> Transferências de unidade requerem autorização do administrador. 
                  Você não pode se transferir diretamente para outra unidade.
                </span>
              </p>
            </div>

            <Button
              className="w-full"
              onClick={() => setShowTransferRequest(true)}
            >
              <Send className="w-4 h-4 mr-2" />
              Solicitar Transferência
            </Button>

            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <MessageCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Caso tenha urgência, entre em contato diretamente com o administrador.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info about restrictions */}
      <Card className="border-border/50">
        <CardContent className="py-4">
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="flex items-start gap-2">
              <Ban className="w-4 h-4 flex-shrink-0 mt-0.5 text-destructive" />
              <span>Não é permitido estar cadastrado em duas unidades diferentes simultaneamente.</span>
            </p>
            <p className="flex items-start gap-2">
              <Ban className="w-4 h-4 flex-shrink-0 mt-0.5 text-destructive" />
              <span>Um mesmo CPF não pode estar vinculado a múltiplas unidades ou equipes.</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Ações irreversíveis - use com cuidado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Desativar Minha Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnitTransferPanel;