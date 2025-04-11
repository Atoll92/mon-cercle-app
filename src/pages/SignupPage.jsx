// src/pages/SignupPage.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseclient'; // Adjust path if needed
import { useNavigate, Link } from 'react-router-dom';

function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage('');

    try {
      // Note: Supabase sends a confirmation email by default.
      // The user object in the response will be null until confirmed.
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) throw error;

      // Optional: You might want to create a profile entry here,
      // BUT it's often better to do that *after* email confirmation
      // using a trigger or function, or when the user first logs in.

      setMessage('Signup successful! Please check your email to confirm.');
      // Don't navigate immediately, user needs to confirm email first.
      // navigate('/');
    } catch (error) {
      setError(error.message || "Failed to sign up");
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Sign Up</h1>
      <form onSubmit={handleSignup}>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength="6" // Supabase default minimum password length
          required
        />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}
      </form>
      <p>
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
}

export default SignupPage;