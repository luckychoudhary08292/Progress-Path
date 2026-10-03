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
      // Prevent automatic silent suppression so we can trigger the native browser dialog
      e.preventDefault();
      deferredPrompt = e;

      // Check if browser native prompt was already shown this session
      const alreadyPrompted = sessionStorage.getItem('desktop_native_prompt_shown');
      if (alreadyPrompted) {
        return;
      }

      sessionStorage.setItem('desktop_native_prompt_shown', 'true');

      // Trigger the browser's own native dialog after a brief moment on the website
      setTimeout(async () => {
        if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
          try {
            await deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;
            deferredPrompt = null;
          } catch (err) {
            // Silently catch if browser requires user gesture
            console.debug('Native browser install prompt status:', err);
          }
        }
      }, 1000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
}

export default useDesktopNativeInstallPrompt;
