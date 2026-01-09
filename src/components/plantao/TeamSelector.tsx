import { useState, useEffect } from 'react';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Check, Shield, Star, Target, Crosshair, ArrowRightLeft, User, Ban, AlertTriangle } from 'lucide-react';
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
    
    // Se já está em uma equipe, não permite trocar diretamente
    if (agent.current_team) {
      setTargetTeam(teamId);
      setShowTransferConfirm(true);
      return;
    }
    
    // Se não tem equipe, pode escolher
    await performTeamJoin(teamId);
  };

  const performTeamJoin = async (teamId: string) => {
    if (!agent?.id) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('transfer_agent_team', {
        p_agent_id: agent.id,
        p_new_team: teamId as any,
      });

      if (error) throw error;

      const storedCredentials = localStorage.getItem('plantao_credentials');
      if (storedCredentials) {
        const credentials = JSON.parse(storedCredentials);
        credentials.team = teamId;
        localStorage.setItem('plantao_credentials', JSON.stringify(credentials));
      }

      toast.success(`Você foi vinculado à Equipe ${teamId.charAt(0).toUpperCase() + teamId.slice(1)}!`);
      onTeamChanged();
      onBack();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao entrar na equipe');
    } finally {
      setLoading(false);
      setShowTransferConfirm(false);
      setTargetTeam(null);
    }
  };

  const currentTeamData = teams.find(t => t.id === agent?.current_team);

  // Se já está em uma equipe, não pode trocar por conta própria
  const canChangeTeam = !agent?.current_team;

  return (
    <div className="space-y-4">
      {/* Transfer Block Dialog */}
      <AlertDialog open={showTransferConfirm} onOpenChange={setShowTransferConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-500">
              <Ban className="w-5 h-5" />
              Transferência Não Permitida
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Você já está vinculado à <strong className="text-foreground">Equipe {agent?.current_team?.toUpperCase()}</strong>.
              </p>
              <p>
                Para trocar de equipe, você precisa solicitar autorização ao administrador.
              </p>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mt-3">
                <p className="text-sm text-amber-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Não é permitido estar em duas equipes diferentes simultaneamente.
                    Entre em contato com o administrador para solicitar sua transferência.
                  </span>
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowTransferConfirm(false)}>
              Entendido
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
            {canChangeTeam ? 'Escolher Equipe' : 'Minha Equipe'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {canChangeTeam 
              ? 'Selecione a equipe à qual você deseja se vincular' 
              : 'Você está vinculado a esta equipe'
            }
          </p>
        </div>
      </div>

      {/* Current Team Info */}
      {agent?.current_team && currentTeamData && (
        <Card className={`border-2 ${currentTeamData.borderColor} ${currentTeamData.bgColor}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <currentTeamData.icon className={`w-5 h-5 ${currentTeamData.textColor}`} />
                Sua Equipe
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
                          <p className={`text-sm font-medium truncate ${isCurrentUser ? 'text-white' : 'text-foreground'}`}>
                            {member.full_name}
                          </p>
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

            {/* Info about team transfer */}
            <div className="p-3 rounded-lg bg-card border border-border">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                <span>
                  Para trocar de equipe, entre em contato com o administrador. 
                  Não é possível transferir-se diretamente.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Selection (only if not in a team) */}
      {canChangeTeam && (
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowRightLeft className="w-5 h-5 text-primary" /> 
              Escolher Equipe
            </CardTitle>
            <CardDescription>
              Selecione a equipe à qual você deseja se vincular
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => handleSelectTeam(team.id)}
                disabled={loading}
                className={`
                  relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 
                  transition-all duration-300 min-h-[100px]
                  border-border/50 hover:border-primary/50 bg-background/50 hover:bg-background/80 cursor-pointer
                `}
              >
                <team.icon className="w-8 h-8 text-muted-foreground" />
                <span className="font-bold text-sm text-foreground">
                  {team.name.replace('Equipe ', '')}
                </span>
                <span className="text-[10px] text-muted-foreground">{team.subtitle}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Other Teams (view only when already in a team) */}
      {!canChangeTeam && (
        <Card className="border-border/50 bg-card/80 backdrop-blur opacity-60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">
              <Users className="w-5 h-5" /> 
              Outras Equipes
            </CardTitle>
            <CardDescription>
              Você não pode se transferir para outra equipe sem autorização
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {teams.filter(t => t.id !== agent?.current_team).map((team) => (
              <div
                key={team.id}
                className="relative p-4 rounded-xl border-2 border-border/30 flex flex-col items-center justify-center gap-2 min-h-[100px] cursor-not-allowed"
              >
                <Ban className="absolute top-2 right-2 w-4 h-4 text-destructive/50" />
                <team.icon className="w-8 h-8 text-muted-foreground/50" />
                <span className="font-bold text-sm text-muted-foreground/50">
                  {team.name.replace('Equipe ', '')}
                </span>
                <span className="text-[10px] text-muted-foreground/50">{team.subtitle}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-border/50">
        <CardContent className="py-4">
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="flex items-start gap-2">
              <Ban className="w-4 h-4 flex-shrink-0 mt-0.5 text-destructive" />
              <span>Não é permitido estar em duas equipes diferentes simultaneamente.</span>
            </p>
            <p className="flex items-start gap-2">
              <Ban className="w-4 h-4 flex-shrink-0 mt-0.5 text-destructive" />
              <span>Transferências de equipe requerem autorização do administrador.</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground pt-4">Developed by Franc Denis</p>
    </div>
  );
};

export default TeamSelector;
