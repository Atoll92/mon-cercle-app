import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import LinkPreview from '../components/LinkPreview';

function LinkPreviewTest() {
  const testUrls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://github.com',
    'https://www.nytimes.com',
    'https://example.com',
    'google.com'
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        LinkPreview Component Test
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {testUrls.map((url, index) => (
          <Paper key={index} sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Testing URL: {url}
            </Typography>
            <LinkPreview 
              url={url} 
              compact={false} 
              isEditable={true} 
              height="auto" 
            />
          </Paper>
        ))}
      </Box>
    </Container>
  );
}

export default LinkPreviewTest;