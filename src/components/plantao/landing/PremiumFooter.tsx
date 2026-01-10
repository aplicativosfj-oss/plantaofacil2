import { motion } from 'framer-motion';

interface PremiumFooterProps {
  onAboutOpen: () => void;
}

export const PremiumFooter = ({ onAboutOpen }: PremiumFooterProps) => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="relative z-20 px-4 py-4"
    >
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between text-xs">
          {/* Copyright */}
          <motion.span
            className="text-slate-600 font-mono"
            animate={{ 
              color: ['hsl(var(--primary))', 'hsl(220 20% 30%)', 'hsl(var(--primary))'],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            © 2026 Franc Denis
          </motion.span>

          {/* About link */}
          <button
            onClick={onAboutOpen}
            className="text-slate-600 hover:text-primary transition-colors font-mono"
          >
            Sobre • v1.0
          </button>

          {/* Status indicators */}
          <div className="flex items-center gap-3 font-mono">
            <span className="text-primary/60">SYS::OK</span>
            <span className="text-emerald-500/60">SEC::ON</span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default PremiumFooter;
