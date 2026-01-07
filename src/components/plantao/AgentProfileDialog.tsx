import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, User, Lock, Phone, Mail, MapPin, Building, IdCard, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { usePlantaoAuth } from '@/contexts/PlantaoAuthContext';
import { toast } from 'sonner';

interface AgentProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onChangePassword: () => void;
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

const AgentProfileDialog: React.FC<AgentProfileDialogProps> = ({ 
  isOpen, 
  onClose,
  onChangePassword 
}) => {
  const { agent, refreshAgent } = usePlantaoAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [phone, setPhone] = useState(agent?.phone || '');
  const [email, setEmail] = useState(agent?.email || '');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !agent) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      // Convert to base64 and store directly in the avatar_url field
      // This is a simpler approach that doesn't require storage bucket setup
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        const { error } = await supabase
          .from('agents')
          .update({ avatar_url: base64 })
          .eq('id', agent.id);

        if (error) {
          toast.error('Erro ao salvar foto');
          return;
        }

        await refreshAgent();
        toast.success('Foto atualizada!');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!agent) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('agents')
        .update({
          phone: phone || null,
          email: email || null,
        })
        .eq('id', agent.id);

      if (error) {
        toast.error('Erro ao salvar alterações');
        return;
      }

      await refreshAgent();
      toast.success('Perfil atualizado!');
      onClose();
    } catch (err) {
      toast.error('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  if (!agent) return null;

  const teamName = agent.current_team 
    ? agent.current_team.charAt(0).toUpperCase() + agent.current_team.slice(1)
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full z-50 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-card/95 backdrop-blur z-10 flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Meu Perfil</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Profile Photo */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-4 ${getTeamColor(agent.current_team)} shadow-lg`}>
                    {agent.avatar_url ? (
                      <img 
                        src={agent.avatar_url} 
                        alt={agent.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-white" />
                    )}
                  </div>
                  
                  {/* Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute bottom-0 right-0 p-2 bg-primary rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                <h3 className="mt-3 text-lg font-medium">{agent.full_name}</h3>
                <Badge className={`${getTeamColor(agent.current_team)} text-white mt-1`}>
                  Equipe {teamName}
                </Badge>
              </div>

              {/* Read-only Info */}
              <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <IdCard className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">CPF</p>
                    <p className="font-medium">{agent.cpf}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Matrícula</p>
                    <p className="font-medium">{agent.registration_number || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Unidade</p>
                    <p className="font-medium">{agent.unit || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Cidade</p>
                    <p className="font-medium">{agent.city || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Editable Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Password Change */}
              <Button
                variant="outline"
                className="w-full"
                onClick={onChangePassword}
              >
                <Lock className="w-4 h-4 mr-2" />
                Alterar Senha
              </Button>

              {/* Save Button */}
              <Button
                className="w-full"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AgentProfileDialog;
