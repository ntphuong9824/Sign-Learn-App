import { useState, useCallback, useEffect, useRef } from 'react';

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

interface UseSpeechRecognitionReturn {
  transcript: string;
  isListening: boolean;
  error: string | null;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
}

// Define SpeechRecognition type for TypeScript
interface SpeechRecognitionType {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export function useSpeechRecognition({
  lang = 'en',
  continuous = false,
  interimResults = true,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  // Check browser support
  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionClass = (globalThis as unknown as { SpeechRecognition?: new () => SpeechRecognitionType; webkitSpeechRecognition?: new () => SpeechRecognitionType })
      .SpeechRecognition || (globalThis as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionType }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onresult = (event: unknown) => {
      const e = event as { results: { isFinal: boolean; 0: { transcript: string } }[]; resultIndex: number };
      let finalTranscript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript((prev) => prev + ' ' + finalTranscript);
      }
    };

    recognition.onerror = (event: unknown) => {
      const e = event as { error?: string };
      setError(e.error || 'Unknown error');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [isSupported, lang, continuous, interimResults]);

  const start = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError('Speech recognition not supported');
      return;
    }

    setError(null);
    setTranscript('');
    setIsListening(true);

    try {
      recognitionRef.current.start();
    } catch (e) {
      setError((e as Error).message);
      setIsListening(false);
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return {
    transcript: transcript.trim(),
    isListening,
    error,
    isSupported,
    start,
    stop,
  };
}