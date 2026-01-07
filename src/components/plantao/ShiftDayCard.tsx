import { useState, useEffect } from 'react';
import { format, differenceInSeconds, addHours, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Play, CheckCircle, AlertTriangle, Moon } from 'lucide-react';
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
      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-purple-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-400">Folga Hoje</p>
              <p className="text-xs text-muted-foreground">
                {todayDayOff.off_type === '24h' ? '24 horas' : '12 horas'}
                {todayDayOff.reason && ` • ${todayDayOff.reason}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isShiftToday) {
    return (
      <Card className="border-border/30">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground/50" />
              <div>
                <p className="text-sm text-muted-foreground">Sem plantão hoje</p>
                {nextShiftDate && (
                  <p className="text-xs text-primary">
                    Próximo: {format(nextShiftDate, "EEE, dd/MM", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>
            {upcomingDaysOff.length > 0 && (
              <div className="flex gap-1">
                {upcomingDaysOff.slice(0, 2).map(dayOff => (
                  <Badge key={dayOff.id} variant="outline" className="text-[9px] px-1 py-0 bg-purple-500/10 border-purple-500/20">
                    {format(new Date(dayOff.off_date), "dd/MM", { locale: ptBR })}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isCompleted = progress >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className={`border ${isCompleted ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
        <CardContent className="p-3 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Play className="w-4 h-4 text-amber-500 animate-pulse" />
              )}
              <span className="text-sm font-medium">Plantão de Hoje</span>
            </div>
            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${isCompleted ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'}`}>
              {isCompleted ? 'Concluído' : 'Em Andamento'}
            </Badge>
          </div>

          {/* Timer Display - Compact */}
          <div className="text-center py-2">
            <div className="text-3xl font-mono font-bold tracking-wider">
              <span className="text-primary">{String(elapsedTime.hours).padStart(2, '0')}</span>
              <span className="text-muted-foreground">:</span>
              <span className="text-primary">{String(elapsedTime.minutes).padStart(2, '0')}</span>
              <span className="text-muted-foreground text-xl">:{String(elapsedTime.seconds).padStart(2, '0')}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Horas trabalhadas</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>06:00</span>
              <span>{Math.round(progress)}%</span>
              <span>06:00 (+1)</span>
            </div>
          </div>

          {/* Shift Details with Date and Day of Week */}
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-muted/30 rounded">
              <p className="text-[10px] text-muted-foreground">Início</p>
              <p className="text-sm font-bold">{shiftStart && format(shiftStart, 'HH:mm')}</p>
              <p className="text-[9px] text-muted-foreground">
                {shiftStart && format(shiftStart, "dd/MM (EEE)", { locale: ptBR })}
              </p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded">
              <p className="text-[10px] text-muted-foreground">Término</p>
              <p className="text-sm font-bold">{shiftEnd && format(shiftEnd, 'HH:mm')}</p>
              <p className="text-[9px] text-muted-foreground">
                {shiftEnd && format(shiftEnd, "dd/MM (EEE)", { locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Remaining Hours Alert */}
          {!isCompleted && (24 - elapsedTime.hours) <= 4 && (
            <div className="flex items-center gap-1.5 text-amber-500 text-xs bg-amber-500/10 px-2 py-1.5 rounded">
              <AlertTriangle className="w-3 h-3" />
              <span>Faltam {24 - elapsedTime.hours}h</span>
            </div>
          )}

          {/* Upcoming days off - Compact */}
          {upcomingDaysOff.length > 0 && (
            <div className="pt-2 border-t border-border/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Moon className="w-3 h-3" /> Folgas:
                </span>
                <div className="flex gap-1">
                  {upcomingDaysOff.slice(0, 2).map(dayOff => (
                    <Badge key={dayOff.id} variant="outline" className="text-[9px] px-1 py-0 bg-purple-500/10 border-purple-500/20">
                      {format(new Date(dayOff.off_date), "dd/MM", { locale: ptBR })}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ShiftDayCard;
