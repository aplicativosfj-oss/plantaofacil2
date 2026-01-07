import { useState, useEffect } from 'react';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Check, Shield, Star, Target, Crosshair, LogOut, ArrowRightLeft, User, Phone, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import teamsBg from '@/assets/teams-bg.png';
import plantaoLogo from '@/assets/plantao-logo.png';
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

interface TeamMember {
  id: string;
  full_name: string;
  registration_number: string | null;
  phone: string | null;
  avatar_url: string | null;
}

const teams = [
  { 
    id: 'alfa', 
    name: 'Equipe Alfa', 
    color: 'from-blue-500 to-blue-700',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-400',
    icon: Shield,
    subtitle: 'Força Tática'
  },
  { 
    id: 'bravo', 
    name: 'Equipe Bravo', 
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500',
    textColor: 'text-amber-400',
    icon: Star,
    subtitle: 'Operações Especiais'
  },
  { 
    id: 'charlie', 
    name: 'Equipe Charlie', 
    color: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-400',
    icon: Target,
    subtitle: 'Pronta Resposta'
  },
  { 
    id: 'delta', 
    name: 'Equipe Delta', 
    color: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500',
    textColor: 'text-red-400',
    icon: Crosshair,
    subtitle: 'Intervenção Rápida'
  },
];

interface Props {
  onBack: () => void;
  onTeamChanged: () => void;
}

