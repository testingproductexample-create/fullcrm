'use client';

import { useContext } from 'react';
import { AuthContext } from '@/components/auth-provider';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a default context for pages that aren't wrapped in AuthProvider yet
    return {
      user: null,
      session: null,
      loading: false,
      error: null,
      signIn: async () => {},
      signUp: async () => {},
      signOut: async () => {},
      resetPassword: async () => {},
    };
  }
  return context;
}
