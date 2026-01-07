import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { Button } from '@/components/ui/button';
import { X, Clock, AlertTriangle, CreditCard, MessageCircle } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface License {
  id: string;
  expires_at: string;
  status: string;
  monthly_fee: number;
}

const ADMIN_WHATSAPP = '5568999461733';

const LicenseExpiryAlert = () => {
  const { agent } = usePlantaoAuth();
  const [license, setLicense] = useState<License | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (!agent?.id) return;

    const fetchLicense = async () => {
      const { data } = await supabase
        .from('agent_licenses')
        .select('id, expires_at, status, monthly_fee')
        .eq('agent_id', agent.id)
        .single();

      if (data) {
        setLicense(data);
        
        // Check if we should show alert (expiring in 7 days or less)
        const daysRemaining = differenceInDays(new Date(data.expires_at), new Date());
        if (daysRemaining <= 7 && daysRemaining >= 0 && data.status === 'active') {
          // Check if dismissed today
          const dismissedKey = `license_alert_dismissed_${data.id}`;
          const dismissedDate = localStorage.getItem(dismissedKey);
          const today = format(new Date(), 'yyyy-MM-dd');
          
          if (dismissedDate !== today) {
            setShowAlert(true);
          }
        }
      }
    };

    fetchLicense();

    // Subscribe to license changes
    const channel = supabase
      .channel('license-expiry-alert')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_licenses',
        filter: `agent_id=eq.${agent.id}`,
      }, fetchLicense)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agent?.id]);

  const handleDismiss = () => {
    if (license) {
      const dismissedKey = `license_alert_dismissed_${license.id}`;
      localStorage.setItem(dismissedKey, format(new Date(), 'yyyy-MM-dd'));
    }
    setDismissed(true);
    setShowAlert(false);
  };

  const openWhatsApp = () => {
    const daysRemaining = license ? differenceInDays(new Date(license.expires_at), new Date()) : 0;
    const message = encodeURIComponent(
      `Olá! Sou ${agent?.full_name || 'um agente'}. ` +
      `Minha licença expira em ${daysRemaining} dia(s) e gostaria de renovar.`
    );
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${message}`, '_blank');
  };

  if (!license || !showAlert || dismissed) return null;

  const daysRemaining = differenceInDays(new Date(license.expires_at), new Date());
  const isUrgent = daysRemaining <= 3;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={`fixed top-4 left-4 right-4 z-50 max-w-md mx-auto p-4 rounded-xl border shadow-lg backdrop-blur-md ${
          isUrgent 
            ? 'bg-red-500/10 border-red-500/30' 
            : 'bg-amber-500/10 border-amber-500/30'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${isUrgent ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
            {isUrgent ? (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            ) : (
              <Clock className="w-5 h-5 text-amber-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold text-sm ${isUrgent ? 'text-red-500' : 'text-amber-500'}`}>
              {isUrgent ? '⚠️ Licença Expirando!' : 'Licença Próxima do Vencimento'}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Sua licença expira em <span className="font-bold">{daysRemaining} dia(s)</span> 
              ({format(new Date(license.expires_at), 'dd/MM/yyyy')})
            </p>

            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                className={`h-7 text-xs gap-1 ${
                  isUrgent 
                    ? 'border-red-500/30 hover:bg-red-500/10' 
                    : 'border-amber-500/30 hover:bg-amber-500/10'
                }`}
                onClick={openWhatsApp}
              >
                <MessageCircle className="w-3 h-3" />
                Renovar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={handleDismiss}
              >
                Lembrar amanhã
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-muted/50 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LicenseExpiryAlert;
