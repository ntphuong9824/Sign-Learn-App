import { useState, useEffect, useRef } from 'react';
import { useSpokenToSigned } from '../../hooks/useTranslation';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { useCamera } from '../../hooks/useCamera';
import { usePoseDetection } from '../../hooks/usePoseDetection';
import { SkeletonPoseViewer } from '../../components/translate/SkeletonPoseViewer';
import { PoseCanvas } from '../../components/PoseCanvas';
import { useSettingsStore } from '../../store/settingsStore';
import type { CombinedPoseResult } from '../../services/mediaPipeService';
import './TranslatePage.css';

interface TranslationHistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: Date;
}

interface SignedToSpokenResult {
  text: string;
  glosses: string[];
  timestamp: number;
}

const MAX_TEXT_LENGTH = 5000;
const MAX_POSE_FRAMES = 100;

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

const SIGN_LANGUAGE_CODES = ['ase', 'bfi', 'gsg', 'fsl', 'jsl', 'vnsl'];

const isSignLanguage = (code: string): boolean => {
  return SIGN_LANGUAGE_CODES.includes(code);
};

export function TranslatePage() {
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('ase');
  const [inputText, setInputText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);

  // Signed-to-spoken state
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [isProcessingSigned, setIsProcessingSigned] = useState(false);
  const [signedToSpokenResult, setSignedToSpokenResult] = useState<SignedToSpokenResult | null>(null);
  const [signedToSpokenError, setSignedToSpokenError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false); // Camera only active when user clicks
  const [uploadedVideoPose, setUploadedVideoPose] = useState<CombinedPoseResult | null>(null); // Pose from uploaded video

  // Circular buffer for pose history to avoid memory leaks
  const poseHistoryBufferRef = useRef<CombinedPoseResult[]>(new Array(MAX_POSE_FRAMES));
  const poseHistoryIndexRef = useRef(0);
  const poseHistoryCountRef = useRef(0);
  const [poseHistory, setPoseHistory] = useState<CombinedPoseResult[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);

  const spokenToSigned = useSpokenToSigned();
  const { isListening, isSupported: speechSupported, start, stop, transcript } = useSpeechRecognition({
    lang: sourceLanguage,
  });
  const { speak, isSpeaking } = useTextToSpeech({ lang: sourceLanguage });

  // Camera hook for signed-to-spoken
  const { isStreaming, error: cameraError, startCamera, stopCamera, videoRef: cameraVideoRef } = useCamera({
    facingMode: 'user',
    width: { min: 1280, ideal: 1280 },
    height: { min: 720, ideal: 720 },
    frameRate: 30,
  });

  // Pose detection hook for signed-to-spoken
  const { isModelLoaded, error: poseError, detectPose, detectPoseFromVideo, stopDetection, currentPose } = usePoseDetection({
    poseModelType: 'full',
    handsModelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    targetFps: 30,
  });

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

  // Stop camera when switching away from sign language
  useEffect(() => {
    if (!isSignLanguage(sourceLanguage)) {
      setIsCameraActive(false);
      stopCamera();
      stopDetection();
    }
  }, [sourceLanguage, stopCamera, stopDetection]);

  // Start pose detection when camera is active and source is sign language
  useEffect(() => {
    if (!isSignLanguage(sourceLanguage) || !isCameraActive) {
      return;
    }

    if (!isModelLoaded || !cameraVideoRef.current) {
      return;
    }

    const video = cameraVideoRef.current;

    // Wait for video to have valid dimensions before starting detection
    const checkVideoReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        detectPoseFromVideo(video, (pose) => {
          // Use circular buffer to avoid creating new arrays every frame
          const buffer = poseHistoryBufferRef.current;
          const index = poseHistoryIndexRef.current;

          // Store pose in circular buffer
          buffer[index] = pose;

          // Update index (wrap around)
          poseHistoryIndexRef.current = (index + 1) % MAX_POSE_FRAMES;

          // Update count (up to max)
          if (poseHistoryCountRef.current < MAX_POSE_FRAMES) {
            poseHistoryCountRef.current++;
          }

          // Update state with current buffer contents
          setPoseHistory(() => {
            if (poseHistoryCountRef.current < MAX_POSE_FRAMES) {
              // Buffer not full yet, return slice from 0 to count
              return buffer.slice(0, poseHistoryCountRef.current);
            }
            // Buffer full, return reordered array (oldest first)
            const result = new Array(MAX_POSE_FRAMES);
            for (let i = 0; i < MAX_POSE_FRAMES; i++) {
              result[i] = buffer[(index + i) % MAX_POSE_FRAMES];
            }
            return result;
          });
        });
      }
    };

    // Check immediately and also listen for loadeddata event
    checkVideoReady();
    video.addEventListener('loadeddata', checkVideoReady);

    return () => {
      video.removeEventListener('loadeddata', checkVideoReady);
      stopDetection();
    };
  }, [sourceLanguage, isModelLoaded, cameraVideoRef, detectPoseFromVideo, stopDetection]);

  // Cleanup object URL on unmount or when video changes
  useEffect(() => {
    return () => {
      if (uploadedVideo) {
        URL.revokeObjectURL(uploadedVideo);
      }
    };
  }, [uploadedVideo]);

  // Run pose detection on uploaded video
  useEffect(() => {
    if (!uploadedVideo || !videoRef.current || !isModelLoaded) {
      return;
    }

    const video = videoRef.current;
    let animationFrameId: number | null = null;
    let isProcessing = true;

    const processVideoFrame = async () => {
      if (!isProcessing || video.paused || video.ended) {
        return;
      }

      try {
        const pose = await detectPose(video);
        if (pose && isProcessing) {
          setUploadedVideoPose(pose);
        }
      } catch (error) {
        console.error('Error detecting pose from uploaded video:', error);
      }

      if (isProcessing && !video.paused && !video.ended) {
        animationFrameId = requestAnimationFrame(processVideoFrame);
      }
    };

    // Start processing when video is ready
    const handleVideoPlay = () => {
      isProcessing = true;
      processVideoFrame();
    };

    const handleVideoPause = () => {
      isProcessing = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    const handleVideoEnded = () => {
      isProcessing = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    video.addEventListener('play', handleVideoPlay);
    video.addEventListener('pause', handleVideoPause);
    video.addEventListener('ended', handleVideoEnded);

    // If video is already playing, start processing
    if (!video.paused) {
      processVideoFrame();
    }

    return () => {
      isProcessing = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      video.removeEventListener('play', handleVideoPlay);
      video.removeEventListener('pause', handleVideoPause);
      video.removeEventListener('ended', handleVideoEnded);
    };
  }, [uploadedVideo, isModelLoaded, detectPose]);

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

  // Handle video file upload for signed-to-spoken
  const handleFileSelect = (file: File) => {
    // File validation constraints
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setSignedToSpokenError('Invalid file type. Please upload MP4, WebM, OGG, or MOV.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setSignedToSpokenError('File too large. Maximum size is 100MB.');
      return;
    }

    // Stop camera and detection when uploading video
    if (isStreaming) {
      setIsCameraActive(false);
      stopCamera();
      stopDetection();
    }

    // Revoke previous URL if exists
    if (uploadedVideo) {
      URL.revokeObjectURL(uploadedVideo);
    }

    const url = URL.createObjectURL(file);
    setUploadedVideo(url);

    // Reset circular buffer
    poseHistoryBufferRef.current = new Array(MAX_POSE_FRAMES);
    poseHistoryIndexRef.current = 0;
    poseHistoryCountRef.current = 0;
    setPoseHistory([]);

    setSignedToSpokenResult(null);
    setSignedToSpokenError(null);
  };

  // Toggle camera on/off
  const handleToggleCamera = async () => {
    if (isStreaming) {
      setIsCameraActive(false);
      stopCamera();
      stopDetection();
    } else {
      setIsCameraActive(true);
      await startCamera();
    }
  };

  // Start camera when clicking on video area
  const handleVideoAreaClick = async () => {
    if (!isStreaming && !uploadedVideo && isSignLanguage(sourceLanguage)) {
      setIsCameraActive(true);
      await startCamera();
    }
  };

  // Handle signed-to-spoken translation
  const handleSignedToSpokenTranslate = async () => {
    if (poseHistory.length === 0) {
      return;
    }

    setIsProcessingSigned(true);
    setSignedToSpokenError(null);

    try {
      // TODO: Send pose data to backend for translation
      // For now, use placeholder result
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSignedToSpokenResult({
        text: 'Hello, how are you?',
        glosses: ['HELLO', 'YOU', 'HOW'],
        timestamp: Date.now(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Translation failed';
      setSignedToSpokenError(errorMessage);
      console.error('Signed-to-spoken translation error:', error);
    } finally {
      setIsProcessingSigned(false);
    }
  };

  const handleTranslate = () => {
    if (isSignLanguage(sourceLanguage)) {
      // Signed-to-spoken translation
      handleSignedToSpokenTranslate();
    } else if (inputText.trim()) {
      // Spoken-to-signed translation
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
                  // Video input for sign language (signed-to-spoken)
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-muted rounded-lg overflow-hidden relative">
                    {!uploadedVideo ? (
                      <>
                        {/* Hidden video element for MediaPipe */}
                        <video
                          ref={cameraVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="hidden"
                        />

                        {/* Canvas for visualization - clickable to start camera */}
                        <div
                          onClick={handleVideoAreaClick}
                          className="w-full h-full rounded-lg bg-black relative cursor-pointer"
                        >
                          <PoseCanvas
                            pose={currentPose}
                            width={640}
                            height={480}
                            drawVideo={isStreaming}
                            drawPose={isStreaming}
                            videoElement={cameraVideoRef.current}
                            className="w-full h-full rounded-lg"
                          />

                          {/* Start camera overlay when not streaming */}
                          {!isStreaming && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                              <svg className="w-16 h-16 text-white mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <p className="text-white text-sm font-medium">Click to start camera</p>
                            </div>
                          )}
                        </div>

                        {/* Status overlay */}
                        {isStreaming && (
                          <div className="absolute top-4 left-4 flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-green-500/90 text-white px-3 py-1 rounded-full">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                              <span className="text-sm font-medium">Live</span>
                            </div>
                          </div>
                        )}

                        {/* Error overlay */}
                        {cameraError && (
                          <div className="absolute bottom-4 left-4 right-4 bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg">
                            <p className="text-sm">{cameraError}</p>
                          </div>
                        )}

                        {/* Pose error overlay */}
                        {poseError && (
                          <div className="absolute bottom-4 left-4 right-4 bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg">
                            <p className="text-sm">Pose Error: {poseError}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      // Uploaded video with pose detection
                      <div className="w-full h-full relative">
                        {/* Video element for playback and controls */}
                        <video
                          ref={videoRef}
                          src={uploadedVideo}
                          autoPlay={false}
                          controls={true}
                          className="w-full h-full object-cover rounded-lg"
                        />

                        {/* Canvas overlay for pose visualization */}
                        {uploadedVideoPose && (
                          <div className="absolute inset-0 pointer-events-none">
                            <PoseCanvas
                              pose={uploadedVideoPose}
                              width={640}
                              height={480}
                              drawVideo={false}
                              drawPose={true}
                              videoElement={videoRef.current}
                              mirror={false}
                              className="w-full h-full rounded-lg"
                            />
                          </div>
                        )}

                        {/* Status overlay */}
                        {uploadedVideoPose && (
                          <div className="absolute top-4 left-4 flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-blue-500/90 text-white px-3 py-1 rounded-full">
                              <span className="text-sm font-medium">Video Analysis</span>
                            </div>
                          </div>
                        )}
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
                        onClick={handleToggleCamera}
                        className={`p-2 rounded-lg transition-colors ${
                          isStreaming
                            ? 'bg-destructive text-destructive-foreground'
                            : 'hover:bg-accent text-muted-foreground'
                        }`}
                        aria-label="Toggle camera"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <label className="p-2 hover:bg-accent rounded-lg transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file);
                          }}
                          className="hidden"
                        />
                        <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </label>
                      <span className="text-sm text-muted-foreground">
                        Frames: {poseHistory.length}
                      </span>
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
                <span className="text-sm text-muted-foreground">
                  {isSignLanguage(sourceLanguage) ? '' : `${inputText.length} / ${MAX_TEXT_LENGTH}`}
                </span>
              </div>
            </div>

            {/* Output Panel */}
            <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
              <div className="flex-1 p-6">
                {isSignLanguage(targetLanguage) ? (
                  // Video output for sign language (spoken-to-signed)
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
                  // Text output for spoken language (signed-to-spoken)
                  <div className="h-full min-h-[300px]">
                    {isProcessingSigned ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
                        <span className="text-sm text-muted-foreground">Processing sign language...</span>
                      </div>
                    ) : signedToSpokenError ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center">
                          <span className="text-4xl">⚠️</span>
                        </div>
                        <p className="text-destructive text-center">{signedToSpokenError}</p>
                        <button
                          onClick={() => setSignedToSpokenError(null)}
                          className="px-4 py-2 bg-input-background hover:bg-accent border border-border rounded-lg transition-colors text-sm"
                        >
                          Dismiss
                        </button>
                      </div>
                    ) : signedToSpokenResult ? (
                      <div className="space-y-4">
                        {/* Translated text */}
                        <div className="p-4 bg-input-background rounded-lg">
                          <div className="text-xs text-muted-foreground mb-2">Spoken Text</div>
                          <p className="text-lg text-foreground">{signedToSpokenResult.text}</p>
                        </div>

                        {/* Glosses */}
                        {signedToSpokenResult.glosses.length > 0 && (
                          <div className="p-4 bg-input-background rounded-lg">
                            <div className="text-xs text-muted-foreground mb-2">Detected Signs (Gloss)</div>
                            <div className="flex flex-wrap gap-2">
                              {signedToSpokenResult.glosses.map((gloss, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-accent rounded-full text-sm"
                                >
                                  {gloss}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className="text-xs text-muted-foreground">
                          Translated at: {new Date(signedToSpokenResult.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ) : inputText ? (
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
                      if (isSignLanguage(targetLanguage) && inputText) {
                        navigator.clipboard.writeText(inputText);
                      } else if (signedToSpokenResult?.text) {
                        navigator.clipboard.writeText(signedToSpokenResult.text);
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
                      onClick={() => speak(signedToSpokenResult?.text || inputText)}
                      disabled={(!signedToSpokenResult?.text && !inputText) || isSpeaking}
                      className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
                      aria-label="Text to speech"
                    >
                      <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                  )}
                </div>
                {(inputText || poseHistory.length > 0) && (
                  <button
                    onClick={handleTranslate}
                    disabled={spokenToSigned.isPending || isProcessingSigned}
                    className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {spokenToSigned.isPending || isProcessingSigned ? 'Translating...' : 'Translate'}
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
