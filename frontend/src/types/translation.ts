// Translation Types

export interface NormalizeRequest {
  lang: string;
  text: string;
}

export interface NormalizeResponse {
  text: string;
}

export interface TranslateRequest {
  text: string;
  spoken: string;
  signed: string;
}

export interface PoseData {
  landmarks: Landmark[][];
  worldLandmarks: Landmark[][];
  transformation?: unknown;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface TranslateResponse {
  poseData?: PoseData;
  animationUrl?: string;
}


export interface TextToTextRequest {
  text: string;
  from: string;
  to: string;
  direction: string;
}

export interface TextToTextResponse {
  direction: string;
  from: string;
  to: string;
  text: string;
}

export interface Language {
  code: string;
  name: string;
}

export const SIGNED_LANGUAGES: Language[] = [
  { code: 'ase', name: 'ASE' },
  { code: 'bfi', name: 'BFI' },
  { code: 'gsg', name: 'GSG' },
  { code: 'fsl', name: 'FSL' },
  { code: 'jsl', name: 'JSL' },
];

export const SPOKEN_LANGUAGES: Language[] = [
  { code: 'en', name: 'Tiếng Anh' },
  { code: 'de', name: 'Tiếng Đức' },
  { code: 'fr', name: 'Tiếng Pháp' },
  { code: 'ja', name: 'Tiếng Nhật' },
];
