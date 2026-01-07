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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full z-50 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with Logo */}
            <div className="bg-gradient-to-b from-primary/20 to-transparent p-6 text-center">
              <motion.img
                src={plantaoLogo}
                alt="PlantãoPro"
                className="h-20 mx-auto object-contain drop-shadow-lg"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              />
              <motion.h2
                className="text-xl font-display tracking-wide mt-3"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                📱 Sobre o Aplicativo
              </motion.h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* App Description */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Este aplicativo foi desenvolvido com o objetivo de <strong className="text-foreground">controlar, registrar e acompanhar os plantões e o banco de horas</strong>, oferecendo aos usuários maior organização, clareza e autonomia na gestão do tempo de trabalho.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A ferramenta permite visualizar jornadas realizadas, acompanhar o saldo de horas e organizar plantões, contribuindo para um melhor planejamento das atividades profissionais e pessoais.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Seu uso facilita o controle das rotinas, reduz a necessidade de registros manuais e promove maior transparência nas informações.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  O aplicativo foi pensado para apoiar a organização do trabalho, proporcionando liberdade para que cada usuário possa gerenciar seu próprio tempo de forma prática e responsável.
                </p>
              </motion.div>

              {/* Features Icons */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-3 gap-3"
              >
                <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                  <Clock className="w-6 h-6 text-primary" />
                  <span className="text-xs text-muted-foreground text-center">Controle de Plantões</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                  <Users className="w-6 h-6 text-accent" />
                  <span className="text-xs text-muted-foreground text-center">Gestão de Equipes</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                  <Heart className="w-6 h-6 text-destructive" />
                  <span className="text-xs text-muted-foreground text-center">Banco de Horas</span>
                </div>
              </motion.div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Developer Info */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">👨‍💻 Sobre o Desenvolvedor</h3>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Franc Denis</strong> é Agente Socioeducativo do CS Feijó e desenvolvedor de soluções digitais voltadas ao apoio da organização institucional e da gestão de rotinas de trabalho.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A partir da experiência prática no ambiente socioeducativo, o desenvolvedor criou este aplicativo com foco em funcionalidade, clareza e utilidade real, atendendo às necessidades do dia a dia dos profissionais.
                </p>
              </motion.div>

              {/* Contact */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-muted/30 rounded-xl p-4"
              >
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Contato:</span>
                  <a 
                    href="mailto:francdenisbr@gmail.com" 
                    className="text-primary hover:underline font-medium"
                  >
                    francdenisbr@gmail.com
                  </a>
                </div>
              </motion.div>

              {/* Footer */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center pt-2 border-t border-border"
              >
                <p className="text-xs text-muted-foreground">
                  Developed by <span className="text-primary font-medium">Franc Denis</span>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PlantaoAboutDialog;
