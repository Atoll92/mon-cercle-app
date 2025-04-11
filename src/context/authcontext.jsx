// src/context/authcontext.jsx
//capital
import React, { createContext, useState, useEffect, useContext } from 'react';
// import { supabase } from '../supabaseclient';
import { supabase } from '../supabaseclient';
// Create the context
const AuthContext = createContext(null);

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Create or update user profile
  const ensureProfile = async (userId, email) => {
    try {
      console.log('Checking for existing profile...');
      
      // First check if the profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking profile:', fetchError);
        return;
      }
      
      if (existingProfile) {
        console.log('Existing profile found:', existingProfile.id);
        return;
      }
      
      console.log('Profile not found, creating a new one');
      
      // Create a new network for the user
      const { data: network, error: networkError } = await supabase
        .from('networks')
        .insert([{ 
          name: 'My Network',
          description: 'Personal network created at signup'
        }])
        .select()
        .single();
      
      if (networkError) {
        console.error('Error creating network:', networkError);
        return;
      }
      
      console.log('Network created:', network.id);
      
      // Create a profile with the new network
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([{ 
          id: userId,
          network_id: network.id,  // Assign the new network
          role: 'admin',           // Make user admin of their own network
          full_name: '',
          contact_email: email,
          updated_at: new Date()
        }]);
      
      if (profileError) {
        console.error('Error creating profile:', profileError);
        return;
      }
      
      console.log('Profile created successfully');
      
    } catch (error) {
      console.error('Exception in profile creation:', error);
    }
  };

  useEffect(() => {
    console.log('AuthProvider initializing');
    
    // Get the initial session
    const getInitialSession = async () => {
      try {
        console.log('Fetching initial session');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          throw error;
        }
        
        console.log('Session data received:', { 
          hasSession: !!data.session,
          user: data.session?.user ? { 
            id: data.session.user.id,
            email: data.session.user.email 
          } : null
        });
        
        setSession(data.session);
        setUser(data.session?.user || null);
        
        // If user is logged in, ensure they have a profile
        if (data.session?.user) {
          await ensureProfile(data.session.user.id, data.session.user.email);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setAuthError(error.message);
      } finally {
        console.log('Initial auth loading complete');
        setLoading(false);
      }
    };

    getInitialSession();

    // Set up the auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`Auth state changed: ${event}`, { 
        hasNewSession: !!newSession,
        userId: newSession?.user?.id 
      });
      
      setSession(newSession);
      setUser(newSession?.user || null);
      
      // Handle specific auth events
      if (event === 'SIGNED_IN') {
        // Create profile and assign to network if needed
        if (newSession?.user) {
          await ensureProfile(newSession.user.id, newSession.user.email);
        }
      }
      
      setLoading(false);
    });

    // Clean up the subscription
    return () => {
      console.log('Cleaning up auth listener');
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Authentication functions
  const signUp = async (email, password) => {
    try {
      setAuthError(null);
      console.log('Signing up user:', email);
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      console.log('Signup successful');
      return { data, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      setAuthError(error.message);
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      setAuthError(null);
      console.log('Signing in user:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      console.log('Sign in successful');
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      setAuthError(error.message);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      setAuthError(null);
      console.log('Signing out user');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthError(error.message);
      return { error };
    }
  };

  const resetPassword = async (email) => {
    try {
      setAuthError(null);
      console.log('Requesting password reset for:', email);
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      console.log('Password reset email sent');
      return { data, error: null };
    } catch (error) {
      console.error('Password reset error:', error);
      setAuthError(error.message);
      return { data: null, error };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      setAuthError(null);
      console.log('Updating user password');
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      console.log('Password updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Update password error:', error);
      setAuthError(error.message);
      return { data: null, error };
    }
  };

  // Log state changes
  useEffect(() => {
    console.log('Auth state updated:', { 
      loading, 
      hasUser: !!user, 
      hasSession: !!session,
      hasError: !!authError
    });
  }, [loading, user, session, authError]);

  // Provide the auth context value
  const value = {
    user,
    session,
    loading,
    authError,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    clearAuthError: () => setAuthError(null)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;