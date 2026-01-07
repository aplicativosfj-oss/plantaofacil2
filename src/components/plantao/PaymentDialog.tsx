import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  CreditCard, Upload, CheckCircle, Copy, Clock, 
  QrCode, Smartphone, Building, FileImage, X, Send
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface License {
  id: string;
  license_key: string;
  license_type: string;
  status: string;
  expires_at: string;
  monthly_fee: number;
}

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  license: License;
}

const PaymentDialog = ({ isOpen, onClose, license }: PaymentDialogProps) => {
  const { agent } = usePlantaoAuth();
  const [step, setStep] = useState<'info' | 'payment' | 'upload' | 'success'>('info');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PIX_KEY = 'contato@plantaopro.app'; // Configurable PIX key
  const BANK_DETAILS = {
    bank: 'Banco do Brasil',
    agency: '1234-5',
    account: '12345-6',
    name: 'PlantãoPro LTDA',
    cnpj: '00.000.000/0001-00'
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 5MB.');
        return;
      }
      setReceiptFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmitPayment = async () => {
    if (!receiptFile || !agent || !paymentMethod) {
      toast.error('Selecione um comprovante');
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to storage
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${agent.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile);

      if (uploadError) {
        // If bucket doesn't exist, create payment without file URL
        console.warn('Upload error:', uploadError);
      }

      const receiptUrl = uploadData?.path 
        ? supabase.storage.from('receipts').getPublicUrl(uploadData.path).data.publicUrl
        : null;

      // Create payment record
      const { error: paymentError } = await supabase
        .from('license_payments')
        .insert({
          license_id: license.id,
          agent_id: agent.id,
          amount: license.monthly_fee,
          payment_month: format(new Date(), 'yyyy-MM'),
          payment_method: paymentMethod,
          receipt_url: receiptUrl,
          receipt_filename: receiptFile.name,
          status: 'pending'
        });

      if (paymentError) throw paymentError;

      setStep('success');
      toast.success('Comprovante enviado! Aguarde confirmação.');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Erro ao enviar comprovante');
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const handleClose = () => {
    setStep('info');
    setPaymentMethod(null);
    setReceiptFile(null);
    setPreviewUrl(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {step === 'success' ? 'Pagamento Enviado' : 'Renovar Licença'}
          </DialogTitle>
          <DialogDescription>
            {step === 'success' 
              ? 'Seu comprovante foi enviado com sucesso!'
              : 'Taxa de manutenção mensal do PlantãoPro'
            }
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Valor mensal</span>
                  <Badge variant="outline" className="bg-primary/20">
                    {license.license_type === 'trial' ? '1º mês grátis' : 'Mensal'}
                  </Badge>
                </div>
                <div className="text-3xl font-bold text-primary">
                  R$ {license.monthly_fee.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Renovação válida por 30 dias
                </p>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Licença atual</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Expira em: {format(new Date(license.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              <Button className="w-full" onClick={() => setStep('payment')}>
                Escolher forma de pagamento
              </Button>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Escolha a forma de pagamento:
              </p>

              <div className="space-y-2">
                <button
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    paymentMethod === 'pix' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentMethod('pix')}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#32BCAD]/20">
                      <QrCode className="w-5 h-5 text-[#32BCAD]" />
                    </div>
                    <div>
                      <p className="font-medium">PIX</p>
                      <p className="text-xs text-muted-foreground">Pagamento instantâneo</p>
                    </div>
                  </div>
                </button>

                <button
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    paymentMethod === 'transfer' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setPaymentMethod('transfer')}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Building className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">Transferência Bancária</p>
                      <p className="text-xs text-muted-foreground">TED/DOC</p>
                    </div>
                  </div>
                </button>
              </div>

              {paymentMethod === 'pix' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-muted/30 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Chave PIX (Email)</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(PIX_KEY)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <div className="p-3 bg-background rounded-lg font-mono text-sm break-all">
                    {PIX_KEY}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Smartphone className="w-4 h-4" />
                    Use o app do seu banco para pagar
                  </div>
                </motion.div>
              )}

              {paymentMethod === 'transfer' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-muted/30 rounded-xl space-y-2"
                >
                  {Object.entries(BANK_DETAILS).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground capitalize">{key}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => copyToClipboard(Object.values(BANK_DETAILS).join(' | '))}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar dados
                  </Button>
                </motion.div>
              )}

              {paymentMethod && (
                <Button className="w-full" onClick={() => setStep('upload')}>
                  Já fiz o pagamento
                </Button>
              )}

              <Button variant="ghost" className="w-full" onClick={() => setStep('info')}>
                Voltar
              </Button>
            </motion.div>
          )}

          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <FileImage className="w-12 h-12 mx-auto text-primary mb-2" />
                <p className="text-sm text-muted-foreground">
                  Envie o comprovante de pagamento para confirmação
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Comprovante" 
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setReceiptFile(null);
                      setPreviewUrl(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed border-primary/30 rounded-xl hover:border-primary/50 transition-colors"
                >
                  <Upload className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="text-sm font-medium">Clique para selecionar</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG ou PDF até 5MB</p>
                </button>
              )}

              <Button 
                className="w-full gap-2" 
                disabled={!receiptFile || isUploading}
                onClick={handleSubmitPayment}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Comprovante
                  </>
                )}
              </Button>

              <Button variant="ghost" className="w-full" onClick={() => setStep('payment')}>
                Voltar
              </Button>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">Comprovante Enviado!</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Seu pagamento está em análise. Assim que confirmado, sua licença será renovada automaticamente.
              </p>
              <Badge variant="outline" className="mb-4">
                Prazo de confirmação: até 24 horas úteis
              </Badge>
              <Button className="w-full" onClick={handleClose}>
                Entendi
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
