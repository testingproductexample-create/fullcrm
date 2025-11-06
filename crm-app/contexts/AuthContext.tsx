'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getCurrentUser, getUserProfile } from '@/lib/supabase';
import { Profile } from '@/types/database';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, organizationId: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          const userProfile = await getUserProfile(currentUser.id);
          // If profile fetch fails, create a fallback profile from user data
          if (userProfile) {
            setProfile(userProfile);
          } else {
            // Create fallback profile from auth user data
            const fallbackProfile: Profile = {
              id: currentUser.id,
              organization_id: currentUser.id, // Use user ID as org ID
              full_name: currentUser.email?.split('@')[0] || 'User',
              role: 'owner',
              phone: null,
              avatar_url: null,
              preferences: {},
              created_at: currentUser.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            setProfile(fallbackProfile);
          }
        }
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    // Listen for auth changes (DO NOT use async operations in callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        
        // Fetch profile separately
        if (session?.user) {
          getUserProfile(session.user.id).then((userProfile) => {
            if (userProfile) {
              setProfile(userProfile);
            } else {
              // Fallback profile
              const fallbackProfile: Profile = {
                id: session.user.id,
                organization_id: session.user.id,
                full_name: session.user.email?.split('@')[0] || 'User',
                role: 'owner',
                phone: null,
                avatar_url: null,
                preferences: {},
                created_at: session.user.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              setProfile(fallbackProfile);
            }
          });
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, organizationId: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    
    if (!error && data.user) {
      // Create profile
      await supabase.from('profiles').insert({
        id: data.user.id,
        organization_id: organizationId,
        full_name: fullName,
        role: 'manager',
      });
    }
    
    return { error };
  };

  const signOutUser = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
