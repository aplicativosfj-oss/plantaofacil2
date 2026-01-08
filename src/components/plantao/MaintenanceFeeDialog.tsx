import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, Server, Sparkles, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface MaintenanceFeeDialogProps {
  agentId: string;
  isPaidLicense: boolean;
}

const MaintenanceFeeDialog = ({ agentId, isPaidLicense }: MaintenanceFeeDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Não mostrar para licenças pagas
    if (isPaidLicense) return;

    // Verificar se já foi exibido para este agente
    const dismissedKey = `maintenance_fee_dismissed_${agentId}`;
    const wasDismissed = localStorage.getItem(dismissedKey);
    
    if (!wasDismissed) {
      // Pequeno delay para não aparecer imediatamente
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [agentId, isPaidLicense]);

  const handleDismiss = () => {
    const dismissedKey = `maintenance_fee_dismissed_${agentId}`;
    localStorage.setItem(dismissedKey, 'true');
    setIsOpen(false);
  };

  // Não renderizar se for licença paga
  if (isPaidLicense) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-card to-primary/5 border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Heart className="w-5 h-5 text-red-500 animate-pulse" />
            Apoie o PlantãoPro!
          </DialogTitle>
        </DialogHeader>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl border border-primary/20">
            <Server className="w-10 h-10 text-primary flex-shrink-0" />
            <div>
              <p className="font-semibold text-primary">Custo de Manutenção</p>
              <p className="text-sm text-muted-foreground">
                Servidor e banco de dados
              </p>
            </div>
          </div>

          <div className="text-center py-4">
            <p className="text-3xl font-bold text-primary">R$ 20,00</p>
            <p className="text-sm text-muted-foreground">por mês</p>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p>Este valor ajuda a manter o aplicativo funcionando, pagando custos de servidor e armazenamento de dados.</p>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p>Com sua contribuição, garantimos atualizações constantes e suporte técnico.</p>
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-sm text-amber-500 text-center">
              💡 Para renovar sua licença, acesse o menu de pagamentos ou entre em contato com o administrador.
            </p>
          </div>
        </motion.div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleDismiss}
            className="w-full gap-2"
          >
            <X className="w-4 h-4" />
            Entendi, não mostrar novamente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceFeeDialog;
