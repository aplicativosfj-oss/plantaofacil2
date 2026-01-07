import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Users, MessageCircle, Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  recipient_team: string | null;
  is_broadcast: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string | null;
    current_team: string | null;
  };
}

interface TeamChatProps {
  isOpen: boolean;
  onClose: () => void;
}

type TeamType = 'alfa' | 'bravo' | 'charlie' | 'delta';

const TEAMS: { value: TeamType; label: string; color: string }[] = [
  { value: 'alfa', label: 'Alfa', color: 'bg-blue-500' },
  { value: 'bravo', label: 'Bravo', color: 'bg-amber-500' },
  { value: 'charlie', label: 'Charlie', color: 'bg-sky-500' },
  { value: 'delta', label: 'Delta', color: 'bg-green-500' },
];

const getTeamColor = (team: string | null) => {
  switch (team) {
    case 'alfa': return 'bg-blue-500';
    case 'bravo': return 'bg-amber-500';
    case 'charlie': return 'bg-sky-500';
    case 'delta': return 'bg-green-500';
    default: return 'bg-muted';
  }
};

const getTeamLabel = (team: string | null) => {
  const found = TEAMS.find(t => t.value === team);
  return found ? found.label : 'Equipe';
};

const TeamChat: React.FC<TeamChatProps> = ({ isOpen, onClose }) => {
  const { agent } = usePlantaoAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'team' | 'all'>('team');
  const [selectedTeam, setSelectedTeam] = useState<TeamType | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize selected team with agent's team
  useEffect(() => {
    if (agent?.current_team) {
      setSelectedTeam(agent.current_team as TeamType);
    }
  }, [agent?.current_team]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isOpen || !agent) return;

    const fetchMessages = async () => {
      setLoading(true);
      
      let query = supabase
        .from('agent_messages')
        .select(`
          *,
          sender:agents!sender_id (
            full_name,
            avatar_url,
            current_team
          )
        `)
        .order('created_at', { ascending: true })
        .limit(100);

      if (activeTab === 'team' && selectedTeam) {
        query = query.eq('recipient_team', selectedTeam);
      } else {
        query = query.eq('is_broadcast', true);
      }

      const { data, error } = await query;

      if (data && !error) {
        setMessages(data as Message[]);
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('team-chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'agent_messages',
      }, async (payload) => {
        // Fetch the sender info for the new message
        const { data: senderData } = await supabase
          .from('agents')
          .select('full_name, avatar_url, current_team')
          .eq('id', payload.new.sender_id)
          .single();

        const newMsg = {
          ...payload.new,
          sender: senderData
        } as Message;

        // Only add if it matches current filter
        if (activeTab === 'team' && newMsg.recipient_team === selectedTeam) {
          setMessages(prev => [...prev, newMsg]);
        } else if (activeTab === 'all' && newMsg.is_broadcast) {
          setMessages(prev => [...prev, newMsg]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, agent, activeTab, selectedTeam]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !agent) return;

    setSending(true);

    try {
      const messageData = {
        sender_id: agent.id,
        content: newMessage.trim(),
        recipient_team: activeTab === 'team' ? selectedTeam : null,
        is_broadcast: activeTab === 'all',
      };

      const { error } = await supabase
        .from('agent_messages')
        .insert(messageData);

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!agent) return null;

  const currentTeamLabel = selectedTeam ? getTeamLabel(selectedTeam) : 'Selecionar';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full md:h-[80vh] z-50 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Chat</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'team' | 'all')} className="flex-1 flex flex-col">
              <div className="flex items-center border-b border-border">
                <TabsList className="flex-1 rounded-none border-none bg-transparent">
                  <TabsTrigger value="team" className="flex-1 gap-2">
                    <Users className="w-4 h-4" />
                    Equipe
                  </TabsTrigger>
                  <TabsTrigger value="all" className="flex-1 gap-2">
                    <Globe className="w-4 h-4" />
                    Geral
                  </TabsTrigger>
                </TabsList>

                {/* Team Selector Dropdown */}
                {activeTab === 'team' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1 mr-2">
                        <span className={`w-2 h-2 rounded-full ${getTeamColor(selectedTeam)}`} />
                        {currentTeamLabel}
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {TEAMS.map((team) => (
                        <DropdownMenuItem
                          key={team.value}
                          onClick={() => setSelectedTeam(team.value)}
                          className="gap-2"
                        >
                          <span className={`w-3 h-3 rounded-full ${team.color}`} />
                          {team.label}
                          {team.value === agent.current_team && (
                            <Badge variant="outline" className="text-[10px] ml-auto">Minha</Badge>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <TabsContent value={activeTab} className="flex-1 flex flex-col m-0 overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                      <p>Nenhuma mensagem ainda</p>
                      <p className="text-sm">Seja o primeiro a enviar!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.sender_id === agent.id;
                      
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
                            {/* Sender info */}
                            {!isOwn && (
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-6 h-6 rounded-full ${getTeamColor(msg.sender?.current_team)} flex items-center justify-center overflow-hidden`}>
                                  {msg.sender?.avatar_url ? (
                                    <img src={msg.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xs text-white font-medium">
                                      {msg.sender?.full_name?.charAt(0) || '?'}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {msg.sender?.full_name?.split(' ')[0] || 'Desconhecido'}
                                </span>
                                {msg.sender?.current_team && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                                    {msg.sender.current_team.charAt(0).toUpperCase()}
                                  </Badge>
                                )}
                              </div>
                            )}
                            
                            {/* Message bubble */}
                            <div className={`rounded-2xl px-4 py-2 ${
                              isOwn 
                                ? 'bg-primary text-primary-foreground rounded-br-sm' 
                                : 'bg-muted rounded-bl-sm'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                            
                            {/* Time */}
                            <p className={`text-[10px] text-muted-foreground mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                              {format(new Date(msg.created_at), 'HH:mm', { locale: ptBR })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`Mensagem para ${activeTab === 'team' ? `Equipe ${currentTeamLabel}` : 'Todos'}...`}
                      className="flex-1"
                      disabled={sending}
                    />
                    <Button 
                      onClick={handleSend} 
                      disabled={!newMessage.trim() || sending}
                      size="icon"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TeamChat;
