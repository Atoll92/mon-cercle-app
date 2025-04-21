// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { supabase } from '../supabaseclient';
import '../styles/ProfilePage.css';

function ProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if viewing own profile
        if (userId === user?.id) {
          setIsOwnProfile(true);
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*, networks(*)')
          .eq('id', userId)
          .single();
          
        if (error) throw error;
        
        // Fetch portfolio items for this profile
        const { data: portfolioItems, error: portfolioError } = await supabase
          .from('portfolio_items')
          .select('*')
          .eq('profile_id', userId);
          
        if (portfolioError) throw portfolioError;
        
        setProfile({
          ...data,
          projects: portfolioItems || [] // Add portfolio items to the profile object
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile. The user may not exist or you may not have permission to view their profile.');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchProfile();
    }
  }, [userId, user]);
  
  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="profile-error">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="profile-not-found">
        <h2>Profile Not Found</h2>
        <p>The user you're looking for doesn't exist or you don't have permission to view their profile.</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }
  
  return (
    <div className="profile-container">
      <div className="profile-header">
        <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
        <h1>
          {isOwnProfile ? 'Your Profile' : `${profile.full_name || 'User'}'s Profile`}
        </h1>
        {isOwnProfile && (
          <Link to="/profile/edit" className="edit-profile-btn">
            Edit Profile
          </Link>
        )}
      </div>
      
      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="profile-avatar">
            {profile.profile_picture_url ? (
              <img src={profile.profile_picture_url} alt={profile.full_name} />
            ) : (
              <div className="avatar-placeholder">
                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>
          
          <div className="profile-info-card">
            <h2>{profile.full_name || 'Unnamed User'}</h2>
            {profile.role === 'admin' && <span className="role-badge">Network Admin</span>}
            
            <div className="contact-info">
              <div className="info-item">
                <span className="info-label">Email:</span>
                <a href={`mailto:${profile.contact_email}`} className="info-value">
                  {profile.contact_email}
                </a>
              </div>
              
              {profile.portfolio_url && (
                <div className="info-item">
                  <span className="info-label">Portfolio:</span>
                  <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="info-value">
                    {profile.portfolio_url.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </div>
              )}
              
              {profile.linkedin_url && (
                <div className="info-item">
                  <span className="info-label">LinkedIn:</span>
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="info-value">
                    {profile.linkedin_url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}
                  </a>
                </div>
              )}
              
              <div className="info-item">
                <span className="info-label">Network:</span>
                <span className="info-value">
                  {profile.networks?.name || 'No Network'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="profile-details">
          <div className="profile-section">
            <h3>About</h3>
            <div className="section-content">
              {profile.bio ? (
                <p>{profile.bio}</p>
              ) : (
                <p className="empty-section">No bio provided.</p>
              )}
            </div>
          </div>
          
          <div className="profile-section">
            <h3>Skills</h3>
            <div className="section-content">
              {profile.skills && profile.skills.length > 0 ? (
                <div className="skills-list">
                  {profile.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              ) : (
                <p className="empty-section">No skills listed.</p>
              )}
            </div>
          </div>
          
          <div className="profile-section">
            <h3>Portfolio Projects</h3>
            <div className="section-content">
              {profile.projects && profile.projects.length > 0 ? (
                <div className="projects-grid">
                  {profile.projects.map(project => (
                    <div key={project.id} className="project-card">
                      <div className="project-card-inner">
                        {project.image_url && (
                          <div className="project-thumbnail">
                            <img src={project.image_url} alt={project.title} />
                          </div>
                        )}
                        <div className="project-info">
                          <h4 className="project-title">{project.title}</h4>
                          <p className="project-description">{project.description}</p>
                          {project.url && (
                            <a href={project.url} target="_blank" rel="noopener noreferrer" className="view-project-btn">
                              View Project
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-section">No projects shared yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;