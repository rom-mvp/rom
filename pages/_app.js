import { ClerkProvider } from '@clerk/nextjs';
import { useEffect } from 'react';

// Global styles (Tailwind already in config)
import '../styles/globals.css';  // We'll add this file next

function MyApp({ Component, pageProps }) {
  // Clerk needs env vars—error if missing
  return (
    <ClerkProvider {...pageProps}>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default MyApp;
