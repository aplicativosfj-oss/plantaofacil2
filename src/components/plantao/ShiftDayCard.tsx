import { useState, useEffect } from 'react';
import { format, differenceInSeconds, addHours, addDays, subHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Clock, Play, CheckCircle, AlertTriangle, Moon, Shield, 
  Radio, Siren, Timer, Target, Zap, Calendar, Bell, BellRing, BellOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface ShiftAlert {
  id: string;
  shiftDate: string;
  alertTime: Date;
  hoursBefore: number;
}

const ALERT_OPTIONS = [
  { hours: 2, label: '2h antes' },
  { hours: 4, label: '4h antes' },
  { hours: 8, label: '8h antes' },
  { hours: 12, label: '12h antes' },
];

// Acre timezone: UTC-5 (America/Rio_Branco)
const ACRE_UTC_OFFSET_HOURS = -5;

// Get current date/time parts as they appear on a clock in Acre
const getAcreNowParts = () => {
  const now = new Date();
  // Convert UTC to Acre time by adding the offset (which is negative, so we subtract hours)
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcSeconds = now.getUTCSeconds();
  
  // Create a date representing "now" in Acre
  // We need to shift by the offset: Acre = UTC + (-5) = UTC - 5
  let acreHour = utcHours + ACRE_UTC_OFFSET_HOURS; // -5 means we subtract 5 hours
  let acreDay = now.getUTCDate();
  let acreMonth = now.getUTCMonth();
  let acreYear = now.getUTCFullYear();
  
  // Handle day rollover
  if (acreHour < 0) {
    acreHour += 24;
    acreDay -= 1;
    if (acreDay < 1) {
      acreMonth -= 1;
      if (acreMonth < 0) {
        acreMonth = 11;
        acreYear -= 1;
      }
      // Get last day of previous month
      acreDay = new Date(Date.UTC(acreYear, acreMonth + 1, 0)).getUTCDate();
    }
  }
  
  return {
    year: acreYear,
    month: acreMonth,
    day: acreDay,
    hour: acreHour,
    minute: utcMinutes,
    second: utcSeconds,
  };
};

const getDatePartsUTC = (date: Date) => ({
  year: date.getUTCFullYear(),
  month: date.getUTCMonth(),
  day: date.getUTCDate(),
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const acreDateIndexMs = (year: number, month: number, day: number) => Date.UTC(year, month, day);

// Convert Acre local time to a UTC Date object
const acreLocalToInstant = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
  second = 0
) => {
  // Acre is UTC-5, so to get UTC we ADD 5 hours
  return new Date(Date.UTC(year, month, day, hour - ACRE_UTC_OFFSET_HOURS, minute, second));
};

const parseDateOnly = (value: string) => {
  // Date-only values must not shift by timezone. Use UTC noon to keep the same calendar day.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  }
  return new Date(value);
};

const ShiftDayCard = () => {
  const { agent } = usePlantaoAuth();
  const [isShiftToday, setIsShiftToday] = useState(false);
  const [shiftStart, setShiftStart] = useState<Date | null>(null);
  const [shiftEnd, setShiftEnd] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [remainingTime, setRemainingTime] = useState({ hours: 24, minutes: 0, seconds: 0 });
  const [progress, setProgress] = useState(0);
  const [shiftSchedule, setShiftSchedule] = useState<ShiftSchedule | null>(null);
  const [nextShiftDate, setNextShiftDate] = useState<Date | null>(null);
  const [todayDayOff, setTodayDayOff] = useState<DayOff | null>(null);
  const [upcomingDaysOff, setUpcomingDaysOff] = useState<DayOff[]>([]);
  const [showAlertOptions, setShowAlertOptions] = useState(false);
  const [activeAlert, setActiveAlert] = useState<ShiftAlert | null>(null);
  const [alertCountdown, setAlertCountdown] = useState<string | null>(null);

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

    // Load saved alert from localStorage
    const savedAlert = localStorage.getItem(`shift_alert_${agent.id}`);
    if (savedAlert) {
      try {
        const parsed = JSON.parse(savedAlert);
        const alertTime = new Date(parsed.alertTime);
        if (alertTime > new Date()) {
          setActiveAlert({ ...parsed, alertTime });
        } else {
          localStorage.removeItem(`shift_alert_${agent.id}`);
        }
      } catch (e) {
        console.error('Error loading alert:', e);
      }
    }
  }, [agent?.id]);

  // Check if today is a shift day - considering 24h shift that spans 2 calendar days (AC time)
  const checkIfShiftToday = (firstShiftDate: string) => {
    const nowAC = getAcreNowParts();
    const todayIndex = acreDateIndexMs(nowAC.year, nowAC.month, nowAC.day);

    const firstParts = (() => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(firstShiftDate)) {
        const [y, m, d] = firstShiftDate.split('-').map(Number);
        return { year: y, month: m - 1, day: d };
      }
      // Fallback: interpret the timestamp and convert to Acre calendar day
      const raw = new Date(firstShiftDate);
      const utcHours = raw.getUTCHours();
      let acreHour = utcHours + ACRE_UTC_OFFSET_HOURS;
      let acreDay = raw.getUTCDate();
      let acreMonth = raw.getUTCMonth();
      let acreYear = raw.getUTCFullYear();
      if (acreHour < 0) {
        acreDay -= 1;
        if (acreDay < 1) {
          acreMonth -= 1;
          if (acreMonth < 0) {
            acreMonth = 11;
            acreYear -= 1;
          }
          acreDay = new Date(Date.UTC(acreYear, acreMonth + 1, 0)).getUTCDate();
        }
      }
      return { year: acreYear, month: acreMonth, day: acreDay };
    })();

    const firstIndex = acreDateIndexMs(firstParts.year, firstParts.month, firstParts.day);

    // Days since first shift (based on AC calendar days)
    const daysDiff = Math.floor((todayIndex - firstIndex) / MS_PER_DAY);

    // 24x72 pattern: work 1 day, rest 3 days = 4 day cycle
    // Shift starts at 07:00 (AC) and ends at 07:00 next day (24 hours)
    const isTodayWorkDay = daysDiff >= 0 && daysDiff % 4 === 0;
    const yesterdayDiff = daysDiff - 1;
    const wasYesterdayWorkDay = yesterdayDiff >= 0 && yesterdayDiff % 4 === 0;

    let activeShift = false;
    let shiftStartTime: Date | null = null;
    let shiftStartIndex = todayIndex; // AC calendar-day index

    if (nowAC.hour >= 7 && isTodayWorkDay) {
      activeShift = true;
      shiftStartIndex = todayIndex;
    } else if (nowAC.hour < 7 && wasYesterdayWorkDay) {
      activeShift = true;
      shiftStartIndex = todayIndex - MS_PER_DAY;
    }

    if (activeShift) {
      const shiftStartDate = new Date(shiftStartIndex);
      const parts = getDatePartsUTC(shiftStartDate);
      shiftStartTime = acreLocalToInstant(parts.year, parts.month, parts.day, 7, 0, 0);
    }

    // Calculate next shift date (store at UTC noon to keep the same calendar day across timezones)
    let nextShiftIndex: number;
    if (daysDiff < 0) {
      nextShiftIndex = firstIndex;
    } else if (activeShift) {
      nextShiftIndex = shiftStartIndex + 4 * MS_PER_DAY;
    } else {
      const daysInCycle = daysDiff % 4;
      const daysUntilNextShift = daysInCycle === 0 ? 0 : 4 - daysInCycle;
      nextShiftIndex = todayIndex + daysUntilNextShift * MS_PER_DAY;
    }

    setNextShiftDate(new Date(nextShiftIndex + 12 * 60 * 60 * 1000));

    if (activeShift && shiftStartTime) {
      setIsShiftToday(true);
      setShiftStart(shiftStartTime);
      setShiftEnd(addHours(shiftStartTime, 24));
    } else {
      setIsShiftToday(false);
      setShiftStart(null);
      setShiftEnd(null);
    }
  };

  // Update elapsed time and remaining time
  useEffect(() => {
    if (!isShiftToday || !shiftStart || !shiftEnd) return;

    const updateTimer = () => {
      const now = new Date();
      const diffSeconds = differenceInSeconds(now, shiftStart);
      const remainingSeconds = differenceInSeconds(shiftEnd, now);
      
      if (diffSeconds < 0) {
        setElapsedTime({ hours: 0, minutes: 0, seconds: 0 });
        setRemainingTime({ hours: 24, minutes: 0, seconds: 0 });
        setProgress(0);
        return;
      }

      // Elapsed time
      const elapsedHours = Math.floor(diffSeconds / 3600);
      const elapsedMinutes = Math.floor((diffSeconds % 3600) / 60);
      const elapsedSecs = diffSeconds % 60;
      setElapsedTime({ hours: elapsedHours, minutes: elapsedMinutes, seconds: elapsedSecs });
      
      // Remaining time
      if (remainingSeconds > 0) {
        const remHours = Math.floor(remainingSeconds / 3600);
        const remMinutes = Math.floor((remainingSeconds % 3600) / 60);
        const remSecs = remainingSeconds % 60;
        setRemainingTime({ hours: remHours, minutes: remMinutes, seconds: remSecs });
      } else {
        setRemainingTime({ hours: 0, minutes: 0, seconds: 0 });
      }
      
      // Progress based on 24-hour shift
      const progressPercent = Math.min((diffSeconds / (24 * 3600)) * 100, 100);
      setProgress(progressPercent);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isShiftToday, shiftStart, shiftEnd]);

  // Alert countdown effect
  useEffect(() => {
    if (!activeAlert) {
      setAlertCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = activeAlert.alertTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        // Trigger the alarm!
        triggerAlarm();
        setActiveAlert(null);
        if (agent?.id) {
          localStorage.removeItem(`shift_alert_${agent.id}`);
        }
        setAlertCountdown(null);
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        setAlertCountdown(`${hours}h ${minutes}m`);
      } else {
        setAlertCountdown(`${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [activeAlert, agent?.id]);

  const triggerAlarm = () => {
    // Play alarm sound
    const audio = new Audio('/audio/notification.mp3');
    audio.volume = 1;
    audio.loop = true;
    audio.play().catch(() => {});
    
    // Stop after 30 seconds
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 30000);

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⚠️ ALERTA DE PLANTÃO!', {
        body: `Seu plantão começa em ${activeAlert?.hoursBefore || 0} horas!`,
        icon: '/pwa-192x192.png',
        tag: 'shift-alert',
        requireInteraction: true
      });
    }
    
    toast.warning('⚠️ ALERTA DE PLANTÃO!', {
      description: `Seu plantão começa em breve! Prepare-se.`,
      duration: 30000,
    });
  };

  const handleSetAlert = (hoursBefore: number) => {
    if (!nextShiftDate || !agent?.id) return;

    // Shift starts at 07:00 (AC) regardless of device timezone
    const parts = getDatePartsUTC(nextShiftDate);
    const shiftStartTime = acreLocalToInstant(parts.year, parts.month, parts.day, 7, 0, 0);

    const alertTime = subHours(shiftStartTime, hoursBefore);
    
    if (alertTime <= new Date()) {
      toast.error('Este horário já passou!');
      return;
    }
    
    const newAlert: ShiftAlert = {
      id: crypto.randomUUID(),
      shiftDate: format(nextShiftDate, 'yyyy-MM-dd'),
      alertTime,
      hoursBefore
    };
    
    setActiveAlert(newAlert);
    localStorage.setItem(`shift_alert_${agent.id}`, JSON.stringify(newAlert));
    setShowAlertOptions(false);
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    toast.success(`Alarme definido!`, {
      description: `Você será alertado ${hoursBefore}h antes do plantão.`
    });
  };

  const handleCancelAlert = () => {
    if (agent?.id) {
      localStorage.removeItem(`shift_alert_${agent.id}`);
    }
    setActiveAlert(null);
    setShowAlertOptions(false);
    toast.info('Alarme cancelado');
  };

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

  // No shift today - Show next shift highlighted
  if (!isShiftToday) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <Card className="border-border/30 bg-muted/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted/30">
                  <Clock className="w-5 h-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Sem plantão hoje</p>
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
            
            {/* Next shift highlight with Alert Button */}
            {nextShiftDate && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <motion.div
                  animate={{ 
                    boxShadow: ['0 0 0px rgba(245, 158, 11, 0)', '0 0 20px rgba(245, 158, 11, 0.4)', '0 0 0px rgba(245, 158, 11, 0)']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-4 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 border border-amber-500/40 backdrop-blur"
                >
                  {/* Main content */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ 
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30"
                      >
                        <Shield className="w-5 h-5 text-white" />
                      </motion.div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Próximo Plantão</p>
                        <p className="text-base font-bold text-amber-300 capitalize">
                          {format(nextShiftDate, "EEEE", { locale: ptBR })}
                        </p>
                        <p className="text-lg font-bold text-amber-200">
                          {format(nextShiftDate, "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold font-mono text-amber-400">07:00</p>
                      <p className="text-[10px] text-muted-foreground">Início</p>
                    </div>
                  </div>

                  {/* Alert Section */}
                  <div className="border-t border-amber-500/20 pt-3">
                    <AnimatePresence mode="wait">
                      {activeAlert ? (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <motion.div
                              animate={{ 
                                scale: [1, 1.2, 1],
                                rotate: [0, 10, -10, 0]
                              }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="p-1.5 rounded-lg bg-green-500/20"
                            >
                              <BellRing className="w-4 h-4 text-green-400" />
                            </motion.div>
                            <div>
                              <p className="text-xs text-green-300 font-medium">
                                Alarme ativo: {activeAlert.hoursBefore}h antes
                              </p>
                              {alertCountdown && (
                                <p className="text-[10px] text-muted-foreground">
                                  Dispara em: <span className="text-green-400 font-mono">{alertCountdown}</span>
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelAlert}
                            className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <BellOff className="w-4 h-4 mr-1" />
                            Cancelar
                          </Button>
                        </motion.div>
                      ) : showAlertOptions ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2"
                        >
                          <p className="text-xs text-muted-foreground text-center">
                            Quando deseja ser alertado?
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {ALERT_OPTIONS.map((option) => (
                              <motion.button
                                key={option.hours}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSetAlert(option.hours)}
                                className="py-2 px-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition-colors"
                              >
                                {option.label}
                              </motion.button>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowAlertOptions(false)}
                            className="w-full h-7 text-xs text-muted-foreground"
                          >
                            Cancelar
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Button
                            onClick={() => setShowAlertOptions(true)}
                            className="w-full h-10 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium shadow-lg shadow-amber-500/20"
                          >
                            <motion.div
                              animate={{ rotate: [0, 15, -15, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="mr-2"
                            >
                              <Bell className="w-4 h-4" />
                            </motion.div>
                            Ativar Alarme para este Plantão
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
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

          {/* Timer Display - Worked and Remaining */}
          <div className="grid grid-cols-2 gap-3 py-2">
            {/* Worked Hours */}
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
              <p className="text-[10px] text-green-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <Timer className="w-3 h-3" /> Trabalhadas
              </p>
              <div className="flex items-center justify-center gap-0.5">
                <motion.span 
                  key={elapsedTime.hours}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-mono font-bold tabular-nums text-green-300"
                >
                  {elapsedTime.hours}
                </motion.span>
                <span className="text-lg text-green-400/50 animate-pulse">:</span>
                <motion.span 
                  key={elapsedTime.minutes}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-mono font-bold tabular-nums text-green-300"
                >
                  {elapsedTime.minutes.toString().padStart(2, '0')}
                </motion.span>
                <span className="text-sm text-green-400/50">:</span>
                <span className="text-sm font-mono text-green-400/70 tabular-nums">
                  {elapsedTime.seconds.toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Remaining Hours */}
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-600/5 border border-amber-500/20">
              <p className="text-[10px] text-amber-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Restantes
              </p>
              <div className="flex items-center justify-center gap-0.5">
                <motion.span 
                  key={remainingTime.hours}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className={`text-2xl font-mono font-bold tabular-nums ${remainingTime.hours <= 4 ? 'text-red-400' : 'text-amber-300'}`}
                >
                  {remainingTime.hours}
                </motion.span>
                <span className="text-lg text-amber-400/50 animate-pulse">:</span>
                <motion.span 
                  key={remainingTime.minutes}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className={`text-2xl font-mono font-bold tabular-nums ${remainingTime.hours <= 4 ? 'text-red-400' : 'text-amber-300'}`}
                >
                  {remainingTime.minutes.toString().padStart(2, '0')}
                </motion.span>
                <span className="text-sm text-amber-400/50">:</span>
                <span className={`text-sm font-mono tabular-nums ${remainingTime.hours <= 4 ? 'text-red-400/70' : 'text-amber-400/70'}`}>
                  {remainingTime.seconds.toString().padStart(2, '0')}
                </span>
              </div>
            </div>
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
