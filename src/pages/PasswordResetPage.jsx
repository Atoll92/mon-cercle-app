// src/pages/PasswordResetPage.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseclient'; // Adjust path if needed
import { Link } from 'react-router-dom';

function PasswordResetPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // This sends a password reset link to the user's email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/update-password', // URL user will be redirected to after clicking link
      });

      if (error) throw error;

      setMessage('Password reset instructions sent! Please check your email.');
    } catch (error) {
      setError(error.message || 'Failed to send password reset email.');
      console.error("Password reset error:", error);
    } finally {
      setLoading(false);
    }
  };

  // You will also need a separate page/route (e.g., /update-password)
  // to handle the actual password update after the user clicks the email link.
  // That page would use `supabase.auth.updateUser({ password: newPassword })`
  // typically within a useEffect hook that listens for the access_token fragment.

  return (
    <div>
      <h1>Reset Password</h1>
      <p>Enter your email address to receive password reset instructions.</p>
      <form onSubmit={handlePasswordReset}>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Instructions'}
        </button>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}
      </form>
      <p>
        Remember your password? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
}

export default PasswordResetPage;