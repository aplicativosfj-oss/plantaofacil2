import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Star, Heart, Award, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import plantaoLogo from '@/assets/plantao-logo.png';

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
  isFirstLogin?: boolean;
  onChangePassword?: () => void;
}

const WelcomeDialog: React.FC<WelcomeDialogProps> = ({ 
  isOpen, 
  onClose, 
  agentName,
  isFirstLogin = false,
  onChangePassword 
}) => {
  const firstName = agentName.split(' ')[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full z-50 bg-gradient-to-b from-card to-card/95 border border-primary/30 rounded-2xl shadow-2xl shadow-primary/20 overflow-hidden"
          >
            {/* Animated Background Stars */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-primary/30 rounded-full"
                  initial={{ 
                    x: Math.random() * 400, 
                    y: Math.random() * 400,
                    opacity: 0 
                  }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    delay: Math.random() * 2,
                    repeat: Infinity 
                  }}
                />
              ))}
            </div>

            {/* Content */}
            <div className="relative p-8 text-center space-y-6">
              {/* Logo Animation */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="relative inline-block"
              >
                <motion.div
                  className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <img 
                  src={plantaoLogo} 
                  alt="PlantãoPro" 
                  className="w-24 h-24 mx-auto object-contain relative z-10"
                />
              </motion.div>

              {/* Shield Icon */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center"
              >
                <div className="p-3 bg-primary/20 rounded-full">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
              </motion.div>

              {/* Welcome Text */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <h2 className="text-2xl font-display tracking-wide">
                  Bem-vindo, <span className="text-primary">{firstName}</span>!
                </h2>
                <p className="text-muted-foreground">
                  Agente Socioeducativo
                </p>
              </motion.div>

              {/* Honor Message */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <Award className="w-6 h-6 text-primary" />
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-sm leading-relaxed">
                  Seu trabalho é <strong className="text-primary">essencial</strong> para a sociedade. 
                  A dedicação diária à ressocialização de jovens transforma vidas e constrói um futuro melhor.
                </p>
                <div className="flex items-center justify-center gap-1 text-primary text-sm">
                  <Heart className="w-4 h-4 fill-current" />
                  <span className="font-medium">Obrigado por sua dedicação!</span>
                </div>
              </motion.div>

              {/* Sparkles */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center gap-4"
              >
                <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                <Sparkles className="w-4 h-4 text-primary animate-pulse" style={{ animationDelay: '0.5s' }} />
                <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" style={{ animationDelay: '1s' }} />
              </motion.div>

              {/* First Login Password Change */}
              {isFirstLogin && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="bg-muted/30 rounded-lg p-4 border border-border/50"
                >
                  <p className="text-sm text-muted-foreground mb-3">
                    🔐 Este é seu primeiro acesso. Deseja alterar sua senha?
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={onClose}
                    >
                      Depois
                    </Button>
                    <Button 
                      size="sm"
                      onClick={onChangePassword}
                    >
                      Alterar Senha
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Continue Button */}
              {!isFirstLogin && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button onClick={onClose} className="w-full" size="lg">
                    Continuar
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WelcomeDialog;
