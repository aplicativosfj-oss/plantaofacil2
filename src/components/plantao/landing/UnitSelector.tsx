import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, ChevronDown, CheckCircle } from 'lucide-react';
import { useGlobalSound } from '@/hooks/useGlobalSound';

interface Unit {
  id: string;
  name: string;
  active: boolean;
}

interface UnitSelectorProps {
  units: Unit[];
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const UnitSelector = ({
  units,
  selectedUnit,
  onSelectUnit,
  isOpen,
  onToggle,
}: UnitSelectorProps) => {
  const { playClick } = useGlobalSound();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="w-full"
    >
      {/* Section header */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <Building2 className="w-4 h-4 text-slate-500" />
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Unidade Socioeducativa
        </span>
      </div>

      {/* Selector button */}
      <motion.button
        onClick={() => {
          playClick();
          onToggle();
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`
          w-full p-4 rounded-2xl
          bg-gradient-to-br from-slate-800/80 to-slate-900/80
          border border-slate-700/50
          backdrop-blur-xl
          transition-all duration-300
          ${isOpen ? 'border-primary/40 shadow-lg shadow-primary/10' : 'hover:border-slate-600/80'}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/20">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white text-sm">{selectedUnit}</p>
              <p className="text-xs text-slate-500">Sistema Ativo</p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-slate-500" />
          </motion.div>
        </div>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-2 overflow-hidden"
          >
            <div className="p-2 rounded-2xl bg-slate-800/90 border border-slate-700/50 backdrop-blur-xl space-y-1">
              {units.filter(u => u.active).map((unit, index) => (
                <motion.button
                  key={unit.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    playClick();
                    onSelectUnit(unit.name);
                  }}
                  className={`
                    w-full p-3 rounded-xl flex items-center justify-between
                    transition-all duration-200
                    ${selectedUnit === unit.name 
                      ? 'bg-primary/15 border border-primary/30' 
                      : 'hover:bg-slate-700/50 border border-transparent'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className={`w-4 h-4 ${selectedUnit === unit.name ? 'text-primary' : 'text-slate-500'}`} />
                    <span className={`text-sm ${selectedUnit === unit.name ? 'font-medium text-primary' : 'text-slate-300'}`}>
                      {unit.name}
                    </span>
                  </div>
                  {selectedUnit === unit.name && (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UnitSelector;
