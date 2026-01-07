import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { Clock, AlertTriangle, Shield, CreditCard, ChevronRight, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { differenceInDays, differenceInHours, differenceInMinutes, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PaymentDialog from './PaymentDialog';

interface License {
  id: string;
  license_key: string;
  license_type: string;
  status: string;
  expires_at: string;
  next_reminder_at: string | null;
  monthly_fee: number;
  created_at: string;
}

interface LicenseCounterProps {
  onExpired?: () => void;
}

const LicenseCounter = ({ onExpired }: LicenseCounterProps) => {
  const { agent } = usePlantaoAuth();
  const [license, setLicense] = useState<License | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showReminder, setShowReminder] = useState(false);

  // Fetch license data
  useEffect(() => {
    if (!agent?.id) return;

    const fetchLicense = async () => {
      const { data, error } = await supabase
        .from('agent_licenses')
        .select('*')
        .eq('agent_id', agent.id)
        .single();

      if (data && !error) {
        setLicense(data);
        
        // Check if should show reminder
        if (data.next_reminder_at && new Date(data.next_reminder_at) <= new Date()) {
          const reminded = sessionStorage.getItem(`license_reminder_${data.id}`);
          if (!reminded) {
            setShowReminder(true);
          }
        }
      }
    };

    fetchLicense();

    // Subscribe to license changes
    const channel = supabase
      .channel('license-changes')
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

  // Update countdown
  useEffect(() => {
    if (!license?.expires_at) return;

    const updateCountdown = () => {
      const now = new Date();
      const expiry = new Date(license.expires_at);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (license.status === 'active') {
          onExpired?.();
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [license?.expires_at, license?.status, onExpired]);

  const handleDismissReminder = () => {
    if (license) {
      sessionStorage.setItem(`license_reminder_${license.id}`, 'true');
    }
    setShowReminder(false);
  };

  if (!license) return null;

  const isExpired = license.status === 'expired' || new Date(license.expires_at) <= new Date();
  const daysUntilExpiry = differenceInDays(new Date(license.expires_at), new Date());
  const isWarning = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  const isCritical = daysUntilExpiry <= 3 && daysUntilExpiry > 0;

  const getStatusColor = () => {
    if (isExpired) return 'bg-destructive/20 border-destructive text-destructive';
    if (isCritical) return 'bg-destructive/10 border-destructive/50 text-destructive';
    if (isWarning) return 'bg-warning/10 border-warning/50 text-warning';
    return 'bg-primary/10 border-primary/30 text-primary';
  };

  const getStatusLabel = () => {
    if (isExpired) return 'EXPIRADA';
    if (license.license_type === 'trial') return 'PERÍODO GRÁTIS';
    return 'ATIVA';
  };

  return (
    <>
      {/* Reminder Modal */}
      <AnimatePresence>
        {showReminder && !isExpired && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card border border-warning/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-warning/20">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
                <Button variant="ghost" size="icon" onClick={handleDismissReminder}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <h3 className="text-lg font-bold mb-2">Lembrete de Licença</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Sua licença do PlantãoPro irá expirar em <span className="font-bold text-warning">{daysUntilExpiry} dias</span>.
                Renove agora para continuar usando o aplicativo sem interrupções.
              </p>

              <div className="p-3 bg-muted/30 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Taxa mensal</span>
                  <span className="font-bold">R$ {license.monthly_fee.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleDismissReminder}>
                  Depois
                </Button>
                <Button 
                  className="flex-1 bg-warning hover:bg-warning/90 text-black"
                  onClick={() => {
                    handleDismissReminder();
                    setShowPayment(true);
                  }}
                >
                  Renovar Agora
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* License Counter Widget */}
      <motion.div
        initial={false}
        animate={{ width: isExpanded ? 'auto' : 'auto' }}
        className={`relative border rounded-xl cursor-pointer transition-all ${getStatusColor()}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 min-w-[280px]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span className="font-bold text-sm">LICENÇA</span>
                </div>
                <Badge variant={isExpired ? 'destructive' : 'outline'} className="text-xs">
                  {getStatusLabel()}
                </Badge>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { value: countdown.days, label: 'Dias' },
                  { value: countdown.hours, label: 'Hrs' },
                  { value: countdown.minutes, label: 'Min' },
                  { value: countdown.seconds, label: 'Seg' },
                ].map((item, i) => (
                  <div key={i} className="text-center p-2 bg-background/50 rounded-lg">
                    <div className="text-lg font-mono font-bold">{String(item.value).padStart(2, '0')}</div>
                    <div className="text-[10px] text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="text-xs text-muted-foreground mb-3">
                {isExpired ? (
                  <span className="text-destructive">Sua licença expirou. Renove para continuar.</span>
                ) : (
                  <>Expira em: {format(new Date(license.expires_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</>
                )}
              </div>

              <Button 
                size="sm" 
                className="w-full gap-2"
                variant={isExpired ? 'destructive' : 'default'}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPayment(true);
                }}
              >
                <CreditCard className="w-4 h-4" />
                {isExpired ? 'Reativar Licença' : 'Renovar Antecipado'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 py-2 flex items-center gap-2"
            >
              <Clock className={`w-4 h-4 ${isExpired || isCritical ? 'animate-pulse' : ''}`} />
              <div className="text-xs font-medium">
                {isExpired ? (
                  'EXPIRADA'
                ) : countdown.days > 0 ? (
                  `${countdown.days}d ${countdown.hours}h`
                ) : (
                  `${countdown.hours}h ${countdown.minutes}m`
                )}
              </div>
              {(isWarning || isCritical || isExpired) && (
                <AlertTriangle className="w-3 h-3 animate-pulse" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <PaymentDialog 
        isOpen={showPayment} 
        onClose={() => setShowPayment(false)} 
        license={license}
      />
    </>
  );
};

export default LicenseCounter;
