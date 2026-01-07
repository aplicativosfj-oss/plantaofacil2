import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';

interface OnlineIndicatorProps {
  compact?: boolean;
}

const OnlineIndicator = ({ compact = false }: OnlineIndicatorProps) => {
  const { agent } = usePlantaoAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnected, setIsConnected] = useState(true);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  // Monitor browser online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update presence in database
  useEffect(() => {
    if (!agent?.id || !isOnline) return;

    const updatePresence = async () => {
      const { error } = await supabase
        .from('agent_presence')
        .upsert({
          agent_id: agent.id,
          is_online: true,
          last_seen: new Date().toISOString(),
          device_info: navigator.userAgent.slice(0, 100)
        }, { onConflict: 'agent_id' });

      if (error) {
        console.error('Error updating presence:', error);
        setIsConnected(false);
      } else {
        setIsConnected(true);
        setLastSeen(new Date());
      }
    };

    updatePresence();
    const interval = setInterval(updatePresence, 30000); // Update every 30s

    // Set offline on unmount
    return () => {
      clearInterval(interval);
      if (agent?.id) {
        supabase
          .from('agent_presence')
          .update({ is_online: false, last_seen: new Date().toISOString() })
          .eq('agent_id', agent.id);
      }
    };
  }, [agent?.id, isOnline]);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <AnimatePresence mode="wait">
          {isOnline && isConnected ? (
            <motion.div
              key="online"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-1"
            >
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75" />
              </div>
              <span className="text-[10px] text-green-500 font-mono uppercase">Online</span>
            </motion.div>
          ) : (
            <motion.div
              key="offline"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-1"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-[10px] text-red-500 font-mono uppercase">Offline</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono
        ${isOnline && isConnected 
          ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
          : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }
      `}
    >
      {isOnline && isConnected ? (
        <>
          <div className="relative">
            <Cloud className="w-4 h-4" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <span>Conectado</span>
        </>
      ) : isOnline && !isConnected ? (
        <>
          <CloudOff className="w-4 h-4" />
          <span>Reconectando...</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Sem conexão</span>
        </>
      )}
    </motion.div>
  );
};

export default OnlineIndicator;
