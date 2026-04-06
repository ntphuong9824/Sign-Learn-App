import { useState, useCallback, useEffect } from 'react';

interface UseTextToSpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface UseTextToSpeechReturn {
  speak: (text: string) => void;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
}

export function useTextToSpeech({
  lang = 'en',
  rate = 1,
  pitch = 1,
  volume = 1,
}: UseTextToSpeechOptions = {}): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  const getVoice = useCallback(() => {
    const voice = voices.find((v) => v.lang.startsWith(lang));
    return voice || voices[0];
  }, [voices, lang]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      const selectedVoice = getVoice();
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, lang, rate, pitch, volume, getVoice]
  );

  const cancel = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const pause = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.pause();
    }
  }, [isSupported]);

  const resume = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.resume();
    }
  }, [isSupported]);

  return {
    speak,
    cancel,
    pause,
    resume,
    isSpeaking,
    isSupported,
    voices,
  };
}