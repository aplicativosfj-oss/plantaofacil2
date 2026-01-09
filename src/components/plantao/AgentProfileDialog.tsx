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

  // Sync form with agent data when dialog opens or agent changes
  useEffect(() => {
    if (agent) {
      setFullName(agent.full_name || '');
      setPhone(agent.phone || '');
      setEmail(agent.email || '');
      setCity(agent.city || '');
      setUnit(agent.unit || '');
      setRegistrationNumber(agent.registration_number || '');
    }
    if (isOpen) {
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
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed left-2 right-2 top-[5%] bottom-[5%] md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-sm md:w-full md:max-h-[85vh] z-50 bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-border bg-card">
              <h2 className="text-sm font-semibold">Meu Perfil</h2>
              <div className="flex items-center gap-1">
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-1 h-7 text-xs"
                  >
                    <Edit2 className="w-3 h-3" />
                    Editar
                  </Button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Profile Photo */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-3 ${getTeamColor(agent.current_team)} shadow-lg`}>
                    {agent.avatar_url ? (
                      <img 
                        src={agent.avatar_url} 
                        alt={agent.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                  
                  {/* Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-3 h-3 text-white animate-spin" />
                    ) : (
                      <Camera className="w-3 h-3 text-white" />
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
                    <h3 className="mt-2 text-sm font-medium">{agent.full_name}</h3>
                    <Badge className={`${getTeamColor(agent.current_team)} text-white text-xs mt-1`}>
                      {teamName}
                    </Badge>
                  </>
                ) : (
                  <Badge className={`${getTeamColor(agent.current_team)} text-white text-xs mt-2`}>
                    {teamName}
                  </Badge>
                )}
              </div>

              {/* CPF - Only visible to the agent themselves */}
              <div className="bg-card border border-border rounded-lg p-2.5">
                <div className="flex items-center gap-2">
                  <IdCard className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">CPF (visível apenas para você)</p>
                    <p className="text-sm font-semibold font-mono">{formatCPF(agent.cpf)}</p>
                  </div>
                </div>
              </div>

              {isEditing ? (
                /* Editing Mode */
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="fullName" className="text-xs">Nome Completo *</Label>
                    <div className="relative">
                      <UserCircle className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-8 h-8 text-sm"
                        placeholder="Seu nome completo"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="registrationNumber" className="text-xs">Matrícula</Label>
                      <div className="relative">
                        <IdCard className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          id="registrationNumber"
                          value={registrationNumber}
                          onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                          className="pl-8 h-8 text-sm uppercase"
                          placeholder="Matrícula"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="unit" className="text-xs">Unidade</Label>
                      <div className="relative">
                        <Building className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          id="unit"
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="pl-8 h-8 text-sm"
                          placeholder="Unidade"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="city" className="text-xs">Cidade</Label>
                    <div className="relative">
                      <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="pl-8 h-8 text-sm"
                        placeholder="Sua cidade"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-xs">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(formatPhone(e.target.value))}
                          className="pl-8 h-8 text-sm"
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-8 h-8 text-sm"
                          placeholder="seu@email.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1 h-8 text-xs"
                      onClick={handleSave}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-3 h-3 mr-1" />
                          Salvar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
                  <div className="space-y-2 bg-card border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-xs">Mat:</span>
                      <span className="font-semibold text-xs uppercase">{agent.registration_number || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-xs">Unidade:</span>
                      <span className="font-medium text-xs">{agent.unit || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-xs">Cidade:</span>
                      <span className="font-medium text-xs">{agent.city || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-xs">Tel:</span>
                      <span className="font-medium text-xs">{agent.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-xs truncate">{agent.email || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Password Change */}
                  <Button
                    variant="outline"
                    className="w-full h-8 text-xs"
                    onClick={onChangePassword}
                  >
                    <Lock className="w-3 h-3 mr-1" />
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
