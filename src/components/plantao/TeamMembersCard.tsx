import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, User, Crown, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import AgentProfileDialog from './AgentProfileDialog';
import ChangePasswordDialog from './ChangePasswordDialog';

interface TeamMember {
  id: string;
  full_name: string;
  registration_number: string | null;
  phone: string | null;
  avatar_url: string | null;
}

const getTeamColor = (team: string | null) => {
  switch (team) {
    case 'alfa': return 'from-blue-500 to-blue-700';
    case 'bravo': return 'from-amber-500 to-orange-600';
    case 'charlie': return 'from-sky-400 to-blue-600';
    case 'delta': return 'from-green-500 to-emerald-600';
    default: return 'from-muted to-muted';
  }
};

const getTeamBgColor = (team: string | null) => {
  switch (team) {
    case 'alfa': return 'bg-blue-500/10 border-blue-500/30';
    case 'bravo': return 'bg-amber-500/10 border-amber-500/30';
    case 'charlie': return 'bg-sky-500/10 border-sky-500/30';
    case 'delta': return 'bg-green-500/10 border-green-500/30';
    default: return 'bg-muted/10 border-muted/30';
  }
};

const TeamMembersCard = () => {
  const { agent } = usePlantaoAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  useEffect(() => {
    if (!agent?.current_team) {
      setLoading(false);
      return;
    }

    const fetchTeamMembers = async () => {
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
      setLoading(false);
    };

    fetchTeamMembers();

    // Subscribe to changes
    const channel = supabase
      .channel('team-members')
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

  if (!agent?.current_team) {
    return null;
  }

  const teamName = agent.current_team.charAt(0).toUpperCase() + agent.current_team.slice(1);

  return (
    <>
      <Card className={`border ${getTeamBgColor(agent.current_team)}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Equipe {teamName}
            </div>
            <Badge variant="outline" className="text-xs">
              {members.length} {members.length === 1 ? 'membro' : 'membros'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : members.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum membro na equipe</p>
          ) : (
            <div className="space-y-2">
              {members.map((member, index) => {
                const isCurrentUser = member.id === agent.id;
                
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      boxShadow: isCurrentUser 
                        ? ['0 0 0 0 rgba(251, 191, 36, 0)', '0 0 20px 4px rgba(251, 191, 36, 0.4)', '0 0 0 0 rgba(251, 191, 36, 0)']
                        : 'none'
                    }}
                    transition={{ 
                      delay: index * 0.05,
                      boxShadow: isCurrentUser ? {
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      } : undefined
                    }}
                    whileHover={isCurrentUser ? { 
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    } : undefined}
                    whileTap={isCurrentUser ? { scale: 0.98 } : undefined}
                    onClick={isCurrentUser ? () => setShowProfileDialog(true) : undefined}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg transition-all
                      ${isCurrentUser 
                        ? `bg-gradient-to-r ${getTeamColor(agent.current_team)} text-white shadow-lg cursor-pointer ring-2 ring-yellow-400/50` 
                        : 'bg-muted/30 hover:bg-muted/50'
                      }
                    `}
                  >
                    {/* Avatar */}
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                      ${isCurrentUser ? 'bg-white/20' : 'bg-primary/10'}
                    `}>
                      {member.avatar_url ? (
                        <img 
                          src={member.avatar_url} 
                          alt={member.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className={`w-5 h-5 ${isCurrentUser ? 'text-white' : 'text-primary'}`} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium truncate ${isCurrentUser ? 'text-white' : 'text-foreground'}`}>
                          {member.full_name}
                        </p>
                        {isCurrentUser && (
                          <motion.div
                            animate={{ 
                              rotate: [0, -10, 10, -10, 0],
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 3
                            }}
                          >
                            <Crown className="w-4 h-4 text-yellow-300 flex-shrink-0" />
                          </motion.div>
                        )}
                      </div>
                      <p className={`text-sm truncate ${isCurrentUser ? 'text-white/80' : 'text-muted-foreground'}`}>
                        Mat: {member.registration_number || 'N/A'}
                      </p>
                    </div>

                    {/* Phone (if available and not current user) */}
                    {member.phone && !isCurrentUser && (
                      <a 
                        href={`tel:${member.phone}`}
                        className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                        title="Ligar"
                      >
                        <Phone className="w-4 h-4 text-primary" />
                      </a>
                    )}

                    {/* You badge */}
                    {isCurrentUser && (
                      <motion.div
                        animate={{ 
                          scale: [1, 1.05, 1]
                        }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      >
                        <Badge className="bg-white/20 text-white border-0 text-xs hover:bg-white/30">
                          Você
                        </Badge>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Dialog */}
      <AgentProfileDialog
        isOpen={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
        onChangePassword={() => {
          setShowProfileDialog(false);
          setShowPasswordDialog(true);
        }}
      />

      {/* Password Dialog */}
      <ChangePasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
      />
    </>
  );
};

export default TeamMembersCard;
