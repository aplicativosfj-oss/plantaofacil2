import { useState, useEffect } from 'react';
import { format, differenceInSeconds, addHours, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Clock, Play, CheckCircle, AlertTriangle, Moon, Shield, 
  Radio, Siren, Timer, Target, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
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

const parseDateOnly = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
};

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

    const firstShift = parseDateOnly(firstShiftDate);
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

  // If on day off today - Purple glow effect
  if (todayDayOff) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-violet-500/20 to-purple-500/20 rounded-xl blur-md animate-pulse" />
        
        <Card className="relative border-purple-500/40 bg-gradient-to-br from-purple-950/80 to-slate-900/90 backdrop-blur overflow-hidden">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--purple-500)) 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }} />
          </div>
          
          <CardContent className="p-4 relative">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/30"
              >
                <Moon className="w-5 h-5 text-white" />
              </motion.div>
              <div className="flex-1">
                <p className="text-sm font-bold text-purple-300">FOLGA HOJE</p>
                <p className="text-xs text-muted-foreground">
                  {todayDayOff.off_type === '24h' ? '24 horas de descanso' : '12 horas de descanso'}
                  {todayDayOff.reason && ` • ${todayDayOff.reason}`}
                </p>
              </div>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                Relaxe!
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // No shift today - Faded/muted style
  if (!isShiftToday) {
    return (
      <Card className="border-border/20 bg-muted/20 opacity-60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted/30">
                <Clock className="w-5 h-5 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Sem plantão hoje</p>
                {nextShiftDate && (
                  <p className="text-xs text-primary/70">
                    Próximo: {format(nextShiftDate, "EEEE, dd/MM", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>
            {upcomingDaysOff.length > 0 && (
              <div className="flex gap-1.5">
                {upcomingDaysOff.slice(0, 2).map(dayOff => (
                  <Badge key={dayOff.id} variant="outline" className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 border-purple-500/20 text-purple-300">
                    <Moon className="w-2.5 h-2.5 mr-0.5" />
                    {format(parseDateOnly(dayOff.off_date), "dd/MM", { locale: ptBR })}
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

  // Active shift - Animated tactical style
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      {/* Active glow effect */}
      {!isCompleted && (
        <motion.div
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.02, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-amber-500/30 rounded-xl blur-md"
        />
      )}
      
      <Card className={`relative overflow-hidden ${
        isCompleted 
          ? 'border-green-500/40 bg-gradient-to-br from-green-950/80 to-slate-900/90' 
          : 'border-amber-500/40 bg-gradient-to-br from-amber-950/80 to-slate-900/90'
      } backdrop-blur`}>
        {/* Tactical grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(0deg, transparent 24%, hsl(var(--primary)) 25%, hsl(var(--primary)) 26%, transparent 27%, transparent 74%, hsl(var(--primary)) 75%, hsl(var(--primary)) 76%, transparent 77%),
                              linear-gradient(90deg, transparent 24%, hsl(var(--primary)) 25%, hsl(var(--primary)) 26%, transparent 27%, transparent 74%, hsl(var(--primary)) 75%, hsl(var(--primary)) 76%, transparent 77%)`,
            backgroundSize: '30px 30px'
          }} />
        </div>

        {/* Scanning line for active shift */}
        {!isCompleted && (
          <motion.div
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent pointer-events-none z-10"
          />
        )}

        <CardContent className="p-4 space-y-4 relative">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={!isCompleted ? { 
                  scale: [1, 1.15, 1],
                  boxShadow: [
                    '0 0 0 0 rgba(245, 158, 11, 0)',
                    '0 0 20px 5px rgba(245, 158, 11, 0.4)',
                    '0 0 0 0 rgba(245, 158, 11, 0)'
                  ]
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`p-2.5 rounded-xl shadow-lg ${
                  isCompleted 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30' 
                    : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <Shield className="w-5 h-5 text-white" />
                )}
              </motion.div>
              <div>
                <p className="text-sm font-bold tracking-wide flex items-center gap-2">
                  PLANTÃO ATIVO
                  {!isCompleted && (
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-red-500"
                    />
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {format(new Date(), "EEEE", { locale: ptBR })} • Escala 24x72
                </p>
              </div>
            </div>
            <Badge className={`text-[10px] px-2 py-1 ${
              isCompleted 
                ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              {isCompleted ? (
                <><CheckCircle className="w-3 h-3 mr-1" /> Concluído</>
              ) : (
                <><Radio className="w-3 h-3 mr-1 animate-pulse" /> Em Serviço</>
              )}
            </Badge>
          </div>

          {/* Timer Display - Tactical Style */}
          <div className="text-center py-3 relative">
            <div className="inline-flex items-center gap-1 px-6 py-3 rounded-lg bg-black/30 border border-white/10">
              <Timer className="w-4 h-4 text-muted-foreground mr-2" />
              <motion.span 
                key={elapsedTime.hours}
                initial={{ scale: 1.2, color: 'hsl(var(--primary))' }}
                animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
                className="text-3xl font-mono font-bold tabular-nums"
              >
                {String(elapsedTime.hours).padStart(2, '0')}
              </motion.span>
              <span className="text-2xl text-muted-foreground animate-pulse">:</span>
              <motion.span 
                key={elapsedTime.minutes}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-3xl font-mono font-bold tabular-nums"
              >
                {String(elapsedTime.minutes).padStart(2, '0')}
              </motion.span>
              <span className="text-xl text-muted-foreground">:</span>
              <span className="text-xl font-mono text-muted-foreground tabular-nums w-6">
                {String(elapsedTime.seconds).padStart(2, '0')}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">
              Tempo de Serviço
            </p>
          </div>

          {/* Progress Bar - Tactical */}
          <div className="space-y-2">
            <div className="relative h-3 bg-black/30 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className={`h-full rounded-full ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
                    : 'bg-gradient-to-r from-amber-500 to-orange-400'
                }`}
              />
              {/* Progress glow */}
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" /> 06:00
              </span>
              <span className="font-bold text-foreground">{Math.round(progress)}%</span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" /> 06:00 (+1)
              </span>
            </div>
          </div>

          {/* Shift Details */}
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-3 bg-black/20 rounded-lg border border-white/5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Início</p>
              <p className="text-lg font-bold font-mono">{shiftStart && format(shiftStart, 'HH:mm')}</p>
              <p className="text-[9px] text-muted-foreground">
                {shiftStart && format(shiftStart, "dd/MM (EEE)", { locale: ptBR })}
              </p>
            </div>
            <div className="text-center p-3 bg-black/20 rounded-lg border border-white/5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Término</p>
              <p className="text-lg font-bold font-mono">{shiftEnd && format(shiftEnd, 'HH:mm')}</p>
              <p className="text-[9px] text-muted-foreground">
                {shiftEnd && format(shiftEnd, "dd/MM (EEE)", { locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Remaining Hours Alert */}
          {!isCompleted && (24 - elapsedTime.hours) <= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20"
            >
              <Siren className="w-4 h-4 animate-pulse" />
              <span className="font-medium">Atenção: Faltam apenas {24 - elapsedTime.hours}h para o término!</span>
            </motion.div>
          )}

          {/* Upcoming days off */}
          {upcomingDaysOff.length > 0 && (
            <div className="pt-3 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Moon className="w-3 h-3" /> Próximas Folgas
                </span>
                <div className="flex gap-1.5">
                  {upcomingDaysOff.slice(0, 2).map(dayOff => (
                    <Badge key={dayOff.id} variant="outline" className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 border-purple-500/20 text-purple-300">
                      {format(parseDateOnly(dayOff.off_date), "dd/MM", { locale: ptBR })}
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
