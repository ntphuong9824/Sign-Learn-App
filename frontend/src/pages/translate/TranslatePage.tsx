import { useState, useEffect, useRef } from 'react';
import { useSpokenToSigned } from '../../hooks/useTranslation';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { SkeletonPoseViewer } from '../../components/translate/SkeletonPoseViewer';
import { useSettingsStore } from '../../store/settingsStore';
import './TranslatePage.css';

interface TranslationHistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: Date;
}

const MAX_TEXT_LENGTH = 5000;

const SPOKEN_TO_SIGN_COMPAT: Record<string, string[]> = {
  en: ['ase', 'bfi'],
  vi: ['vnsl'],
  de: ['gsg'],
  fr: ['fsl'],
  ja: ['jsl'],
};

const SIGN_TO_SPOKEN_COMPAT: Record<string, string[]> = {
  ase: ['en'],
  bfi: ['en'],
  gsg: ['de'],
  fsl: ['fr'],
  jsl: ['ja'],
  vnsl: ['vi'],
};

const QUICK_PHRASES_BY_SPOKEN: Record<string, string[]> = {
  en: ['Hello', 'Thank you', 'Good morning', 'How are you?', 'Nice to meet you', 'I need help'],
  de: ['Hallo', 'Danke', 'Guten Morgen', 'Wie geht es dir?', 'Freut mich', 'Ich brauche Hilfe'],
  fr: ['Bonjour', 'Merci', 'Bon matin', 'Comment ca va ?', 'Ravi de vous rencontrer', "J'ai besoin d'aide"],
  ja: ['こんにちは', 'ありがとう', 'おはよう', 'お元気ですか', 'はじめまして', '助けが必要です'],
  vi: ['Xin chào', 'Cảm ơn', 'Chào buổi sáng', 'Bạn khoẻ không?', 'Rất vui được gặp bạn', 'Tôi cần giúp đỡ'],
};

