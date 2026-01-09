import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, User, Lock, Phone, Mail, MapPin, Building, IdCard, Save, Loader2, Edit2, UserCircle } from 'lucide-react';
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

// Formatar CPF: XXX.XXX.XXX-XX
const formatCPF = (cpf: string) => {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

// Formatar telefone
const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
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
  const [isEditing, setIsEditing] = useState(false);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [unit, setUnit] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');

  // Sync form with agent data when dialog opens
  useEffect(() => {
    if (agent && isOpen) {
      setFullName(agent.full_name || '');
      setPhone(agent.phone || '');
      setEmail(agent.email || '');
      setCity(agent.city || '');
      setUnit(agent.unit || '');
      setRegistrationNumber(agent.registration_number || '');
      setIsEditing(false);
    }
  }, [agent, isOpen]);

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

    // Validate required fields
    if (!fullName.trim()) {
      toast.error('Nome completo é obrigatório');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('agents')
        .update({
          full_name: fullName.trim(),
          phone: phone || null,
          email: email || null,
          city: city.trim() || null,
          unit: unit.trim() || null,
          registration_number: registrationNumber.trim() || null,
        })
        .eq('id', agent.id);

      if (error) {
        toast.error('Erro ao salvar alterações');
        return;
      }

      await refreshAgent();
      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (err) {
      toast.error('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (agent) {
      setFullName(agent.full_name || '');
      setPhone(agent.phone || '');
      setEmail(agent.email || '');
      setCity(agent.city || '');
      setUnit(agent.unit || '');
      setRegistrationNumber(agent.registration_number || '');
    }
    setIsEditing(false);
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
            transition={{ duration: 0.1 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full z-50 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-card/95 backdrop-blur z-10 flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Meu Perfil</h2>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </Button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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

                {!isEditing ? (
                  <>
                    <h3 className="mt-3 text-lg font-medium">{agent.full_name}</h3>
                    <Badge className={`${getTeamColor(agent.current_team)} text-white mt-1`}>
                      Equipe {teamName}
                    </Badge>
                  </>
                ) : (
                  <Badge className={`${getTeamColor(agent.current_team)} text-white mt-3`}>
                    Equipe {teamName}
                  </Badge>
                )}
              </div>

              {/* CPF - Always read-only */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <IdCard className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">CPF (não editável)</p>
                    <p className="font-medium font-mono">{formatCPF(agent.cpf)}</p>
                  </div>
                </div>
              </div>

              {isEditing ? (
                /* Editing Mode */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo *</Label>
                    <div className="relative">
                      <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        placeholder="Seu nome completo"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Matrícula</Label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="registrationNumber"
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                        className="pl-10 uppercase"
                        placeholder="Sua matrícula"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidade</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="unit"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="pl-10"
                        placeholder="Sua unidade"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="pl-10"
                        placeholder="Sua cidade"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        className="pl-10"
                        placeholder="(00) 00000-0000"
                        maxLength={15}
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

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1"
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
                          Salvar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
                  <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Matrícula</p>
                        <p className="font-medium uppercase">{agent.registration_number || 'N/A'}</p>
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
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Telefone</p>
                        <p className="font-medium">{agent.phone || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">E-mail</p>
                        <p className="font-medium">{agent.email || 'N/A'}</p>
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
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AgentProfileDialog;
