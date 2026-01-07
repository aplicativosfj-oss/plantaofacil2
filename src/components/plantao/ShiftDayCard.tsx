import { useState, useEffect } from 'react';
import { format, isToday, differenceInSeconds, differenceInMinutes, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Play, CheckCircle, AlertTriangle, Timer } from 'lucide-react';
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

const ShiftDayCard = () => {
  const { agent } = usePlantaoAuth();
  const [isShiftToday, setIsShiftToday] = useState(false);
  const [shiftStart, setShiftStart] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [progress, setProgress] = useState(0);
  const [shiftSchedule, setShiftSchedule] = useState<ShiftSchedule | null>(null);

  // Fetch shift schedule
  useEffect(() => {
    if (!agent?.id) return;

    const fetchSchedule = async () => {
      const { data } = await supabase
        .from('shift_schedules')
        .select('*')
        .eq('agent_id', agent.id)
        .single();

      if (data) {
        setShiftSchedule(data);
        checkIfShiftToday(data.first_shift_date);
      }
    };

    fetchSchedule();
  }, [agent?.id]);

  // Check if today is a shift day
  const checkIfShiftToday = (firstShiftDate: string) => {
    const today = new Date();
    const firstShift = new Date(firstShiftDate);
    
    // Calculate days since first shift
    const daysDiff = Math.floor((today.getTime() - firstShift.getTime()) / (1000 * 60 * 60 * 24));
    
    // 24x72 pattern: work 1 day, rest 3 days = 4 day cycle
    const isWorkDay = daysDiff >= 0 && daysDiff % 4 === 0;
    
    if (isWorkDay) {
      setIsShiftToday(true);
      // Shift starts at 06:00
      const shiftStartTime = new Date(today);
      shiftStartTime.setHours(6, 0, 0, 0);
      setShiftStart(shiftStartTime);
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

  if (!isShiftToday) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4 text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-sm">Hoje não é dia de plantão</p>
        </CardContent>
      </Card>
    );
  }

  const shiftEnd = shiftStart ? addHours(shiftStart, 24) : null;
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

          {/* Shift Details */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Timer className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="text-[10px] text-muted-foreground">Início</p>
              <p className="text-sm font-bold">
                {shiftStart && format(shiftStart, 'HH:mm')}
              </p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Clock className="w-4 h-4 mx-auto mb-1 text-accent" />
              <p className="text-[10px] text-muted-foreground">Término</p>
              <p className="text-sm font-bold">
                {shiftEnd && format(shiftEnd, 'HH:mm')}
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
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ShiftDayCard;
