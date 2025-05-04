import React from 'react';
import {
  Typography,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import Chat from './Chat';

const ChatTab = ({ networkId, isUserMember }) => {
  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Network Chat
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {isUserMember ? (
        <Chat networkId={networkId} />
      ) : (
        <Alert severity="info">
          You must be a member of this network to participate in the chat
        </Alert>
      )}
    </Paper>
  );
};

export default ChatTab;