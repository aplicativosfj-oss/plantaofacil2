import { useState, useEffect, useRef } from 'react';
import { format, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  MessageSquare, Users, Globe, Shield, Star, Target, Crosshair, 
  User, Play, Pause, FileText, Volume2, ArrowLeft, Search,
  Calendar, Filter, ChevronDown, Mail, MailOpen, Trash2, Clock, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  sender_id: string;
  channel_type: 'general' | 'team';
  team_channel: 'alfa' | 'bravo' | 'charlie' | 'delta' | null;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    current_team: string | null;
  };
}

interface ChatHistoryPanelProps {
  onBack: () => void;
  onOpenGlobalChat: () => void;
  onOpenTeamChat: () => void;
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
    case 'alfa': return 'text-blue-400 bg-blue-500/20';
    case 'bravo': return 'text-amber-400 bg-amber-500/20';
    case 'charlie': return 'text-emerald-400 bg-emerald-500/20';
    case 'delta': return 'text-red-400 bg-red-500/20';
    default: return 'text-muted-foreground bg-muted';
  }
};

const getTeamLabel = (team: string | null) => {
  switch (team) {
    case 'alfa': return 'Alfa';
    case 'bravo': return 'Bravo';
    case 'charlie': return 'Charlie';
    case 'delta': return 'Delta';
    default: return 'Sem equipe';
  }
};

// Audio message component
const AudioMessage: React.FC<{ content: string }> = ({ content }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const audioData = content.match(/\[AUDIO:([^\]]+)\]/);
  if (!audioData) return <span className="text-sm">{content}</span>;

  const audioUrl = audioData[1];
  const textContent = content.replace(/\[AUDIO:[^\]]+\]/, '').trim();

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 bg-background/30 rounded-full px-2 py-1 w-fit">
        <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
        <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={togglePlay}>
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </Button>
        <Volume2 className="w-3 h-3" />
        <span className="text-xs">Áudio</span>
      </div>
      {textContent && <p className="text-sm">{textContent}</p>}
    </div>
  );
};

// Image message component
const ImageMessage: React.FC<{ content: string }> = ({ content }) => {
  const imageData = content.match(/\[IMAGE:([^\]]+)\]/);
  if (!imageData) return <span className="text-sm">{content}</span>;

  const imageUrl = imageData[1];
  const textContent = content.replace(/\[IMAGE:[^\]]+\]/, '').trim();

  return (
    <div className="space-y-1">
      <img src={imageUrl} alt="Imagem" className="max-w-full rounded-lg max-h-32 object-cover" />
      {textContent && <p className="text-sm">{textContent}</p>}
    </div>
  );
};

// Document message component
const DocumentMessage: React.FC<{ content: string }> = ({ content }) => {
  const docData = content.match(/\[DOC:([^|]+)\|([^\]]+)\]/);
  if (!docData) return <span className="text-sm">{content}</span>;

  const docUrl = docData[1];
  const fileName = docData[2];
  const textContent = content.replace(/\[DOC:[^\]]+\]/, '').trim();

  return (
    <div className="space-y-1">
      <a 
        href={docUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-blue-500/20 rounded-lg px-2 py-1 hover:bg-blue-500/30 transition-colors w-fit"
      >
        <FileText className="w-3 h-3 text-blue-400" />
        <span className="text-xs truncate max-w-[120px]">{fileName}</span>
      </a>
      {textContent && <p className="text-sm">{textContent}</p>}
    </div>
  );
};

// Message content renderer
const MessageContent: React.FC<{ content: string }> = ({ content }) => {
  if (content.includes('[AUDIO:')) return <AudioMessage content={content} />;
  if (content.includes('[IMAGE:')) return <ImageMessage content={content} />;
  if (content.includes('[DOC:')) return <DocumentMessage content={content} />;
  return <span className="text-sm">{content}</span>;
};

// Time remaining component
const TimeRemaining: React.FC<{ createdAt: string }> = ({ createdAt }) => {
  const hoursElapsed = differenceInHours(new Date(), new Date(createdAt));
  const hoursRemaining = Math.max(0, 24 - hoursElapsed);
  
  if (hoursRemaining === 0) {
    return <span className="text-destructive text-[10px]">Expirando...</span>;
  }
  
  return (
    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
      <Clock className="w-2.5 h-2.5" />
      {hoursRemaining}h
    </span>
  );
};

