import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Mail, MapPin, Building, MessageCircle, IdCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { differenceInMinutes, parseISO } from 'date-fns';

interface MemberProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string | null;
  onStartChat: (memberId: string) => void;
}

interface MemberData {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  unit: string | null;
  registration_number: string | null;
  avatar_url: string | null;
  current_team: string | null;
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

const MemberProfileDialog: React.FC<MemberProfileDialogProps> = ({ 
  isOpen, 
  onClose,
  memberId,
  onStartChat
}) => {
  const [member, setMember] = useState<MemberData | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!memberId || !isOpen) return;

    const fetchMember = async () => {
      setLoading(true);
      
      // Fetch member data (without CPF)
      const { data, error } = await supabase
        .from('agents')
        .select('id, full_name, phone, email, city, unit, registration_number, avatar_url, current_team')
        .eq('id', memberId)
        .single();

      if (data && !error) {
        setMember(data);
      }

      // Check if online
      const { data: presence } = await supabase
        .from('agent_presence')
        .select('last_seen')
        .eq('agent_id', memberId)
        .single();

      if (presence?.last_seen) {
        const diffMinutes = differenceInMinutes(new Date(), parseISO(presence.last_seen));
        setIsOnline(diffMinutes < 5);
      } else {
        setIsOnline(false);
      }

      setLoading(false);
    };

    fetchMember();
  }, [memberId, isOpen]);

  if (!member && !loading) return null;

  const teamName = member?.current_team 
    ? member.current_team.charAt(0).toUpperCase() + member.current_team.slice(1)
    : 'Sem equipe';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed left-4 right-4 top-[15%] md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-sm md:w-full z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
              <h2 className="text-sm font-semibold">Perfil do Membro</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : member && (
              <div className="p-4 space-y-4">
                {/* Profile Photo & Name */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border-4 ${getTeamColor(member.current_team)} shadow-lg`}>
                      {member.avatar_url ? (
                        <img 
                          src={member.avatar_url} 
                          alt={member.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-white" />
                      )}
                    </div>
                    {/* Online Indicator */}
                    <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-card ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </div>

                  <h3 className="mt-2 text-base font-medium text-center">{member.full_name}</h3>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${getTeamColor(member.current_team)} text-white text-xs`}>
                      {teamName}
                    </Badge>
                    {isOnline && (
                      <Badge variant="outline" className="text-green-500 border-green-500 text-xs">
                        Online
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                  {member.registration_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <IdCard className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Mat:</span>
                      <span className="font-medium uppercase">{member.registration_number}</span>
                    </div>
                  )}
                  {member.unit && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Unidade:</span>
                      <span className="font-medium">{member.unit}</span>
                    </div>
                  )}
                  {member.city && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Cidade:</span>
                      <span className="font-medium">{member.city}</span>
                    </div>
                  )}
                </div>

                {/* Contact Actions */}
                <div className="space-y-2">
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="flex items-center gap-2 w-full p-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-sm"
                    >
                      <Phone className="w-4 h-4 text-primary" />
                      <span>{member.phone}</span>
                    </a>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="flex items-center gap-2 w-full p-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-sm"
                    >
                      <Mail className="w-4 h-4 text-primary" />
                      <span className="truncate">{member.email}</span>
                    </a>
                  )}
                </div>

                {/* Chat Button */}
                <Button
                  className="w-full gap-2"
                  onClick={() => {
                    onStartChat(member.id);
                    onClose();
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Enviar Mensagem
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MemberProfileDialog;