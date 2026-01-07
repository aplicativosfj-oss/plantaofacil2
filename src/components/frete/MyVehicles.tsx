import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Truck, Edit2, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import VehicleForm, { VehicleFormData } from '@/components/frete/VehicleForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const vehicleTypeLabels: Record<string, string> = {
  carro_pequeno: 'Carro Pequeno',
  utilitario: 'Utilitário',
  van: 'Van/Kombi',
  caminhao_pequeno: 'Caminhão 3/4',
  caminhao_grande: 'Caminhão Grande',
  carroceiro: 'Carroça',
  moto: 'Moto',
};

const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const MyVehicles: React.FC = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Buscar veículos do prestador
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['my-vehicles', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('provider_vehicles')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Mutation para criar veículo
  const createMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      const { error } = await supabase
        .from('provider_vehicles')
        .insert([{
          profile_id: profile!.id,
          vehicle_type: data.vehicle_type,
          vehicle_name: data.vehicle_name,
          plate: data.plate || null,
          capacity_kg: data.capacity_kg || 0,
          capacity_description: data.capacity_description || null,
          base_rate_per_km: data.base_rate_per_km,
          fuel_consumption_km_per_liter: data.fuel_consumption_km_per_liter || 10,
          min_rate: data.min_rate,
          is_available: data.is_available,
          availability_start_hour: data.availability_start_hour,
          availability_end_hour: data.availability_end_hour,
          availability_days: data.availability_days,
          notes: data.notes || null,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Veículo cadastrado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['my-vehicles'] });
      setShowForm(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao cadastrar veículo: ' + error.message);
    },
  });

  // Mutation para atualizar veículo
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: VehicleFormData }) => {
      const { error } = await supabase
        .from('provider_vehicles')
        .update({
          vehicle_type: data.vehicle_type,
          vehicle_name: data.vehicle_name,
          plate: data.plate || null,
          capacity_kg: data.capacity_kg || 0,
          capacity_description: data.capacity_description || null,
          base_rate_per_km: data.base_rate_per_km,
          fuel_consumption_km_per_liter: data.fuel_consumption_km_per_liter || 10,
          min_rate: data.min_rate,
          is_available: data.is_available,
          availability_start_hour: data.availability_start_hour,
          availability_end_hour: data.availability_end_hour,
          availability_days: data.availability_days,
          notes: data.notes || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Veículo atualizado!');
      queryClient.invalidateQueries({ queryKey: ['my-vehicles'] });
      setEditingVehicle(null);
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  // Mutation para deletar veículo
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('provider_vehicles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Veículo removido!');
      queryClient.invalidateQueries({ queryKey: ['my-vehicles'] });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error('Erro ao remover: ' + error.message);
    },
  });

  const handleSubmit = (data: VehicleFormData) => {
    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (showForm || editingVehicle) {
    return (
      <div className="p-4">
        <VehicleForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingVehicle(null);
          }}
          initialData={editingVehicle || undefined}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Truck className="w-6 h-6 text-orange-500" />
          Meus Veículos
        </h2>
        <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Novo Veículo
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-32 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <Card className="border-dashed border-2 border-muted-foreground/30">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">Nenhum veículo cadastrado</h3>
            <p className="text-sm text-muted-foreground/70 text-center mt-1 mb-4">
              Cadastre seu veículo para começar a receber solicitações de frete
            </p>
            <Button onClick={() => setShowForm(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Veículo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {vehicles.map(vehicle => (
            <Card key={vehicle.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {vehicle.vehicle_name}
                      {vehicle.is_approved ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Aprovado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Aguardando
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {vehicleTypeLabels[vehicle.vehicle_type] || vehicle.vehicle_type}
                      {vehicle.plate && ` • ${vehicle.plate}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingVehicle(vehicle)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setDeleteId(vehicle.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Valor/km:</span>
                    <span className="ml-1 font-medium">R$ {Number(vehicle.base_rate_per_km).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mínimo:</span>
                    <span className="ml-1 font-medium">R$ {Number(vehicle.min_rate).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Capacidade:</span>
                    <span className="ml-1 font-medium">{vehicle.capacity_kg || 0} kg</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`ml-1 font-medium ${vehicle.is_available ? 'text-green-500' : 'text-red-500'}`}>
                      {vehicle.is_available ? 'Disponível' : 'Indisponível'}
                    </span>
                  </div>
                </div>
                
                {vehicle.capacity_description && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    "{vehicle.capacity_description}"
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground mr-1">Disponível:</span>
                  {vehicle.availability_days?.map((day: number) => (
                    <Badge key={day} variant="outline" className="text-xs">
                      {weekDayLabels[day]}
                    </Badge>
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">
                    {String(vehicle.availability_start_hour).padStart(2, '0')}h - 
                    {String(vehicle.availability_end_hour).padStart(2, '0')}h
                  </span>
                </div>

                {!vehicle.is_approved && (
                  <div className="mt-3 p-2 rounded bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-yellow-600">
                      Seu veículo está aguardando aprovação do administrador
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover veículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O veículo será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyVehicles;
