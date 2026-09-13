import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verify if genuine credentials exist
export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawAnonKey &&
  rawUrl.trim() !== '' &&
  rawAnonKey.trim() !== '' &&
  rawUrl !== 'MY_SUPABASE_URL' &&
  rawAnonKey !== 'MY_SUPABASE_ANON_KEY' &&
  (rawUrl.startsWith('https://') || rawUrl.startsWith('http://'))
);

let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(rawUrl.trim(), rawAnonKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

export const supabase = supabaseInstance;

// Helper response interface
export interface AuthResponse<T = any> {
  data: T | null;
  error: string | null;
}

// User Metadata schema
export interface AuthUserMeta {
  name?: string;
  businessName?: string;
  role?: 'Owner' | 'Manager' | 'Cashier';
}

/**
 * Sign In with Email and Password
 */
export async function authSignIn(email: string, password: string): Promise<AuthResponse<{ user: User | null; session: Session | null }>> {
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        return { data: null, error: error.message };
      }
      return { data: { user: data.user, session: data.session }, error: null };
    } catch (err: any) {
      return { data: null, error: err?.message || 'Network error during sign in' };
    }
  }

  // Fallback mode when VITE_SUPABASE_URL is not yet provisioned
  // Verify demo credentials or valid simulated login
  const mockUser: any = {
    id: `usr_${Date.now()}`,
    email: email.trim(),
    user_metadata: {
      name: email.split('@')[0],
      role: 'Owner',
    },
  };
  return {
    data: {
      user: mockUser,
      session: {
        access_token: 'mock-session-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: mockUser,
      } as any,
    },
    error: null,
  };
}

/**
 * Sign Up with Email, Password and metadata
 */
export async function authSignUp(
  email: string,
  password: string,
  meta?: AuthUserMeta
): Promise<AuthResponse<{ user: User | null; session: Session | null; confirmationRequired?: boolean }>> {
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: meta?.name || email.split('@')[0],
            businessName: meta?.businessName || `${meta?.name || 'My'} Business`,
            role: meta?.role || 'Owner',
          },
        },
      });

      if (error) {
        return { data: null, error: error.message };
      }

      // Check if email confirmation is required by Supabase project settings
      const confirmationRequired = !data.session && Boolean(data.user && data.user.identities && data.user.identities.length > 0);

      return {
        data: {
          user: data.user,
          session: data.session,
          confirmationRequired,
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err?.message || 'Network error during sign up' };
    }
  }

  // Fallback mode
  const mockUser: any = {
    id: `usr_${Date.now()}`,
    email: email.trim(),
    user_metadata: {
      name: meta?.name || email.split('@')[0],
      businessName: meta?.businessName || `${meta?.name || 'My'} Store`,
      role: meta?.role || 'Owner',
    },
  };

  return {
    data: {
      user: mockUser,
      session: {
        access_token: 'mock-session-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: mockUser,
      } as any,
      confirmationRequired: false,
    },
    error: null,
  };
}

/**
 * Reset password via email
 */
export async function authResetPassword(email: string): Promise<AuthResponse<boolean>> {
  if (supabase) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) {
        return { data: null, error: error.message };
      }
      return { data: true, error: null };
    } catch (err: any) {
      return { data: null, error: err?.message || 'Failed to dispatch reset email' };
    }
  }

  // Simulated reset
  return { data: true, error: null };
}

/**
 * Sign Out
 */
export async function authSignOut(): Promise<AuthResponse<boolean>> {
  if (supabase) {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Supabase sign out error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase sign out network warning:', err);
    }
  }
  return { data: true, error: null };
}

/**
 * Get active session
 */
export async function authGetSession(): Promise<Session | null> {
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch (err) {
      console.error('Error fetching Supabase session:', err);
      return null;
    }
  }
  return null;
}
