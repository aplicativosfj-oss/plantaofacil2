import { useState } from 'react';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Check } from 'lucide-react';
import { toast } from 'sonner';

const teams = [
  { id: 'alfa', name: 'Equipe Alfa', color: 'bg-team-alfa' },
  { id: 'bravo', name: 'Equipe Bravo', color: 'bg-team-bravo' },
  { id: 'charlie', name: 'Equipe Charlie', color: 'bg-team-charlie' },
  { id: 'delta', name: 'Equipe Delta', color: 'bg-team-delta' },
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
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" /> Selecionar Equipe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => handleSelectTeam(team.id)}
              disabled={loading || agent?.current_team === team.id}
              className={`w-full p-4 rounded-lg border-2 flex items-center justify-between transition-all ${
                agent?.current_team === team.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${team.color}`} />
                <span className="font-medium">{team.name}</span>
              </div>
              {agent?.current_team === team.id && <Check className="w-5 h-5 text-primary" />}
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamSelector;
