import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, differenceInHours, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, Clock, Calendar, AlertTriangle, Moon, Banknote, Check, Sun, TrendingUp, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

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
  hour_value?: number;
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
  const [isOvertimeViewDialogOpen, setIsOvertimeViewDialogOpen] = useState(false);
  const [viewingOvertime, setViewingOvertime] = useState<OvertimeEntry | null>(null);
  const [editingNote, setEditingNote] = useState<CalendarNote | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', color: 'blue', is_reminder: false });
  const [newFirstShiftDate, setNewFirstShiftDate] = useState<string>('');
  const [dayOffForm, setDayOffForm] = useState({ off_type: '24h', reason: '' });
  const [selectedDayOff, setSelectedDayOff] = useState<DayOff | null>(null);
  const [overtimeForm, setOvertimeForm] = useState({ hours: '', description: '', shiftType: 'day', scheduledTime: '', hourValue: '15.75' });
  const [selectedOvertime, setSelectedOvertime] = useState<OvertimeEntry | null>(null);
  const [isEditingHourValue, setIsEditingHourValue] = useState(false);

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
    
    // Check if there's an overtime entry for this date - show view dialog
    const existingOvertime = getOvertime(date);
    if (existingOvertime) {
      setViewingOvertime(existingOvertime);
      setIsOvertimeViewDialogOpen(true);
      return;
    }
    
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

  const handleEditOvertimeFromView = () => {
    if (!viewingOvertime) return;
    const overtimeDate = parseDateOnly(viewingOvertime.date);
    setSelectedDate(overtimeDate);
    setSelectedOvertime(viewingOvertime);
    setOvertimeForm({ 
      hours: viewingOvertime.hours_worked.toString(), 
      description: viewingOvertime.description || '',
      shiftType: viewingOvertime.shift_type || 'day',
      scheduledTime: viewingOvertime.scheduled_time || '',
      hourValue: viewingOvertime.hour_value?.toString() || '15.75'
    });
    setIsOvertimeViewDialogOpen(false);
    setIsOvertimeDialogOpen(true);
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
        scheduledTime: existingOvertime.scheduled_time || '',
        hourValue: existingOvertime.hour_value?.toString() || '15.75'
      });
    } else {
      setSelectedOvertime(null);
      setOvertimeForm({ hours: '', description: '', shiftType: 'day', scheduledTime: '', hourValue: '15.75' });
    }
    setIsEditingHourValue(false);
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
    const hourValue = parseFloat(overtimeForm.hourValue) || 15.75;
    const computedTotalValue = hours * hourValue;

    // NOTE: total_value is a generated column in the database, so we must NOT send it on INSERT/UPDATE.
    const overtimeDataForDb = {
      agent_id: agent.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      hours_worked: hours,
      description: overtimeForm.description || null,
      month_year: monthYear,
      hour_value: hourValue,
      shift_type: overtimeForm.shiftType,
      scheduled_time: overtimeForm.scheduledTime || null,
      alert_sent: false,
    };

    if (selectedOvertime) {
      const { data, error } = await supabase
        .from('overtime_bank')
        .update(overtimeDataForDb)
        .eq('id', selectedOvertime.id)
        .select('*')
        .single();

      if (error) {
        toast.error('Erro ao atualizar BH');
        return;
      }

      setOvertimeEntries(prev =>
        prev.map(o => (o.id === selectedOvertime.id ? (data ?? { ...o, ...overtimeDataForDb, total_value: computedTotalValue }) : o))
      );
      toast.success('BH atualizado!');
    } else {
      const { data, error } = await supabase
        .from('overtime_bank')
        .insert(overtimeDataForDb)
        .select('*')
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

  // Calculate monthly BH summary
  const monthlyBHSummary = overtimeEntries
    .filter(ot => {
      const otDate = parseDateOnly(ot.date);
      return format(otDate, 'yyyy-MM') === format(currentMonth, 'yyyy-MM');
    })
    .reduce((acc, ot) => ({
      totalHours: acc.totalHours + ot.hours_worked,
      totalValue: acc.totalValue + (ot.total_value || (ot.hours_worked * (ot.hour_value || 15.75))),
      count: acc.count + 1
    }), { totalHours: 0, totalValue: 0, count: 0 });

  // Calculate BH evolution data for last 6 months
  const bhEvolutionData = useMemo(() => {
    const months: { month: string; monthLabel: string; hours: number; value: number; count: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const targetMonth = subMonths(new Date(), i);
      const monthKey = format(targetMonth, 'yyyy-MM');
      const monthLabel = format(targetMonth, 'MMM', { locale: ptBR });
      
      const monthData = overtimeEntries
        .filter(ot => {
          const otDate = parseDateOnly(ot.date);
          return format(otDate, 'yyyy-MM') === monthKey;
        })
        .reduce((acc, ot) => ({
          hours: acc.hours + ot.hours_worked,
          value: acc.value + (ot.total_value || (ot.hours_worked * (ot.hour_value || 15.75))),
          count: acc.count + 1
        }), { hours: 0, value: 0, count: 0 });
      
      months.push({
        month: monthKey,
        monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        hours: monthData.hours,
        value: monthData.value,
        count: monthData.count
      });
    }
    
    return months;
  }, [overtimeEntries]);

  // State for chart visibility
  const [showEvolutionChart, setShowEvolutionChart] = useState(false);

  return (
    <div className="space-y-3">
      {/* Edit Shift Button - Compact */}
      {shiftSchedule && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs">
              1º plantão: <strong>{format(parseDateOnly(shiftSchedule.first_shift_date), "dd/MM/yy")}</strong>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenEditShift}
            disabled={!canEditShift()}
            className={`h-7 text-xs px-2 ${!canEditShift() ? 'opacity-50' : ''}`}
          >
            <Edit2 className="w-3 h-3 mr-1" />
            Editar
          </Button>
        </div>
      )}

      {shiftSchedule && !canEditShift() && (
        <Alert className="border-amber-500/50 bg-amber-500/10 py-2">
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          <AlertDescription className="text-amber-200 text-xs">
            Prazo de 24h para edição expirou.
          </AlertDescription>
        </Alert>
      )}

      {/* Calendar Header - Compact */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-base font-bold capitalize">
          {format(currentMonth, 'MMM yyyy', { locale: ptBR })}
        </h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Week Days - Compact */}
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {weekDays.map(day => (
          <div key={day} className="text-[10px] font-semibold text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid - Rounded buttons with animations */}
      <div className="grid grid-cols-7 gap-1.5">
        {paddingDays.map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square bg-muted/10 rounded-xl" />
        ))}
        
        {days.map(day => {
          const dayNotes = getNotesForDate(day);
          const isShift = isShiftDay(day);
          const shiftCompleted = isShiftCompleted(day);
          const dayOff = getDayOff(day);
          const overtime = getOvertime(day);
          const today = isToday(day);

          // Animation variants for different categories
          const getAnimationProps = () => {
            if (shiftCompleted) {
              return { animate: { opacity: 0.7 } };
            }
            if (overtime) {
              return { 
                animate: { 
                  boxShadow: ['0 0 0px rgba(6, 182, 212, 0)', '0 0 12px rgba(6, 182, 212, 0.5)', '0 0 0px rgba(6, 182, 212, 0)']
                },
                transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const }
              };
            }
            if (dayOff) {
              return {
                animate: { 
                  scale: [1, 1.02, 1]
                },
                transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const }
              };
            }
            if (isShift) {
              return {
                animate: { 
                  borderColor: ['rgba(245, 158, 11, 0.5)', 'rgba(245, 158, 11, 1)', 'rgba(245, 158, 11, 0.5)']
                },
                transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const }
              };
            }
            return {};
          };

          return (
            <motion.button
              key={day.toISOString()}
              whileHover={{ scale: shiftCompleted ? 1 : 1.08, y: shiftCompleted ? 0 : -2 }}
              whileTap={{ scale: shiftCompleted ? 1 : 0.95 }}
              onClick={() => !shiftCompleted && handleDateClick(day)}
              disabled={shiftCompleted}
              {...getAnimationProps()}
              className={`
                aspect-square p-1 rounded-xl transition-all relative overflow-hidden
                ${shiftCompleted
                  ? 'border-2 border-green-600/50 bg-gradient-to-br from-green-800/40 to-green-900/30 cursor-not-allowed'
                  : overtime
                    ? 'border-2 border-cyan-400 bg-gradient-to-br from-cyan-500/40 to-cyan-600/20 shadow-lg shadow-cyan-500/20'
                    : dayOff
                      ? 'border-2 border-purple-400 bg-gradient-to-br from-purple-500/40 to-purple-600/20 shadow-lg shadow-purple-500/20'
                      : isShift 
                        ? 'border-2 border-amber-400 bg-gradient-to-br from-amber-500/40 to-amber-600/20 shadow-lg shadow-amber-500/20' 
                        : today
                          ? 'border-2 border-primary/50 bg-primary/10 shadow-md'
                          : 'border border-border/30 hover:border-primary/30 hover:bg-muted/30 hover:shadow-md'
                }
              `}
            >
              {/* Animated ring for special days */}
              {(overtime || dayOff || isShift) && !shiftCompleted && (
                <motion.div 
                  className={`absolute inset-0 rounded-xl ${
                    overtime ? 'bg-cyan-400/10' : dayOff ? 'bg-purple-400/10' : 'bg-amber-400/10'
                  }`}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              <div className="flex flex-col h-full items-center justify-center relative z-10">
                {/* Date number */}
                <div className={`text-sm font-bold ${
                  shiftCompleted
                    ? 'text-green-400'
                    : overtime
                      ? 'text-cyan-300'
                      : dayOff
                        ? 'text-purple-300'
                        : isShift 
                          ? 'text-amber-300' 
                          : today 
                            ? 'text-primary font-extrabold' 
                            : 'text-foreground/80'
                }`}>
                  {format(day, 'd')}
                </div>
                
                {/* Status indicator with icons */}
                {shiftCompleted && (
                  <motion.div 
                    className="text-green-400"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Check className="w-3 h-3" />
                  </motion.div>
                )}

                {overtime && !shiftCompleted && (
                  <motion.div 
                    className="text-[8px] font-bold text-cyan-300 bg-cyan-500/30 px-1 rounded"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    BH
                  </motion.div>
                )}
                
                {dayOff && !shiftCompleted && !overtime && (
                  <motion.div 
                    className="text-purple-300"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Moon className="w-3 h-3" />
                  </motion.div>
                )}
                
                {isShift && !dayOff && !shiftCompleted && !overtime && (
                  <motion.div 
                    className="text-[8px] font-bold text-amber-300 bg-amber-500/30 px-1 rounded"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    P
                  </motion.div>
                )}

                {/* Note indicator dots */}
                {dayNotes.length > 0 && !isShift && !dayOff && !shiftCompleted && !overtime && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayNotes.slice(0, 2).map((note, idx) => (
                      <motion.div 
                        key={idx} 
                        className={`w-1.5 h-1.5 rounded-full ${getColorClass(note.color)}`}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Legend - More visual */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-muted-foreground bg-muted/20 rounded-lg p-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-md border-2 border-amber-400 bg-amber-500/30" />
          <span>Plantão</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-md border-2 border-green-500 bg-green-800/40 flex items-center justify-center">
            <Check className="w-2 h-2 text-green-400" />
          </div>
          <span>Concluído</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-md border-2 border-cyan-400 bg-cyan-500/30" />
          <span>BH</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-md border-2 border-purple-400 bg-purple-500/30" />
          <span>Folga</span>
        </div>
      </div>

      {/* Monthly BH Summary */}
      {monthlyBHSummary.count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5">
            <CardHeader className="pb-2 pt-3 px-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-cyan-400" />
                  Resumo BH - {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => setShowEvolutionChart(!showEvolutionChart)}
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-1" />
                  {showEvolutionChart ? 'Ocultar' : 'Evolução'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  <div className="text-lg font-bold text-cyan-400">{monthlyBHSummary.count}</div>
                  <div className="text-[10px] text-muted-foreground">Registros</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  <div className="text-lg font-bold text-cyan-400">{monthlyBHSummary.totalHours}h</div>
                  <div className="text-[10px] text-muted-foreground">Total Horas</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  <div className="text-lg font-bold text-green-400">R$ {monthlyBHSummary.totalValue.toFixed(2)}</div>
                  <div className="text-[10px] text-muted-foreground">Valor Total</div>
                </div>
              </div>

              {/* Evolution Chart */}
              <AnimatePresence>
                {showEvolutionChart && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 border-t border-cyan-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-medium">Evolução dos últimos 6 meses</span>
                      </div>
                      
                      {bhEvolutionData.some(d => d.hours > 0) ? (
                        <div className="h-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={bhEvolutionData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                              <defs>
                                <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                              <XAxis 
                                dataKey="monthLabel" 
                                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)' }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                              />
                              <YAxis 
                                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)' }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'rgba(0,0,0,0.8)', 
                                  border: '1px solid rgba(6,182,212,0.5)',
                                  borderRadius: '8px',
                                  fontSize: '12px'
                                }}
                                formatter={(value: number, name: string) => {
                                  if (name === 'hours') return [`${value}h`, 'Horas'];
                                  if (name === 'value') return [`R$ ${value.toFixed(2)}`, 'Valor'];
                                  return [value, name];
                                }}
                                labelFormatter={(label) => `Mês: ${label}`}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="hours" 
                                stroke="#06b6d4" 
                                strokeWidth={2}
                                fill="url(#hoursGradient)"
                                dot={{ fill: '#06b6d4', strokeWidth: 2 }}
                                activeDot={{ r: 6, fill: '#06b6d4' }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground text-xs">
                          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Sem dados de BH para exibir</p>
                        </div>
                      )}

                      {/* Monthly comparison */}
                      {bhEvolutionData.some(d => d.hours > 0) && (
                        <div className="mt-3 grid grid-cols-6 gap-1">
                          {bhEvolutionData.map((month, idx) => (
                            <div 
                              key={month.month}
                              className={`text-center p-1.5 rounded-lg text-[10px] ${
                                format(currentMonth, 'yyyy-MM') === month.month
                                  ? 'bg-cyan-500/30 border border-cyan-500/50'
                                  : 'bg-muted/30'
                              }`}
                            >
                              <div className="font-bold text-cyan-400">{month.hours}h</div>
                              <div className="text-muted-foreground">{month.monthLabel}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* My Schedule Panel - Compact */}
      <Card className="border-primary/30">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            Minha Agenda
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          {upcomingNotes.length === 0 ? (
            <div className="text-center py-3 text-muted-foreground text-xs">
              <Calendar className="w-6 h-6 mx-auto mb-1 opacity-50" />
              <p>Nenhum agendamento</p>
              <p className="text-[10px] mt-0.5">Clique em uma data para adicionar</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {upcomingNotes.slice(0, 5).map(note => {
                const noteDate = parseDateOnly(note.note_date);
                const isNoteToday = isToday(noteDate);
                
                return (
                  <div
                    key={note.id}
                    className={`flex items-center gap-2 p-2 rounded border ${
                      isNoteToday ? 'border-primary/50 bg-primary/5' : 'border-border/50 bg-muted/20'
                    }`}
                  >
                    <div className={`w-1.5 h-6 rounded-full ${getColorClass(note.color)}`} />
                    
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-xs truncate block">{note.title}</span>
                      <div className="text-[10px] text-muted-foreground">
                        {format(noteDate, "dd/MM", { locale: ptBR })}
                        {isNoteToday && <span className="ml-1 text-primary font-semibold">Hoje</span>}
                      </div>
                    </div>

                    <div className="flex">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditNote(note)}>
                        <Edit2 className="w-2.5 h-2.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteNote(note.id)}>
                        <Trash2 className="w-2.5 h-2.5" />
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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

            {/* Hour Value - Editable */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Valor da Hora (R$)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setIsEditingHourValue(!isEditingHourValue)}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  {isEditingHourValue ? 'OK' : 'Editar'}
                </Button>
              </div>
              {isEditingHourValue ? (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={overtimeForm.hourValue}
                  onChange={e => setOvertimeForm(prev => ({ ...prev, hourValue: e.target.value }))}
                  className="h-10"
                  placeholder="15.75"
                />
              ) : (
                <div className="p-2 rounded-lg bg-muted/50 border border-border text-center">
                  <span className="font-bold text-lg">R$ {parseFloat(overtimeForm.hourValue || '15.75').toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground ml-2">/ hora</span>
                </div>
              )}
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

            {/* Auto-generated Summary */}
            {(overtimeForm.hours || overtimeForm.scheduledTime) && selectedDate && (
              <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/30 space-y-3">
                <div className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Resumo do BH
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Data:</span>
                    <div className="font-medium">{format(selectedDate, "dd/MM/yyyy")}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Turno:</span>
                    <div className="font-medium flex items-center gap-1">
                      {overtimeForm.shiftType === 'day' ? (
                        <><Sun className="w-3 h-3 text-amber-400" /> Diurno</>
                      ) : (
                        <><Moon className="w-3 h-3 text-indigo-400" /> Noturno</>
                      )}
                    </div>
                  </div>
                  {overtimeForm.scheduledTime && overtimeForm.hours && (
                    <>
                      <div>
                        <span className="text-muted-foreground text-xs">Início:</span>
                        <div className="font-medium">{overtimeForm.scheduledTime}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Término (estimado):</span>
                        <div className="font-medium">
                          {(() => {
                            const [h, m] = overtimeForm.scheduledTime.split(':').map(Number);
                            const hoursToAdd = parseFloat(overtimeForm.hours) || 0;
                            const totalMinutes = h * 60 + m + hoursToAdd * 60;
                            const endHours = Math.floor(totalMinutes / 60) % 24;
                            const endMinutes = Math.floor(totalMinutes % 60);
                            return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <span className="text-muted-foreground text-xs">Horas:</span>
                    <div className="font-medium">{overtimeForm.hours || '0'}h</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Valor/hora:</span>
                    <div className="font-medium">R$ {parseFloat(overtimeForm.hourValue || '15.75').toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-cyan-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-bold text-cyan-400 text-xl">
                      R$ {(parseFloat(overtimeForm.hours || '0') * parseFloat(overtimeForm.hourValue || '15.75')).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
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
      {/* Overtime View Dialog */}
      <Dialog open={isOvertimeViewDialogOpen} onOpenChange={setIsOvertimeViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-cyan-500" />
              Detalhes do Banco de Horas
            </DialogTitle>
          </DialogHeader>

          {viewingOvertime && (
            <div className="space-y-4">
              {/* Date Display */}
              <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/40">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="font-medium capitalize">
                    {format(parseDateOnly(viewingOvertime.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>

              {/* BH Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <span className="text-xs text-muted-foreground">Horas Trabalhadas</span>
                  <div className="font-bold text-xl text-cyan-400">{viewingOvertime.hours_worked}h</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <span className="text-xs text-muted-foreground">Turno</span>
                  <div className="font-bold text-lg flex items-center gap-1">
                    {viewingOvertime.shift_type === 'night' ? (
                      <><Moon className="w-4 h-4 text-indigo-400" /> Noturno</>
                    ) : (
                      <><Sun className="w-4 h-4 text-amber-400" /> Diurno</>
                    )}
                  </div>
                </div>
              </div>

              {/* Schedule Times */}
              {viewingOvertime.scheduled_time && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <span className="text-xs text-muted-foreground">Horário de Início</span>
                    <div className="font-bold text-lg">{viewingOvertime.scheduled_time}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <span className="text-xs text-muted-foreground">Término (estimado)</span>
                    <div className="font-bold text-lg">
                      {(() => {
                        const [h, m] = viewingOvertime.scheduled_time!.split(':').map(Number);
                        const hoursToAdd = viewingOvertime.hours_worked || 0;
                        const totalMinutes = h * 60 + m + hoursToAdd * 60;
                        const endHours = Math.floor(totalMinutes / 60) % 24;
                        const endMinutes = Math.floor(totalMinutes % 60);
                        return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {viewingOvertime.description && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <span className="text-xs text-muted-foreground">Descrição</span>
                  <div className="font-medium mt-1">{viewingOvertime.description}</div>
                </div>
              )}

              {/* Value Summary */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-sm">Valor/hora:</span>
                  <span className="font-medium">R$ {(viewingOvertime.hour_value || 15.75).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-cyan-500/20">
                  <span className="font-semibold">Valor Total:</span>
                  <span className="font-bold text-cyan-400 text-2xl">
                    R$ {(viewingOvertime.total_value || (viewingOvertime.hours_worked * (viewingOvertime.hour_value || 15.75))).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsOvertimeViewDialogOpen(false)}>
                  Fechar
                </Button>
                <Button 
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                  onClick={handleEditOvertimeFromView}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShiftCalendar;