const TeamSelector = ({ onBack, onTeamChanged }: Props) => {
  const { agent } = usePlantaoAuth();
  const [loading, setLoading] = useState(false);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [targetTeam, setTargetTeam] = useState<string | null>(null);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Fetch team members
  useEffect(() => {
    if (!agent?.current_team) {
      setLoadingMembers(false);
      return;
    }

    const fetchTeamMembers = async () => {
      setLoadingMembers(true);
      const { data, error } = await supabase
        .from('agents')
        .select('id, full_name, registration_number, phone, avatar_url')
        .eq('current_team', agent.current_team)
        .eq('is_active', true)
        .order('full_name');

      if (data && !error) {
        // Sort to put current user first
        const sorted = data.sort((a, b) => {
          if (a.id === agent.id) return -1;
          if (b.id === agent.id) return 1;
          return a.full_name.localeCompare(b.full_name);
        });
        setMembers(sorted);
      }
      setLoadingMembers(false);
    };

    fetchTeamMembers();

    // Subscribe to changes
    const channel = supabase
      .channel('team-members-selector')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agents',
        filter: `current_team=eq.${agent.current_team}`,
      }, fetchTeamMembers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agent?.current_team, agent?.id]);

  const handleSelectTeam = async (teamId: string) => {
    if (!agent?.id) return;
    
    if (agent.current_team && agent.current_team !== teamId) {
      // If already in a team, show transfer confirmation
      setTargetTeam(teamId);
      setShowTransferConfirm(true);
      return;
    }
    
    await performTeamTransfer(teamId);
  };

  const performTeamTransfer = async (teamId: string) => {
    if (!agent?.id) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('transfer_agent_team', {
        p_agent_id: agent.id,
        p_new_team: teamId as any,
      });

      if (error) throw error;

      // Update localStorage with new team
      const storedCredentials = localStorage.getItem('plantao_credentials');
      if (storedCredentials) {
        const credentials = JSON.parse(storedCredentials);
        credentials.team = teamId;
        localStorage.setItem('plantao_credentials', JSON.stringify(credentials));
      }

      toast.success(`Você foi transferido para a Equipe ${teamId.charAt(0).toUpperCase() + teamId.slice(1)}!`);
      onTeamChanged();
      onBack();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao mudar de equipe');
    } finally {
      setLoading(false);
      setShowTransferConfirm(false);
      setTargetTeam(null);
    }
  };

  const handleUnlink = async () => {
    if (!agent?.id) return;
    setLoading(true);

    try {
      // Set current_team to null
      const { error } = await supabase
        .from('agents')
        .update({ current_team: null, team_joined_at: null })
        .eq('id', agent.id);

      if (error) throw error;

      // Update localStorage
      const storedCredentials = localStorage.getItem('plantao_credentials');
      if (storedCredentials) {
        localStorage.removeItem('plantao_credentials');
      }

      toast.success('Você foi desvinculado da equipe. Faça login novamente para escolher uma nova equipe.');
      onTeamChanged();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao desvincular da equipe');
    } finally {
      setLoading(false);
      setShowUnlinkConfirm(false);
    }
  };

  const currentTeamData = teams.find(t => t.id === agent?.current_team);

  return (
    <div className="space-y-4">
      {/* Transfer Confirmation Dialog */}
      <AlertDialog open={showTransferConfirm} onOpenChange={setShowTransferConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              Confirmar Transferência
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a ser transferido da <strong className="text-foreground">Equipe {agent?.current_team?.toUpperCase()}</strong> para a <strong className="text-foreground">Equipe {targetTeam?.toUpperCase()}</strong>.
              <br /><br />
              Esta ação é imediata e você passará a fazer parte da nova equipe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => targetTeam && performTeamTransfer(targetTeam)}
              disabled={loading}
            >
              {loading ? 'Transferindo...' : 'Confirmar Transferência'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={showUnlinkConfirm} onOpenChange={setShowUnlinkConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <LogOut className="w-5 h-5" />
              Desvincular da Equipe
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você será desvinculado da <strong className="text-foreground">Equipe {agent?.current_team?.toUpperCase()}</strong>.
              <br /><br />
              Após o desvinculo, você precisará fazer login novamente e poderá escolher uma nova equipe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUnlink}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? 'Desvinculando...' : 'Confirmar Desvinculo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <img src={plantaoLogo} alt="PlantãoPro" className="h-8 w-auto object-contain opacity-70" />
      </div>

      {/* Team Banner */}
      <div className="relative rounded-xl overflow-hidden h-48 mb-6">
        <img 
          src={teamsBg} 
          alt="Equipes" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-2xl font-display tracking-wide text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Gerenciar Equipe
          </h2>
          <p className="text-sm text-muted-foreground">Transfira-se ou desvincule-se da sua equipe</p>
        </div>
      </div>

      {/* Current Team Info with Unlink Option */}
      {agent?.current_team && currentTeamData && (
        <Card className={`border-2 ${currentTeamData.borderColor} ${currentTeamData.bgColor}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <currentTeamData.icon className={`w-5 h-5 ${currentTeamData.textColor}`} />
                Sua Equipe Atual
              </div>
              <Badge className={`bg-gradient-to-r ${currentTeamData.color} text-white border-0`}>
                {currentTeamData.name}
              </Badge>
            </CardTitle>
            <CardDescription>
              Você está vinculado a esta equipe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Team Members */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Membros da Equipe ({members.length})
              </p>
              
              {loadingMembers ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum membro encontrado
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {members.map((member, index) => {
                    const isCurrentUser = member.id === agent.id;
                    
                    return (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                          flex items-center gap-3 p-2 rounded-lg
                          ${isCurrentUser 
                            ? `bg-gradient-to-r ${currentTeamData.color} text-white` 
                            : 'bg-muted/30'
                          }
                        `}
                      >
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                          ${isCurrentUser ? 'bg-white/20' : 'bg-primary/10'}
                        `}>
                          {member.avatar_url ? (
                            <img 
                              src={member.avatar_url} 
                              alt={member.full_name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className={`w-4 h-4 ${isCurrentUser ? 'text-white' : 'text-primary'}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className={`text-sm font-medium truncate ${isCurrentUser ? 'text-white' : 'text-foreground'}`}>
                              {member.full_name}
                            </p>
                            {isCurrentUser && <Crown className="w-3 h-3 text-yellow-300 flex-shrink-0" />}
                          </div>
                          <p className={`text-xs truncate ${isCurrentUser ? 'text-white/70' : 'text-muted-foreground'}`}>
                            Mat: {member.registration_number || 'N/A'}
                          </p>
                        </div>
                        {isCurrentUser && (
                          <Badge className="bg-white/20 text-white border-0 text-[10px]">
                            Você
                          </Badge>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Unlink Button */}
            <Button
              variant="outline"
              className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => setShowUnlinkConfirm(true)}
              disabled={loading}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Desvincular desta Equipe
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Transfer to Another Team */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowRightLeft className="w-5 h-5 text-primary" /> 
            {agent?.current_team ? 'Transferir para Outra Equipe' : 'Escolher Equipe'}
          </CardTitle>
          <CardDescription>
            {agent?.current_team 
              ? 'Selecione a equipe para qual deseja ser transferido'
              : 'Selecione a equipe à qual você deseja se vincular'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {teams.map((team) => {
            const isSelected = agent?.current_team === team.id;
            
            return (
              <button
                key={team.id}
                onClick={() => handleSelectTeam(team.id)}
                disabled={loading || isSelected}
                className={`
                  relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 
                  transition-all duration-300 min-h-[100px]
                  ${isSelected 
                    ? `${team.borderColor} ${team.bgColor} ring-2 ring-offset-2 ring-offset-background ring-primary/50 opacity-50 cursor-not-allowed` 
                    : 'border-border/50 hover:border-primary/50 bg-background/50 hover:bg-background/80 cursor-pointer'
                  }
                `}
              >
                <team.icon className={`w-8 h-8 ${isSelected ? team.textColor : 'text-muted-foreground'}`} />
                <span className={`font-bold text-sm ${isSelected ? team.textColor : 'text-foreground'}`}>
                  {team.name.replace('Equipe ', '')}
                </span>
                <span className="text-[10px] text-muted-foreground">{team.subtitle}</span>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className={`w-5 h-5 ${team.textColor}`} />
                  </div>
                )}
                {isSelected && (
                  <span className="text-xs text-muted-foreground mt-1">Atual</span>
                )}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {agent?.current_team && (
        <p className="text-center text-sm text-muted-foreground">
          Você está atualmente na <strong className="text-primary">Equipe {agent.current_team.charAt(0).toUpperCase() + agent.current_team.slice(1)}</strong>
        </p>
      )}

      <p className="text-center text-xs text-muted-foreground pt-4">Developed by Franc Denis</p>
    </div>
  );
};

export default TeamSelector;
