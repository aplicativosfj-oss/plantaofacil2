import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Truck, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';

const vehicleSchema = z.object({
  vehicle_type: z.string().min(1, 'Selecione o tipo de veículo'),
  vehicle_name: z.string().min(2, 'Nome do veículo é obrigatório'),
  plate: z.string().optional(),
  capacity_kg: z.coerce.number().min(0).optional(),
  capacity_description: z.string().optional(),
  base_rate_per_km: z.coerce.number().min(0.5, 'Valor mínimo é R$ 0,50'),
  fuel_consumption_km_per_liter: z.coerce.number().min(1).optional(),
  min_rate: z.coerce.number().min(10, 'Valor mínimo é R$ 10,00'),
  is_available: z.boolean().default(true),
  availability_start_hour: z.coerce.number().min(0).max(23),
  availability_end_hour: z.coerce.number().min(0).max(23),
  availability_days: z.array(z.number()).min(1, 'Selecione pelo menos um dia'),
  notes: z.string().optional(),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  onSubmit: (data: VehicleFormData) => void;
  onCancel: () => void;
  initialData?: Partial<VehicleFormData>;
  isLoading?: boolean;
}

const vehicleTypes = [
  { value: 'carro_pequeno', label: 'Carro Pequeno', consumption: 12 },
  { value: 'utilitario', label: 'Utilitário (Fiorino, Kangoo)', consumption: 10 },
  { value: 'van', label: 'Van / Kombi', consumption: 8 },
  { value: 'caminhao_pequeno', label: 'Caminhão Pequeno (3/4)', consumption: 6 },
  { value: 'caminhao_grande', label: 'Caminhão Grande / Baú', consumption: 4 },
  { value: 'carroceiro', label: 'Carroça / Carroceiro', consumption: 0 },
  { value: 'moto', label: 'Moto com Baú', consumption: 35 },
];

const weekDays = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];

const VehicleForm: React.FC<VehicleFormProps> = ({ 
  onSubmit, 
  onCancel, 
  initialData,
  isLoading = false 
}) => {
  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicle_type: initialData?.vehicle_type || '',
      vehicle_name: initialData?.vehicle_name || '',
      plate: initialData?.plate || '',
      capacity_kg: initialData?.capacity_kg || 0,
      capacity_description: initialData?.capacity_description || '',
      base_rate_per_km: initialData?.base_rate_per_km || 2.50,
      fuel_consumption_km_per_liter: initialData?.fuel_consumption_km_per_liter || 10,
      min_rate: initialData?.min_rate || 30,
      is_available: initialData?.is_available ?? true,
      availability_start_hour: initialData?.availability_start_hour || 6,
      availability_end_hour: initialData?.availability_end_hour || 22,
      availability_days: initialData?.availability_days || [1, 2, 3, 4, 5, 6],
      notes: initialData?.notes || '',
    },
  });

  const handleVehicleTypeChange = (value: string) => {
    form.setValue('vehicle_type', value);
    const vehicleType = vehicleTypes.find(v => v.value === value);
    if (vehicleType && vehicleType.consumption > 0) {
      form.setValue('fuel_consumption_km_per_liter', vehicleType.consumption);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Truck className="w-5 h-5 text-primary" />
          {initialData ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicle_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Veículo *</FormLabel>
                    <Select onValueChange={handleVehicleTypeChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicleTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicle_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome/Modelo do Veículo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Fiat Fiorino 2020" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="capacity_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição da Capacidade</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ex: Cabe 1 geladeira + sofá de 3 lugares"
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="base_rate_per_km"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor por km (R$) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Mínimo (R$) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fuel_consumption_km_per_liter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consumo (km/L)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="availability_start_hour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário Início</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {String(i).padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="availability_end_hour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário Fim</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {String(i).padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="availability_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dias Disponíveis</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map(day => (
                      <div key={day.value} className="flex items-center gap-1">
                        <Checkbox
                          checked={field.value?.includes(day.value)}
                          onCheckedChange={(checked) => {
                            const newValue = checked
                              ? [...(field.value || []), day.value]
                              : (field.value || []).filter(d => d !== day.value);
                            field.onChange(newValue);
                          }}
                        />
                        <Label className="text-sm">{day.label}</Label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_available"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Disponível para fretes</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Seu veículo aparecerá para clientes
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais sobre o veículo..."
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Salvando...' : 'Salvar Veículo'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default VehicleForm;
