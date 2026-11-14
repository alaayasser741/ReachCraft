import React, { useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';

interface Props {
  onSuccess: (credential: string) => void;
  onError?: (err: any) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleSignInButton: React.FC<Props> = ({ onSuccess, onError, disabled }) => {
  const { dir } = useTranslation();
  const buttonRef = useRef<HTMLDivElement>(null);
  const clientId =
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
    '474605180783-f001a9je2fo3h6u7ofejdn2q82pdeo42.apps.googleusercontent.com';

  useEffect(() => {
    // Dynamically load Google Identity Services if not already present
    const existingScript = document.getElementById('google-jssdk');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-jssdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    } else if (window.google?.accounts?.id) {
      initializeGoogle();
    }

    function initializeGoogle() {
      if (!window.google?.accounts?.id || !buttonRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response.credential) {
              onSuccess(response.credential);
            } else if (onError) {
              onError(new Error('No credential received'));
            }
          },
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: buttonRef.current.clientWidth || 360,
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: dir === 'rtl' ? 'right' : 'left',
        });
      } catch (err) {
        if (onError) onError(err);
      }
    }
  }, [clientId, dir, onSuccess, onError]);

  return (
    <div className="w-full flex justify-center my-2">
      <div ref={buttonRef} className="w-full min-h-[44px] flex justify-center" />
    </div>
  );
};
