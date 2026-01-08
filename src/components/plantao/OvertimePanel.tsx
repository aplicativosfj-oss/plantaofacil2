import { useState, useEffect, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, DollarSign, Clock, Plus, Trash2, Edit2, 
  TrendingUp, Calendar, Sun, Moon, AlertCircle, Banknote,
  ChevronLeft, ChevronRight, Download, FileText, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import SoundButton from './SoundButton';
import plantaoLogo from '@/assets/plantao-pro-logo-new.png';

interface OvertimeEntry {
  id: string;
  date: string;
  hours_worked: number;
  description: string | null;
  total_value: number | null;
  hour_value: number;
  shift_type: string;
  scheduled_time: string | null;
  month_year: string;
  created_at: string;
}

interface Props { 
  onBack: () => void; 
}

const HOUR_VALUE_OPTIONS = [
  { value: '15.75', label: 'R$ 15,75 (Padrão)' },
  { value: '20.00', label: 'R$ 20,00' },
  { value: '25.00', label: 'R$ 25,00' },
  { value: '31.50', label: 'R$ 31,50 (Hora Dobrada)' },
];

const CHART_COLORS = ['#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const OvertimePanel = ({ onBack }: Props) => {
  const { agent } = usePlantaoAuth();
  const [entries, setEntries] = useState<OvertimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<OvertimeEntry | null>(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    hours: '',
    description: '',
    shiftType: 'day',
    scheduledTime: '',
    hourValue: '15.75',
  });
  const [activeTab, setActiveTab] = useState('list');

  // Parse date string as local date
  const parseDateOnly = (value: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(value);
  };

  // Fetch overtime entries
  useEffect(() => {
    if (!agent?.id) return;

    const fetchEntries = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('overtime_bank')
        .select('*')
        .eq('agent_id', agent.id)
        .order('date', { ascending: false });

      if (error) {
        toast.error('Erro ao carregar banco de horas');
      } else {
        setEntries(data || []);
      }
      setLoading(false);
    };

    fetchEntries();
  }, [agent?.id]);

  // Filter entries by selected month
  const filteredEntries = useMemo(() => {
    const monthKey = format(selectedMonth, 'yyyy-MM');
    return entries.filter(e => e.month_year === monthKey);
  }, [entries, selectedMonth]);

  // Calculate monthly summary
  const monthlySummary = useMemo(() => {
    return filteredEntries.reduce((acc, entry) => ({
      totalHours: acc.totalHours + entry.hours_worked,
      totalValue: acc.totalValue + (entry.total_value || entry.hours_worked * entry.hour_value),
      dayShifts: acc.dayShifts + (entry.shift_type === 'day' ? 1 : 0),
      nightShifts: acc.nightShifts + (entry.shift_type === 'night' ? 1 : 0),
      count: acc.count + 1,
    }), { totalHours: 0, totalValue: 0, dayShifts: 0, nightShifts: 0, count: 0 });
  }, [filteredEntries]);

  // Calculate yearly summary
  const yearlySummary = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return entries
      .filter(e => parseDateOnly(e.date).getFullYear() === currentYear)
      .reduce((acc, entry) => ({
        totalHours: acc.totalHours + entry.hours_worked,
        totalValue: acc.totalValue + (entry.total_value || entry.hours_worked * entry.hour_value),
        count: acc.count + 1,
      }), { totalHours: 0, totalValue: 0, count: 0 });
  }, [entries]);

  // Evolution chart data (last 6 months)
  const evolutionData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const targetMonth = subMonths(new Date(), i);
      const monthKey = format(targetMonth, 'yyyy-MM');
      const monthLabel = format(targetMonth, 'MMM', { locale: ptBR });
      
      const monthEntries = entries.filter(e => e.month_year === monthKey);
      const monthData = monthEntries.reduce((acc, e) => ({
        hours: acc.hours + e.hours_worked,
        value: acc.value + (e.total_value || e.hours_worked * e.hour_value),
        count: acc.count + 1,
      }), { hours: 0, value: 0, count: 0 });

      months.push({
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        monthFull: format(targetMonth, 'MMMM yyyy', { locale: ptBR }),
        hours: monthData.hours,
        value: monthData.value,
        count: monthData.count,
      });
    }
    return months;
  }, [entries]);

  // Shift type distribution
  const shiftDistribution = useMemo(() => {
    const dayHours = entries.filter(e => e.shift_type === 'day').reduce((sum, e) => sum + e.hours_worked, 0);
    const nightHours = entries.filter(e => e.shift_type === 'night').reduce((sum, e) => sum + e.hours_worked, 0);
    return [
      { name: 'Diurno', value: dayHours, color: '#f59e0b' },
      { name: 'Noturno', value: nightHours, color: '#6366f1' },
    ].filter(item => item.value > 0);
  }, [entries]);

  const handleOpenDialog = (entry?: OvertimeEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        date: entry.date,
        hours: entry.hours_worked.toString(),
        description: entry.description || '',
        shiftType: entry.shift_type,
        scheduledTime: entry.scheduled_time || '',
        hourValue: entry.hour_value.toString(),
      });
    } else {
      setEditingEntry(null);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        hours: '',
        description: '',
        shiftType: 'day',
        scheduledTime: '',
        hourValue: '15.75',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!agent?.id || !formData.hours || !formData.date) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const hours = parseFloat(formData.hours);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      toast.error('Informe um valor de horas válido (1-24)');
      return;
    }

    const selectedDate = parseDateOnly(formData.date);
    const monthYear = format(selectedDate, 'yyyy-MM');
    const hourValue = parseFloat(formData.hourValue) || 15.75;

    const entryData = {
      agent_id: agent.id,
      date: formData.date,
      hours_worked: hours,
      description: formData.description || null,
      month_year: monthYear,
      hour_value: hourValue,
      shift_type: formData.shiftType,
      scheduled_time: formData.scheduledTime || null,
      alert_sent: false,
    };

    if (editingEntry) {
      const { data, error } = await supabase
        .from('overtime_bank')
        .update(entryData)
        .eq('id', editingEntry.id)
        .select()
        .single();

      if (error) {
        toast.error('Erro ao atualizar BH');
        return;
      }

      setEntries(prev => prev.map(e => e.id === editingEntry.id ? data : e));
      toast.success('BH atualizado com sucesso!');
    } else {
      const { data, error } = await supabase
        .from('overtime_bank')
        .insert(entryData)
        .select()
        .single();

      if (error) {
        toast.error('Erro ao registrar BH');
        return;
      }

      setEntries(prev => [data, ...prev]);
      toast.success('BH registrado com sucesso!');
    }

    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;

    const { error } = await supabase
      .from('overtime_bank')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir BH');
      return;
    }

    setEntries(prev => prev.filter(e => e.id !== id));
    toast.success('BH excluído!');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SoundButton variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </SoundButton>
        <img src={plantaoLogo} alt="PlantãoPro" className="h-8 w-auto object-contain opacity-70" />
      </div>

      {/* Title & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Banknote className="w-5 h-5 text-cyan-400" />
            Banco de Horas
          </h2>
          <p className="text-xs text-muted-foreground">Gerencie suas horas extras</p>
        </div>
        <SoundButton onClick={() => handleOpenDialog()} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Novo BH
        </SoundButton>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-muted-foreground">Este Mês</span>
              </div>
              <p className="text-2xl font-bold text-cyan-300">{monthlySummary.totalHours.toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground">{monthlySummary.count} registro(s)</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-xs text-muted-foreground">Valor Mês</span>
              </div>
              <p className="text-2xl font-bold text-green-300">{formatCurrency(monthlySummary.totalValue)}</p>
              <div className="flex gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><Sun className="w-3 h-3 text-amber-400" />{monthlySummary.dayShifts}</span>
                <span className="flex items-center gap-0.5"><Moon className="w-3 h-3 text-indigo-400" />{monthlySummary.nightShifts}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Yearly Summary */}
      <Card className="border-primary/30">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Total {new Date().getFullYear()}</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-primary">{yearlySummary.totalHours.toFixed(1)}h</span>
              <span className="text-sm text-muted-foreground ml-2">({formatCurrency(yearlySummary.totalValue)})</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="text-xs">Registros</TabsTrigger>
          <TabsTrigger value="chart" className="text-xs">Gráficos</TabsTrigger>
          <TabsTrigger value="details" className="text-xs">Detalhes</TabsTrigger>
        </TabsList>

        {/* List Tab */}
        <TabsContent value="list" className="mt-3">
          {/* Month Selector */}
          <div className="flex items-center justify-between mb-3">
            <SoundButton variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </SoundButton>
            <span className="text-sm font-semibold capitalize">
              {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <SoundButton variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedMonth(prev => {
              const next = new Date(prev);
              next.setMonth(next.getMonth() + 1);
              return next;
            })}>
              <ChevronRight className="w-4 h-4" />
            </SoundButton>
          </div>

          {/* Entries List */}
          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Banknote className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum BH registrado neste mês</p>
                <SoundButton 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => handleOpenDialog()}
                >
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </SoundButton>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredEntries.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="hover:border-primary/50 transition-colors">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={`text-[10px] ${entry.shift_type === 'night' ? 'border-indigo-500 text-indigo-400' : 'border-amber-500 text-amber-400'}`}>
                                  {entry.shift_type === 'night' ? <Moon className="w-3 h-3 mr-0.5" /> : <Sun className="w-3 h-3 mr-0.5" />}
                                  {entry.shift_type === 'night' ? 'Noturno' : 'Diurno'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(parseDateOnly(entry.date), "dd/MM/yyyy")}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-cyan-300">{entry.hours_worked}h</span>
                                <span className="text-sm text-green-400">{formatCurrency(entry.total_value || entry.hours_worked * entry.hour_value)}</span>
                              </div>
                              {entry.scheduled_time && (
                                <p className="text-[10px] text-muted-foreground">
                                  Horário: {entry.scheduled_time}
                                </p>
                              )}
                              {entry.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {entry.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <SoundButton
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleOpenDialog(entry)}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </SoundButton>
                              <SoundButton
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(entry.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </SoundButton>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Chart Tab */}
        <TabsContent value="chart" className="mt-3 space-y-4">
          {/* Evolution Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Evolução Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evolutionData.some(d => d.hours > 0) ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={evolutionData}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}h`, 'Horas']}
                    />
                    <Area type="monotone" dataKey="hours" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                  Sem dados para exibir
                </div>
              )}
            </CardContent>
          </Card>

          {/* Value Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                Valores por Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evolutionData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${v}`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Valor']}
                    />
                    <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                  Sem dados para exibir
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shift Type Distribution */}
          {shiftDistribution.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Distribuição por Turno
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={shiftDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {shiftDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}h`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {shiftDistribution.map((item, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                      <span>{item.name}: {item.value.toFixed(1)}h</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-3 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Estatísticas Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 border">
                  <p className="text-xs text-muted-foreground">Total de Registros</p>
                  <p className="text-xl font-bold">{entries.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border">
                  <p className="text-xs text-muted-foreground">Média por Registro</p>
                  <p className="text-xl font-bold">
                    {entries.length > 0 ? (entries.reduce((sum, e) => sum + e.hours_worked, 0) / entries.length).toFixed(1) : 0}h
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border">
                  <p className="text-xs text-muted-foreground">Maior BH</p>
                  <p className="text-xl font-bold">
                    {entries.length > 0 ? Math.max(...entries.map(e => e.hours_worked)).toFixed(1) : 0}h
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border">
                  <p className="text-xs text-muted-foreground">Valor/Hora Médio</p>
                  <p className="text-xl font-bold">
                    {entries.length > 0 ? formatCurrency(entries.reduce((sum, e) => sum + e.hour_value, 0) / entries.length) : 'R$ 0'}
                  </p>
                </div>
              </div>

              {/* Monthly Comparison */}
              <div className="pt-3 border-t">
                <p className="text-sm font-medium mb-2">Comparativo Mensal</p>
                <div className="space-y-2">
                  {evolutionData.slice(-3).reverse().map((month, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/20">
                      <span className="text-sm capitalize">{month.monthFull}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-cyan-400">{month.hours.toFixed(1)}h</span>
                        <span className="text-sm text-green-400">{formatCurrency(month.value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="border-amber-500/30 bg-amber-500/5">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-xs text-amber-200">
              Lembre-se de registrar seu BH até 24h após a realização para manter o controle atualizado.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-cyan-400" />
              {editingEntry ? 'Editar BH' : 'Novo BH'}
            </DialogTitle>
            <DialogDescription>
              {editingEntry ? 'Atualize as informações do banco de horas' : 'Registre suas horas extras trabalhadas'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-background/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Horas *</Label>
                <Input
                  type="number"
                  placeholder="Ex: 6"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Horário Agendado</Label>
                <Input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Turno</Label>
              <RadioGroup
                value={formData.shiftType}
                onValueChange={(value) => setFormData({ ...formData, shiftType: value })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="day" id="day" />
                  <Label htmlFor="day" className="flex items-center gap-1 cursor-pointer">
                    <Sun className="w-4 h-4 text-amber-400" /> Diurno
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="night" id="night" />
                  <Label htmlFor="night" className="flex items-center gap-1 cursor-pointer">
                    <Moon className="w-4 h-4 text-indigo-400" /> Noturno
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Valor da Hora</Label>
              <Select value={formData.hourValue} onValueChange={(value) => setFormData({ ...formData, hourValue: value })}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_VALUE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição do BH (opcional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-background/50 h-20"
              />
            </div>

            {formData.hours && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-xs text-muted-foreground">Valor Estimado</p>
                <p className="text-xl font-bold text-green-400">
                  {formatCurrency(parseFloat(formData.hours || '0') * parseFloat(formData.hourValue || '15.75'))}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                {editingEntry ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <p className="text-center text-xs text-muted-foreground pt-2">Developed by Franc Denis</p>
    </div>
  );
};

export default OvertimePanel;
