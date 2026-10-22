import '@fontsource-variable/schibsted-grotesk';
import './index.css';

import { ClerkProvider } from '@clerk/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { Providers } from './app/Providers';
import { router } from './app/router';
import { Toasts } from './components/Toasts';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY. Copy frontend/.env.example to frontend/.env and fill it in.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={publishableKey}
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: '#1f2a24',
          fontFamily: "'Schibsted Grotesk Variable', ui-sans-serif, system-ui, sans-serif",
          borderRadius: '0.5rem',
        },
      }}
    >
      <Providers>
        <RouterProvider router={router} />
        <Toasts />
      </Providers>
    </ClerkProvider>
  </StrictMode>,
);
