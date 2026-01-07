import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, Send, Calendar, MapPin, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const freightRequestSchema = z.object({
  origin_neighborhood_id: z.string().optional(),
  origin_address: z.string().min(5, 'Endereço de origem é obrigatório'),
  origin_reference: z.string().optional(),
  destination_neighborhood_id: z.string().optional(),
  destination_address: z.string().min(5, 'Endereço de destino é obrigatório'),
  destination_reference: z.string().optional(),
  service_type: z.string().min(1, 'Selecione o tipo de serviço'),
  cargo_description: z.string().min(5, 'Descreva o que será transportado'),
  cargo_weight_kg: z.coerce.number().min(0).optional(),
  requires_helpers: z.boolean().default(false),
  helpers_count: z.coerce.number().min(0).max(5).optional(),
  scheduled_date: z.date({ required_error: 'Selecione a data' }),
  scheduled_time_start: z.string().optional(),
  scheduled_time_end: z.string().optional(),
  is_urgent: z.boolean().default(false),
  notes: z.string().optional(),
});

export type FreightRequestFormData = z.infer<typeof freightRequestSchema>;

interface FreightRequestFormProps {
  onSubmit: (data: FreightRequestFormData) => void;
  onCancel: () => void;
  estimatedValue?: number;
  isLoading?: boolean;
}

const serviceTypes = [
  { value: 'frete', label: 'Frete Simples', description: 'Transporte de objetos pequenos/médios' },
  { value: 'mudanca', label: 'Mudança', description: 'Mudança residencial completa' },
  { value: 'carreto', label: 'Carreto', description: 'Transporte de móveis ou objetos grandes' },
  { value: 'entrega', label: 'Entrega Rápida', description: 'Entrega de pacotes/documentos' },
];

const FreightRequestForm: React.FC<FreightRequestFormProps> = ({
  onSubmit,
  onCancel,
  estimatedValue,
  isLoading = false,
}) => {
  const form = useForm<FreightRequestFormData>({
    resolver: zodResolver(freightRequestSchema),
    defaultValues: {
      origin_address: '',
      origin_reference: '',
      destination_address: '',
      destination_reference: '',
      service_type: '',
      cargo_description: '',
      cargo_weight_kg: 0,
      requires_helpers: false,
      helpers_count: 0,
      scheduled_date: new Date(),
      scheduled_time_start: '08:00',
      scheduled_time_end: '18:00',
      is_urgent: false,
      notes: '',
    },
  });

  // Buscar bairros
  const { data: neighborhoods = [] } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('id, name, city')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const requiresHelpers = form.watch('requires_helpers');
  const isUrgent = form.watch('is_urgent');

  return (
    <Card className="border-orange-500/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl text-orange-500">
          <Package className="w-6 h-6" />
          Solicitar Frete
        </CardTitle>
        <CardDescription>
          Preencha os dados para receber propostas de prestadores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo de Serviço */}
            <FormField
              control={form.control}
              name="service_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Tipo de Serviço *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="O que você precisa?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serviceTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{type.label}</span>
                            <span className="text-xs text-muted-foreground">{type.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Origem */}
            <div className="space-y-4 p-4 rounded-lg border border-green-500/20 bg-green-500/5">
              <h3 className="font-semibold flex items-center gap-2 text-green-600">
                <MapPin className="w-4 h-4" />
                Local de Coleta (Origem)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="origin_neighborhood_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o bairro" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {neighborhoods.map(n => (
                            <SelectItem key={n.id} value={n.id}>
                              {n.name}
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
                  name="origin_reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ponto de Referência</FormLabel>
                      <FormControl>
                        <Input placeholder="Próximo a..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="origin_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço Completo *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Rua, número, complemento..."
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Destino */}
            <div className="space-y-4 p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
              <h3 className="font-semibold flex items-center gap-2 text-blue-600">
                <MapPin className="w-4 h-4" />
                Local de Entrega (Destino)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="destination_neighborhood_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o bairro" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {neighborhoods.map(n => (
                            <SelectItem key={n.id} value={n.id}>
                              {n.name}
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
                  name="destination_reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ponto de Referência</FormLabel>
                      <FormControl>
                        <Input placeholder="Próximo a..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="destination_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço Completo *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Rua, número, complemento..."
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* O que será transportado */}
            <FormField
              control={form.control}
              name="cargo_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">O que será transportado? *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva os itens: quantidade, tamanho aproximado, peso estimado..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Quanto mais detalhes, melhores propostas você receberá
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cargo_weight_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peso Estimado (kg)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data e Horário */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="scheduled_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data *
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              "Selecione"
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduled_time_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Horário Início
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduled_time_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário Fim</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ajudantes */}
            <FormField
              control={form.control}
              name="requires_helpers"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <FormLabel className="text-base">Precisa de ajudantes?</FormLabel>
                      <FormDescription>
                        Para carregar/descarregar itens pesados
                      </FormDescription>
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {requiresHelpers && (
              <FormField
                control={form.control}
                name="helpers_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantos ajudantes?</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(n => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Urgente */}
            <FormField
              control={form.control}
              name="is_urgent"
              render={({ field }) => (
                <FormItem className={cn(
                  "flex items-center justify-between rounded-lg border p-4 transition-colors",
                  field.value && "border-red-500/50 bg-red-500/10"
                )}>
                  <div>
                    <FormLabel className="text-base">🚨 É urgente?</FormLabel>
                    <FormDescription>
                      Fretes urgentes podem ter valor maior
                    </FormDescription>
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
                  <FormLabel>Observações Adicionais</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações extras para o prestador..."
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Estimativa de Valor */}
            {estimatedValue && estimatedValue > 0 && (
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <p className="text-sm text-muted-foreground">Estimativa de valor:</p>
                <p className="text-2xl font-bold text-orange-500">
                  R$ {estimatedValue.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  * Valor final será definido pelo prestador
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                <Send className="w-4 h-4 mr-2" />
                {isLoading ? 'Enviando...' : 'Solicitar Frete'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default FreightRequestForm;
