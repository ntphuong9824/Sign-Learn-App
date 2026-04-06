import { useEffect, useMemo, useState } from 'react';
import { useSpokenToSigned } from '../../hooks/useTranslation';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { AvatarPoseViewer } from '../../components/translate/AvatarPoseViewer';
import { HumanPoseViewer } from '../../components/translate/HumanPoseViewer';
import { SkeletonPoseViewer } from '../../components/translate/SkeletonPoseViewer';
import { useSettingsStore } from '../../store/settingsStore';
import type { Landmark } from '../../types/translation';
import { SIGNED_LANGUAGES, SPOKEN_LANGUAGES } from '../../types/translation';
import './TranslatePage.css';

type TranslationMode = 'spoken-to-signed' | 'signed-to-spoken';
type SignedInputMode = 'webcam' | 'upload';

const MAX_TEXT_LENGTH = 5000;
const MOBILE_BREAKPOINT = 599;

type LanguagePair = {
  spoken: string;
  signed: string;
};

const SIGNED_TO_SPOKEN_MAP: Record<string, string> = {
  ase: 'en',
  gsg: 'de',
  fsl: 'fr',
  bfi: 'en',
  ils: 'he',
  sgg: 'de',
  ssr: 'ru',
  slf: 'fr',
  isr: 'he',
  ssp: 'es',
  csl: 'zh',
  nzs: 'en',
  fse: 'fr',
  asq: 'en',
  'gss-cy': 'cy',
  gss: 'en',
  icl: 'it',
  ise: 'it',
  jsl: 'ja',
  rsl: 'ru',
  svk: 'sk',
  aed: 'nl',
  ukl: 'uk',
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return isMobile;
}

