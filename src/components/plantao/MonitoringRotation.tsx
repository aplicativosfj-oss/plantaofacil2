import { useState, useEffect } from 'react';
import { format, addMinutes, parse, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Clock, Calculator, RefreshCw, Play, Pause, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  // Update current slot and elapsed time
  useEffect(() => {
    if (!isCalculated || rotationSlots.length === 0) return;

    const updateCurrentSlot = () => {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      
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
            setElapsedInCurrentSlot(elapsed);
          }
        } else {
          if (nowMinutes >= startMinutes && nowMinutes < endMinutes) {
            activeIndex = index;
            setElapsedInCurrentSlot(nowMinutes - startMinutes);
          }
        }
      });
      
      setCurrentSlotIndex(activeIndex);
    };

    updateCurrentSlot();
    const interval = setInterval(updateCurrentSlot, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isCalculated, rotationSlots]);

  const resetCalculation = () => {
    setRotationSlots([]);
    setIsCalculated(false);
    setCurrentSlotIndex(null);
    setElapsedInCurrentSlot(0);
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary" />
            Divisão de Monitoramento
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
                  {rotationSlots.map((slot, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        p-3 rounded-lg border-2 transition-all
                        ${slot.isActive 
                          ? 'border-green-500 bg-green-500/10' 
                          : slot.isPast 
                            ? 'border-muted bg-muted/30 opacity-60' 
                            : 'border-border/50 bg-card'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                            ${slot.isActive 
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
                              {slot.isActive && (
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
                  ))}
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
