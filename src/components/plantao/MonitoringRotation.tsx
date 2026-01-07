import { useState, useEffect, useRef, useCallback } from 'react';
import { format, addMinutes, parse, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Clock, Calculator, RefreshCw, Play, Pause, AlertCircle, Bell, BellOff, Volume2, VolumeX, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface RotationSlot {
  agent: number;
  startTime: string;
  endTime: string;
  duration: number;
  isActive: boolean;
  isPast: boolean;
}

const MonitoringRotation = () => {
  const [startTime, setStartTime] = useState('22:00');
  const [endTime, setEndTime] = useState('06:00');
  const [agentCount, setAgentCount] = useState(4);
  const [rotationSlots, setRotationSlots] = useState<RotationSlot[]>([]);
  const [isCalculated, setIsCalculated] = useState(false);
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number | null>(null);
  const [elapsedInCurrentSlot, setElapsedInCurrentSlot] = useState(0);
  
  // New states for timer and alert
  const [mySlotIndex, setMySlotIndex] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [countdown, setCountdown] = useState<string>('');
  const [hasAlerted, setHasAlerted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/audio/notification.mp3');
    audioRef.current.loop = true;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Play alert sound
  const playAlert = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
      toast.success('🔔 Seu turno de monitoramento começou!', { duration: 10000 });
    }
  }, [soundEnabled]);

  // Stop alert sound
  const stopAlert = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Calculate rotation slots
  const calculateRotation = () => {
    if (agentCount < 1 || agentCount > 10) {
      toast.error('Quantidade de agentes deve ser entre 1 e 10');
      return;
    }

    // Parse times
    const start = parse(startTime, 'HH:mm', new Date());
    let end = parse(endTime, 'HH:mm', new Date());
    
    // If end time is before start time, it's next day
    if (end <= start) {
      end = addMinutes(end, 24 * 60);
    }

    // Calculate total minutes
    const totalMinutes = differenceInMinutes(end, start);
    const minutesPerAgent = Math.floor(totalMinutes / agentCount);
    
    // Generate slots
    const slots: RotationSlot[] = [];
    let currentTime = start;

    for (let i = 0; i < agentCount; i++) {
      const slotEnd = i === agentCount - 1 
        ? end 
        : addMinutes(currentTime, minutesPerAgent);
      
      const now = new Date();
      const slotStartTime = format(currentTime, 'HH:mm');
      const slotEndTime = format(slotEnd, 'HH:mm');
      
      // Check if slot is active or past
      const slotStartMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
      const slotEndMinutes = slotEnd.getHours() * 60 + slotEnd.getMinutes();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      
      let isActive = false;
      let isPast = false;
      
      // Handle overnight shifts
      if (slotEndMinutes < slotStartMinutes) {
        // Slot crosses midnight
        isActive = nowMinutes >= slotStartMinutes || nowMinutes < slotEndMinutes;
        isPast = nowMinutes >= slotEndMinutes && nowMinutes < slotStartMinutes;
      } else {
        isActive = nowMinutes >= slotStartMinutes && nowMinutes < slotEndMinutes;
        isPast = nowMinutes >= slotEndMinutes;
      }

      slots.push({
        agent: i + 1,
        startTime: slotStartTime,
        endTime: slotEndTime,
        duration: Math.round(differenceInMinutes(slotEnd, currentTime)),
        isActive,
        isPast
      });

      currentTime = slotEnd;
    }

    setRotationSlots(slots);
    setIsCalculated(true);
    setHasAlerted(false);
    toast.success(`Divisão calculada: ${formatDuration(minutesPerAgent)} por agente`);
  };

  // Format duration in hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  // Format countdown
  const formatCountdown = (totalMinutes: number) => {
    if (totalMinutes <= 0) return '00:00:00';
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.floor(totalMinutes % 60);
    const secs = Math.floor((totalMinutes * 60) % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update current slot, elapsed time, and countdown
  useEffect(() => {
    if (!isCalculated || rotationSlots.length === 0) return;

    const updateCurrentSlot = () => {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
      
      let activeIndex: number | null = null;
      
      rotationSlots.forEach((slot, index) => {
        const [startH, startM] = slot.startTime.split(':').map(Number);
        const [endH, endM] = slot.endTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        
        // Handle overnight
        if (endMinutes < startMinutes) {
          if (nowMinutes >= startMinutes || nowMinutes < endMinutes) {
            activeIndex = index;
            const elapsed = nowMinutes >= startMinutes 
              ? nowMinutes - startMinutes 
              : (24 * 60 - startMinutes) + nowMinutes;
            setElapsedInCurrentSlot(Math.floor(elapsed));
          }
        } else {
          if (nowMinutes >= startMinutes && nowMinutes < endMinutes) {
            activeIndex = index;
            setElapsedInCurrentSlot(Math.floor(nowMinutes - startMinutes));
          }
        }
      });
      
      setCurrentSlotIndex(activeIndex);

      // Calculate countdown if user selected their slot
      if (mySlotIndex !== null && rotationSlots[mySlotIndex]) {
        const mySlot = rotationSlots[mySlotIndex];
        const [startH, startM] = mySlot.startTime.split(':').map(Number);
        let slotStartMinutes = startH * 60 + startM;
        
        // Handle overnight - if slot start is less than current time, it's tomorrow
        if (slotStartMinutes < nowMinutes && startH < 12) {
          slotStartMinutes += 24 * 60;
        }
        
        const minutesUntilStart = slotStartMinutes - nowMinutes;
        
        if (minutesUntilStart > 0) {
          setCountdown(formatCountdown(minutesUntilStart));
        } else if (minutesUntilStart <= 0 && activeIndex === mySlotIndex) {
          setCountdown('ATIVO');
          // Trigger alert when slot starts
          if (!hasAlerted) {
            playAlert();
            setHasAlerted(true);
          }
        } else {
          setCountdown('Concluído');
          stopAlert();
        }
      }
    };

    updateCurrentSlot();
    const interval = setInterval(updateCurrentSlot, 1000); // Update every second for timer

    return () => clearInterval(interval);
  }, [isCalculated, rotationSlots, mySlotIndex, hasAlerted, playAlert, stopAlert]);

  // Stop alert when sound is disabled
  useEffect(() => {
    if (!soundEnabled) {
      stopAlert();
    }
  }, [soundEnabled, stopAlert]);

  const resetCalculation = () => {
    stopAlert();
    setRotationSlots([]);
    setIsCalculated(false);
    setCurrentSlotIndex(null);
    setElapsedInCurrentSlot(0);
    setMySlotIndex(null);
    setCountdown('');
    setHasAlerted(false);
  };

  const selectMySlot = (index: number) => {
    setMySlotIndex(index);
    setHasAlerted(false);
    stopAlert();
    toast.success(`Você selecionou o turno do Agente ${index + 1}`);
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Divisão de Monitoramento
            </div>
            {isCalculated && (
              <div className="flex items-center gap-2">
                <Label htmlFor="sound-toggle" className="text-xs text-muted-foreground">
                  {soundEnabled ? 'Som ativo' : 'Silencioso'}
                </Label>
                <Button
                  variant={soundEnabled ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    if (soundEnabled) stopAlert();
                  }}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
          </CardTitle>
          <CardDescription>
            Configure o período e quantidade de agentes para calcular a divisão de rondas
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Input Form */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Início das Rondas</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="text-center"
                disabled={isCalculated}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Fim das Rondas</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="text-center"
                disabled={isCalculated}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Qtd. Agentes</Label>
              <Select 
                value={agentCount.toString()} 
                onValueChange={(value) => setAgentCount(parseInt(value))}
                disabled={isCalculated}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'agente' : 'agentes'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calculate Button */}
          {!isCalculated ? (
            <Button 
              className="w-full" 
              onClick={calculateRotation}
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calcular Divisão
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={resetCalculation}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recalcular
            </Button>
          )}
        </CardContent>
      </Card>

      {/* My Slot Timer Card */}
      {isCalculated && mySlotIndex !== null && rotationSlots[mySlotIndex] && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className={`border-2 ${countdown === 'ATIVO' ? 'border-green-500 bg-green-500/10' : 'border-primary/50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${countdown === 'ATIVO' ? 'bg-green-500 animate-pulse' : 'bg-primary/20'}`}>
                    <Bell className={`w-6 h-6 ${countdown === 'ATIVO' ? 'text-white' : 'text-primary'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Seu turno (Agente {mySlotIndex + 1})</p>
                    <p className="font-semibold">
                      {rotationSlots[mySlotIndex].startTime} - {rotationSlots[mySlotIndex].endTime}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {countdown === 'ATIVO' ? 'EM ANDAMENTO' : countdown === 'Concluído' ? 'FINALIZADO' : 'INICIA EM'}
                  </p>
                  <p className={`text-2xl font-bold font-mono ${countdown === 'ATIVO' ? 'text-green-500' : 'text-primary'}`}>
                    {countdown}
                  </p>
                </div>
              </div>
              
              {countdown === 'ATIVO' && (
                <div className="mt-3 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={stopAlert}
                  >
                    <BellOff className="w-4 h-4 mr-2" />
                    Parar Alarme
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {isCalculated && rotationSlots.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Escala de Monitoramento</span>
                  <Badge variant="outline">
                    {formatDuration(rotationSlots[0]?.duration || 0)} / agente
                  </Badge>
                </CardTitle>
                {mySlotIndex === null && (
                  <CardDescription className="text-amber-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Toque em um turno para selecionar o seu e ativar o alarme
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Info Alert */}
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Período: {startTime} até {endTime}</p>
                    <p>{agentCount} agentes com {formatDuration(rotationSlots[0]?.duration || 0)} cada</p>
                  </div>
                </div>

                <Separator />

                {/* Rotation Slots */}
                <div className="space-y-2">
                  {rotationSlots.map((slot, index) => {
                    const isMySlot = mySlotIndex === index;
                    
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => selectMySlot(index)}
                        className={`
                          p-3 rounded-lg border-2 transition-all cursor-pointer
                          ${isMySlot 
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                            : slot.isActive 
                              ? 'border-green-500 bg-green-500/10' 
                              : slot.isPast 
                                ? 'border-muted bg-muted/30 opacity-60' 
                                : 'border-border/50 bg-card hover:border-primary/50'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                              ${isMySlot
                                ? 'bg-primary text-white'
                                : slot.isActive 
                                  ? 'bg-green-500 text-white' 
                                  : slot.isPast
                                    ? 'bg-muted text-muted-foreground'
                                    : 'bg-primary/20 text-primary'
                              }
                            `}>
                              {slot.agent}
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Agente {slot.agent}</span>
                                {isMySlot && (
                                  <Badge className="bg-primary text-xs">
                                    <UserCheck className="w-3 h-3 mr-1" />
                                    Meu Turno
                                  </Badge>
                                )}
                                {slot.isActive && !isMySlot && (
                                  <Badge className="bg-green-500 text-xs animate-pulse">
                                    <Play className="w-3 h-3 mr-1" />
                                    Ativo
                                  </Badge>
                                )}
                                {slot.isPast && (
                                  <Badge variant="secondary" className="text-xs">
                                    Concluído
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{slot.startTime} - {slot.endTime}</span>
                                <span className="text-xs">({formatDuration(slot.duration)})</span>
                              </div>
                            </div>
                          </div>

                          {/* Alarm indicator for my slot */}
                          {isMySlot && soundEnabled && (
                            <Bell className="w-5 h-5 text-primary animate-bounce" />
                          )}
                        </div>

                        {/* Progress for active slot */}
                        {slot.isActive && currentSlotIndex === index && (
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Tempo no posto: {formatDuration(elapsedInCurrentSlot)}</span>
                              <span>Restante: {formatDuration(slot.duration - elapsedInCurrentSlot)}</span>
                            </div>
                            <Progress 
                              value={(elapsedInCurrentSlot / slot.duration) * 100} 
                              className="h-2"
                            />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="text-center p-3 bg-primary/10 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{agentCount}</p>
                    <p className="text-xs text-muted-foreground">Agentes</p>
                  </div>
                  <div className="text-center p-3 bg-accent/10 rounded-lg">
                    <p className="text-2xl font-bold text-accent">{formatDuration(rotationSlots[0]?.duration || 0)}</p>
                    <p className="text-xs text-muted-foreground">Por Agente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonitoringRotation;
