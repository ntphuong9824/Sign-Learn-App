# Lessons

- When deleting route-backed pages, also remove related hosting rewrites, sitemap entries, and UI links to avoid dead navigation paths.
- When deleting public pages (like About/Contribute), also update metadata generators and SEO/sitemap sources so app-store URLs and indexed paths do not point to removed routes.
- When removing header/footer wrappers on mobile, preserve functional controls by moving them into `ion-content` instead of deleting those controls outright.
- After deleting a UI block, remove matching standalone imports/icons and SCSS sections in the same commit to avoid drift and stale style debt.
- After removing a feature component from templates, also clean global selectors (like `app-send-feedback` in theme styles) to avoid hidden dead references.
- Hardcoded test data (FAKE_WORDS) in components can mask missing functionality. When features rely on fake data, the app appears to work but actually returns the same static result every time. Always check if component behavior is real or mocked.
- Button disabled states should be explicitly set based on business logic, not hardcoded to `true`. The `[disabled]="true"` in a button's HTML will make it unresponsive regardless of handlers.
- Signed-to-Spoken translation requires a trained ML model to recognize poses/gestures from video. Without this backend support, only placeholder functionality is possible.
- When removing mobile platform support (Android/iOS), delete: (1) `android/` and `ios/` folders, (2) Capacitor/Ionic dependencies from `package.json`, (3) `capacitor.config.ts` and `ionic.config.json`, (4) mobile-specific npm scripts (capacitor:assets, mobile:sync, mobile:metadata), (5) promotional asset folders, (6) `tools/mobile/` scripts directory, (7) .gitignore entries for platform-specific assets.
- When initializing a new GitHub presence for an existing workspace, add a root `README.md` and a basic `.github/ISSUE_TEMPLATE.md` so the repository feels ready even before workflows are customized.
- If the goal is a truly fresh GitHub repo, remove the entire `.github/` folder after creating any temporary templates or workflows you no longer want; otherwise the repo still carries old automation and metadata.
- Before adding a Git remote, run `git remote -v` first; if `origin` is absent, add it once, and if it already exists, update it instead of creating duplicate remotes.
- A freshly initialized Git repo cannot be pushed until it has at least one commit; create the initial commit first, then run `git push -u origin main` to set upstream tracking.
- For skeleton playback parity with sign.mt, set `autoplay="true"` on the `pose-viewer` custom element in React; without it, playback may stop after one run.
- If `pose-viewer` still stops after one pass, add a replay watchdog in the wrapper component that remounts on `ended`/`error` and near-end playback state.
- For smoother replay, prefer the custom element's native `loop`/`play()` behavior over remounting; remounts cause the visible blink between runs.
- For React wrappers around web components, prefer imperative property assignment and native event listeners when JSX props don’t reliably trigger behavior (e.g. `ended$`/`play()` on `pose-viewer`).
