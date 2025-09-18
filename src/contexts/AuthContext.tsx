import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextProps {
  user: any;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
  signup?: (email: string, password: string, metadata: any) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session with error handling
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.log('Session error, clearing auth:', error);
        supabase.auth.signOut(); // Clear any bad tokens
        setUser(null);
      } else {
        setUser(data.session?.user ?? null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Helper function to migrate anonymous scans to user account
  const migrateAnonymousScans = async (userId: string) => {
    try {
      const anonymousScans = JSON.parse(localStorage.getItem('anonymous_scans') || '[]');
      
      if (anonymousScans.length > 0) {
        console.log(`Migrating ${anonymousScans.length} anonymous scans to user account`);
        
        // Prepare scans for database insertion
        const scansToInsert = anonymousScans.map((scan: any) => ({
          supporter_id: userId,
          artist_id: scan.artistId,
          timestamp: scan.timestamp
        }));
        
        // Bulk insert to database
        const { error: insertError } = await supabase
          .from('scan_history')
          .insert(scansToInsert);
        
        if (insertError) {
          console.error('Error migrating scans:', insertError);
        } else {
          console.log('Successfully migrated anonymous scans');
          // Clear localStorage after successful migration
          localStorage.removeItem('anonymous_scans');
        }
      }
    } catch (error) {
      console.error('Error during scan migration:', error);
      // Don't throw - migration failure shouldn't break signup
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }
    // Fetch fresh session to get user_metadata
    const { data: sessionData } = await supabase.auth.getSession();
    const loggedInUser = sessionData?.session?.user ?? null;
    setUser(loggedInUser);
    setLoading(false);
    return loggedInUser;
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  const signup = async (email: string, password: string, metadata: any) => {
    setLoading(true);
    try {
      // 1️⃣ Create Supabase Auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }
      if (!data.user) {
        setLoading(false);
        return { success: false, error: 'User not created' };
      }

      // 2️⃣ Prepare insert data for "users" table
      let insertData: any = {
        id: data.user.id,
        role: metadata.role,
        email,
        profile_handle: metadata.username || '',
        social_links: {},
        created_at: new Date()
      };

      if (metadata.role === 'artist') {
        insertData.stage_name = metadata.stageName || 'New Artist';
      }

      // 3️⃣ Insert into users table
      const { error: dbError } = await supabase.from('users').insert(insertData);
      if (dbError) {
        setLoading(false);
        return { success: false, error: dbError.message };
      }

      // 4️⃣ Migrate anonymous scans to new user account (only for supporters)
      if (metadata.role === 'supporter') {
        await migrateAnonymousScans(data.user.id);
      }

      // 5️⃣ Fetch fresh session to get correct user_metadata
      const { data: sessionData } = await supabase.auth.getSession();
      const newUser = sessionData?.session?.user ?? null;
      setUser(newUser);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'Unknown error' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
