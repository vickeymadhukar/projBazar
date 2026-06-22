// ─────────────────────────────────────────────────────────────────────────────
//  src/App.jsx
//  Root component — React Query Provider + Router
//  Auth is now handled via JWT HttpOnly cookie + custom useAuth hook
// ─────────────────────────────────────────────────────────────────────────────
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AuthTest from './pages/AuthTest.jsx';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile.jsx';

// ── Query Client ──────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            1000 * 60 * 5, // 5 minutes
      retry:                1,
      refetchOnWindowFocus: false,
    },
  },
});

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e1e2e',
              color:      '#cdd6f4',
              border:     '1px solid #313244',
            },
          }}
        />

        <Routes>
          {/* Auth test sandbox page */}
          <Route path="/" element={<AuthTest />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:id" element={<Profile />} />
          {/* Google OAuth callback landing page */}
          <Route path="/auth/callback" element={<Navigate to="/" replace />} />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
