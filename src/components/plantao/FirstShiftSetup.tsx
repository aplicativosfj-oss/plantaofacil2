import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FirstShiftSetupProps {
  onComplete: () => void;
}

const FirstShiftSetup = ({ onComplete }: FirstShiftSetupProps) => {
  const { agent } = usePlantaoAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Generate preview of next 4 shifts (24x72 pattern)
  const generatePreviewDates = () => {
    if (!selectedDate) return [];
    
    const dates = [];
    let currentDate = selectedDate;
    
    for (let i = 0; i < 4; i++) {
      dates.push(currentDate);
      currentDate = addDays(currentDate, 4); // 24x72 = 1 day work, 3 days off = 4 day cycle
    }
    
    return dates;
  };

  const handleConfirmShift = async () => {
    if (!agent?.id || !selectedDate) {
      toast.error('Selecione uma data para o primeiro plantão');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.from('shift_schedules').insert({
        agent_id: agent.id,
        first_shift_date: format(selectedDate, 'yyyy-MM-dd'),
        shift_pattern: '24x72',
        is_locked: true
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('Você já possui uma escala configurada!');
        } else {
          toast.error('Erro ao configurar escala');
        }
        return;
      }

      toast.success('Escala configurada com sucesso!');
      onComplete();
    } finally {
      setIsLoading(false);
    }
  };

  const previewDates = generatePreviewDates();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Calendar className="w-5 h-5 text-primary" />
            Configurar Escala de Plantões
          </CardTitle>
          <CardDescription>
            Selecione a data do seu <strong>primeiro plantão</strong>. 
            O sistema irá gerar automaticamente os próximos plantões seguindo o padrão 24x72.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Warning Alert */}
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-200">
              <strong>Atenção:</strong> Após confirmar, esta configuração <strong>não poderá ser alterada</strong>. 
              Verifique a data com cuidado antes de confirmar.
            </AlertDescription>
          </Alert>

          {/* Date Picker */}
          <div className="flex flex-col items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full max-w-sm justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  ) : (
                    "Selecione a data do primeiro plantão"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="center">
                <CalendarPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setShowPreview(true);
                  }}
                  locale={ptBR}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Preview */}
          {showPreview && selectedDate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <div className="text-sm font-medium text-center text-muted-foreground">
                Prévia dos próximos plantões (24x72):
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {previewDates.map((date, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-center"
                  >
                    <Clock className="w-4 h-4 mx-auto mb-1 text-primary" />
                    <div className="text-sm font-bold">
                      {format(date, 'dd/MM', { locale: ptBR })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(date, 'EEE', { locale: ptBR })}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="text-xs text-center text-muted-foreground">
                O sistema continuará gerando plantões para todo o mês automaticamente.
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setSelectedDate(undefined);
                setShowPreview(false);
              }}
              disabled={isLoading}
            >
              Limpar
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirmShift}
              disabled={!selectedDate || isLoading}
            >
              {isLoading ? (
                <>Confirmando...</>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Confirmar Escala
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-center text-muted-foreground border-t pt-4">
            <CheckCircle className="w-3 h-3 inline mr-1 text-green-500" />
            Padrão 24x72: Trabalha 24h, folga 72h (3 dias)
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FirstShiftSetup;
