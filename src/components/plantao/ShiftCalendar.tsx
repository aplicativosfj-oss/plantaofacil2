import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CalendarNote | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', color: 'blue', is_reminder: false });

  // Fetch notes
  useEffect(() => {
    if (!agent?.id) return;

    const fetchNotes = async () => {
      const { data } = await supabase
        .from('calendar_notes')
        .select('*')
        .eq('agent_id', agent.id);

      if (data) setNotes(data);
    };

    fetchNotes();
  }, [agent?.id]);

  // Fetch shift dates
  useEffect(() => {
    if (!agent?.id) return;

    const fetchShiftDates = async () => {
      // First check if agent has a schedule
      const { data: schedule } = await supabase
        .from('shift_schedules')
        .select('*')
        .eq('agent_id', agent.id)
        .single();

      if (schedule) {
        const { data } = await supabase.rpc('generate_shift_dates', {
          p_first_date: schedule.first_shift_date,
          p_pattern: schedule.shift_pattern,
          p_months_ahead: 3
        });

        if (data) setShiftDates(data);
      }
    };

    fetchShiftDates();
  }, [agent?.id]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getNotesForDate = (date: Date) => {
    return notes.filter(note => isSameDay(new Date(note.note_date), date));
  };

  const isShiftDay = (date: Date) => {
    return shiftDates.some(shift => isSameDay(new Date(shift.shift_date), date));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEditingNote(null);
    setFormData({ title: '', content: '', color: 'blue', is_reminder: false });
    setIsDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!agent?.id || !selectedDate || !formData.title.trim()) {
      toast.error('Preencha o título da anotação');
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
        toast.error('Erro ao atualizar anotação');
        return;
      }

      setNotes(prev => prev.map(n => n.id === editingNote.id ? { ...n, ...noteData } : n));
      toast.success('Anotação atualizada!');
    } else {
      const { data, error } = await supabase
        .from('calendar_notes')
        .insert(noteData)
        .select()
        .single();

      if (error) {
        toast.error('Erro ao criar anotação');
        return;
      }

      setNotes(prev => [...prev, data]);
      toast.success('Anotação criada!');
    }

    setIsDialogOpen(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    const { error } = await supabase
      .from('calendar_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      toast.error('Erro ao excluir anotação');
      return;
    }

    setNotes(prev => prev.filter(n => n.id !== noteId));
    toast.success('Anotação excluída!');
  };

  const handleEditNote = (note: CalendarNote) => {
    setEditingNote(note);
    setSelectedDate(new Date(note.note_date));
    setFormData({
      title: note.title,
      content: note.content || '',
      color: note.color,
      is_reminder: note.is_reminder
    });
    setIsDialogOpen(true);
  };

  // First day of month padding
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();
  const paddingDays = Array(firstDayOfMonth).fill(null);

  return (
    <div className="space-y-4">
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
          <div key={`pad-${i}`} className="h-20 bg-muted/20 rounded-lg" />
        ))}
        
        {days.map(day => {
          const dayNotes = getNotesForDate(day);
          const isShift = isShiftDay(day);
          const today = isToday(day);
          const isShiftToday = isShift && today;

          return (
            <motion.button
              key={day.toISOString()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDateClick(day)}
              className={`
                h-24 p-1 rounded-lg border-2 transition-all relative overflow-hidden
                ${isShiftToday 
                  ? 'border-amber-500 bg-gradient-to-br from-amber-500/20 to-amber-600/10 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/20' 
                  : isShift 
                    ? 'border-amber-500/50 bg-amber-500/10' 
                    : today 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border/50 bg-card/50'
                }
                hover:border-primary/50 hover:bg-card
              `}
            >
              <div className="flex flex-col h-full">
                {/* Date number */}
                <div className="flex items-center justify-between">
                  <div className={`text-sm font-bold ${isShiftToday ? 'text-amber-500' : today ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  
                  {isShift && (
                    <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-semibold ${isShiftToday ? 'bg-amber-500 text-white animate-pulse' : 'bg-amber-500/20 text-amber-500'}`}>
                      <Clock className="w-2.5 h-2.5" />
                      {isShiftToday ? '24H' : 'P'}
                    </div>
                  )}
                </div>

                {/* Shift indicator for shift days */}
                {isShift && (
                  <div className={`text-[9px] text-center mt-0.5 px-1 py-0.5 rounded ${isShiftToday ? 'bg-amber-500/30 text-amber-200 font-medium' : 'text-amber-500/80'}`}>
                    {isShiftToday ? '🔥 PLANTÃO' : 'Plantão'}
                  </div>
                )}

                {/* Notes */}
                <div className="flex-1 overflow-hidden space-y-0.5 mt-1">
                  {dayNotes.slice(0, 1).map(note => (
                    <div
                      key={note.id}
                      className={`text-[9px] px-1 py-0.5 rounded truncate text-white ${getColorClass(note.color)}`}
                    >
                      {note.title}
                    </div>
                  ))}
                  {dayNotes.length > 1 && (
                    <div className="text-[9px] text-muted-foreground">
                      +{dayNotes.length - 1}
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-500" />
          <span>Dia de Plantão</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-primary bg-primary/10" />
          <span>Hoje</span>
        </div>
      </div>

      {/* Note Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? 'Editar Anotação' : 'Nova Anotação'}
              {selectedDate && (
                <span className="text-muted-foreground font-normal ml-2">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Existing notes for this date */}
            {selectedDate && !editingNote && getNotesForDate(selectedDate).length > 0 && (
              <div className="space-y-2 pb-4 border-b">
                <Label className="text-sm text-muted-foreground">Anotações existentes:</Label>
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
    </div>
  );
};

export default ShiftCalendar;
