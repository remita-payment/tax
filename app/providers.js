// app/providers.tsx
'use client';

import AuthProvider from '@/components/AuthProvider';
import { Toaster } from 'sonner';

export function Providers({ children }) {
  return (
    <AuthProvider>
      <Toaster position="bottom-center" />
      {children}
    </AuthProvider>
  );
}
