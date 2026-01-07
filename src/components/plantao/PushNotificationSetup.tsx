import React, { useState } from 'react';
import { Bell, BellOff, BellRing, Check, Settings, Smartphone, TestTube, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { usePlantonPushNotifications } from '@/hooks/usePlantonPushNotifications';

interface PushNotificationSetupProps {
  agentId: string;
}

const PushNotificationSetup: React.FC<PushNotificationSetupProps> = ({ agentId }) => {
  const [showSettings, setShowSettings] = useState(false);
  const {
    isSupported,
    permission,
    settings,
    requestPermission,
    testNotification,
    updateSettings,
  } = usePlantonPushNotifications(agentId);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Notificações ativadas com sucesso!');
      updateSettings({ enabled: true });
    } else {
      toast.error('Permissão negada. Verifique as configurações do navegador.');
    }
  };

  const handleTestNotification = async () => {
    const sent = await testNotification();
    if (sent) {
      toast.success('Notificação de teste enviada!');
    } else {
      toast.error('Falha ao enviar notificação de teste');
    }
  };

  const getStatusBadge = () => {
    if (!isSupported) {
      return <Badge variant="secondary" className="bg-muted">Não Suportado</Badge>;
    }
    if (permission === 'denied') {
      return <Badge variant="destructive">Bloqueado</Badge>;
    }
    if (permission === 'granted' && settings.enabled) {
      return <Badge className="bg-green-500">Ativo</Badge>;
    }
    return <Badge variant="outline">Desativado</Badge>;
  };

  const getStatusIcon = () => {
    if (!isSupported || permission === 'denied') {
      return <BellOff className="w-5 h-5 text-muted-foreground" />;
    }
    if (permission === 'granted' && settings.enabled) {
      return <BellRing className="w-5 h-5 text-green-500" />;
    }
    return <Bell className="w-5 h-5 text-warning" />;
  };

  if (!isSupported) {
    return (
      <Card className="border-muted">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <BellOff className="w-5 h-5" />
            <p className="text-sm">Notificações push não são suportadas neste navegador</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-primary/30 hover:border-primary/50 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              {getStatusIcon()}
              Notificações Push
            </CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription>
            Receba alertas de plantões e permutas no celular
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {permission === 'denied' ? (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <p className="font-medium mb-1">Notificações bloqueadas</p>
              <p className="text-xs text-muted-foreground">
                Acesse as configurações do navegador para permitir notificações deste site.
              </p>
            </div>
          ) : permission !== 'granted' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button 
                onClick={handleEnableNotifications}
                className="w-full gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Ativar Notificações
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Clique para receber alertas importantes no seu dispositivo
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="notifications-enabled"
                    checked={settings.enabled}
                    onCheckedChange={(checked) => updateSettings({ enabled: checked })}
                  />
                  <Label htmlFor="notifications-enabled" className="text-sm">
                    Notificações {settings.enabled ? 'ativas' : 'pausadas'}
                  </Label>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleTestNotification}
                    title="Testar notificação"
                  >
                    <TestTube className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowSettings(true)}
                    title="Configurações"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {settings.enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/50"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500" />
                      <span>Lembretes de plantão</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500" />
                      <span>Solicitações de permuta</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500" />
                      <span>Alertas de hora extra</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurações de Notificação
            </DialogTitle>
            <DialogDescription>
              Personalize quais alertas você deseja receber
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Lembretes de Plantão</Label>
                <p className="text-xs text-muted-foreground">
                  Alertas 24h e 2h antes do plantão
                </p>
              </div>
              <Switch
                checked={settings.shiftReminders}
                onCheckedChange={(checked) => updateSettings({ shiftReminders: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Alertas de Permuta</Label>
                <p className="text-xs text-muted-foreground">
                  Novas solicitações e respostas
                </p>
              </div>
              <Switch
                checked={settings.swapAlerts}
                onCheckedChange={(checked) => updateSettings({ swapAlerts: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Alertas de Hora Extra</Label>
                <p className="text-xs text-muted-foreground">
                  Atualizações do banco de horas
                </p>
              </div>
              <Switch
                checked={settings.overtimeAlerts}
                onCheckedChange={(checked) => updateSettings({ overtimeAlerts: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Fechar
            </Button>
            <Button onClick={handleTestNotification} variant="secondary" className="gap-2">
              <TestTube className="w-4 h-4" />
              Testar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PushNotificationSetup;
