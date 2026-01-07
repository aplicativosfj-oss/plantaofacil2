import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ValidationResult {
  isChecking: boolean;
  isDuplicate: boolean;
  duplicateName: string | null;
  error: string;
}

// Hook para validar CPF de agente em tempo real
export function useAgentCpfValidation(cpf: string, debounceMs: number = 500): ValidationResult {
  const [isChecking, setIsChecking] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateName, setDuplicateName] = useState<string | null>(null);
  const [error, setError] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkCpf = useCallback(async (cpfValue: string) => {
    const digits = cpfValue.replace(/\D/g, '');
    
    // Reset states if CPF is incomplete
    if (!digits || digits.length < 11) {
      setIsDuplicate(false);
      setDuplicateName(null);
      setError('');
      return;
    }

    setIsChecking(true);

    try {
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('id, full_name')
        .eq('cpf', digits)
        .maybeSingle();

      if (existingAgent) {
        setIsDuplicate(true);
        setDuplicateName(existingAgent.full_name || 'outro agente');
        setError(`CPF já cadastrado para: ${existingAgent.full_name || 'outro agente'}`);
      } else {
        setIsDuplicate(false);
        setDuplicateName(null);
        setError('');
      }
    } catch (err) {
      console.error('Error checking CPF:', err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const digits = cpf.replace(/\D/g, '');
    
    if (digits && digits.length === 11) {
      timeoutRef.current = setTimeout(() => {
        checkCpf(cpf);
      }, debounceMs);
    } else {
      setIsDuplicate(false);
      setDuplicateName(null);
      setError('');
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [cpf, debounceMs, checkCpf]);

  return {
    isChecking,
    isDuplicate,
    duplicateName,
    error,
  };
}

// Hook para validar matrícula de agente em tempo real
export function useAgentRegistrationValidation(registration: string, debounceMs: number = 500): ValidationResult {
  const [isChecking, setIsChecking] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateName, setDuplicateName] = useState<string | null>(null);
  const [error, setError] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkRegistration = useCallback(async (regValue: string) => {
    const digits = regValue.replace(/\D/g, '');
    
    // Reset states if registration is incomplete (must be 9 digits)
    if (!digits || digits.length < 9) {
      setIsDuplicate(false);
      setDuplicateName(null);
      setError('');
      return;
    }

    setIsChecking(true);

    try {
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('id, full_name')
        .eq('registration_number', digits)
        .maybeSingle();

      if (existingAgent) {
        setIsDuplicate(true);
        setDuplicateName(existingAgent.full_name || 'outro agente');
        setError(`Matrícula já cadastrada para: ${existingAgent.full_name || 'outro agente'}`);
      } else {
        setIsDuplicate(false);
        setDuplicateName(null);
        setError('');
      }
    } catch (err) {
      console.error('Error checking registration:', err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const digits = registration.replace(/\D/g, '');
    
    if (digits && digits.length === 9) {
      timeoutRef.current = setTimeout(() => {
        checkRegistration(registration);
      }, debounceMs);
    } else {
      setIsDuplicate(false);
      setDuplicateName(null);
      setError('');
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [registration, debounceMs, checkRegistration]);

  return {
    isChecking,
    isDuplicate,
    duplicateName,
    error,
  };
}
