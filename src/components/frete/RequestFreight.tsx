import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Plus, Clock, MapPin, Truck, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import FreightRequestForm, { FreightRequestFormData } from '@/components/frete/FreightRequestForm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { estimateByDistance } from '@/lib/freightCalculator';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-500' },
  open: { label: 'Aberto', color: 'bg-blue-500' },
  in_negotiation: { label: 'Em Negociação', color: 'bg-purple-500' },
  accepted: { label: 'Aceito', color: 'bg-green-500' },
  in_progress: { label: 'Em Andamento', color: 'bg-orange-500' },
  completed: { label: 'Concluído', color: 'bg-green-600' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500' },
};

const serviceTypeLabels: Record<string, string> = {
  frete: 'Frete',
  mudanca: 'Mudança',
  carreto: 'Carreto',
  entrega: 'Entrega',
};

const RequestFreight: React.FC = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [estimatedValue, setEstimatedValue] = useState<number>(0);

  // Buscar solicitações do cliente
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['my-freight-requests', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('freight_requests')
        .select(`
          *,
          origin_neighborhood:neighborhoods!freight_requests_origin_neighborhood_id_fkey(name),
          destination_neighborhood:neighborhoods!freight_requests_destination_neighborhood_id_fkey(name)
        `)
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Buscar propostas para cada solicitação
  const { data: proposalCounts = {} } = useQuery({
    queryKey: ['freight-proposal-counts', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return {};
      const requestIds = requests.map(r => r.id);
      if (requestIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('freight_proposals')
        .select('request_id')
        .in('request_id', requestIds)
        .eq('status', 'pending');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(p => {
        counts[p.request_id] = (counts[p.request_id] || 0) + 1;
      });
      return counts;
    },
    enabled: requests.length > 0,
  });

  // Mutation para criar solicitação
  const createMutation = useMutation({
    mutationFn: async (data: FreightRequestFormData) => {
      // Calcular estimativa
      const estimate = await estimateByDistance(
        5, // Distância padrão para Feijó (cidade pequena)
        data.is_urgent,
        data.requires_helpers ? data.helpers_count || 0 : 0
      );

      const { error } = await supabase
        .from('freight_requests')
        .insert({
          client_id: profile!.id,
          origin_neighborhood_id: data.origin_neighborhood_id || null,
          origin_address: data.origin_address,
          origin_reference: data.origin_reference || null,
          destination_neighborhood_id: data.destination_neighborhood_id || null,
          destination_address: data.destination_address,
          destination_reference: data.destination_reference || null,
          service_type: data.service_type,
          cargo_description: data.cargo_description,
          cargo_weight_kg: data.cargo_weight_kg || null,
          requires_helpers: data.requires_helpers,
          helpers_count: data.requires_helpers ? data.helpers_count : 0,
          scheduled_date: format(data.scheduled_date, 'yyyy-MM-dd'),
          scheduled_time_start: data.scheduled_time_start || null,
          scheduled_time_end: data.scheduled_time_end || null,
          is_urgent: data.is_urgent,
          estimated_value: estimate,
          status: 'open',
          notes: data.notes || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Solicitação enviada! Aguarde propostas dos prestadores.');
      queryClient.invalidateQueries({ queryKey: ['my-freight-requests'] });
      setShowForm(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao enviar solicitação: ' + error.message);
    },
  });

  // Cancelar solicitação
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('freight_requests')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Solicitação cancelada');
      queryClient.invalidateQueries({ queryKey: ['my-freight-requests'] });
    },
  });

  if (showForm) {
    return (
      <div className="p-4">
        <FreightRequestForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
          estimatedValue={estimatedValue}
          isLoading={createMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6 text-orange-500" />
          Meus Fretes
        </h2>
        <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Solicitar Frete
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="border-dashed border-2 border-muted-foreground/30">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">Nenhuma solicitação</h3>
            <p className="text-sm text-muted-foreground/70 text-center mt-1 mb-4">
              Solicite seu primeiro frete e receba propostas de prestadores
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Solicitar Frete
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map(request => {
            const status = statusLabels[request.status] || statusLabels.pending;
            const pendingProposals = proposalCounts[request.id] || 0;
            
            return (
              <Card key={request.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {serviceTypeLabels[request.service_type] || request.service_type}
                        <Badge className={status.color}>{status.label}</Badge>
                        {request.is_urgent && (
                          <Badge variant="destructive">🚨 Urgente</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(request.scheduled_date), "dd 'de' MMMM", { locale: ptBR })}
                        {request.scheduled_time_start && ` às ${request.scheduled_time_start.slice(0, 5)}`}
                      </p>
                    </div>
                    
                    {pendingProposals > 0 && (
                      <Badge variant="secondary" className="animate-pulse">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {pendingProposals} {pendingProposals === 1 ? 'proposta' : 'propostas'}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-muted-foreground">De:</span>{' '}
                        <span className="font-medium">
                          {(request as any).origin_neighborhood?.name && `${(request as any).origin_neighborhood.name} - `}
                          {request.origin_address}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-muted-foreground">Para:</span>{' '}
                        <span className="font-medium">
                          {(request as any).destination_neighborhood?.name && `${(request as any).destination_neighborhood.name} - `}
                          {request.destination_address}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Package className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{request.cargo_description}</span>
                    </div>
                  </div>

                  {request.estimated_value && (
                    <div className="mt-3 p-2 rounded bg-orange-500/10 border border-orange-500/30">
                      <span className="text-sm text-muted-foreground">Estimativa: </span>
                      <span className="font-bold text-orange-500">
                        R$ {Number(request.estimated_value).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {['pending', 'open', 'in_negotiation'].includes(request.status) && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => cancelMutation.mutate(request.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                      {pendingProposals > 0 && (
                        <Button size="sm" variant="outline">
                          Ver Propostas
                        </Button>
                      )}
                    </div>
                  )}

                  {request.status === 'completed' && (
                    <div className="mt-3 flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Frete concluído!</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RequestFreight;
