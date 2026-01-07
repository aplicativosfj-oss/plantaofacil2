import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CreditCard, LogOut, Phone, Mail, MessageCircle, Clock, Send } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
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

// Informações de contato do administrador
const ADMIN_CONTACT = {
  email: 'francdenis@gmail.com',
  whatsapp: '5568999461733',
  whatsappDisplay: '(68) 99946-1733',
};

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

  const daysExpired = differenceInDays(new Date(), new Date(license.expires_at));

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Sou ${agent?.full_name || 'um agente'} (Matrícula: ${agent?.registration_number || 'N/A'}). ` +
      `Minha licença do PlantãoPro expirou há ${daysExpired} dia(s) e gostaria de solicitar o desbloqueio/renovação.`
    );
    window.open(`https://wa.me/${ADMIN_CONTACT.whatsapp}?text=${message}`, '_blank');
  };

  const openEmail = () => {
    const subject = encodeURIComponent(`Solicitação de Desbloqueio - PlantãoPro`);
    const body = encodeURIComponent(
      `Olá!\n\n` +
      `Sou ${agent?.full_name || 'um agente'}\n` +
      `Matrícula: ${agent?.registration_number || 'N/A'}\n` +
      `Equipe: ${agent?.current_team?.toUpperCase() || 'N/A'}\n\n` +
      `Minha licença do PlantãoPro expirou em ${format(new Date(license.expires_at), "dd/MM/yyyy", { locale: ptBR })}.\n` +
      `Gostaria de solicitar o desbloqueio/renovação do meu acesso.\n\n` +
      `Agradeço a atenção.`
    );
    window.open(`mailto:${ADMIN_CONTACT.email}?subject=${subject}&body=${body}`, '_blank');
  };

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
            Para continuar utilizando o aplicativo, entre em contato com o administrador para renovar sua licença.
          </p>

          <div className="p-4 bg-muted/30 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Taxa mensal</span>
              <span className="text-2xl font-bold">R$ {license.monthly_fee.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Expirado há {daysExpired} dia(s)</span>
            </div>
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

        {/* Contact Admin Section */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            Solicitar Desbloqueio
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline"
              className="gap-2 border-green-500/30 hover:bg-green-500/10 hover:border-green-500/50"
              onClick={openWhatsApp}
            >
              <MessageCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">WhatsApp</span>
            </Button>
            <Button 
              variant="outline"
              className="gap-2 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50"
              onClick={openEmail}
            >
              <Mail className="w-4 h-4 text-blue-500" />
              <span className="text-sm">E-mail</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {ADMIN_CONTACT.whatsappDisplay} • {ADMIN_CONTACT.email}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            className="w-full gap-2"
            size="lg"
            onClick={() => setShowPayment(true)}
          >
            <CreditCard className="w-5 h-5" />
            {hasPendingPayment ? 'Enviar Novo Comprovante' : 'Enviar Comprovante de Pagamento'}
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
