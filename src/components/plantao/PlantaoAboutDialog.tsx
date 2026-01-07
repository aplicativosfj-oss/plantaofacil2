import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Code, Mail, MapPin, Shield, Heart } from 'lucide-react';
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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full z-50 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with Logo */}
            <div className="bg-gradient-to-b from-primary/20 to-transparent p-8 text-center">
              <motion.img
                src={plantaoLogo}
                alt="PlantãoPro"
                className="h-24 mx-auto object-contain drop-shadow-lg"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              />
              <motion.h2
                className="text-2xl font-display tracking-wide mt-4"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                PLANTÃO<span className="text-primary">PRO</span>
              </motion.h2>
              <motion.p
                className="text-sm text-muted-foreground mt-1"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                v1.0.0 • Sistema de Gestão de Plantões
              </motion.p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Description */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Aplicação web desenvolvida para gestão de plantões de agentes socioeducativos, 
                    com controle de escalas, banco de horas e permutas.
                  </p>
                </div>
              </motion.div>

              {/* Features */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <h3 className="text-sm font-semibold text-foreground">Recursos</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Escala 24h/72h com contagem regressiva</li>
                  <li>• Banco de horas com limite de 70h mensais</li>
                  <li>• Sistema de permutas entre agentes</li>
                  <li>• Gestão de equipes (Alfa, Bravo, Charlie, Delta)</li>
                  <li>• Alertas e notificações em tempo real</li>
                </ul>
              </motion.div>

              {/* Developer Info */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-muted/30 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Desenvolvido por</h3>
                </div>
                
                <div className="space-y-2">
                  <p className="text-lg font-medium text-foreground">Franc Denis</p>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-accent" />
                    <span>Feijó/AC, Brasil</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 text-accent" />
                    <a 
                      href="mailto:francdenisbr@gmail.com" 
                      className="hover:text-primary transition-colors"
                    >
                      francdenisbr@gmail.com
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Tech Stack */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center text-xs text-muted-foreground"
              >
                <p>React • TypeScript • Tailwind CSS • Supabase</p>
              </motion.div>

              {/* Footer */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center justify-center gap-1 text-xs text-muted-foreground pt-2 border-t border-border"
              >
                <span>Feito com</span>
                <Heart className="w-3 h-3 text-destructive fill-destructive" />
                <span>para os agentes socioeducativos</span>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PlantaoAboutDialog;
