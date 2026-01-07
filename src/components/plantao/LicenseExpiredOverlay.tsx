import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CreditCard, LogOut, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PaymentDialog from './PaymentDialog';

interface License {
  id: string;
  license_key: string;
  license_type: string;
  status: string;
  expires_at: string;
  monthly_fee: number;
}

interface LicenseExpiredOverlayProps {
  onLogout: () => void;
}

const LicenseExpiredOverlay = ({ onLogout }: LicenseExpiredOverlayProps) => {
  const { agent } = usePlantaoAuth();
  const [license, setLicense] = useState<License | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [hasPendingPayment, setHasPendingPayment] = useState(false);

  useEffect(() => {
    if (!agent?.id) return;

    const fetchData = async () => {
      // Fetch license
      const { data: licenseData } = await supabase
        .from('agent_licenses')
        .select('*')
        .eq('agent_id', agent.id)
        .single();

      if (licenseData) {
        setLicense(licenseData);
      }

      // Check for pending payments
      const { data: payments } = await supabase
        .from('license_payments')
        .select('id')
        .eq('agent_id', agent.id)
        .eq('status', 'pending')
        .limit(1);

      setHasPendingPayment(payments && payments.length > 0);
    };

    fetchData();

    // Subscribe to changes
    const channel = supabase
      .channel('license-expired-check')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_licenses',
        filter: `agent_id=eq.${agent.id}`,
      }, fetchData)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'license_payments',
        filter: `agent_id=eq.${agent.id}`,
      }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agent?.id]);

  if (!license) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] bg-background flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Warning Icon */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-12 h-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Licença Expirada</h1>
          <p className="text-muted-foreground">
            Sua licença do PlantãoPro expirou em{' '}
            <span className="font-medium text-foreground">
              {format(new Date(license.expires_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-card border border-destructive/30 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="font-medium">Acesso Bloqueado</span>
            </div>
            <Badge variant="destructive">EXPIRADA</Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Para continuar utilizando o aplicativo, é necessário renovar sua licença.
          </p>

          <div className="p-4 bg-muted/30 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Taxa mensal</span>
              <span className="text-2xl font-bold">R$ {license.monthly_fee.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Renovação válida por 30 dias
            </p>
          </div>
        </div>

        {/* Pending Payment Notice */}
        {hasPendingPayment && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Pagamento em Análise</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Você possui um pagamento pendente de confirmação. Aguarde até 24 horas úteis.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            className="w-full gap-2"
            size="lg"
            onClick={() => setShowPayment(true)}
          >
            <CreditCard className="w-5 h-5" />
            {hasPendingPayment ? 'Enviar Novo Comprovante' : 'Renovar Licença'}
          </Button>

          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={onLogout}
          >
            <LogOut className="w-5 h-5" />
            Sair do Aplicativo
          </Button>
        </div>

        {/* Contact Info */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-center text-muted-foreground mb-3">
            Precisa de ajuda? Entre em contato:
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <a href="tel:+5500000000000" className="flex items-center gap-1 text-primary hover:underline">
              <Phone className="w-4 h-4" />
              Suporte
            </a>
            <span className="text-border">|</span>
            <a href="mailto:suporte@plantaopro.app" className="flex items-center gap-1 text-primary hover:underline">
              <Mail className="w-4 h-4" />
              Email
            </a>
          </div>
        </div>
      </motion.div>

      <PaymentDialog 
        isOpen={showPayment} 
        onClose={() => setShowPayment(false)} 
        license={license}
      />
    </motion.div>
  );
};

export default LicenseExpiredOverlay;
