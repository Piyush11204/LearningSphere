import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, X, CheckCircle } from 'lucide-react';

const InstallPWA = ({ className = "" }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }

      // iOS detection
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const iPadOS = navigator.userAgent.includes("Mac") && "ontouchend" in document;
      setIsIOS(iOS || iPadOS);

      // Android detection
      setIsAndroid(/Android/.test(navigator.userAgent));
    };

    checkInstalled();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const dismissPrompt = () => {
    setShowInstallPrompt(false);
  };

  // Don't show if already installed
  if (isInstalled) {
    return (
      <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm font-medium">App Installed</span>
      </div>
    );
  }

  // iOS install instructions
  if (isIOS && !isInstalled) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <button
          onClick={() => setShowInstallPrompt(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">Install App</span>
        </button>

        {showInstallPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Install Growora</h3>
                <button onClick={dismissPrompt} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">iOS Installation</p>
                    <p className="text-sm text-gray-600">Tap the share button and select "Add to Home Screen"</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Tap the share button <span className="text-blue-600">⬆️</span> in Safari</li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" to confirm</li>
                  </ol>
                </div>
              </div>

              <button
                onClick={dismissPrompt}
                className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Android install button
  if (isAndroid && deferredPrompt) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <button
          onClick={handleInstall}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">Install App</span>
        </button>
      </div>
    );
  }

  // Desktop download option
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={() => window.open('https://growora.com/download', '_blank')}
        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <Monitor className="w-4 h-4" />
        <span className="text-sm font-medium">Download</span>
      </button>
    </div>
  );
};

export default InstallPWA;