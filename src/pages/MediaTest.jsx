import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import MediaPlayer from '../components/MediaPlayer';

function MediaTest() {
  // Test data
  const testMedia = [
    {
      id: 1,
      type: 'video',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      title: 'Test Video'
    },
    {
      id: 2,
      type: 'audio',
      url: 'https://www.w3schools.com/html/horse.mp3',
      title: 'Test Audio'
    }
  ];

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Media Player Test Page
      </Typography>
      
      {testMedia.map(media => (
        <Paper key={media.id} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {media.title} ({media.type})
          </Typography>
          <MediaPlayer
            src={media.url}
            type={media.type}
            title={media.title}
            compact={false}
            darkMode={false}
          />
        </Paper>
      ))}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test News Item Display
        </Typography>
        <Box>
          {/* Simulate news item with media */}
          <Typography>Media Type: VIDEO</Typography>
          <Typography>Media URL: {testMedia[0].url}</Typography>
          <Box sx={{ mt: 2 }}>
            {testMedia[0].url && 'VIDEO' === 'VIDEO' ? (
              <MediaPlayer
                src={testMedia[0].url}
                type="video"
                title="News Video"
                compact={false}
                darkMode={false}
              />
            ) : (
              <Typography>No media to display</Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default MediaTest;