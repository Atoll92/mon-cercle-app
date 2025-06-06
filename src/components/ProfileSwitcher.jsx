import { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  Box,
  Chip,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Add as AddIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useProfile } from '../context/profileContext';
import { useNavigate } from 'react-router-dom';

const ProfileSwitcher = ({ buttonVariant = 'icon' }) => {
  const navigate = useNavigate();
  const { 
    activeProfile, 
    userProfiles, 
    switchProfile,
    hasMultipleProfiles 
  } = useProfile();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [isSwitching, setIsSwitching] = useState(false);
  
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfileSwitch = async (profileId) => {
    if (profileId === activeProfile?.id) {
      handleClose();
      return;
    }
    
    setIsSwitching(true);
    const result = await switchProfile(profileId);
    
    if (result.success) {
      // Refresh the page to reload with new profile context
      window.location.reload();
    } else {
      console.error('Failed to switch profile:', result.error);
    }
    
    setIsSwitching(false);
    handleClose();
  };

  const handleJoinNewNetwork = () => {
    handleClose();
    navigate('/create-network');
  };

  const handleManageProfiles = () => {
    handleClose();
    navigate('/profiles/select');
  };

  // Don't show switcher if user has only one profile
  if (!hasMultipleProfiles && buttonVariant === 'icon') {
    return null;
  }

  const renderButton = () => {
    if (buttonVariant === 'icon') {
      return (
        <Tooltip title="Switch Profile">
          <IconButton
            onClick={handleClick}
            size="large"
            edge="end"
            aria-label="switch profile"
            aria-controls={open ? 'profile-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            color="inherit"
          >
            {activeProfile?.profile_picture_url ? (
              <Avatar
                src={activeProfile.profile_picture_url}
                sx={{ width: 32, height: 32 }}
              >
                {activeProfile.full_name?.charAt(0)}
              </Avatar>
            ) : (
              <AccountCircleIcon />
            )}
          </IconButton>
        </Tooltip>
      );
    }
    
    // Full button variant
    return (
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          p: 1,
          borderRadius: 1,
          '&:hover': {
            bgcolor: 'action.hover'
          }
        }}
      >
        <Avatar
          src={activeProfile?.profile_picture_url}
          sx={{ width: 40, height: 40 }}
        >
          {activeProfile?.full_name?.charAt(0)}
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {activeProfile?.full_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {activeProfile?.network?.name}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <>
      {renderButton()}
      
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 4,
          sx: {
            minWidth: 280,
            maxHeight: 400,
            mt: 1.5,
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {activeProfile && (
          <>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Current Profile
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <Typography variant="body2" fontWeight={600}>
                  {activeProfile.full_name}
                </Typography>
                <Chip
                  label={activeProfile.role}
                  size="small"
                  color={activeProfile.role === 'admin' ? 'primary' : 'default'}
                />
              </Box>
            </Box>
            <Divider />
          </>
        )}
        
        <Box sx={{ py: 1 }}>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ px: 2, display: 'block', mb: 1 }}
          >
            Switch to
          </Typography>
          
          {userProfiles.map((profile) => (
            <MenuItem
              key={profile.id}
              onClick={() => handleProfileSwitch(profile.id)}
              selected={profile.id === activeProfile?.id}
              disabled={isSwitching}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                }
              }}
            >
              <ListItemAvatar>
                <Avatar
                  src={profile.profile_picture_url}
                  sx={{ 
                    width: 36, 
                    height: 36,
                    bgcolor: profile.network?.theme_color || 'primary.main'
                  }}
                >
                  {profile.full_name?.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={profile.full_name}
                secondary={
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="caption">
                      {profile.network?.name}
                    </Typography>
                    {profile.role === 'admin' && (
                      <Chip
                        label="Admin"
                        size="small"
                        sx={{ height: 16, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                }
              />
              {profile.id === activeProfile?.id && (
                <CheckIcon fontSize="small" color="primary" />
              )}
              {isSwitching && profile.id !== activeProfile?.id && (
                <CircularProgress size={20} />
              )}
            </MenuItem>
          ))}
        </Box>
        
        <Divider />
        
        <MenuItem onClick={handleJoinNewNetwork}>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: 'action.hover' }}>
              <AddIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary="Join New Network" />
        </MenuItem>
        
        {hasMultipleProfiles && (
          <MenuItem onClick={handleManageProfiles}>
            <ListItemText 
              primary="Manage Profiles" 
              sx={{ pl: 7.5 }}
            />
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default ProfileSwitcher;