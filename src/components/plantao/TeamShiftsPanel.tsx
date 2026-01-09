import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, startOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, Users, Clock, Moon, Sun, ChevronLeft, ChevronRight, 
  UserCheck, UserX, Shield, Loader2 
} from 'lucide-react';
import SoundButton from './SoundButton';

interface TeamMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
  registration_number: string | null;
}

interface ShiftSchedule {
  agent_id: string;
  first_shift_date: string;
  shift_pattern: string;
}

interface DayOff {
  agent_id: string;
  off_date: string;
  off_type: string;
  reason: string | null;
}

interface DayShiftInfo {
  date: Date;
  working: TeamMember[];
  off: TeamMember[];
}

const TeamShiftsPanel = () => {
  const { agent } = usePlantaoAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [schedules, setSchedules] = useState<ShiftSchedule[]>([]);
  const [daysOff, setDaysOff] = useState<DayOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(startOfDay(new Date()));
  const [daysToShow] = useState(7);

  // Fetch team data
  useEffect(() => {
    if (!agent?.current_team) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch team members
        const { data: members } = await supabase
          .from('agents')
          .select('id, full_name, avatar_url, registration_number')
          .eq('current_team', agent.current_team)
          .eq('is_active', true)
          .order('full_name');

        if (members) {
          setTeamMembers(members);

          // Fetch shift schedules for team members
          const memberIds = members.map(m => m.id);
          
          const { data: shiftsData } = await supabase
            .from('shift_schedules')
            .select('agent_id, first_shift_date, shift_pattern')
            .in('agent_id', memberIds);

          if (shiftsData) {
            setSchedules(shiftsData);
          }

          // Fetch days off for next 30 days
          const endDate = addDays(new Date(), 30);
          const { data: daysOffData } = await supabase
            .from('agent_days_off')
            .select('agent_id, off_date, off_type, reason')
            .in('agent_id', memberIds)
            .gte('off_date', format(new Date(), 'yyyy-MM-dd'))
            .lte('off_date', format(endDate, 'yyyy-MM-dd'));

          if (daysOffData) {
            setDaysOff(daysOffData);
          }
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agent?.current_team]);

  // Calculate if agent is working on a specific date based on 24x72 pattern
  const isWorkingDay = (agentId: string, date: Date): boolean => {
    const schedule = schedules.find(s => s.agent_id === agentId);
    if (!schedule) return false;

    const firstDate = startOfDay(new Date(schedule.first_shift_date));
    const checkDate = startOfDay(date);
    
    // Calculate days since first shift
    const diffTime = checkDate.getTime() - firstDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return false;

    // 24x72 pattern: work 1 day, rest 3 days = cycle of 4 days
    const cycleDay = diffDays % 4;
    return cycleDay === 0;
  };

  // Check if agent has day off on specific date
  const hasDayOff = (agentId: string, date: Date): DayOff | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return daysOff.find(d => d.agent_id === agentId && d.off_date === dateStr) || null;
  };

  // Generate shift info for each day
  const daysInfo = useMemo((): DayShiftInfo[] => {
    const result: DayShiftInfo[] = [];
    
    for (let i = 0; i < daysToShow; i++) {
      const date = addDays(startDate, i);
      const working: TeamMember[] = [];
      const off: TeamMember[] = [];

      teamMembers.forEach(member => {
        const dayOff = hasDayOff(member.id, date);
        
        if (dayOff) {
          off.push(member);
        } else if (isWorkingDay(member.id, date)) {
          working.push(member);
        } else {
          off.push(member);
        }
      });

      result.push({ date, working, off });
    }

    return result;
  }, [startDate, teamMembers, schedules, daysOff, daysToShow]);

  const navigateDays = (direction: 'prev' | 'next') => {
    setStartDate(prev => 
      direction === 'next' 
        ? addDays(prev, 7) 
        : addDays(prev, -7)
    );
  };

  const getTeamColor = () => {
    switch (agent?.current_team) {
      case 'alfa': return 'bg-team-alfa';
      case 'bravo': return 'bg-team-bravo';
      case 'charlie': return 'bg-team-charlie';
      case 'delta': return 'bg-team-delta';
      default: return 'bg-primary';
    }
  };

  if (!agent?.current_team) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Você não está vinculado a uma equipe</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Header */}
      <Card className={`border-border/50 ${getTeamColor()}/10`}>
        <CardHeader className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className={`w-5 h-5 ${getTeamColor()} text-white p-1 rounded`} />
              <CardTitle className="text-base text-foreground">
                Escala Equipe {agent.current_team?.charAt(0).toUpperCase()}{agent.current_team?.slice(1)}
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {teamMembers.length} membros
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between bg-card/50 rounded-lg p-2 border border-border/30">
        <SoundButton
          variant="ghost"
          size="icon"
          onClick={() => navigateDays('prev')}
          className="h-8 w-8"
        >
          <ChevronLeft className="w-4 h-4" />
        </SoundButton>
        
        <div className="text-center">
          <p className="text-sm font-medium">
            {format(startDate, "dd MMM", { locale: ptBR })} - {format(addDays(startDate, 6), "dd MMM", { locale: ptBR })}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(startDate, "yyyy", { locale: ptBR })}
          </p>
        </div>

        <SoundButton
          variant="ghost"
          size="icon"
          onClick={() => navigateDays('next')}
          className="h-8 w-8"
        >
          <ChevronRight className="w-4 h-4" />
        </SoundButton>
      </div>

      {/* Days Grid */}
      <ScrollArea className="h-[calc(100vh-350px)]">
        <div className="space-y-2">
          {daysInfo.map((dayInfo, index) => {
            const isToday = isSameDay(dayInfo.date, new Date());
            
            return (
              <Card 
                key={index} 
                className={`border-border/30 ${isToday ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
              >
                <CardContent className="p-3">
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center ${isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <span className="text-xs font-medium uppercase">
                          {format(dayInfo.date, 'EEE', { locale: ptBR }).slice(0, 3)}
                        </span>
                        <span className="text-lg font-bold leading-none">
                          {format(dayInfo.date, 'd')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {format(dayInfo.date, 'EEEE', { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(dayInfo.date, "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    {isToday && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        Hoje
                      </Badge>
                    )}
                  </div>

                  {/* Tabs for Working/Off */}
                  <Tabs defaultValue="working" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-8">
                      <TabsTrigger value="working" className="text-xs gap-1">
                        <UserCheck className="w-3 h-3" />
                        Plantão ({dayInfo.working.length})
                      </TabsTrigger>
                      <TabsTrigger value="off" className="text-xs gap-1">
                        <Moon className="w-3 h-3" />
                        Folga ({dayInfo.off.length})
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="working" className="mt-2">
                      {dayInfo.working.length > 0 ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          {dayInfo.working.map(member => (
                            <div 
                              key={member.id}
                              className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20"
                            >
                              <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {member.avatar_url ? (
                                  <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <UserCheck className="w-3.5 h-3.5 text-green-500" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">
                                  {member.full_name.split(' ')[0]}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {member.registration_number || 'S/M'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Nenhum agente de plantão
                        </p>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="off" className="mt-2">
                      {dayInfo.off.length > 0 ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          {dayInfo.off.map(member => {
                            const dayOffInfo = hasDayOff(member.id, dayInfo.date);
                            return (
                              <div 
                                key={member.id}
                                className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border/30"
                              >
                                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {member.avatar_url ? (
                                    <img src={member.avatar_url} alt="" className="w-full h-full object-cover opacity-60" />
                                  ) : (
                                    <Moon className="w-3.5 h-3.5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium truncate text-muted-foreground">
                                    {member.full_name.split(' ')[0]}
                                  </p>
                                  {dayOffInfo && (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                                      {dayOffInfo.off_type === 'vacation' ? 'Férias' : 
                                       dayOffInfo.off_type === 'medical' ? 'Atestado' : 'Folga'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Todos de plantão
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Summary */}
      <Card className="border-border/30 bg-card/50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-green-500" />
              <span>De plantão hoje: <strong>{daysInfo[0]?.working.length || 0}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-muted-foreground" />
              <span>De folga hoje: <strong>{daysInfo[0]?.off.length || 0}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TeamShiftsPanel;
