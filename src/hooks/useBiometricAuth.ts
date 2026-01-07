import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface BiometricCredential {
  cpf: string;
  credentialId: string;
}

export const useBiometricAuth = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Check if WebAuthn is supported
    const supported = window.PublicKeyCredential !== undefined &&
      typeof window.PublicKeyCredential === 'function';
    setIsSupported(supported);

    // Check if user has registered biometric
    const savedCredential = localStorage.getItem('plantao_biometric_credential');
    setIsRegistered(!!savedCredential);
  }, []);

  // Generate a random challenge
  const generateChallenge = (): ArrayBuffer => {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return array.buffer as ArrayBuffer;
  };

  // Convert ArrayBuffer to Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return window.btoa(binary);
  };

  // Convert Base64 to ArrayBuffer
  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Register biometric credential
  const registerBiometric = useCallback(async (cpf: string): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Biometria não suportada neste dispositivo');
      return false;
    }

    try {
      const challenge = generateChallenge();
      const userId = new TextEncoder().encode(cpf);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'PlantãoPro',
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: cpf,
          displayName: `Agente ${cpf.slice(-4)}`,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (credential) {
        const biometricData: BiometricCredential = {
          cpf,
          credentialId: arrayBufferToBase64(credential.rawId),
        };

        localStorage.setItem('plantao_biometric_credential', JSON.stringify(biometricData));
        setIsRegistered(true);
        toast.success('Biometria cadastrada com sucesso!');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao registrar biometria:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('Permissão negada para biometria');
        } else if (error.name === 'NotSupportedError') {
          toast.error('Biometria não suportada');
        } else {
          toast.error('Erro ao cadastrar biometria');
        }
      }
      return false;
    }
  }, [isSupported]);

  // Authenticate with biometric
  const authenticateWithBiometric = useCallback(async (): Promise<{ success: boolean; cpf?: string }> => {
    if (!isSupported || !isRegistered) {
      return { success: false };
    }

    setIsAuthenticating(true);

    try {
      const savedCredentialStr = localStorage.getItem('plantao_biometric_credential');
      if (!savedCredentialStr) {
        return { success: false };
      }

      const savedCredential: BiometricCredential = JSON.parse(savedCredentialStr);
      const challenge = generateChallenge();

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [{
          type: 'public-key',
          id: base64ToArrayBuffer(savedCredential.credentialId),
          transports: ['internal'],
        }],
        userVerification: 'required',
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (assertion) {
        toast.success('Autenticação biométrica bem-sucedida!');
        return { success: true, cpf: savedCredential.cpf };
      }

      return { success: false };
    } catch (error) {
      console.error('Erro na autenticação biométrica:', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error('Autenticação cancelada');
      } else {
        toast.error('Falha na autenticação biométrica');
      }
      return { success: false };
    } finally {
      setIsAuthenticating(false);
    }
  }, [isSupported, isRegistered]);

  // Remove biometric registration
  const removeBiometric = useCallback(() => {
    localStorage.removeItem('plantao_biometric_credential');
    setIsRegistered(false);
    toast.success('Biometria removida');
  }, []);

  return {
    isSupported,
    isRegistered,
    isAuthenticating,
    registerBiometric,
    authenticateWithBiometric,
    removeBiometric,
  };
};
