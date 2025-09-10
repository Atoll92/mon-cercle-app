import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Alert,
  Button
} from '@mui/material';
import {
  School as SchoolIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import CoursesPage from './courses/CoursesPage';

const CoursesTab = ({ networkId, isUserMember, darkMode }) => {
  const { user } = useAuth();
  const { activeProfile } = useProfile();

  // If user is not logged in, show public courses view
  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Sign in to enroll in courses and track your progress.
        </Alert>
        <CoursesPage />
      </Box>
    );
  }

  // If user is not a member of this network
  if (!isUserMember) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Join this network to access courses
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Courses are only available to network members.
        </Typography>
      </Box>
    );
  }

  // For network members, show the full courses interface
  return (
    <Box sx={{ p: 3 }}>
      <CoursesPage />
    </Box>
  );
};

export default CoursesTab;