import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, User, Crown, Phone, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { differenceInMinutes, parseISO } from 'date-fns';
import AgentProfileDialog from './AgentProfileDialog';
import ChangePasswordDialog from './ChangePasswordDialog';
import MemberProfileDialog from './MemberProfileDialog';
import TeamChat from './TeamChat';

interface TeamMember {
  id: string;
  full_name: string;
  registration_number: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface PresenceMap {
  [agentId: string]: boolean;
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
  const [presenceMap, setPresenceMap] = useState<PresenceMap>({});
  const [loading, setLoading] = useState(true);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showMemberProfile, setShowMemberProfile] = useState(false);
  const [showTeamChat, setShowTeamChat] = useState(false);

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

    const fetchPresences = async () => {
      const { data } = await supabase
        .from('agent_presence')
        .select('agent_id, last_seen');

      if (data) {
        const map: PresenceMap = {};
        data.forEach(p => {
          if (p.last_seen) {
            const diffMinutes = differenceInMinutes(new Date(), parseISO(p.last_seen));
            map[p.agent_id] = diffMinutes < 5;
          }
        });
        setPresenceMap(map);
      }
    };

    fetchTeamMembers();
    fetchPresences();

    // Refresh presence every 30 seconds
    const presenceInterval = setInterval(fetchPresences, 30000);

    // Subscribe to changes
    const channel = supabase
      .channel('team-members-presence')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agents',
        filter: `current_team=eq.${agent.current_team}`,
      }, fetchTeamMembers)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_presence',
      }, fetchPresences)
      .subscribe();

    return () => {
      clearInterval(presenceInterval);
      supabase.removeChannel(channel);
    };
  }, [agent?.current_team, agent?.id]);

  const handleMemberClick = (memberId: string) => {
    if (memberId === agent?.id) {
      setShowProfileDialog(true);
    } else {
      setSelectedMemberId(memberId);
      setShowMemberProfile(true);
    }
  };

  const handleStartChat = (memberId: string) => {
    setShowTeamChat(true);
  };

  if (!agent?.current_team) {
    return null;
  }

  const teamName = agent.current_team.charAt(0).toUpperCase() + agent.current_team.slice(1);
  const onlineCount = members.filter(m => presenceMap[m.id]).length;

  return (
    <>
      <Card className={`border ${getTeamBgColor(agent.current_team)}`}>
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="flex items-center justify-between text-sm text-foreground">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Equipe {teamName}
            </div>
            <div className="flex items-center gap-1.5">
              {onlineCount > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1 border-green-500/50 text-green-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {onlineCount}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px]">
                {members.length}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          ) : members.length === 0 ? (
            <p className="text-muted-foreground text-center py-3 text-xs">Nenhum membro</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {members.map((member, index) => {
                const isCurrentUser = member.id === agent.id;
                const isOnline = presenceMap[member.id];
                
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleMemberClick(member.id)}
                    className={`
                      flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer
                      ${isCurrentUser 
                        ? `bg-gradient-to-r ${getTeamColor(agent.current_team)} text-white shadow-md` 
                        : 'bg-muted/30 hover:bg-muted/50'
                      }
                    `}
                  >
                    {/* Avatar with online indicator */}
                    <div className="relative flex-shrink-0">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center overflow-hidden
                        ${isCurrentUser ? 'bg-white/20' : 'bg-primary/10'}
                      `}>
                        {member.avatar_url ? (
                          <img 
                            src={member.avatar_url} 
                            alt={member.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className={`w-4 h-4 ${isCurrentUser ? 'text-white' : 'text-primary'}`} />
                        )}
                      </div>
                      {/* Online Indicator */}
                      <div className={`
                        absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2
                        ${isCurrentUser ? 'border-primary' : 'border-card'}
                        ${isOnline ? 'bg-green-500' : 'bg-gray-400'}
                      `} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className={`text-xs font-medium truncate ${isCurrentUser ? 'text-white' : 'text-foreground'}`}>
                          {member.full_name}
                        </p>
                        {isCurrentUser && (
                          <Crown className="w-3 h-3 text-yellow-300 flex-shrink-0" />
                        )}
                      </div>
                      <p className={`text-[10px] truncate ${isCurrentUser ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {member.registration_number || 'N/A'}
                      </p>
                    </div>

                    {/* Actions */}
                    {!isCurrentUser && (
                      <div className="flex items-center gap-1">
                        {isOnline && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartChat(member.id);
                            }}
                            className="p-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                            title="Enviar mensagem"
                          >
                            <MessageCircle className="w-3 h-3 text-primary" />
                          </button>
                        )}
                        {member.phone && (
                          <a 
                            href={`tel:${member.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                            title="Ligar"
                          >
                            <Phone className="w-3 h-3 text-primary" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* You badge */}
                    {isCurrentUser && (
                      <Badge className="bg-white/20 text-white border-0 text-[10px] px-1.5 py-0">
                        Você
                      </Badge>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Dialog (for current user) */}
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

      {/* Member Profile Dialog (for other members) */}
      <MemberProfileDialog
        isOpen={showMemberProfile}
        onClose={() => setShowMemberProfile(false)}
        memberId={selectedMemberId}
        onStartChat={handleStartChat}
      />

      {/* Team Chat */}
      <TeamChat
        isOpen={showTeamChat}
        onClose={() => setShowTeamChat(false)}
      />
    </>
  );
};

export default TeamMembersCard;