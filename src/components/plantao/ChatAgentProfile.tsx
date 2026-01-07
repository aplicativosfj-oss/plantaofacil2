import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Phone, Mail, Calendar, Shield, Clock, 
  MessageSquare, ArrowLeftRight, Users, Copy, Check,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface AgentDetails {
  id: string;
  full_name: string;
  avatar_url: string | null;
  current_team: string | null;
  registration_number: string | null;
  phone: string | null;
  email: string | null;
  unit: string | null;
  city: string | null;
  team_joined_at: string | null;
  created_at: string | null;
}

interface NextShift {
  shift_start: string;
  shift_end: string;
}

interface ChatAgentProfileProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  onStartSwap?: (agentId: string) => void;
}

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
  switch (team) {
    case 'alfa': return 'Alfa';
    case 'bravo': return 'Bravo';
    case 'charlie': return 'Charlie';
    case 'delta': return 'Delta';
    default: return 'Sem equipe';
  }
};

const ChatAgentProfile: React.FC<ChatAgentProfileProps> = ({ 
  isOpen, 
  onClose, 
  agentId,
  onStartSwap 
}) => {
  const [agentDetails, setAgentDetails] = useState<AgentDetails | null>(null);
  const [nextShift, setNextShift] = useState<NextShift | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !agentId) return;

    const fetchAgentDetails = async () => {
      setLoading(true);

      // Fetch agent details
      const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (agent) {
        setAgentDetails(agent);
      }

      // Fetch next shift
      const { data: shift } = await supabase
        .from('shifts')
        .select('shift_start, shift_end')
        .eq('agent_id', agentId)
        .gte('shift_start', new Date().toISOString())
        .order('shift_start', { ascending: true })
        .limit(1)
        .single();

      if (shift) {
        setNextShift(shift);
      }

      // Check if online
      const { data: presence } = await supabase
        .from('agent_presence')
        .select('is_online, last_seen')
        .eq('agent_id', agentId)
        .single();

      if (presence) {
        setIsOnline(presence.is_online || false);
      }

      setLoading(false);
    };

    fetchAgentDetails();
  }, [isOpen, agentId]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('Copiado!');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_self');
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const whatsappPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${whatsappPhone}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:max-w-sm md:w-full z-[60] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className={`h-20 ${getTeamColor(agentDetails?.current_team)} relative`}>
              <button
                onClick={onClose}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              
              {/* Online indicator */}
              {isOnline && (
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  Online
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="relative -mt-10 px-4">
              <div className={`w-20 h-20 rounded-full border-4 border-card ${getTeamColor(agentDetails?.current_team)} flex items-center justify-center overflow-hidden mx-auto`}>
                {loading ? (
                  <div className="animate-pulse bg-muted w-full h-full" />
                ) : agentDetails?.avatar_url ? (
                  <img 
                    src={agentDetails.avatar_url} 
                    alt={agentDetails.full_name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 pt-2">
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-6 bg-muted rounded w-3/4 mx-auto" />
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
                </div>
              ) : agentDetails ? (
                <>
                  {/* Name and Team */}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold">{agentDetails.full_name}</h3>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <Badge className={`${getTeamColor(agentDetails.current_team)} text-white`}>
                        Equipe {getTeamLabel(agentDetails.current_team)}
                      </Badge>
                      {agentDetails.registration_number && (
                        <Badge variant="outline" className="text-xs">
                          Mat: {agentDetails.registration_number}
                        </Badge>
                      )}
                    </div>
                    {agentDetails.unit && (
                      <p className="text-xs text-muted-foreground mt-1">{agentDetails.unit}</p>
                    )}
                  </div>

                  <Separator className="my-3" />

                  {/* Contact Actions */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {agentDetails.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-col h-auto py-2 gap-1"
                        onClick={() => handleCall(agentDetails.phone!)}
                      >
                        <Phone className="w-4 h-4 text-primary" />
                        <span className="text-[10px]">Ligar</span>
                      </Button>
                    )}
                    {agentDetails.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-col h-auto py-2 gap-1"
                        onClick={() => handleWhatsApp(agentDetails.phone!)}
                      >
                        <MessageSquare className="w-4 h-4 text-green-500" />
                        <span className="text-[10px]">WhatsApp</span>
                      </Button>
                    )}
                    {agentDetails.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-col h-auto py-2 gap-1"
                        onClick={() => handleEmail(agentDetails.email!)}
                      >
                        <Mail className="w-4 h-4 text-accent" />
                        <span className="text-[10px]">Email</span>
                      </Button>
                    )}
                  </div>

                  {/* Info Cards */}
                  <div className="space-y-2">
                    {/* Next Shift */}
                    {nextShift && (
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <Calendar className="w-4 h-4 text-primary" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Próximo Plantão</p>
                          <p className="text-sm font-medium">
                            {format(new Date(nextShift.shift_start), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {formatDistanceToNow(new Date(nextShift.shift_start), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </Badge>
                      </div>
                    )}

                    {/* Phone with copy */}
                    {agentDetails.phone && (
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Telefone</p>
                          <p className="text-sm">{agentDetails.phone}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopy(agentDetails.phone!, 'phone')}
                        >
                          {copied === 'phone' ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Email with copy */}
                    {agentDetails.email && (
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm truncate">{agentDetails.email}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopy(agentDetails.email!, 'email')}
                        >
                          {copied === 'email' ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Team joined date */}
                    {agentDetails.team_joined_at && (
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Na equipe desde</p>
                          <p className="text-sm">
                            {format(new Date(agentDetails.team_joined_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="my-3" />

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        onStartSwap?.(agentId);
                        onClose();
                      }}
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                      Solicitar Permuta
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-2"
                      onClick={onClose}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Enviar Mensagem
                    </Button>
                  </div>

                  {/* Member since */}
                  {agentDetails.created_at && (
                    <p className="text-[10px] text-muted-foreground text-center mt-3">
                      Membro desde {format(new Date(agentDetails.created_at), "MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Agente não encontrado</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatAgentProfile;
