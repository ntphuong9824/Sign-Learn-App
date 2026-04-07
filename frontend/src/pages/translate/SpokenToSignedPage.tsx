import { useState } from 'react';
import { useSpokenToSigned } from '../../hooks/useTranslation';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { useSettingsStore } from '../../store/settingsStore';
import { SkeletonPoseViewer } from '../../components/translate/SkeletonPoseViewer';
import { HumanPoseViewer } from '../../components/translate/HumanPoseViewer';
import type { Landmark } from '../../types/translation';
import { SIGNED_LANGUAGES, SPOKEN_LANGUAGES } from '../../types/translation';

export function SpokenToSignedPage() {
  const [text, setText] = useState('');
  const [spokenLang, setSpokenLang] = useState('en');
  const [signedLang, setSignedLang] = useState('ase');

  const mutation = useSpokenToSigned();
  const { speak: speakText, isSpeaking } = useTextToSpeech({ lang: spokenLang });
  const { start: startSpeech, stop: stopSpeech, isListening: isSpeechListening, transcript, isSupported: isSpeechSupported } = useSpeechRecognition({ lang: spokenLang });

  const settings = useSettingsStore();
  const poseViewer = settings.poseViewer;

  const effectiveText = transcript?.trim() ? transcript : text;

  const handleTextChange = (newText: string) => {
    setText(newText);
  };

  const handleTranslate = () => {
    if (!effectiveText.trim()) return;
    mutation.mutate({ text: effectiveText, spoken: spokenLang, signed: signedLang });
  };

  const getPoseData = (): Landmark[][] => {
    if (!mutation.data?.poseData?.landmarks) return [];
    return mutation.data.poseData.landmarks;
  };

  const poseData = getPoseData();

  return (
    <div className="flex h-full min-h-[calc(100vh-60px)]">
      {/* Left Side - Input */}
      <div className="flex-1 flex flex-col p-4 border-r border-[var(--border)]">
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Spoken Language</label>
          <select
            value={spokenLang}
            onChange={(e) => setSpokenLang(e.target.value)}
            className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)]"
          >
            {SPOKEN_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 flex flex-col">
          <textarea
            value={effectiveText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Type or paste text to translate..."
            className="flex-1 w-full p-3 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            dir="auto"
          />
        </div>

        {/* Character count */}
        <div className="text-xs text-[var(--text)] opacity-60 mt-1 text-right">
          {effectiveText.length} / 5000
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          {/* Speech to Text */}
          {isSpeechSupported && (
            <button
              onClick={isSpeechListening ? stopSpeech : startSpeech}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
                isSpeechListening ? 'bg-red-500 text-white' : 'bg-[var(--accent)] text-white'
              }`}
              title="Speech to Text"
            >
              <span>🎤</span>
              Mic
            </button>
          )}

          {/* Text to Speech */}
          <button
            onClick={() => speakText(effectiveText)}
            disabled={!effectiveText || isSpeaking}
            className="flex items-center gap-1 px-3 py-1.5 bg-[var(--accent)] text-white rounded text-sm disabled:opacity-50"
            title="Text to Speech"
          >
            <span>🔊</span>
            Speak
          </button>

          <div className="flex-1" />

          {/* Translate Button */}
          <button
            onClick={handleTranslate}
            disabled={mutation.isPending || !effectiveText.trim()}
            className="px-6 py-1.5 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {mutation.isPending ? 'Translating...' : 'Translate'}
          </button>
        </div>
      </div>

      {/* Right Side - Output */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <label className="text-sm font-medium">Sign Language</label>
          <select
            value={signedLang}
            onChange={(e) => setSignedLang(e.target.value)}
            className="px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--bg)] text-sm"
          >
            {SIGNED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>

        {/* Pose Viewer - matches old design: white bg for small screens, gray for larger */}
        <div className="flex-1 relative flex items-center justify-center" style={{ backgroundColor: '#f5f5f5', aspectRatio: '1' }}>
          {/* Dark mode support */}
          <style>{`
            @media (prefers-color-scheme: dark) {
              .pose-viewer-bg { background-color: #202124; }
            }
          `}</style>

          {/* Light mode bg */}
          <div className="pose-viewer-bg absolute inset-0" style={{ backgroundColor: '#f5f5f5' }}></div>

          <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
            {mutation.isError && (
              <p className="text-red-500">Error: {(mutation.error as Error).message}</p>
            )}

            {mutation.isPending && (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--accent)] border-t-transparent"></div>
                <span className="text-sm text-gray-500">Translating...</span>
              </div>
            )}

            {/* Show pose data when available */}
            {mutation.isSuccess && (mutation.data?.poseUrl || poseData.length > 0) && (
              <div className="w-full h-full max-w-[500px] max-h-[500px]">
                {mutation.data?.poseUrl ? (
                  <SkeletonPoseViewer src={mutation.data.poseUrl} />
                ) : (
                  <>
                    {poseViewer === 'skeleton' && (
                      <SkeletonPoseViewer landmarks={poseData} width={500} height={500} />
                    )}
                    {poseViewer === 'person' && (
                      <HumanPoseViewer landmarks={poseData} width={500} height={500} />
                    )}
                    {(poseViewer === 'avatar' || poseViewer === 'pose') && (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        Avatar view requires sprite assets
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Empty state */}
            {mutation.isSuccess && poseData.length === 0 && (
              <div className="flex items-center justify-center text-gray-500">
                Translation will appear here
              </div>
            )}

            {/* Initial state */}
            {!mutation.isSuccess && !mutation.isPending && !mutation.isError && (
              <div className="flex items-center justify-center text-gray-400 text-sm">
                Enter text and press Translate
              </div>
            )}
          </div>
        </div>

        {/* Action buttons - matching old design */}
        {mutation.isSuccess && poseData.length > 0 && (
          <div className="p-4 border-t border-[var(--border)]">
            <div className="flex gap-2 justify-center mb-3">
              <button
                className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-600 shadow-md hover:scale-105 transition-transform flex items-center justify-center"
                title="Download"
              >
                <span className="text-lg">📥</span>
              </button>
              <button
                className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-600 shadow-md hover:scale-105 transition-transform flex items-center justify-center"
                title="Share"
              >
                <span className="text-lg">📤</span>
              </button>
            </div>

            {/* Viewer selector */}
            <div className="flex gap-1 justify-center">
              <button
                onClick={() => settings.setSetting('poseViewer', 'skeleton')}
                className={`px-3 py-1 rounded text-xs ${
                  poseViewer === 'skeleton' ? 'bg-[var(--accent)] text-white' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                Skeleton
              </button>
              <button
                onClick={() => settings.setSetting('poseViewer', 'person')}
                className={`px-3 py-1 rounded text-xs ${
                  poseViewer === 'person' ? 'bg-[var(--accent)] text-white' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                Person
              </button>
              <button
                onClick={() => settings.setSetting('poseViewer', 'avatar')}
                className={`px-3 py-1 rounded text-xs ${
                  poseViewer === 'avatar' ? 'bg-[var(--accent)] text-white' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                Avatar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
