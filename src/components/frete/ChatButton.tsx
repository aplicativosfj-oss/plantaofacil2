import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface ChatButtonProps {
  requestId: string;
  currentUserId: string;
  onClick: () => void;
  className?: string;
}

const ChatButton: React.FC<ChatButtonProps> = ({
  requestId,
  currentUserId,
  onClick,
  className = '',
}) => {
  const [unreadCount, setUnreadCount] = useState(0);

  // Carregar contagem de mensagens não lidas
  useEffect(() => {
    if (!requestId || !currentUserId) return;

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('freight_messages')
        .select('*', { count: 'exact', head: true })
        .eq('request_id', requestId)
        .eq('receiver_id', currentUserId)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    // Realtime para atualizar contagem
    const channel = supabase
      .channel(`chat-unread-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'freight_messages',
          filter: `request_id=eq.${requestId}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, currentUserId]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`relative gap-2 border-primary/30 hover:border-primary hover:bg-primary/10 ${className}`}
    >
      <MessageCircle size={16} />
      <span>Chat</span>
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-2 -right-2"
          >
            <Badge 
              variant="destructive" 
              className="h-5 min-w-5 flex items-center justify-center text-xs px-1.5 animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
};

export default ChatButton;