export function TranslatePage() {
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('ase');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const spokenToSigned = useSpokenToSigned();
  const { isListening, isSupported: speechSupported, start, stop, transcript } = useSpeechRecognition({
    lang: sourceLanguage,
  });
  const { speak, isSpeaking } = useTextToSpeech({ lang: sourceLanguage });

  const settings = useSettingsStore();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ja', name: '日本語' },
  ];

  const signLanguages = [
    { code: 'ase', name: 'American Sign Language (ASL)' },
    { code: 'bfi', name: 'British Sign Language (BSL)' },
    { code: 'gsg', name: 'German Sign Language (DGS)' },
    { code: 'fsl', name: 'French Sign Language (LSF)' },
    { code: 'jsl', name: 'Japanese Sign Language (JSL)' },
    { code: 'vnsl', name: 'Vietnamese Sign Language (VNSL)' },
  ];

  // Dark mode effect
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Webcam effect
  useEffect(() => {
    if (isRecording && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((mediaStream) => {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch((err) => {
          console.error('Error accessing webcam:', err);
          setIsRecording(false);
        });
    } else if (!isRecording && stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [isRecording]);

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Transcript effect
  useEffect(() => {
    if (transcript) {
      setInputText((current) => (current ? `${current} ${transcript}`.trim() : transcript));
    }
  }, [transcript]);

  const getTargetOptionsForSource = (sourceCode: string) => {
    const sourceIsSign = signLanguages.some((lang) => lang.code === sourceCode);

    if (sourceIsSign) {
      const allowedSpoken = SIGN_TO_SPOKEN_COMPAT[sourceCode];
      return allowedSpoken && allowedSpoken.length > 0
        ? languages.filter((lang) => allowedSpoken.includes(lang.code))
        : languages;
    }

    const allowedSigns = SPOKEN_TO_SIGN_COMPAT[sourceCode];
    return allowedSigns && allowedSigns.length > 0
      ? signLanguages.filter((lang) => allowedSigns.includes(lang.code))
      : signLanguages;
  };

  const getValidTargetForSource = (sourceCode: string, preferredTarget: string) => {
    const options = getTargetOptionsForSource(sourceCode);
    if (options.some((lang) => lang.code === preferredTarget)) {
      return preferredTarget;
    }
    return options[0]?.code ?? preferredTarget;
  };

  const handleSwapLanguages = () => {
    const nextSource = targetLanguage;
    const nextTarget = getValidTargetForSource(nextSource, sourceLanguage);
    setSourceLanguage(nextSource);
    setTargetLanguage(nextTarget);
  };

  const handleCameraToggle = () => {
    setIsRecording(!isRecording);
  };

  const handleTranslate = () => {
    if (inputText.trim()) {
      const newHistoryItem: TranslationHistoryItem = {
        id: Date.now().toString(),
        sourceText: inputText,
        translatedText: `${inputText} (translated)`,
        sourceLang: sourceLanguage,
        targetLang: targetLanguage,
        timestamp: new Date(),
      };
      setHistory([newHistoryItem, ...history]);

      // Call actual translation API
      void spokenToSigned.mutate({ text: inputText, spoken: sourceLanguage, signed: targetLanguage });
    }
  };

  const handleHistoryItemClick = (item: TranslationHistoryItem) => {
    setInputText(item.sourceText);
    setSourceLanguage(item.sourceLang);
    setTargetLanguage(item.targetLang);
    setShowHistory(false);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const isSignLanguage = (code: string) => {
    return signLanguages.some(sl => sl.code === code);
  };

  const targetOptions = getTargetOptionsForSource(sourceLanguage);

  const quickPhraseLanguageCode = isSignLanguage(sourceLanguage)
    ? (SIGN_TO_SPOKEN_COMPAT[sourceLanguage]?.[0] ?? 'en')
    : sourceLanguage;

  const quickPhrases = QUICK_PHRASES_BY_SPOKEN[quickPhraseLanguageCode] ?? QUICK_PHRASES_BY_SPOKEN.en;

  return (
    <div className="w-full min-h-screen bg-background flex flex-col relative overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="w-full flex items-center justify-between">
          <h1 className="text-primary">Sign Language Translator</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 hover:bg-accent rounded-lg transition-colors relative"
              aria-label="Toggle history"
            >
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {history.length}
                </span>
              )}
            </button>
            <button
              onClick={() => settings.setSetting('darkMode', !settings.darkMode)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Toggle dark mode"
            >
              {settings.darkMode ? (
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* History Sidebar */}
      {showHistory && (
        <div className="absolute top-0 right-0 bottom-0 w-80 bg-card border-l border-border shadow-lg z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold">Translation History</h2>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 hover:bg-accent rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center mt-8">No translation history yet</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleHistoryItemClick(item)}
                    className="w-full text-left p-3 bg-input-background hover:bg-accent border border-border rounded-lg transition-colors"
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {item.sourceLang.toUpperCase()} → {item.targetLang.toUpperCase()}
                    </div>
                    <div className="text-sm text-foreground mb-1 truncate">{item.sourceText}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.timestamp.toLocaleTimeString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="w-full p-6">
          {/* Language Selectors Row */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <select
                value={sourceLanguage}
                onChange={(e) => {
                  const nextSource = e.target.value;
                  setSourceLanguage(nextSource);
                  setTargetLanguage((current) => getValidTargetForSource(nextSource, current));
                }}
                className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <optgroup label="Spoken Languages">
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Sign Languages">
                  {signLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <button
              onClick={handleSwapLanguages}
              className="p-3 bg-input-background hover:bg-accent border border-border rounded-lg transition-colors"
              aria-label="Swap languages"
            >
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>

            <div className="flex-1">
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {targetOptions.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Translation Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Input Panel */}
            <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
              <div className="flex-1 p-6">
                {isSignLanguage(sourceLanguage) ? (
                  // Video input for sign language
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-muted rounded-lg overflow-hidden relative">
                    {isRecording ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive/90 text-destructive-foreground px-3 py-1 rounded-full">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium">Recording</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-muted-foreground">Click camera to start recording</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Text input for spoken language
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter text to translate..."
                    className="w-full h-full min-h-[300px] bg-transparent resize-none focus:outline-none text-foreground placeholder:text-muted-foreground"
                  />
                )}
              </div>

              {/* Input Actions */}
              <div className="border-t border-border px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSignLanguage(sourceLanguage) ? (
                    <>
                      <button
                        onClick={handleCameraToggle}
                        className={`p-2 rounded-lg transition-colors ${
                          isRecording
                            ? 'bg-destructive text-destructive-foreground'
                            : 'hover:bg-accent text-muted-foreground'
                        }`}
                        aria-label="Toggle camera"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                        aria-label="Upload video"
                      >
                        <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      {speechSupported && (
                        <button
                          onClick={isListening ? stop : start}
                          className={`p-2 rounded-lg transition-colors ${
                            isListening
                              ? 'bg-destructive text-destructive-foreground'
                              : 'hover:bg-accent text-muted-foreground'
                          }`}
                          aria-label="Toggle microphone"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => speak(inputText)}
                        disabled={!inputText || isSpeaking}
                        className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
                        aria-label="Text to speech"
                      >
                        <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">{inputText.length} / {MAX_TEXT_LENGTH}</span>
              </div>
            </div>

            {/* Output Panel */}
            <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
              <div className="flex-1 p-6">
                {isSignLanguage(targetLanguage) ? (
                  // Video output for sign language
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-muted rounded-lg">
                    {spokenToSigned.isPending ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
                        <span className="text-sm text-muted-foreground">Translating...</span>
                      </div>
                    ) : spokenToSigned.isError ? (
                      <p className="text-destructive">Unable to translate. Please try again.</p>
                    ) : spokenToSigned.data?.poseUrl ? (
                      <SkeletonPoseViewer src={spokenToSigned.data.poseUrl} />
                    ) : spokenToSigned.data?.animationUrl ? (
                      <video
                        src={spokenToSigned.data.animationUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : inputText ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-48 h-48 bg-primary/5 rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-3 flex items-center justify-center">
                              <span className="text-2xl">🤟</span>
                            </div>
                            <p className="text-sm text-muted-foreground">Sign language animation</p>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm">Showing signs for: "{inputText}"</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Translation will appear here</p>
                    )}
                  </div>
                ) : (
                  // Text output for spoken language
                  <div className="h-full min-h-[300px]">
                    {inputText ? (
                      <p className="text-foreground">
                        {inputText} <span className="text-muted-foreground">(translated to {targetLanguage.toUpperCase()})</span>
                      </p>
                    ) : (
                      <p className="text-muted-foreground">Translation will appear here</p>
                    )}
                  </div>
                )}
              </div>

              {/* Output Actions */}
              <div className="border-t border-border px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (inputText) {
                        navigator.clipboard.writeText(inputText);
                      }
                    }}
                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                    aria-label="Copy translation"
                  >
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                    aria-label="Share translation"
                  >
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                  {!isSignLanguage(targetLanguage) && (
                    <button
                      onClick={() => speak(inputText)}
                      disabled={!inputText || isSpeaking}
                      className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
                      aria-label="Text to speech"
                    >
                      <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                  )}
                </div>
                {inputText && (
                  <button
                    onClick={handleTranslate}
                    disabled={spokenToSigned.isPending}
                    className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {spokenToSigned.isPending ? 'Translating...' : 'Translate'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6">
            <h3 className="text-muted-foreground mb-3">Quick phrases</h3>
            <div className="flex flex-wrap gap-2">
              {quickPhrases.map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => setInputText(phrase)}
                  className="px-4 py-2 bg-input-background hover:bg-accent border border-border rounded-full transition-colors text-sm"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4">
        <div className="w-full text-center text-sm text-muted-foreground">
          Translate between spoken languages and sign languages instantly
        </div>
      </footer>
    </div>
  );
}
