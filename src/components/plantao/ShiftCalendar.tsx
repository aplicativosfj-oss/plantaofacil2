import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, differenceInHours, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, Clock, Calendar, AlertTriangle, Moon, Banknote, Check, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CalendarNote {
  id: string;
  note_date: string;
  title: string;
  content: string | null;
  color: string;
  is_reminder: boolean;
}

interface ShiftDate {
  shift_date: string;
  is_working: boolean;
}

interface DayOff {
  id: string;
  off_date: string;
  off_type: string;
  reason: string | null;
}

interface OvertimeEntry {
  id: string;
  date: string;
  hours_worked: number;
  description: string | null;
  total_value: number | null;
  shift_type?: string;
  scheduled_time?: string;
}

const COLORS = [
  { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
  { value: 'green', label: 'Verde', class: 'bg-green-500' },
  { value: 'amber', label: 'Amarelo', class: 'bg-amber-500' },
  { value: 'red', label: 'Vermelho', class: 'bg-red-500' },
  { value: 'purple', label: 'Roxo', class: 'bg-purple-500' },
];

const getColorClass = (color: string) => {
  return COLORS.find(c => c.value === color)?.class || 'bg-blue-500';
};

const ShiftCalendar = () => {
  const { agent } = usePlantaoAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [shiftDates, setShiftDates] = useState<ShiftDate[]>([]);
  const [daysOff, setDaysOff] = useState<DayOff[]>([]);
  const [overtimeEntries, setOvertimeEntries] = useState<OvertimeEntry[]>([]);
  const [shiftSchedule, setShiftSchedule] = useState<{ first_shift_date: string; id: string } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditShiftDialogOpen, setIsEditShiftDialogOpen] = useState(false);
  const [isDayOffDialogOpen, setIsDayOffDialogOpen] = useState(false);
  const [isOvertimeDialogOpen, setIsOvertimeDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CalendarNote | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', color: 'blue', is_reminder: false });
  const [newFirstShiftDate, setNewFirstShiftDate] = useState<string>('');
  const [dayOffForm, setDayOffForm] = useState({ off_type: '24h', reason: '' });
  const [selectedDayOff, setSelectedDayOff] = useState<DayOff | null>(null);
  const [overtimeForm, setOvertimeForm] = useState({ hours: '', description: '', shiftType: 'day', scheduledTime: '' });
  const [selectedOvertime, setSelectedOvertime] = useState<OvertimeEntry | null>(null);

  // IMPORTANT: date strings like "2026-01-03" MUST be parsed as local dates.
  // new Date('YYYY-MM-DD') parses as UTC and shifts the day in Brazil timezone.
  const parseDateOnly = (value: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(value);
  };

  // Fetch notes
  useEffect(() => {
    if (!agent?.id) return;

    const fetchNotes = async () => {
      const { data } = await supabase
        .from('calendar_notes')
        .select('*')
        .eq('agent_id', agent.id)
        .order('note_date', { ascending: true });

      if (data) setNotes(data);
    };

    fetchNotes();
  }, [agent?.id]);

  // Fetch shift dates, days off, and overtime
  useEffect(() => {
    if (!agent?.id) return;

    const fetchData = async () => {
      const { data: schedule } = await supabase
        .from('shift_schedules')
        .select('*')
        .eq('agent_id', agent.id)
        .maybeSingle();

      if (schedule) {
        setShiftSchedule({ first_shift_date: schedule.first_shift_date, id: schedule.id });
        
        const { data } = await supabase.rpc('generate_shift_dates', {
          p_first_date: schedule.first_shift_date,
          p_pattern: schedule.shift_pattern,
          p_months_ahead: 3
        });

        if (data) setShiftDates(data);
      }

      // Fetch days off
      const { data: daysOffData } = await supabase
        .from('agent_days_off')
        .select('*')
        .eq('agent_id', agent.id)
        .order('off_date', { ascending: true });

      if (daysOffData) setDaysOff(daysOffData);

      // Fetch overtime entries
      const { data: overtimeData } = await supabase
        .from('overtime_bank')
        .select('*')
        .eq('agent_id', agent.id)
        .order('date', { ascending: true });

      if (overtimeData) setOvertimeEntries(overtimeData);
    };

    fetchData();
  }, [agent?.id]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getNotesForDate = (date: Date) => {
    return notes.filter(note => isSameDay(parseDateOnly(note.note_date), date));
  };

  const isShiftDay = (date: Date) => {
    return shiftDates.some(shift => isSameDay(parseDateOnly(shift.shift_date), date));
  };

  const isShiftCompleted = (date: Date) => {
    const today = startOfDay(new Date());
    return isShiftDay(date) && isBefore(date, today);
  };

  const getDayOff = (date: Date) => {
    return daysOff.find(dayOff => isSameDay(parseDateOnly(dayOff.off_date), date));
  };

  const getOvertime = (date: Date) => {
    return overtimeEntries.find(ot => isSameDay(parseDateOnly(ot.date), date));
  };

  // Check if shift can be edited (within 24 hours before first shift date)
  const canEditShift = () => {
    if (!shiftSchedule) return false;
    const firstShiftDate = parseDateOnly(shiftSchedule.first_shift_date);
    firstShiftDate.setHours(6, 0, 0, 0); // Shift starts at 06:00
    const hoursUntilShift = differenceInHours(firstShiftDate, new Date());
    return hoursUntilShift > 24;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEditingNote(null);
    setFormData({ title: '', content: '', color: 'blue', is_reminder: false });
    
    // Check if there's already a day off
    const existingDayOff = getDayOff(date);
    if (existingDayOff) {
      setSelectedDayOff(existingDayOff);
      setDayOffForm({ off_type: existingDayOff.off_type, reason: existingDayOff.reason || '' });
    } else {
      setSelectedDayOff(null);
      setDayOffForm({ off_type: '24h', reason: '' });
    }
    
    setIsDialogOpen(true);
  };

  const handleOpenDayOffDialog = () => {
    if (!selectedDate) return;
    const existingDayOff = getDayOff(selectedDate);
    if (existingDayOff) {
      setSelectedDayOff(existingDayOff);
      setDayOffForm({ off_type: existingDayOff.off_type, reason: existingDayOff.reason || '' });
    } else {
      setSelectedDayOff(null);
      setDayOffForm({ off_type: '24h', reason: '' });
    }
    setIsDialogOpen(false);
    setIsDayOffDialogOpen(true);
  };

  const handleSaveDayOff = async () => {
    if (!agent?.id || !selectedDate) return;

    const offData = {
      agent_id: agent.id,
      off_date: format(selectedDate, 'yyyy-MM-dd'),
      off_type: dayOffForm.off_type,
      reason: dayOffForm.reason || null
    };

    if (selectedDayOff) {
      const { error } = await supabase
        .from('agent_days_off')
        .update(offData)
        .eq('id', selectedDayOff.id);

      if (error) {
        toast.error('Erro ao atualizar folga');
        return;
      }

      setDaysOff(prev => prev.map(d => d.id === selectedDayOff.id ? { ...d, ...offData } : d));
      toast.success('Folga atualizada!');
    } else {
      const { data, error } = await supabase
        .from('agent_days_off')
        .insert(offData)
        .select()
        .single();

      if (error) {
        toast.error('Erro ao registrar folga');
        return;
      }

      setDaysOff(prev => [...prev, data]);
      toast.success('Folga registrada!');
    }

    setIsDayOffDialogOpen(false);
  };

  const handleDeleteDayOff = async (dayOffId: string) => {
    const { error } = await supabase
      .from('agent_days_off')
      .delete()
      .eq('id', dayOffId);

    if (error) {
      toast.error('Erro ao remover folga');
      return;
    }

    setDaysOff(prev => prev.filter(d => d.id !== dayOffId));
    toast.success('Folga removida!');
    setIsDayOffDialogOpen(false);
  };

  const handleSaveNote = async () => {
    if (!agent?.id || !selectedDate || !formData.title.trim()) {
      toast.error('Preencha o título do agendamento');
      return;
    }

    const noteData = {
      agent_id: agent.id,
      note_date: format(selectedDate, 'yyyy-MM-dd'),
      title: formData.title,
      content: formData.content || null,
      color: formData.color,
      is_reminder: formData.is_reminder
    };

    if (editingNote) {
      const { error } = await supabase
        .from('calendar_notes')
        .update(noteData)
        .eq('id', editingNote.id);

      if (error) {
        toast.error('Erro ao atualizar agendamento');
        return;
      }

      setNotes(prev => prev.map(n => n.id === editingNote.id ? { ...n, ...noteData } : n));
      toast.success('Agendamento atualizado!');
    } else {
      const { data, error } = await supabase
        .from('calendar_notes')
        .insert(noteData)
        .select()
        .single();

      if (error) {
        toast.error('Erro ao criar agendamento');
        return;
      }

      setNotes(prev => [...prev, data]);
      toast.success('Agendamento criado!');
    }

    setIsDialogOpen(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    const { error } = await supabase
      .from('calendar_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      toast.error('Erro ao excluir agendamento');
      return;
    }

    setNotes(prev => prev.filter(n => n.id !== noteId));
    toast.success('Agendamento excluído!');
  };

  const handleEditNote = (note: CalendarNote) => {
    setEditingNote(note);
    setSelectedDate(parseDateOnly(note.note_date));
    setFormData({
      title: note.title,
      content: note.content || '',
      color: note.color,
      is_reminder: note.is_reminder
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditShift = () => {
    if (!canEditShift()) {
      toast.error('Não é possível editar a escala. O prazo de 24 horas já passou.');
      return;
    }
    setNewFirstShiftDate(shiftSchedule?.first_shift_date || '');
    setIsEditShiftDialogOpen(true);
  };

  const handleSaveShiftEdit = async () => {
    if (!shiftSchedule || !newFirstShiftDate) {
      toast.error('Selecione uma data válida');
      return;
    }

    const { error } = await supabase
      .from('shift_schedules')
      .update({ first_shift_date: newFirstShiftDate })
      .eq('id', shiftSchedule.id);

    if (error) {
      toast.error('Erro ao atualizar escala');
      return;
    }

    // Regenerate shift dates
    const { data } = await supabase.rpc('generate_shift_dates', {
      p_first_date: newFirstShiftDate,
      p_pattern: '24x72',
      p_months_ahead: 3
    });

    if (data) {
      setShiftDates(data);
      setShiftSchedule(prev => prev ? { ...prev, first_shift_date: newFirstShiftDate } : null);
    }

    toast.success('Escala atualizada com sucesso!');
    setIsEditShiftDialogOpen(false);
  };

  // Overtime handlers
  const handleOpenOvertimeDialog = () => {
    if (!selectedDate) return;
    const existingOvertime = getOvertime(selectedDate);
    if (existingOvertime) {
      setSelectedOvertime(existingOvertime);
      setOvertimeForm({ 
        hours: existingOvertime.hours_worked.toString(), 
        description: existingOvertime.description || '',
        shiftType: existingOvertime.shift_type || 'day',
        scheduledTime: existingOvertime.scheduled_time || ''
      });
    } else {
      setSelectedOvertime(null);
      setOvertimeForm({ hours: '', description: '', shiftType: 'day', scheduledTime: '' });
    }
    setIsDialogOpen(false);
    setIsOvertimeDialogOpen(true);
  };

  const handleSaveOvertime = async () => {
    if (!agent?.id || !selectedDate || !overtimeForm.hours) {
      toast.error('Informe as horas trabalhadas');
      return;
    }

    const hours = parseFloat(overtimeForm.hours);
    if (isNaN(hours) || hours <= 0) {
      toast.error('Informe um valor de horas válido');
      return;
    }

    const monthYear = format(selectedDate, 'yyyy-MM');
    const overtimeData = {
      agent_id: agent.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      hours_worked: hours,
      description: overtimeForm.description || null,
      month_year: monthYear,
      hour_value: 15.75,
      total_value: hours * 15.75,
      shift_type: overtimeForm.shiftType,
      scheduled_time: overtimeForm.scheduledTime || null,
      alert_sent: false
    };

    if (selectedOvertime) {
      const { error } = await supabase
        .from('overtime_bank')
        .update(overtimeData)
        .eq('id', selectedOvertime.id);

      if (error) {
        toast.error('Erro ao atualizar BH');
        return;
      }

      setOvertimeEntries(prev => prev.map(o => o.id === selectedOvertime.id ? { ...o, ...overtimeData } : o));
      toast.success('BH atualizado!');
    } else {
      const { data, error } = await supabase
        .from('overtime_bank')
        .insert(overtimeData)
        .select()
        .single();

      if (error) {
        toast.error('Erro ao registrar BH');
        return;
      }

      setOvertimeEntries(prev => [...prev, data]);
      toast.success('BH registrado!');
    }

    setIsOvertimeDialogOpen(false);
  };

  const handleDeleteOvertime = async (overtimeId: string) => {
    const { error } = await supabase
      .from('overtime_bank')
      .delete()
      .eq('id', overtimeId);

    if (error) {
      toast.error('Erro ao remover BH');
      return;
    }

    setOvertimeEntries(prev => prev.filter(o => o.id !== overtimeId));
    toast.success('BH removido!');
    setIsOvertimeDialogOpen(false);
  };

  // First day of month padding
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();
  const paddingDays = Array(firstDayOfMonth).fill(null);

  // Get upcoming scheduled items
  const todayStart = startOfDay(new Date());
  const upcomingNotes = notes
    .filter(note => parseDateOnly(note.note_date) >= todayStart)
    .sort((a, b) => parseDateOnly(a.note_date).getTime() - parseDateOnly(b.note_date).getTime());

  return (
    <div className="space-y-6">
      {/* Edit Shift Button */}
      {shiftSchedule && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm">
              Primeiro plantão: <strong>{format(parseDateOnly(shiftSchedule.first_shift_date), "dd/MM/yyyy")}</strong>
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenEditShift}
            disabled={!canEditShift()}
            className={!canEditShift() ? 'opacity-50' : ''}
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Editar
          </Button>
        </div>
      )}

      {shiftSchedule && !canEditShift() && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-200 text-sm">
            O prazo de 24 horas para edição da escala expirou. A configuração está bloqueada.
          </AlertDescription>
        </Alert>
      )}

      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h3 className="text-lg font-bold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map(day => (
          <div key={day} className="text-xs font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {paddingDays.map((_, i) => (
          <div key={`pad-${i}`} className="h-16 bg-muted/10 rounded-lg" />
        ))}
        
        {days.map(day => {
          const dayNotes = getNotesForDate(day);
          const isShift = isShiftDay(day);
          const shiftCompleted = isShiftCompleted(day);
          const dayOff = getDayOff(day);
          const overtime = getOvertime(day);
          const today = isToday(day);
          const dayOfWeek = format(day, 'EEE', { locale: ptBR });

          return (
            <motion.button
              key={day.toISOString()}
              whileHover={{ scale: shiftCompleted ? 1 : 1.02 }}
              whileTap={{ scale: shiftCompleted ? 1 : 0.98 }}
              onClick={() => !shiftCompleted && handleDateClick(day)}
              disabled={shiftCompleted}
              className={`
                h-16 p-1 rounded-lg transition-all relative
                ${shiftCompleted
                  ? 'border-2 border-green-600/50 bg-gradient-to-br from-green-800/40 to-green-900/30 opacity-60 cursor-not-allowed'
                  : overtime
                    ? 'border-2 border-cyan-500 bg-gradient-to-br from-cyan-500/30 to-cyan-600/20 shadow-md shadow-cyan-500/20'
                    : dayOff
                      ? 'border-2 border-purple-500 bg-gradient-to-br from-purple-500/30 to-purple-600/20 shadow-md shadow-purple-500/20'
                      : isShift 
                        ? 'border-2 border-amber-500 bg-gradient-to-br from-amber-500/30 to-amber-600/20 shadow-md shadow-amber-500/20' 
                        : 'border border-transparent hover:border-muted-foreground/20 hover:bg-muted/20'
                }
              `}
            >
              <div className="flex flex-col h-full items-center justify-center">
                {/* Day of week (small) */}
                <div className={`text-[9px] uppercase ${
                  shiftCompleted ? 'text-green-500' : overtime ? 'text-cyan-400' : dayOff ? 'text-purple-400' : isShift ? 'text-amber-400' : 'text-muted-foreground'
                }`}>
                  {dayOfWeek}
                </div>
                
                {/* Date number */}
                <div className={`text-lg font-bold ${
                  shiftCompleted
                    ? 'text-green-500'
                    : overtime
                      ? 'text-cyan-400'
                      : dayOff
                        ? 'text-purple-500'
                        : isShift 
                          ? 'text-amber-500' 
                          : today 
                            ? 'text-primary' 
                            : 'text-foreground'
                }`}>
                  {format(day, 'd')}
                </div>
                
                {/* Completed shift indicator */}
                {shiftCompleted && (
                  <div className="text-[7px] font-bold text-green-500 mt-0.5 flex items-center gap-0.5">
                    <Check className="w-2 h-2" />
                    CUMPRIDO
                  </div>
                )}

                {/* Overtime indicator */}
                {overtime && !shiftCompleted && (
                  <div className="text-[7px] font-bold text-cyan-400 mt-0.5">
                    BH {overtime.hours_worked}h
                  </div>
                )}
                
                {/* Day off indicator */}
                {dayOff && !shiftCompleted && !overtime && (
                  <div className="text-[7px] font-bold text-purple-400 mt-0.5">
                    FOLGA {dayOff.off_type}
                  </div>
                )}
                
                {/* Shift indicator */}
                {isShift && !dayOff && !shiftCompleted && !overtime && (
                  <div className="text-[7px] font-bold text-amber-400 mt-0.5">
                    PLANTÃO
                  </div>
                )}

                {/* Note indicator dot */}
                {dayNotes.length > 0 && !isShift && !dayOff && !shiftCompleted && !overtime && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayNotes.slice(0, 3).map((note, idx) => (
                      <div key={idx} className={`w-1.5 h-1.5 rounded-full ${getColorClass(note.color)}`} />
                    ))}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-amber-500 bg-amber-500/30" />
          <span>Plantão</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-green-600/50 bg-green-800/40" />
          <span>Cumprido</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-cyan-500 bg-cyan-500/30" />
          <span>BH</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-purple-500 bg-purple-500/30" />
          <span>Folga</span>
        </div>
      </div>

      {/* My Schedule Panel */}
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Minha Agenda
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingNotes.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum agendamento encontrado</p>
              <p className="text-xs mt-1">Clique em uma data para adicionar</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {upcomingNotes.map(note => {
                const noteDate = parseDateOnly(note.note_date);
                const isNoteToday = isToday(noteDate);
                
                return (
                  <div
                    key={note.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      isNoteToday ? 'border-primary/50 bg-primary/5' : 'border-border/50 bg-muted/20'
                    }`}
                  >
                    <div className={`w-2 h-full min-h-8 rounded-full ${getColorClass(note.color)}`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{note.title}</span>
                        {isNoteToday && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Hoje
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(noteDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </div>
                      {note.content && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {note.content}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditNote(note)}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteNote(note.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? 'Editar Agendamento' : 'Novo Agendamento'}
              {selectedDate && (
                <span className="text-muted-foreground font-normal ml-2">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quick actions */}
            {selectedDate && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                  onClick={handleOpenDayOffDialog}
                >
                  <Moon className="w-4 h-4 mr-1" />
                  {getDayOff(selectedDate) ? 'Editar Folga' : 'Folga'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                  onClick={handleOpenOvertimeDialog}
                >
                  <Banknote className="w-4 h-4 mr-1" />
                  {getOvertime(selectedDate) ? 'Editar BH' : 'Reg. BH'}
                </Button>
              </div>
            )}

            {/* Existing notes for this date */}
            {selectedDate && !editingNote && getNotesForDate(selectedDate).length > 0 && (
              <div className="space-y-2 pb-4 border-b">
                <Label className="text-sm text-muted-foreground">Agendamentos existentes:</Label>
                {getNotesForDate(selectedDate).map(note => (
                  <div key={note.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <div className={`w-2 h-2 rounded-full ${getColorClass(note.color)}`} />
                    <span className="flex-1 text-sm truncate">{note.title}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditNote(note)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteNote(note.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Reunião com supervisor"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={formData.content}
                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Detalhes adicionais..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <Select value={formData.color} onValueChange={value => setFormData(prev => ({ ...prev, color: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color.class}`} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSaveNote}>
                <Plus className="w-4 h-4 mr-2" />
                {editingNote ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Shift Dialog */}
      <Dialog open={isEditShiftDialogOpen} onOpenChange={setIsEditShiftDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Editar Data do Primeiro Plantão
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-200 text-sm">
                Você só pode editar a escala até 24 horas antes do primeiro plantão.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Nova data do primeiro plantão</Label>
              <Input
                type="date"
                value={newFirstShiftDate}
                onChange={e => setNewFirstShiftDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditShiftDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSaveShiftEdit}>
                Confirmar Alteração
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Day Off Dialog */}
      <Dialog open={isDayOffDialogOpen} onOpenChange={setIsDayOffDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-purple-500" />
              {selectedDayOff ? 'Editar Folga' : 'Registrar Folga'}
              {selectedDate && (
                <span className="text-muted-foreground font-normal text-sm ml-2">
                  {format(selectedDate, "dd/MM (EEEE)", { locale: ptBR })}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Tipo de Folga</Label>
              <RadioGroup
                value={dayOffForm.off_type}
                onValueChange={(value) => setDayOffForm(prev => ({ ...prev, off_type: value }))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="24h" id="off-24h" />
                  <Label htmlFor="off-24h" className="cursor-pointer">24 horas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="12h" id="off-12h" />
                  <Label htmlFor="off-12h" className="cursor-pointer">12 horas</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea
                value={dayOffForm.reason}
                onChange={e => setDayOffForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Ex: Compensação, folga extra..."
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              {selectedDayOff && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteDayOff(selectedDayOff.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button variant="outline" className="flex-1" onClick={() => setIsDayOffDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={handleSaveDayOff}>
                {selectedDayOff ? 'Salvar' : 'Registrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Overtime Dialog */}
      <Dialog open={isOvertimeDialogOpen} onOpenChange={setIsOvertimeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-cyan-500" />
              {selectedOvertime ? 'Editar Banco de Horas' : 'Registrar Banco de Horas'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Selected Date Display */}
            {selectedDate && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="font-medium">
                    {format(selectedDate, "dd 'de' MMMM 'de' yyyy (EEEE)", { locale: ptBR })}
                  </span>
                </div>
              </div>
            )}

            {/* Hours Worked - Primary field */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Quantas horas de BH?</Label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={overtimeForm.hours}
                onChange={e => setOvertimeForm(prev => ({ ...prev, hours: e.target.value }))}
                placeholder="Ex: 4, 6, 12..."
                className="text-lg h-12"
              />
            </div>

            {/* Shift Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Turno</Label>
              <RadioGroup
                value={overtimeForm.shiftType}
                onValueChange={(value) => setOvertimeForm(prev => ({ ...prev, shiftType: value }))}
                className="grid grid-cols-2 gap-3"
              >
                <div className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  overtimeForm.shiftType === 'day' 
                    ? 'border-amber-500 bg-amber-500/20' 
                    : 'border-muted hover:border-muted-foreground/50'
                }`}>
                  <RadioGroupItem value="day" id="shift-day" className="sr-only" />
                  <Label htmlFor="shift-day" className="cursor-pointer flex items-center gap-2">
                    <Sun className="w-5 h-5 text-amber-400" />
                    <span>Diurno</span>
                  </Label>
                </div>
                <div className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  overtimeForm.shiftType === 'night' 
                    ? 'border-indigo-500 bg-indigo-500/20' 
                    : 'border-muted hover:border-muted-foreground/50'
                }`}>
                  <RadioGroupItem value="night" id="shift-night" className="sr-only" />
                  <Label htmlFor="shift-night" className="cursor-pointer flex items-center gap-2">
                    <Moon className="w-5 h-5 text-indigo-400" />
                    <span>Noturno</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Scheduled Time for Alert */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Horário de Início</Label>
              <Input
                type="time"
                value={overtimeForm.scheduledTime}
                onChange={e => setOvertimeForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                className="h-12"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                O sistema enviará um alerta 1 hora antes deste horário
              </p>
            </div>

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={overtimeForm.description}
                onChange={e => setOvertimeForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Reforço escolta, cobertura..."
                rows={2}
              />
            </div>

            {overtimeForm.hours && (
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Valor estimado:</span>
                  <span className="font-bold text-cyan-400 text-lg">
                    R$ {(parseFloat(overtimeForm.hours || '0') * 15.75).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  {overtimeForm.shiftType === 'day' ? (
                    <><Sun className="w-3 h-3 text-amber-400" /> Turno Diurno</>
                  ) : (
                    <><Moon className="w-3 h-3 text-indigo-400" /> Turno Noturno</>
                  )}
                  {overtimeForm.scheduledTime && (
                    <span className="ml-2">• Início às {overtimeForm.scheduledTime}</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {selectedOvertime && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteOvertime(selectedOvertime.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button variant="outline" className="flex-1" onClick={() => setIsOvertimeDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700" onClick={handleSaveOvertime}>
                {selectedOvertime ? 'Salvar' : 'Registrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShiftCalendar;
