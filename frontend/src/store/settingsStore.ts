import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PoseViewerSetting = 'pose' | 'skeleton' | 'person' | 'avatar';

interface SettingsState {
  receiveVideo: boolean;
  detectSign: boolean;
  animatePose: boolean;
  drawVideo: boolean;
  drawPose: boolean;
  appearance: string;
  poseViewer: PoseViewerSetting;

  // Actions
  setSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  resetSettings: () => void;
}

const initialState = {
  receiveVideo: false,
  detectSign: false,
  animatePose: false,
  drawVideo: true,
  drawPose: true,
  appearance: '#ffffff',
  poseViewer: 'pose' as PoseViewerSetting,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,

      setSetting: (key, value) =>
        set((state) => ({ ...state, [key]: value })),

      resetSettings: () => set(initialState),
    }),
    {
      name: 'signlearn-settings',
    }
  )
);
