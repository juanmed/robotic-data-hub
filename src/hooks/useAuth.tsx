import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
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
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    email_verified: data.email_verified,
  };
}

function mapSessionUser(user: SupabaseUser): AuthUser {
  const metadata = user.user_metadata ?? {};

  return {
    id: user.id,
    email: user.email ?? "",
    name: metadata.full_name ?? metadata.name ?? user.email?.split("@")[0] ?? "User",
    avatar_url: metadata.avatar_url,
    email_verified: !!user.email_confirmed_at,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const resolveUser = useCallback(async (sessionUser: SupabaseUser) => {
    const profile = await fetchProfile(sessionUser.id);
    return profile ?? mapSessionUser(sessionUser);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const uid = session.user.id;
        setActiveUserId(uid);
        setUser(mapSessionUser(session.user));
        const resolvedUser = await resolveUser(session.user);
        setActiveUserId((current) => {
          if (current === uid) setUser(resolvedUser);
          return current;
        });
      } else {
        setActiveUserId(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const uid = session.user.id;
        setActiveUserId(uid);
        setUser(mapSessionUser(session.user));
        const resolvedUser = await resolveUser(session.user);
        setActiveUserId((current) => {
          if (current === uid) setUser(resolvedUser);
          return current;
        });
      } else {
        setActiveUserId(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [resolveUser]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoginLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);

      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error("Please verify your email before signing in. Check your inbox for the verification link.");
      }

      if (data.user) {
        setUser(mapSessionUser(data.user));
        const resolvedUser = await resolveUser(data.user);
        setUser(resolvedUser);
      }
    } finally {
      setIsLoginLoading(false);
    }
  }, [resolveUser]);

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
    await supabase.auth.signOut();
    setUser(null);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && user.email_verified,
        isLoading,
        isLoginLoading,
        login,
        register,
        logout,
        resetPassword,
        updatePassword,
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
