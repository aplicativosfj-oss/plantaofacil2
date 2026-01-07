import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlantaoPushSettings {
  enabled: boolean;
  shiftReminders: boolean;
  swapAlerts: boolean;
  overtimeAlerts: boolean;
}

const DEFAULT_SETTINGS: PlantaoPushSettings = {
  enabled: true,
  shiftReminders: true,
  swapAlerts: true,
  overtimeAlerts: true,
};

export const usePlantonPushNotifications = (agentId: string | undefined) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<PlantaoPushSettings>(DEFAULT_SETTINGS);
  const [isSupported, setIsSupported] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check browser support and register service worker
  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);

      // Register service worker
      navigator.serviceWorker.register('/sw-push.js')
        .then((registration) => {
          setSwRegistration(registration);
          console.log('[PlantãoPush] Service Worker registrado');
        })
        .catch((error) => {
          console.error('[PlantãoPush] Erro ao registrar SW:', error);
        });
    }
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('plantao_push_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('[PlantãoPush] Erro ao carregar configurações:', e);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('plantao_push_settings', JSON.stringify(settings));
  }, [settings]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('[PlantãoPush] Notificações não suportadas');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('[PlantãoPush] Erro ao solicitar permissão:', error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback(async (
    title: string,
    body: string,
    options?: NotificationOptions & { data?: { url?: string; type?: string } }
  ) => {
    if (!isSupported || permission !== 'granted' || !settings.enabled) {
      console.log('[PlantãoPush] Notificação bloqueada:', { isSupported, permission, enabled: settings.enabled });
      return false;
    }

    const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: options?.tag || `plantao-${Date.now()}`,
      requireInteraction: true,
      ...options,
    };

    // Add vibration pattern for mobile devices (non-standard but widely supported)
    const extendedOptions = {
      ...notificationOptions,
      vibrate: [200, 100, 200, 100, 200],
    };

    try {
      // Try service worker notification first (works in background)
      if (swRegistration) {
        await swRegistration.showNotification(title, extendedOptions as NotificationOptions);
        console.log('[PlantãoPush] Notificação enviada via SW');
        return true;
      }

      // Fallback to regular notification
      const notification = new Notification(title, notificationOptions);
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options?.data?.url) {
          window.location.href = options.data.url;
        }
      };
      console.log('[PlantãoPush] Notificação enviada via API');
      return true;
    } catch (error) {
      console.error('[PlantãoPush] Erro ao enviar notificação:', error);
      return false;
    }
  }, [isSupported, permission, settings.enabled, swRegistration]);

  // Send shift reminder notification
  const sendShiftReminder = useCallback(async (
    shiftDate: Date,
    hoursUntil: number
  ) => {
    if (!settings.shiftReminders) return false;

    const timeText = hoursUntil <= 2 
      ? `em ${hoursUntil} hora${hoursUntil > 1 ? 's' : ''}` 
      : `em ${Math.round(hoursUntil)} horas`;

    return sendNotification(
      '⏰ Plantão se aproximando!',
      `Seu plantão começa ${timeText}. Prepare-se!`,
      {
        tag: `shift-reminder-${shiftDate.toISOString()}`,
        data: { type: 'shift_reminder', url: '/agent-dashboard' },
      }
    );
  }, [settings.shiftReminders, sendNotification]);

  // Send swap request notification
  const sendSwapNotification = useCallback(async (
    requesterName: string,
    swapDate: string,
    isRequest: boolean
  ) => {
    if (!settings.swapAlerts) return false;

    const title = isRequest 
      ? '🔄 Nova solicitação de permuta!'
      : '✅ Resposta de permuta recebida';
    
    const body = isRequest
      ? `${requesterName} solicitou permuta para ${swapDate}`
      : `Sua permuta com ${requesterName} foi respondida`;

    return sendNotification(title, body, {
      tag: `swap-${Date.now()}`,
      data: { type: 'swap', url: '/agent-dashboard' },
    });
  }, [settings.swapAlerts, sendNotification]);

  // Send overtime alert notification
  const sendOvertimeNotification = useCallback(async (
    hours: number,
    message: string
  ) => {
    if (!settings.overtimeAlerts) return false;

    return sendNotification(
      '💰 Alerta de Hora Extra',
      message,
      {
        tag: `overtime-${Date.now()}`,
        data: { type: 'overtime', url: '/agent-dashboard' },
      }
    );
  }, [settings.overtimeAlerts, sendNotification]);

  // Send generic alert notification
  const sendAlertNotification = useCallback(async (
    title: string,
    message: string,
    type: string = 'info'
  ) => {
    const icons: Record<string, string> = {
      info: 'ℹ️',
      warning: '⚠️',
      urgent: '🚨',
      success: '✅',
    };

    return sendNotification(
      `${icons[type] || '🔔'} ${title}`,
      message,
      {
        tag: `alert-${Date.now()}`,
        data: { type: 'alert', url: '/agent-dashboard' },
      }
    );
  }, [sendNotification]);

  // Test notification
  const testNotification = useCallback(async () => {
    return sendNotification(
      '🔔 Teste de Notificação',
      'As notificações push do PlantãoPro estão funcionando!',
      { tag: 'test-notification' }
    );
  }, [sendNotification]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<PlantaoPushSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Subscribe to realtime alerts
  useEffect(() => {
    if (!agentId || permission !== 'granted') return;

    const channel = supabase
      .channel('plantao-push-alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'agent_alerts',
        filter: `agent_id=eq.${agentId}`,
      }, (payload) => {
        const alert = payload.new as { title: string; message: string; type: string };
        sendAlertNotification(alert.title, alert.message, alert.type);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'shift_swaps',
        filter: `requested_id=eq.${agentId}`,
      }, (payload) => {
        const swap = payload.new as { requester_id: string; original_date: string };
        // Fetch requester name
        supabase.from('agents').select('full_name').eq('id', swap.requester_id).single()
          .then(({ data }) => {
            if (data) {
              sendSwapNotification(data.full_name, swap.original_date, true);
            }
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, permission, sendAlertNotification, sendSwapNotification]);

  return {
    isSupported,
    permission,
    settings,
    requestPermission,
    sendNotification,
    sendShiftReminder,
    sendSwapNotification,
    sendOvertimeNotification,
    sendAlertNotification,
    testNotification,
    updateSettings,
  };
};
