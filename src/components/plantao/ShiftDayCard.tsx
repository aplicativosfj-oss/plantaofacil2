import { useState, useEffect } from 'react';
import { format, differenceInSeconds, addHours, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Play, CheckCircle, AlertTriangle, Timer, Calendar, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ShiftSchedule {
  first_shift_date: string;
  shift_pattern: string;
}

interface DayOff {
  id: string;
  off_date: string;
  off_type: string;
  reason: string | null;
}

const ShiftDayCard = () => {
  const { agent } = usePlantaoAuth();
  const [isShiftToday, setIsShiftToday] = useState(false);
  const [shiftStart, setShiftStart] = useState<Date | null>(null);
  const [shiftEnd, setShiftEnd] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [progress, setProgress] = useState(0);
  const [shiftSchedule, setShiftSchedule] = useState<ShiftSchedule | null>(null);
  const [nextShiftDate, setNextShiftDate] = useState<Date | null>(null);
  const [todayDayOff, setTodayDayOff] = useState<DayOff | null>(null);
  const [upcomingDaysOff, setUpcomingDaysOff] = useState<DayOff[]>([]);

  // Fetch shift schedule
  useEffect(() => {
    if (!agent?.id) return;

    const fetchData = async () => {
      // Fetch schedule
      const { data: scheduleData } = await supabase
        .from('shift_schedules')
        .select('*')
        .eq('agent_id', agent.id)
        .maybeSingle();

      if (scheduleData) {
        setShiftSchedule(scheduleData);
        checkIfShiftToday(scheduleData.first_shift_date);
      }

      // Fetch days off
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: daysOffData } = await supabase
        .from('agent_days_off')
        .select('*')
        .eq('agent_id', agent.id)
        .gte('off_date', today)
        .order('off_date', { ascending: true });

      if (daysOffData) {
        const todayOff = daysOffData.find(d => d.off_date === today);
        setTodayDayOff(todayOff || null);
        setUpcomingDaysOff(daysOffData.filter(d => d.off_date !== today).slice(0, 3));
      }
    };

    fetchData();
  }, [agent?.id]);

  // Check if today is a shift day
  const checkIfShiftToday = (firstShiftDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstShift = new Date(firstShiftDate);
    firstShift.setHours(0, 0, 0, 0);
    
    // Calculate days since first shift
    const daysDiff = Math.floor((today.getTime() - firstShift.getTime()) / (1000 * 60 * 60 * 24));
    
    // 24x72 pattern: work 1 day, rest 3 days = 4 day cycle
    const isWorkDay = daysDiff >= 0 && daysDiff % 4 === 0;
    
    // Calculate next shift date
    if (daysDiff < 0) {
      setNextShiftDate(firstShift);
    } else {
      const daysUntilNextShift = (4 - (daysDiff % 4)) % 4 || 4;
      setNextShiftDate(addDays(today, isWorkDay ? 0 : daysUntilNextShift));
    }
    
    if (isWorkDay) {
      setIsShiftToday(true);
      // Shift starts at 06:00
      const shiftStartTime = new Date(today);
      shiftStartTime.setHours(6, 0, 0, 0);
      setShiftStart(shiftStartTime);
      setShiftEnd(addHours(shiftStartTime, 24));
    }
  };

  // Update elapsed time
  useEffect(() => {
    if (!isShiftToday || !shiftStart) return;

    const updateTimer = () => {
      const now = new Date();
      const diffSeconds = differenceInSeconds(now, shiftStart);
      
      if (diffSeconds < 0) {
        setElapsedTime({ hours: 0, minutes: 0, seconds: 0 });
        setProgress(0);
        return;
      }

      const hours = Math.floor(diffSeconds / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;

      setElapsedTime({ hours, minutes, seconds });
      
      // Progress based on 24-hour shift
      const progressPercent = Math.min((diffSeconds / (24 * 3600)) * 100, 100);
      setProgress(progressPercent);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isShiftToday, shiftStart]);

  if (!shiftSchedule) {
    return null;
  }

  // If on day off today
  if (todayDayOff) {
    return (
      <Card className="border-purple-500/50 bg-purple-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Moon className="w-8 h-8 text-purple-500" />
            <div>
              <p className="font-semibold text-purple-400">Folga Hoje</p>
              <p className="text-sm text-muted-foreground">
                {todayDayOff.off_type === '24h' ? 'Folga de 24 horas' : 'Folga de 12 horas'}
              </p>
              {todayDayOff.reason && (
                <p className="text-xs text-muted-foreground mt-1">{todayDayOff.reason}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isShiftToday) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-muted-foreground opacity-50" />
            <div>
              <p className="text-muted-foreground text-sm">Hoje não é dia de plantão</p>
              {nextShiftDate && (
                <p className="text-xs text-primary mt-1">
                  Próximo: {format(nextShiftDate, "EEEE, dd/MM", { locale: ptBR })}
                </p>
              )}
            </div>
          </div>
          
          {/* Upcoming days off */}
          {upcomingDaysOff.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/30">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Moon className="w-3 h-3" /> Próximas folgas:
              </p>
              <div className="space-y-1">
                {upcomingDaysOff.map(dayOff => (
                  <div key={dayOff.id} className="flex items-center justify-between text-xs">
                    <span>{format(new Date(dayOff.off_date), "dd/MM (EEE)", { locale: ptBR })}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5">
                      {dayOff.off_type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const isCompleted = progress >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className={`border-2 ${isCompleted ? 'border-green-500/50 bg-green-500/5' : 'border-amber-500/50 bg-amber-500/5'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Play className="w-5 h-5 text-amber-500 animate-pulse" />
              )}
              <span className="text-lg">Plantão de Hoje</span>
            </div>
            <Badge variant={isCompleted ? 'default' : 'secondary'} className={isCompleted ? 'bg-green-500' : 'bg-amber-500'}>
              {isCompleted ? 'Concluído' : 'Em Andamento'}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Timer Display */}
          <div className="text-center py-4">
            <div className="text-4xl font-mono font-bold tracking-wider">
              <span className="text-primary">{String(elapsedTime.hours).padStart(2, '0')}</span>
              <span className="text-muted-foreground">:</span>
              <span className="text-primary">{String(elapsedTime.minutes).padStart(2, '0')}</span>
              <span className="text-muted-foreground">:</span>
              <span className="text-muted-foreground">{String(elapsedTime.seconds).padStart(2, '0')}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Horas trabalhadas</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>06:00</span>
              <span>{Math.round(progress)}%</span>
              <span>06:00 (+1)</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Shift Details with Date and Day of Week */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Timer className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="text-[10px] text-muted-foreground">Início</p>
              <p className="text-sm font-bold">
                {shiftStart && format(shiftStart, 'HH:mm')}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {shiftStart && format(shiftStart, "dd/MM (EEE)", { locale: ptBR })}
              </p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Clock className="w-4 h-4 mx-auto mb-1 text-accent" />
              <p className="text-[10px] text-muted-foreground">Término</p>
              <p className="text-sm font-bold">
                {shiftEnd && format(shiftEnd, 'HH:mm')}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {shiftEnd && format(shiftEnd, "dd/MM (EEE)", { locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Remaining Hours Alert */}
          {!isCompleted && (24 - elapsedTime.hours) <= 4 && (
            <div className="flex items-center gap-2 text-amber-500 text-sm bg-amber-500/10 p-3 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              <span>Faltam {24 - elapsedTime.hours} horas para finalizar</span>
            </div>
          )}

          {/* Upcoming days off */}
          {upcomingDaysOff.length > 0 && (
            <div className="pt-3 border-t border-border/30">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Moon className="w-3 h-3" /> Próximas folgas:
              </p>
              <div className="flex flex-wrap gap-2">
                {upcomingDaysOff.map(dayOff => (
                  <Badge key={dayOff.id} variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30">
                    {format(new Date(dayOff.off_date), "dd/MM", { locale: ptBR })} • {dayOff.off_type}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ShiftDayCard;
