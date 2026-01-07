import { useState } from 'react';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Check, Shield, Star, Target, Crosshair } from 'lucide-react';
import { toast } from 'sonner';
import teamsBg from '@/assets/teams-bg.png';
import plantaoLogo from '@/assets/plantao-logo.png';

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

  const handleSelectTeam = async (teamId: string) => {
    if (!agent?.id) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('transfer_agent_team', {
        p_agent_id: agent.id,
        p_new_team: teamId as any,
      });

      if (error) throw error;

      toast.success(`Você foi transferido para a Equipe ${teamId.charAt(0).toUpperCase() + teamId.slice(1)}!`);
      onTeamChanged();
      onBack();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao mudar de equipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
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
            Escolha sua Equipe
          </h2>
          <p className="text-sm text-muted-foreground">Selecione a equipe à qual você pertence</p>
        </div>
      </div>

      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5" /> Equipes Disponíveis
          </CardTitle>
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
                    ? `${team.borderColor} ${team.bgColor} ring-2 ring-offset-2 ring-offset-background ring-primary/50` 
                    : 'border-border/50 hover:border-primary/50 bg-background/50 hover:bg-background/80'
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
