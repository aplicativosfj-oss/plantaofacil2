import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Code, Mail, Clock, Users, Heart } from 'lucide-react';
import plantaoLogo from '@/assets/plantao-logo.png';

interface PlantaoAboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const PlantaoAboutDialog: React.FC<PlantaoAboutDialogProps> = ({ isOpen, onClose }) => {
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
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed left-2 right-2 top-[10%] bottom-[10%] md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full md:max-h-[80vh] z-50 bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header with Logo */}
            <div className="flex-shrink-0 bg-gradient-to-b from-primary/20 to-transparent p-4 text-center relative">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={plantaoLogo}
                alt="PlantãoPro"
                className="h-12 mx-auto object-contain drop-shadow-lg"
              />
              <h2 className="text-base font-display tracking-wide mt-2">
                📱 Sobre o Aplicativo
              </h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* App Description */}
              <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                <p>
                  Este aplicativo foi desenvolvido para <strong className="text-foreground">controlar e acompanhar os plantões e o banco de horas</strong>, oferecendo organização e autonomia na gestão do tempo de trabalho.
                </p>
                <p>
                  Visualize jornadas, acompanhe o saldo de horas e organize plantões de forma prática.
                </p>
              </div>

              {/* Features Icons */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-muted/30">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-[10px] text-muted-foreground text-center">Plantões</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-muted/30">
                  <Users className="w-5 h-5 text-accent" />
                  <span className="text-[10px] text-muted-foreground text-center">Equipes</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-muted/30">
                  <Heart className="w-5 h-5 text-destructive" />
                  <span className="text-[10px] text-muted-foreground text-center">Banco de Horas</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Developer Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-semibold text-foreground">👨‍💻 Desenvolvedor</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Franc Denis</strong> - Agente Socioeducativo do CS Feijó, desenvolvedor de soluções digitais para organização institucional.
                </p>
              </div>

              {/* Contact */}
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 text-xs">
                  <Mail className="w-4 h-4 text-primary" />
                  <a 
                    href="mailto:francdenisbr@gmail.com" 
                    className="text-primary hover:underline font-medium"
                  >
                    francdenisbr@gmail.com
                  </a>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-2 border-t border-border">
                <p className="text-[10px] text-muted-foreground">
                  Developed by <span className="text-primary font-medium">Franc Denis</span>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PlantaoAboutDialog;
