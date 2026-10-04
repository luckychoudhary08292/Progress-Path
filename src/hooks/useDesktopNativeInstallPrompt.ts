import { useEffect } from 'react';

/**
 * useDesktopNativeInstallPrompt
 * 
 * Exclusively triggers the native browser pop-up dialog (e.g. Chrome/Edge native "Install app?")
 * for desktop visitors, without rendering any custom HTML modal, banner, or icon in the website.
 * Completely disabled on mobile devices.
 */
export function useDesktopNativeInstallPrompt() {
  useEffect(() => {
    // 1. Strictly ignore mobile devices (no action on mobile)
    const userAgent = (window.navigator.userAgent || '').toLowerCase();
    const isMobile =
      /iphone|ipad|ipod|android|mobile|blackberry|iemobile|kindle|silk/.test(userAgent) ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      window.innerWidth < 768;

    if (isMobile) {
      return;
    }

    // 2. Ignore if already running as installed standalone app
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return;
    }

    // 3. Listen for the native beforeinstallprompt event on desktop
    let deferredPrompt: any = null;

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser default silent banner
      e.preventDefault();
      deferredPrompt = e;

      // Check if browser native prompt was already shown this session
      const alreadyPrompted = sessionStorage.getItem('desktop_native_prompt_shown');
      if (alreadyPrompted) {
        return;
      }

      const handleUserGesture = async () => {
        window.removeEventListener('click', handleUserGesture);
        if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
          try {
            sessionStorage.setItem('desktop_native_prompt_shown', 'true');
            await deferredPrompt.prompt();
            await deferredPrompt.userChoice;
          } catch {
            // Silently ignore if already dismissed or unsupported
          } finally {
            deferredPrompt = null;
          }
        }
      };

      // In modern browsers, calling .prompt() requires a user gesture (click)
      window.addEventListener('click', handleUserGesture, { once: true });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
}

export default useDesktopNativeInstallPrompt;
