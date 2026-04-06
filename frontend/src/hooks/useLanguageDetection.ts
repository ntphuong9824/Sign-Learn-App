import { useState, useCallback } from 'react';

// Language detection using CLD3
// In production, use compact-language-detect library

interface UseLanguageDetectionReturn {
  detectedLanguage: string | null;
  isDetecting: boolean;
  confidence: number;
  detectLanguage: (text: string) => Promise<string>;
}

// Common language code mappings
const LANGUAGE_CODES: Record<string, string> = {
  en: 'English',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  he: 'Hebrew',
};

// Simple heuristic-based detection (placeholder for CLD3)
function heuristicDetect(text: string): { lang: string; confidence: number } {
  const lowerText = text.toLowerCase();

  // Check for common words
  const patterns: [RegExp, string][] = [
    [/\b(the|is|are|was|were|have|has|had|do|does|did|will|would|could|should)\b/i, 'en'],
    [/\b(der|die|das|ist|war|sind|haben|werden|kann)\b/i, 'de'],
    [/\b(le|la|les|est|sont|avec|pour|dans|sur)\b/i, 'fr'],
    [/\b(el|la|los|las|es|son|con|para|una)\b/i, 'es'],
    [/\b(il|lo|gli|le|e|con|per|una|del)\b/i, 'it'],
    [/\b(o|a|os|as|e|com|para|uma)\b/i, 'pt'],
    [/\b(и|в|не|на|я|быть|это)\b/i, 'ru'],
    [/\b(的|是|在|我|有|和|就|不)\b/i, 'zh'],
    [/\b(は|が|の|に|を|と|で|です)\b/i, 'ja'],
    [/\b(이|는|의|에|를|과|와|합니다)\b/i, 'ko'],
  ];

  for (const [pattern, lang] of patterns) {
    if (pattern.test(lowerText)) {
      return { lang, confidence: 0.7 };
    }
  }

  return { lang: 'en', confidence: 0.3 };
}

export function useLanguageDetection(): UseLanguageDetectionReturn {
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [confidence, setConfidence] = useState(0);

  const detectLanguage = useCallback(async (text: string): Promise<string> => {
    if (!text || text.trim().length < 3) {
      return 'en';
    }

    setIsDetecting(true);

    try {
      const result = heuristicDetect(text);
      setDetectedLanguage(result.lang);
      setConfidence(result.confidence);

      if (LANGUAGE_CODES[result.lang]) {
        return result.lang;
      }

      return 'en';
    } finally {
      setIsDetecting(false);
    }
  }, []);

  return {
    detectedLanguage,
    isDetecting,
    confidence,
    detectLanguage,
  };
}

export { LANGUAGE_CODES };