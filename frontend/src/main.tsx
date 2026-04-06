import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import { appCheckTokenManager } from './services/appCheckTokenManager';

const queryClient = new QueryClient();

// Keep backend AppCheck cache warm for Spring Boot upstream calls.
void appCheckTokenManager.initialize().catch((error) => {
  console.error('Failed to initialize AppCheck Token Manager:', error);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
