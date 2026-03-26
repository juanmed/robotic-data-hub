import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  email_verified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoginLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapSessionUser(su: SupabaseUser): AuthUser {
  const m = su.user_metadata ?? {};
  return {
    id: su.id,
    email: su.email ?? "",
    name: m.full_name ?? m.name ?? su.email?.split("@")[0] ?? "User",
    avatar_url: m.avatar_url,
    email_verified: !!su.email_confirmed_at,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Guard stale profile fetches: increment on every session change
  const versionRef = useRef(0);

  const hydrateProfile = useCallback((sessionUser: SupabaseUser) => {
    const ver = ++versionRef.current;
    // Fire-and-forget profile enrichment
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", sessionUser.id)
          .single();
        if (versionRef.current !== ver) return; // stale
        if (data) {
          setUser({
            id: data.id,
            email: data.email,
            name: data.name,
            avatar_url: data.avatar_url ?? undefined,
            email_verified: data.email_verified,
          });
        }
      } catch {
        /* keep session-based user */
      }
    })();
  }, []);

  const handleSession = useCallback(
    (sessionUser: SupabaseUser | null) => {
      if (sessionUser) {
        setUser(mapSessionUser(sessionUser));
        hydrateProfile(sessionUser);
      } else {
        versionRef.current++;
        setUser(null);
      }
      setIsInitialized(true);
    },
    [hydrateProfile],
  );

  useEffect(() => {
    // 1. Listen for auth changes (fires for login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => handleSession(session?.user ?? null),
    );

    // 2. Bootstrap from existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoginLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error("Please verify your email before signing in. Check your inbox for the verification link.");
      }
      // onAuthStateChange will handle setting user state
    } finally {
      setIsLoginLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `https://gamiphy.ai/auth/callback`,
      },
    });
    if (error) throw new Error(error.message);
  }, []);

  const logout = useCallback(async () => {
    versionRef.current++;
    setUser(null);
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://gamiphy.ai/auth/callback?type=recovery`,
    });
    if (error) throw new Error(error.message);
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) hydrateProfile(session.user);
  }, [hydrateProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && user.email_verified,
        isLoading: !isInitialized,
        isLoginLoading,
        login,
        register,
        logout,
        resetPassword,
        updatePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
