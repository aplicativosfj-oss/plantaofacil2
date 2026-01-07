import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePlantonPushNotifications } from './usePlantonPushNotifications';
import { format, parseISO, setHours, setMinutes, differenceInMinutes, isToday } from 'date-fns';

interface OvertimeEntry {
  id: string;
  date: string;
  hours_worked: number;
  description: string | null;
  shift_type: string;
  scheduled_time: string | null;
  alert_sent: boolean;
}

export const useOvertimeAlerts = (agentId: string | undefined) => {
  const { sendOvertimeNotification, permission } = usePlantonPushNotifications(agentId);

  const checkAndSendAlerts = useCallback(async () => {
    if (!agentId || permission !== 'granted') return;

    try {
      // Fetch overtime entries for today that haven't had alerts sent
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data: overtimeEntries, error } = await supabase
        .from('overtime_bank')
        .select('*')
        .eq('agent_id', agentId)
        .eq('date', today)
        .eq('alert_sent', false);

      if (error) {
        console.error('[OvertimeAlerts] Error fetching entries:', error);
        return;
      }

      if (!overtimeEntries || overtimeEntries.length === 0) return;

      const now = new Date();

      for (const entry of overtimeEntries as OvertimeEntry[]) {
        if (!entry.scheduled_time) continue;

        // Parse the scheduled time
        const [hours, minutes] = entry.scheduled_time.split(':').map(Number);
        const entryDate = parseISO(entry.date);
        const scheduledDateTime = setMinutes(setHours(entryDate, hours), minutes);
        
        // Calculate minutes until the scheduled time
        const minutesUntil = differenceInMinutes(scheduledDateTime, now);

        // Send alert if within 60 minutes (1 hour before)
        if (minutesUntil > 0 && minutesUntil <= 60) {
          const shiftTypeText = entry.shift_type === 'night' ? 'noturno' : 'diurno';
          const message = `Seu BH ${shiftTypeText} começa às ${entry.scheduled_time}. ${entry.hours_worked}h programadas.`;
          
          await sendOvertimeNotification(entry.hours_worked, message);

          // Mark alert as sent
          await supabase
            .from('overtime_bank')
            .update({ alert_sent: true })
            .eq('id', entry.id);

          console.log('[OvertimeAlerts] Alert sent for entry:', entry.id);
        }
      }
    } catch (error) {
      console.error('[OvertimeAlerts] Error checking alerts:', error);
    }
  }, [agentId, permission, sendOvertimeNotification]);

  // Check for alerts every 5 minutes
  useEffect(() => {
    if (!agentId || permission !== 'granted') return;

    // Initial check
    checkAndSendAlerts();

    // Set up interval to check every 5 minutes
    const intervalId = setInterval(checkAndSendAlerts, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [agentId, permission, checkAndSendAlerts]);

  return { checkAndSendAlerts };
};
