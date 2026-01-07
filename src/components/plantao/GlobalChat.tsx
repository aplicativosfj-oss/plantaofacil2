import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, Users, MessageSquare, Globe, Shield, Star, Target, Crosshair, User, Mic, MicOff, Image, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import useChatSounds from '@/hooks/useChatSounds';
import EmojiPicker from './EmojiPicker';

interface ChatMessage {
  id: string;
  sender_id: string;
  channel_type: 'general' | 'team';
  team_channel: 'alfa' | 'bravo' | 'charlie' | 'delta' | null;
  content: string;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string | null;
    current_team: string | null;
  };
}

interface GlobalChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const getTeamIcon = (team: string | null) => {
  switch (team) {
    case 'alfa': return Shield;
    case 'bravo': return Star;
    case 'charlie': return Target;
    case 'delta': return Crosshair;
    default: return User;
  }
};

const getTeamColor = (team: string | null) => {
  switch (team) {
    case 'alfa': return 'text-blue-400';
    case 'bravo': return 'text-amber-400';
    case 'charlie': return 'text-emerald-400';
    case 'delta': return 'text-red-400';
    default: return 'text-muted-foreground';
  }
};

const GlobalChat = ({ isOpen, onClose }: GlobalChatProps) => {
  const { agent } = usePlantaoAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'team'>('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { playMessageSent, playMessageReceived, playEmojiSound, playErrorSound } = useChatSounds();

  // Fetch messages
  useEffect(() => {
    if (!isOpen || !agent?.id) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      if (data) {
        // Fetch sender info for each message
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        const { data: senders } = await supabase
          .from('agents')
          .select('id, full_name, avatar_url, current_team')
          .in('id', senderIds);

        const sendersMap = new Map(senders?.map(s => [s.id, s]) || []);
        
        const messagesWithSenders = data.map(m => ({
          ...m,
          sender: sendersMap.get(m.sender_id)
        })) as ChatMessage[];

        setMessages(messagesWithSenders);
      }
    };

    fetchMessages();

    // Subscribe to new messages with improved handling
    const channel = supabase
      .channel(`chat-messages-global-${agent.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, async (payload) => {
        console.log('New chat message received:', payload);
        const newMsg = payload.new as ChatMessage;
        
        // Fetch sender info
        const { data: sender } = await supabase
          .from('agents')
          .select('id, full_name, avatar_url, current_team')
          .eq('id', newMsg.sender_id)
          .single();

        const messageWithSender = { ...newMsg, sender };
        
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, messageWithSender];
        });

        // Play sound for messages from others
        if (newMsg.sender_id !== agent?.id) {
          playMessageReceived();
        }
      })
      .subscribe((status) => {
        console.log('Chat subscription status:', status);
      });

    return () => {
      console.log('Cleaning up chat subscription');
      supabase.removeChannel(channel);
    };
  }, [isOpen, agent?.id, playMessageReceived]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!agent?.id || !newMessage.trim()) return;

    setIsLoading(true);
    
    const messageData = {
      sender_id: agent.id,
      channel_type: activeTab,
      team_channel: activeTab === 'team' ? agent.current_team : null,
      content: newMessage.trim()
    };

    const { error } = await supabase.from('chat_messages').insert(messageData);

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
      playErrorSound();
    } else {
      setNewMessage('');
      playMessageSent();
    }

    setIsLoading(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleVoiceRecord = () => {
    // Toggle recording state (placeholder for voice recording feature)
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast.info('🎤 Gravação de voz em breve!', { duration: 2000 });
    }
  };

  const filteredMessages = messages.filter(m => {
    if (activeTab === 'general') return m.channel_type === 'general';
    return m.channel_type === 'team' && m.team_channel === agent?.current_team;
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Chat Global
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'general' | 'team')} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-2 mx-4 mt-2">
            <TabsTrigger value="general" className="gap-2">
              <Globe className="w-4 h-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="w-4 h-4" />
              Equipe
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {filteredMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma mensagem ainda</p>
                      <p className="text-xs">Seja o primeiro a enviar!</p>
                    </div>
                  ) : (
                    filteredMessages.map((message) => {
                      const isOwn = message.sender_id === agent?.id;
                      const TeamIcon = getTeamIcon(message.sender?.current_team || null);

                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                          className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                        >
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage src={message.sender?.avatar_url || ''} />
                            <AvatarFallback className={getTeamColor(message.sender?.current_team || null)}>
                              <TeamIcon className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>

                          <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                              <span className={`text-xs font-medium ${getTeamColor(message.sender?.current_team || null)}`}>
                                {message.sender?.full_name || 'Agente'}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
                              </span>
                            </div>
                            <motion.div 
                              className={`
                                px-3 py-2 rounded-2xl text-sm
                                ${isOwn 
                                  ? 'bg-primary text-primary-foreground rounded-br-md' 
                                  : 'bg-muted rounded-bl-md'
                                }
                              `}
                              whileHover={{ scale: 1.02 }}
                            >
                              {message.content}
                            </motion.div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-background">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2 items-center"
              >
                <EmojiPicker onEmojiSelect={handleEmojiSelect} onPlaySound={playEmojiSound} />
                
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Mensagem para ${activeTab === 'general' ? 'todos' : 'sua equipe'}...`}
                  disabled={isLoading}
                  className="flex-1"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleVoiceRecord}
                  className={`h-9 w-9 ${isRecording ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                <Button type="submit" size="icon" disabled={isLoading || !newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default GlobalChat;
