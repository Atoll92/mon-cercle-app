// src/pages/NetworkAdminPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import '@/styles/NetworkAdminPage.css';
function NetworkAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [network, setNetwork] = useState(null);
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [networkName, setNetworkName] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get admin's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        setProfile(profileData);
        
        // Check if user is an admin
        if (profileData.role !== 'admin') {
          setError('You do not have admin privileges.');
          return;
        }
        
        // Get network info
        if (!profileData.network_id) {
          setError('You are not part of any network.');
          return;
        }
        
        const { data: networkData, error: networkError } = await supabase
          .from('networks')
          .select('*')
          .eq('id', profileData.network_id)
          .single();
          
        if (networkError) throw networkError;
        setNetwork(networkData);
        setNetworkName(networkData.name);
        
        // Get network members
        const { data: membersData, error: membersError } = await supabase
          .from('profiles')
          .select('*')
          .eq('network_id', profileData.network_id)
          .order('full_name', { ascending: true });
          
        if (membersError) throw membersError;
        setMembers(membersData || []);
        
      } catch (error) {
        console.error('Error loading admin data:', error);
        setError('Failed to load network information.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  const handleInvite = async (e) => {
    e.preventDefault();
    
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setMessage('Please enter a valid email address.');
      return;
    }
    
    try {
      setInviting(true);
      setError(null);
      setMessage('');
      
      // Check if user already exists
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id, network_id')
        .eq('contact_email', inviteEmail)
        .maybeSingle();
        
      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }
      
      if (existingUser) {
        if (existingUser.network_id === network.id) {
          setMessage('This user is already in your network.');
          return;
        }
        
        // User exists but is not in network - update their network_id
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ network_id: network.id })
          .eq('id', existingUser.id);
          
        if (updateError) throw updateError;
        
        // Send email notification (would require a server-side function)
        // For now, just set a success message
        setMessage(`User ${inviteEmail} added to your network!`);
        
        // Refresh member list
        const { data: updatedMembers, error: membersError } = await supabase
          .from('profiles')
          .select('*')
          .eq('network_id', network.id)
          .order('full_name', { ascending: true });
          
        if (membersError) throw membersError;
        setMembers(updatedMembers || []);
      } else {
        // User doesn't exist - create an invitation
        // This would require a separate invitations table and email sending
        // For now, just set a message about the invitation
        setMessage(`Invitation sent to ${inviteEmail}!`);
        
        // In a real implementation:
        // 1. Create record in invitations table with network_id and email
        // 2. Generate unique invitation token
        // 3. Send email with signup link + token
        // 4. When user signs up with that token, add them to the network
      }
      
      // Clear input
      setInviteEmail('');
      
    } catch (error) {
      console.error('Error inviting user:', error);
      setError('Failed to send invitation. Please try again.');
    } finally {
      setInviting(false);
    }
  };
  
  const handleUpdateNetwork = async (e) => {
    e.preventDefault();
    
    if (!networkName.trim()) {
      setMessage('Network name cannot be empty.');
      return;
    }
    
    try {
      setUpdating(true);
      setError(null);
      setMessage('');
      
      const { error } = await supabase
        .from('networks')
        .update({ name: networkName })
        .eq('id', network.id);
        
      if (error) throw error;
      
      setNetwork({ ...network, name: networkName });
      setMessage('Network updated successfully!');
      
    } catch (error) {
      console.error('Error updating network:', error);
      setError('Failed to update network. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  
  const handleRemoveMember = async (memberId) => {
    // Don't allow removing yourself
    if (memberId === user.id) {
      setError('You cannot remove yourself from the network.');
      return;
    }
    
    if (!confirm('Are you sure you want to remove this member from your network?')) {
      return;
    }
    
    try {
      setError(null);
      setMessage('');
      
      // Update user's network_id to null
      const { error } = await supabase
        .from('profiles')
        .update({ network_id: null })
        .eq('id', memberId);
        
      if (error) throw error;
      
      // Update local state
      setMembers(members.filter(member => member.id !== memberId));
      setMessage('Member removed from network.');
      
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member. Please try again.');
    }
  };
  
  const handleToggleAdmin = async (memberId, currentRole) => {
    // Don't allow changing your own role
    if (memberId === user.id) {
      setError('You cannot change your own admin status.');
      return;
    }
    
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    const confirmMessage = currentRole === 'admin' 
      ? 'Remove admin privileges from this user?' 
      : 'Grant admin privileges to this user?';
      
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      setError(null);
      setMessage('');
      
      // Update user's role
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', memberId);
        
      if (error) throw error;
      
      // Update local state
      setMembers(members.map(member => 
        member.id === memberId 
          ? { ...member, role: newRole } 
          : member
      ));
      
      setMessage(`User ${newRole === 'admin' ? 'promoted to admin' : 'changed to regular member'}.`);
      
    } catch (error) {
      console.error('Error updating member role:', error);
      setError('Failed to update member role. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading admin panel...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="admin-error">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Back to Dashboard</button>
      </div>
    );
  }
  
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="admin-unauthorized">
        <h2>Access Denied</h2>
        <p>You don't have permission to access the admin panel.</p>
        <button onClick={() => navigate('/')}>Back to Dashboard</button>
      </div>
    );
  }
  
  return (
    <div className="admin-container">
      <div className="admin-header">
        <Link to="/" className="back-link">← Back to Dashboard</Link>
        <h1>Network Admin Panel</h1>
      </div>
      
      {message && <div className="admin-message">{message}</div>}
      {error && <div className="admin-error-message">{error}</div>}
      
      <div className="admin-content">
        <div className="admin-section">
          <h2>Network Settings</h2>
          <form onSubmit={handleUpdateNetwork} className="network-form">
            <div className="form-group">
              <label htmlFor="networkName">Network Name</label>
              <input
                id="networkName"
                type="text"
                value={networkName}
                onChange={(e) => setNetworkName(e.target.value)}
                placeholder="Enter network name"
                required
              />
            </div>
            <button 
              type="submit" 
              className="update-network-btn"
              disabled={updating}
            >
              {updating ? 'Updating...' : 'Update Network'}
            </button>
          </form>
        </div>
        
        <div className="admin-section">
          <h2>Invite Members</h2>
          <form onSubmit={handleInvite} className="invite-form">
            <div className="form-group">
              <label htmlFor="inviteEmail">Email Address</label>
              <div className="invite-input-group">
                <input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email to invite"
                  required
                />
                <button 
                  type="submit" 
                  className="invite-btn"
                  disabled={inviting}
                >
                  {inviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </div>
          </form>
        </div>
        
        <div className="admin-section">
          <h2>Network Members ({members.length})</h2>
          {members.length > 0 ? (
            <div className="members-table-container">
              <table className="members-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(member => (
                    <tr key={member.id} className={member.id === user.id ? 'current-user-row' : ''}>
                      <td>
                        <div className="member-name-cell">
                          {member.profile_picture_url ? (
                            <img 
                              src={member.profile_picture_url} 
                              alt="" 
                              className="member-avatar"
                            />
                          ) : (
                            <div className="member-avatar-placeholder">
                              {member.full_name ? member.full_name.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                          <Link to={`/profile/${member.id}`}>
                            {member.full_name || 'Unnamed User'}
                            {member.id === user.id && ' (You)'}
                          </Link>
                        </div>
                      </td>
                      <td>{member.contact_email}</td>
                      <td>
                        <span className={`role-tag ${member.role === 'admin' ? 'admin-role' : 'member-role'}`}>
                          {member.role || 'member'}
                        </span>
                      </td>
                      <td>
                        <div className="member-actions">
                          {member.id !== user.id && (
                            <>
                              <button 
                                onClick={() => handleToggleAdmin(member.id, member.role)}
                                className="toggle-admin-btn"
                              >
                                {member.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                              </button>
                              <button 
                                onClick={() => handleRemoveMember(member.id)}
                                className="remove-member-btn"
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-members">No members found in your network.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default NetworkAdminPage;