import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { TranslatePage } from './pages/translate/TranslatePage';
import { SettingsPage } from './pages/SettingsPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TranslatePage />} />
        <Route path="/translate/spoken-to-signed" element={<Navigate to="/" replace />} />
        <Route path="/translate/signed-to-spoken" element={<Navigate to="/" replace />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
