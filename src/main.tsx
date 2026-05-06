import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { LegalTermsPage } from './pages/LegalTermsPage.tsx';
import { LegalPrivacyPage } from './pages/LegalPrivacyPage.tsx';
import { OwnerHubPage } from './pages/OwnerHubPage.tsx';
import { PlatformRoadmapPage } from './pages/PlatformRoadmapPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/terms" element={<LegalTermsPage />} />
        <Route path="/privacy" element={<LegalPrivacyPage />} />
        <Route path="/owner" element={<OwnerHubPage />} />
        <Route path="/platform" element={<PlatformRoadmapPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>,
);
