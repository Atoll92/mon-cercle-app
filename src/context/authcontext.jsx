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
  // const ensureProfile = async (userId, email) => {
  //   try {
  //     console.log('Checking for existing profile...');
      
  //     // First check if the profile exists
  //     const { data: existingProfile, error: fetchError } = await supabase
  //       .from('profiles')
  //       .select('*')
  //       .eq('id', userId)
  //       .maybeSingle();
      
  //     if (fetchError && fetchError.code !== 'PGRST116') {
  //       console.error('Error checking profile:', fetchError);
  //       return;
  //     }
      
  //     if (existingProfile) {
  //       console.log('Existing profile found:', existingProfile.id);
  //       return;
  //     }
      
  //     console.log('Profile not found, creating a new one');
      
  //     // Create a new network for the user
  //     const { data: network, error: networkError } = await supabase
  //       .from('networks')
  //       .insert([{ 
  //         name: 'My Network',
  //         description: 'Personal network created at signup'
  //       }])
  //       .select()
  //       .single();
      
  //     if (networkError) {
  //       console.error('Error creating network:', networkError);
  //       return;
  //     }
      
  //     console.log('Network created:', network.id);
      
  //     // Create a profile with the new network
  //     const { data: profile, error: profileError } = await supabase
  //       .from('profiles')
  //       .insert([{ 
  //         id: userId,
  //         network_id: network.id,  // Assign the new network
  //         role: 'admin',           // Make user admin of their own network
  //         full_name: '',
  //         contact_email: email,
  //         updated_at: new Date()
  //       }]);
      
  //     if (profileError) {
  //       console.error('Error creating profile:', profileError);
  //       return;
  //     }
      
  //     console.log('Profile created successfully');
      
  //   } catch (error) {
  //     console.error('Exception in profile creation:', error);
  //   }
  // };

  useEffect(() => {
    console.log('AuthProvider initializing');
    setLoading(true); // Explicitly set loading true at start
    
    // Get the initial session
    // --- Get Initial Session ---
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('AuthProvider: Error getting initial session:', error);
        setAuthError(error.message);
        setSession(null);
        setUser(null);
      } else {
        console.log('AuthProvider: Initial session received.', { hasSession: !!data.session });
        setSession(data.session);
        setUser(data.session?.user ?? null);
        // --- ensureProfile could potentially be called HERE if needed AFTER session is set ---
        // --- but ideally it's handled elsewhere (DB trigger) ---
        // if (data.session?.user) {
        //   ensureProfile(data.session.user.id, data.session.user.email); // Still adds delay here
        // }
      }
      // **** CRITICAL: Set loading false ONLY after initial check is done ****
      console.log('AuthProvider: Initial loading complete.');
      setLoading(false);

    }).catch(error => {
        // Catch potential errors in the promise chain itself
         console.error('AuthProvider: CATCH - Error during getSession promise:', error);
         setAuthError(error.message);
         setSession(null);
         setUser(null);
         setLoading(false); // Ensure loading stops even on catch
    });


    // Set up the auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log(`AuthProvider: Auth state changed - ${event}`, { hasNewSession: !!newSession });
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // --- Handle ensureProfile separately if needed, not blocking loading state ---
        // if (event === 'SIGNED_IN' && newSession?.user) {
        //   console.log('AuthProvider: User signed in, ensuring profile (async)...');
        //   ensureProfile(newSession.user.id, newSession.user.email); // Run async, don't await here
        // }

        // **** REMOVED: setLoading(false) from here ****
        // The loading state should only reflect the *initial* check.
        // Subsequent updates just change session/user.
      }
    );

    // Clean up the subscription
    return () => {
      console.log('AuthProvider: Cleaning up auth listener.');
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array is correct here

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
      
      // Don't check for session first, just try to sign out
      const { error } = await supabase.auth.signOut();
      
      // Clear user and session state regardless of success/failure
      setSession(null);
      setUser(null);
      
      // Return any error that might have occurred
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthError(error.message);
      
      // Clear user and session state even if there's an error
      setSession(null);
      setUser(null);
      
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

  useEffect(() => {
    console.log('AuthProvider: State updated ->', {
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