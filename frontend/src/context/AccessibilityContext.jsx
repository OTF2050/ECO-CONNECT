import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const AccessibilityContext = createContext(null);

const DEFAULT_SETTINGS = {
  fontScale: 1,
  letterSpacing: 0,      // 0 | 1 | 2
  wordSpacing: 0,        // 0 | 1 | 2
  saturation: 1,         // 0 (gray) .. 2 (vivid), 1 = normal
  colorBlind: 'none',    // none | protanopia | deuteranopia | tritanopia | grayscale
  highContrast: false,
  reduceMotion: false,
  dyslexiaFriendly: false,
  hideImages: false,
  tts: false,            // text-to-speech: read on click
  language: 'en',        // en | ar  (ar -> RTL)
};

const STORAGE_KEY = 'eco_a11y_settings';

function readStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(() => readStoredSettings());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty('--eco-font-scale', String(settings.fontScale));
    root.style.setProperty('--eco-letter-spacing', `${settings.letterSpacing * 0.04}em`);
    root.style.setProperty('--eco-word-spacing', `${settings.wordSpacing * 0.12}em`);
    root.style.setProperty('--eco-saturation', String(settings.saturation));

    root.classList.toggle('eco-high-contrast', settings.highContrast);
    root.classList.toggle('eco-reduced-motion', settings.reduceMotion);
    root.classList.toggle('eco-dyslexia', settings.dyslexiaFriendly);
    root.classList.toggle('eco-hide-images', settings.hideImages);
    root.classList.toggle('eco-spacing', settings.letterSpacing > 0 || settings.wordSpacing > 0);
    root.classList.toggle('eco-saturate', settings.saturation !== 1);

    // Colour-blindness filter
    ['protanopia', 'deuteranopia', 'tritanopia', 'grayscale'].forEach((c) =>
      root.classList.remove(`eco-cb-${c}`)
    );
    if (settings.colorBlind !== 'none') {
      root.classList.add(`eco-cb-${settings.colorBlind}`);
    }

    // Language / direction
    root.lang = settings.language;
    root.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
  }, [settings]);

  // Text-to-speech: read arbitrary text aloud
  const speak = useCallback((text) => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(String(text));
      utter.lang = settings.language === 'ar' ? 'ar-AE' : 'en-US';
      utter.rate = 0.97;
      window.speechSynthesis.speak(utter);
    } catch {
      /* speechSynthesis unavailable */
    }
  }, [settings.language]);

  const stopSpeaking = useCallback(() => {
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
  }, []);

  // When TTS is enabled, click any text to hear it
  useEffect(() => {
    if (!settings.tts) return;
    const handler = (e) => {
      if (e.target?.closest('button, a, input, textarea, select')) return;
      const text = e.target?.innerText || e.target?.textContent;
      if (text && text.trim().length > 1 && text.length < 600) {
        speak(text.trim());
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [settings.tts, speak]);

  const value = useMemo(() => ({
    settings,
    updateSettings: (patch) => setSettings((prev) => ({ ...prev, ...patch })),
    resetSettings: () => setSettings(DEFAULT_SETTINGS),
    speak,
    stopSpeaking,
    ar: settings.language === 'ar',
  }), [settings, speak, stopSpeaking]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return ctx;
}
