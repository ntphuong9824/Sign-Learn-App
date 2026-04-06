import { useSettingsStore, type PoseViewerSetting } from '../store/settingsStore';

export function SettingsPage() {
  const settings = useSettingsStore();

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <h1>Settings</h1>

      <div className="w-full max-w-md space-y-6">
        {/* Video Settings */}
        <section className="p-4 bg-[var(--code-bg)] rounded">
          <h2 className="mb-4">Video</h2>

          <label className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              checked={settings.receiveVideo}
              onChange={(e) => settings.setSetting('receiveVideo', e.target.checked)}
              className="w-5 h-5"
            />
            <span>Receive Video</span>
          </label>

          <label className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              checked={settings.drawVideo}
              onChange={(e) => settings.setSetting('drawVideo', e.target.checked)}
              className="w-5 h-5"
            />
            <span>Draw Video</span>
          </label>
        </section>

        {/* Detection Settings */}
        <section className="p-4 bg-[var(--code-bg)] rounded">
          <h2 className="mb-4">Detection</h2>

          <label className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              checked={settings.detectSign}
              onChange={(e) => settings.setSetting('detectSign', e.target.checked)}
              className="w-5 h-5"
            />
            <span>Detect Sign</span>
          </label>

          <label className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              checked={settings.drawPose}
              onChange={(e) => settings.setSetting('drawPose', e.target.checked)}
              className="w-5 h-5"
            />
            <span>Draw Pose</span>
          </label>

          <label className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              checked={settings.animatePose}
              onChange={(e) => settings.setSetting('animatePose', e.target.checked)}
              className="w-5 h-5"
            />
            <span>Animate Pose</span>
          </label>

        </section>

        {/* Appearance Settings */}
        <section className="p-4 bg-[var(--code-bg)] rounded">
          <h2 className="mb-4">Appearance</h2>

          <div className="mb-4">
            <label className="block mb-2">Background Color</label>
            <input
              type="color"
              value={settings.appearance}
              onChange={(e) => settings.setSetting('appearance', e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="block mb-2">Pose Viewer</label>
            <select
              value={settings.poseViewer}
              onChange={(e) => settings.setSetting('poseViewer', e.target.value as PoseViewerSetting)}
              className="w-full px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)]"
            >
              <option value="pose">Pose</option>
              <option value="avatar">Avatar</option>
              <option value="person">Person</option>
            </select>
          </div>
        </section>

        {/* Reset Button */}
        <button
          onClick={settings.resetSettings}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
