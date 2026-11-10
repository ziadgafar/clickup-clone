import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (session) => {
    if (!session) {
      setUser(null);
    } else {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setUser(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => loadProfile(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer: calling supabase inside this callback can deadlock the auth lock.
      setTimeout(() => loadProfile(session), 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const logout = () => supabase.auth.signOut();
  const refresh = async () =>
    loadProfile((await supabase.auth.getSession()).data.session);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
