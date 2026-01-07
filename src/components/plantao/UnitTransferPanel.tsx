import { useState } from 'react';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Building, ArrowRightLeft, Trash2, Loader2, AlertTriangle, CheckCircle, MapPin, IdCard, Ban } from 'lucide-react';
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

const UNITS = [
  { id: 'cs-feijo', name: 'CS Feijó', active: true },
  { id: 'cs-jurua', name: 'CS Juruá', active: false },
  { id: 'cs-rio-branco', name: 'CS Rio Branco', active: false },
  { id: 'cs-purus', name: 'CS Purus', active: false },
  { id: 'cs-alto-acre', name: 'CS Alto Acre', active: false },
];

interface Props {
  onBack: () => void;
  onAccountDeleted?: () => void;
}

const UnitTransferPanel = ({ onBack, onAccountDeleted }: Props) => {
  const { agent, refreshAgent, signOut } = usePlantaoAuth();
  const [loading, setLoading] = useState(false);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRemoveRegistrationConfirm, setShowRemoveRegistrationConfirm] = useState(false);
  const [targetUnit, setTargetUnit] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleTransferUnit = async () => {
    if (!agent?.id || !targetUnit) return;
    setLoading(true);

    try {
      // For now, only CS Feijó is active
      if (targetUnit !== 'CS Feijó') {
        toast.error(
          <div className="space-y-1">
            <p className="font-bold">🚫 Transferência Indisponível</p>
            <p>A unidade <strong>{targetUnit}</strong> ainda não está ativa no sistema.</p>
            <p className="text-xs opacity-80">Entre em contato com o administrador.</p>
          </div>,
          { duration: 5000 }
        );
        setLoading(false);
        setShowTransferConfirm(false);
        return;
      }

      // Update agent's unit
      const { error } = await supabase
        .from('agents')
        .update({ 
          unit: targetUnit,
          // Reset team when changing units
          current_team: null,
          team_joined_at: null
        })
        .eq('id', agent.id);

      if (error) throw error;

      // Clear local storage credentials
      localStorage.removeItem('plantao_credentials');

      toast.success(
        <div className="space-y-1">
          <p className="font-bold">✅ Transferência Realizada</p>
          <p>Você foi transferido para <strong>{targetUnit}</strong>.</p>
          <p className="text-xs opacity-80">Faça login novamente para escolher sua equipe.</p>
        </div>,
        { duration: 5000 }
      );

      await refreshAgent();
      signOut();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao transferir de unidade');
    } finally {
      setLoading(false);
      setShowTransferConfirm(false);
      setTargetUnit(null);
    }
  };

  const handleRemoveRegistration = async () => {
    if (!agent?.id) return;
    setLoading(true);

    try {
      // Remove registration number
      const { error } = await supabase
        .from('agents')
        .update({ registration_number: null })
        .eq('id', agent.id);

      if (error) throw error;

      toast.success('Matrícula removida com sucesso!');
      await refreshAgent();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover matrícula');
    } finally {
      setLoading(false);
      setShowRemoveRegistrationConfirm(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!agent?.id || deleteConfirmText !== 'EXCLUIR') return;
    setLoading(true);

    try {
      // Deactivate the agent account
      const { error } = await supabase
        .from('agents')
        .update({ 
          is_active: false,
          current_team: null,
          team_joined_at: null
        })
        .eq('id', agent.id);

      if (error) throw error;

      // Clear local storage
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

  return (
    <div className="space-y-4">
      {/* Transfer Unit Confirmation Dialog */}
      <AlertDialog open={showTransferConfirm} onOpenChange={setShowTransferConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              Confirmar Transferência de Unidade
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a ser transferido da unidade <strong className="text-foreground">{agent?.unit}</strong> para <strong className="text-foreground">{targetUnit}</strong>.
              <br /><br />
              <span className="text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Você será desvinculado da sua equipe atual e precisará fazer login novamente.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleTransferUnit}
              disabled={loading}
            >
              {loading ? 'Transferindo...' : 'Confirmar Transferência'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Registration Confirmation Dialog */}
      <AlertDialog open={showRemoveRegistrationConfirm} onOpenChange={setShowRemoveRegistrationConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-500">
              <IdCard className="w-5 h-5" />
              Remover Matrícula
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a remover sua matrícula <strong className="text-foreground">{agent?.registration_number}</strong>.
              <br /><br />
              Isso permitirá que você cadastre uma nova matrícula ou que outra pessoa use esta matrícula.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveRegistration}
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {loading ? 'Removendo...' : 'Confirmar Remoção'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <h2 className="text-lg font-semibold">Gerenciar Unidade e Matrícula</h2>
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
            {agent?.registration_number && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                onClick={() => setShowRemoveRegistrationConfirm(true)}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Remover
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transfer Unit */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            Transferir de Unidade
          </CardTitle>
          <CardDescription>
            Solicite transferência para outra unidade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Selecione a nova unidade</Label>
            <Select onValueChange={(value) => {
              if (value === agent?.unit) {
                toast.info('Você já está nesta unidade');
                return;
              }
              const unit = UNITS.find(u => u.name === value);
              if (unit && !unit.active) {
                toast.error(
                  <div className="space-y-1">
                    <p className="font-bold">🚫 Unidade Indisponível</p>
                    <p>{value} ainda não está ativa no sistema.</p>
                  </div>
                );
                return;
              }
              setTargetUnit(value);
              setShowTransferConfirm(true);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha a unidade de destino" />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((unit) => (
                  <SelectItem 
                    key={unit.id} 
                    value={unit.name}
                    disabled={unit.name === agent?.unit}
                    className={!unit.active ? 'opacity-60' : ''}
                  >
                    <span className="flex items-center gap-2">
                      {unit.name}
                      {unit.name === agent?.unit && (
                        <Badge variant="outline" className="text-[10px] py-0">Atual</Badge>
                      )}
                      {!unit.active && (
                        <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Ban className="w-3 h-3" />
                          Em breve
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Ao transferir de unidade, você será desvinculado da sua equipe atual e precisará escolher uma nova equipe na unidade de destino.
              </span>
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