export function TranslatePage() {
  const [mode, setMode] = useState<TranslationMode>('spoken-to-signed');
  const [signedInputMode, setSignedInputMode] = useState<SignedInputMode>('webcam');
  const [spokenLanguage, setSpokenLanguage] = useState('en');
  const [signedLanguage, setSignedLanguage] = useState('ase');
  const [spokenText, setSpokenText] = useState('');
  const [signedToSpokenText, setSignedToSpokenText] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState('');

  const spokenToSigned = useSpokenToSigned();

  const { isListening, isSupported: speechSupported, start, stop, transcript } = useSpeechRecognition({
    lang: spokenLanguage,
  });
  const { speak, isSpeaking } = useTextToSpeech({ lang: spokenLanguage });

  const settings = useSettingsStore();
  const isMobile = useIsMobile();

  const spokenCodes = useMemo(() => new Set(SPOKEN_LANGUAGES.map((language) => language.code)), []);

  const languagePairs = useMemo<LanguagePair[]>(() => {
    return SIGNED_LANGUAGES.map((language) => {
      const mappedSpoken = SIGNED_TO_SPOKEN_MAP[language.code];
      return {
        signed: language.code,
        spoken: mappedSpoken && spokenCodes.has(mappedSpoken) ? mappedSpoken : 'en',
      };
    });
  }, [spokenCodes]);

  const displayNames = useMemo(() => {
    try {
      return new Intl.DisplayNames(['vi'], { type: 'language' });
    } catch {
      return null;
    }
  }, []);

  const pairValue = `${spokenLanguage}|${signedLanguage}`;

  const getSpokenName = (code: string) => {
    const value = displayNames?.of(code) ?? code;
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  useEffect(() => {
    if (!transcript) {
      return;
    }
    setSpokenText((current) => (current ? `${current} ${transcript}`.trim() : transcript));
  }, [transcript]);

  useEffect(() => {
    return () => {
      if (videoUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const poseFrames = useMemo<Landmark[][]>(() => {
    if (!spokenToSigned.data?.poseData?.landmarks) {
      return [];
    }
    return spokenToSigned.data.poseData.landmarks;
  }, [spokenToSigned.data]);

  const hasOutput = Boolean(spokenToSigned.data?.animationUrl) || poseFrames.length > 0;

  const handlePairChange = (value: string) => {
    const [spoken, signed] = value.split('|');
    if (!spoken || !signed) {
      return;
    }
    setSpokenLanguage(spoken);
    setSignedLanguage(signed);
    if (mode === 'signed-to-spoken') {
      setSignedToSpokenText('');
    }
  };

  const handleTranslate = () => {
    const text = spokenText.trim();
    if (!text) {
      return;
    }
    void spokenToSigned.mutate({ text, spoken: spokenLanguage, signed: signedLanguage });
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (videoUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(videoUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setVideoUrl(objectUrl);
    setUploadName(file.name);
    setSignedToSpokenText(`Detected sign stream from ${file.name}. Text output is shown here.`);
  };

  const renderPoseViewer = () => {
    if (spokenToSigned.isPending) {
      return <div className="translate-loader">Translating...</div>;
    }

    if (spokenToSigned.isError) {
      return <div className="translate-error">Unable to translate. Please try again.</div>;
    }

    if (spokenToSigned.data?.animationUrl) {
      return (
        <video
          src={spokenToSigned.data.animationUrl}
          autoPlay
          loop
          muted
          playsInline
          className="translate-output-video"
        />
      );
    }

    if (poseFrames.length === 0) {
      return <div className="translate-placeholder">Translation output appears here.</div>;
    }

    if (settings.poseViewer === 'person') {
      return <HumanPoseViewer landmarks={poseFrames} width={420} height={420} />;
    }

    if (settings.poseViewer === 'avatar') {
      return <AvatarPoseViewer landmarks={poseFrames} width={420} height={420} />;
    }

    return <SkeletonPoseViewer landmarks={poseFrames} width={420} height={420} />;
  };

  const renderSpokenInput = (mobile: boolean) => (
    <section className={`translate-spoken ${mobile ? 'mobile' : ''}`}>
      {!mobile && <label className="translate-label">Spoken text</label>}
      <textarea
        value={spokenText}
        onChange={(event) => setSpokenText(event.target.value)}
        className="translate-textarea"
        placeholder="Type spoken language text..."
        maxLength={MAX_TEXT_LENGTH}
        dir="auto"
      />
      <div className="translate-actions-row">
        {speechSupported && (
          <button type="button" className="translate-action-button" onClick={isListening ? stop : start}>
            {isListening ? 'Stop mic' : 'Mic'}
          </button>
        )}
        <button
          type="button"
          className="translate-action-button"
          onClick={() => speak(spokenText)}
          disabled={!spokenText || isSpeaking}
        >
          {isSpeaking ? 'Speaking...' : 'Speak'}
        </button>
        <span className="translate-char-count">{spokenText.length} / {MAX_TEXT_LENGTH}</span>
      </div>
    </section>
  );

  const renderDesktopContent = () => {
    if (mode === 'spoken-to-signed') {
      return (
        <div className="translate-grid spoken-to-signed">
          {renderSpokenInput(false)}
          <section className="translate-output" aria-label="Signed output">
            {renderPoseViewer()}
            {hasOutput && (
              <div className="translate-output-actions">
                <button type="button" className="round-button" aria-label="Download translation">
                  Download
                </button>
                <button type="button" className="round-button" aria-label="Share translation">
                  Share
                </button>
              </div>
            )}
            {hasOutput && (
              <div className="translate-viewer-switch">
                <button
                  type="button"
                  className={settings.poseViewer === 'pose' || settings.poseViewer === 'skeleton' ? 'active' : ''}
                  onClick={() => settings.setSetting('poseViewer', 'skeleton')}
                >
                  Skeleton
                </button>
                <button
                  type="button"
                  className={settings.poseViewer === 'person' ? 'active' : ''}
                  onClick={() => settings.setSetting('poseViewer', 'person')}
                >
                  Person
                </button>
                <button
                  type="button"
                  className={settings.poseViewer === 'avatar' ? 'active' : ''}
                  onClick={() => settings.setSetting('poseViewer', 'avatar')}
                >
                  Avatar
                </button>
              </div>
            )}
          </section>
        </div>
      );
    }

    return (
      <div className="translate-grid signed-to-spoken">
        <section className="translate-output" aria-label="Signed input">
          {signedInputMode === 'upload' && !videoUrl && (
            <label className="translate-upload-box">
              <span>Upload sign video or pose file</span>
              <input type="file" accept="video/*,.pose" onChange={handleUpload} />
            </label>
          )}
          {(signedInputMode === 'webcam' || videoUrl) && (
            <div className="translate-placeholder">{videoUrl ? `Loaded: ${uploadName}` : 'Webcam preview area'}</div>
          )}
        </section>
        <section className="translate-spoken-result">
          <div>{signedToSpokenText || 'Spoken translation appears here.'}</div>
          <div className="translate-actions-row right">
            <button
              type="button"
              className="translate-action-button"
              disabled={!signedToSpokenText}
              onClick={() => speak(signedToSpokenText)}
            >
              Speak
            </button>
            <button
              type="button"
              className="translate-action-button"
              disabled={!signedToSpokenText}
              onClick={() => navigator.clipboard.writeText(signedToSpokenText)}
            >
              Copy
            </button>
          </div>
        </section>
      </div>
    );
  };

  const renderMobileContent = () => {
    if (mode === 'spoken-to-signed') {
      return (
        <>
          <section className="translate-output mobile" aria-label="Signed output">
            {renderPoseViewer()}
          </section>
          <div className="translate-mobile-input">{renderSpokenInput(true)}</div>
        </>
      );
    }

    return (
      <>
        <section className="translate-output mobile" aria-label="Signed input">
          {signedInputMode === 'upload' && !videoUrl ? (
            <label className="translate-upload-box compact">
              <span>Browse</span>
              <input type="file" accept="video/*,.pose" onChange={handleUpload} />
            </label>
          ) : (
            <div className="translate-placeholder">{videoUrl ? `Loaded: ${uploadName}` : 'Webcam preview area'}</div>
          )}
        </section>
        <div className="translate-mobile-input signed-to-spoken">
          <section className="translate-spoken-result mobile">
            <div>{signedToSpokenText || 'Spoken translation appears here.'}</div>
          </section>
        </div>
      </>
    );
  };

  return (
    <main className="translate-page">
      <div className="translate-shell">
        {!isMobile && (
          <div className="translate-mode-buttons" role="group" aria-label="Input mode">
            {mode === 'spoken-to-signed' ? (
              <button type="button" className="active" onClick={() => setMode('spoken-to-signed')}>
                Text
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={signedInputMode === 'webcam' ? 'active' : ''}
                  onClick={() => {
                    setMode('signed-to-spoken');
                    setSignedInputMode('webcam');
                  }}
                >
                  Webcam
                </button>
                <button
                  type="button"
                  className={signedInputMode === 'upload' ? 'active' : ''}
                  onClick={() => {
                    setMode('signed-to-spoken');
                    setSignedInputMode('upload');
                  }}
                >
                  Upload
                </button>
              </>
            )}
            <button
              type="button"
              className={mode === 'spoken-to-signed' ? 'active' : ''}
              onClick={() => setMode('spoken-to-signed')}
            >
              Spoken to Signed
            </button>
            <button
              type="button"
              className={mode === 'signed-to-spoken' ? 'active' : ''}
              onClick={() => setMode('signed-to-spoken')}
            >
              Signed to Spoken
            </button>
          </div>
        )}

        <section className="translate-card">
          <header className="translate-language-row">
            <label>
              <span>Language pair</span>
              <select value={pairValue} onChange={(event) => handlePairChange(event.target.value)}>
                {languagePairs.map((pair) => (
                  <option key={`${pair.spoken}-${pair.signed}`} value={`${pair.spoken}|${pair.signed}`}>
                    {`${pair.spoken} - ${pair.signed} = ${getSpokenName(pair.spoken)}`}
                  </option>
                ))}
              </select>
            </label>
          </header>

          <div className="translate-content">{isMobile ? renderMobileContent() : renderDesktopContent()}</div>

          {mode === 'spoken-to-signed' && (
            <footer className="translate-footer">
              <button
                type="button"
                className="translate-primary-button"
                onClick={handleTranslate}
                disabled={!spokenText.trim() || spokenToSigned.isPending}
              >
                {spokenToSigned.isPending ? 'Translating...' : 'Translate'}
              </button>
            </footer>
          )}
        </section>
      </div>
    </main>
  );
}