const ChatHistoryPanel = ({ onBack, onOpenGlobalChat, onOpenTeamChat }: ChatHistoryPanelProps) => {
  const { agent } = usePlantaoAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'sent' | 'received'>('all');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState<'all' | 'general' | 'team'>('all');
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const fetchMessages = async () => {
    if (!agent?.id) return;
    
    setIsLoading(true);
    
    // Filter messages less than 24 hours old
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Error fetching messages:', error);
      setIsLoading(false);
      return;
    }

    if (data && data.length > 0) {
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
    } else {
      setMessages([]);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to changes
    const channel = supabase
      .channel(`chat-history-${agent?.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages'
      }, async (payload) => {
        if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          return;
        }
        
        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new as ChatMessage;
          
          const { data: sender } = await supabase
            .from('agents')
            .select('id, full_name, avatar_url, current_team')
            .eq('id', newMsg.sender_id)
            .single();

          const messageWithSender = { ...newMsg, sender };
          
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [messageWithSender, ...prev];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agent?.id]);

  // Handle delete message
  const handleDeleteMessage = async () => {
    if (!deleteMessageId) return;
    
    setIsDeleting(true);
    
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', deleteMessageId);
    
    if (error) {
      console.error('Error deleting message:', error);
      toast.error('Erro ao apagar mensagem');
    } else {
      setMessages(prev => prev.filter(m => m.id !== deleteMessageId));
      toast.success('Mensagem apagada');
    }
    
    setIsDeleting(false);
    setDeleteMessageId(null);
  };

  // Filter messages
  const filteredMessages = messages.filter(m => {
    // Tab filter
    if (activeTab === 'sent' && m.sender_id !== agent?.id) return false;
    if (activeTab === 'received' && m.sender_id === agent?.id) return false;
    
    // Channel filter
    if (filterChannel === 'general' && m.channel_type !== 'general') return false;
    if (filterChannel === 'team' && m.channel_type !== 'team') return false;
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchContent = m.content.toLowerCase().includes(term);
      const matchSender = m.sender?.full_name?.toLowerCase().includes(term);
      if (!matchContent && !matchSender) return false;
    }
    
    return true;
  });

  // Group messages by date
  const groupedMessages = filteredMessages.reduce((groups, message) => {
    const date = format(new Date(message.created_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, ChatMessage[]>);

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Hoje';
    }
    if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Ontem';
    }
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  const totalSent = messages.filter(m => m.sender_id === agent?.id).length;
  const totalReceived = messages.filter(m => m.sender_id !== agent?.id).length;

  return (
    <div className="h-full flex flex-col">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteMessageId} onOpenChange={() => setDeleteMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Apagar Mensagem
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja apagar esta mensagem? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMessage}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Apagando...' : 'Apagar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Histórico de Mensagens
            </h2>
            <p className="text-xs text-muted-foreground">
              {totalSent} enviadas • {totalReceived} recebidas
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchMessages}
            className="h-8 w-8"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenGlobalChat}
            className="gap-1.5 text-xs"
          >
            <Globe className="w-3.5 h-3.5" />
            Chat Geral
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenTeamChat}
            className="gap-1.5 text-xs"
          >
            <Users className="w-3.5 h-3.5" />
            Chat Equipe
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
        <p className="text-xs text-amber-400 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          As mensagens são automaticamente apagadas após 24 horas
        </p>
      </div>

      {/* Filters */}
      <div className="p-3 border-b border-border/30 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar mensagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-9">
                <Filter className="w-3.5 h-3.5" />
                {filterChannel === 'all' ? 'Todos' : filterChannel === 'general' ? 'Geral' : 'Equipe'}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterChannel('all')}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Todos os canais
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterChannel('general')}>
                <Globe className="w-4 h-4 mr-2" />
                Chat Geral
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterChannel('team')}>
                <Users className="w-4 h-4 mr-2" />
                Chat da Equipe
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'sent' | 'received')}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all" className="text-xs gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Todas
            </TabsTrigger>
            <TabsTrigger value="sent" className="text-xs gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Enviadas
            </TabsTrigger>
            <TabsTrigger value="received" className="text-xs gap-1.5">
              <MailOpen className="w-3.5 h-3.5" />
              Recebidas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Messages List */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhuma mensagem encontrada</p>
            <p className="text-xs">
              {searchTerm ? 'Tente outro termo de busca' : 'As mensagens aparecerão aqui'}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={onOpenGlobalChat}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Enviar Mensagem
            </Button>
          </div>
        ) : (
          <div className="p-3 space-y-4">
            {Object.entries(groupedMessages).map(([date, dayMessages]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/50">
                    <Calendar className="w-3 h-3" />
                    {formatDateHeader(date)}
                  </span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>

                {/* Messages */}
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {dayMessages.map((message) => {
                      const isOwn = message.sender_id === agent?.id;
                      const TeamIcon = getTeamIcon(message.sender?.current_team || null);

                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`
                            group relative p-3 rounded-xl border border-border/30
                            ${isOwn 
                              ? 'bg-primary/5 border-primary/20' 
                              : 'bg-muted/30'
                            }
                          `}
                        >
                          {/* Delete button for own messages */}
                          {isOwn && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteMessageId(message.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                          
                          <div className="flex items-start gap-3">
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarImage src={message.sender?.avatar_url || ''} />
                              <AvatarFallback className={getTeamColor(message.sender?.current_team || null)}>
                                <TeamIcon className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium truncate">
                                    {isOwn ? 'Você' : message.sender?.full_name || 'Agente'}
                                  </span>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-[10px] px-1.5 py-0 ${getTeamColor(message.sender?.current_team || null)}`}
                                  >
                                    {getTeamLabel(message.sender?.current_team || null)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <TimeRemaining createdAt={message.created_at} />
                                  <Badge 
                                    variant="secondary" 
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    {message.channel_type === 'general' ? (
                                      <><Globe className="w-2.5 h-2.5 mr-1" /> Geral</>
                                    ) : (
                                      <><Users className="w-2.5 h-2.5 mr-1" /> Equipe</>
                                    )}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground">
                                    {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="text-foreground/90">
                                <MessageContent content={message.content} />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ChatHistoryPanel;