import React from 'react';
import {
  Typography,
  Paper,
  Divider,
  Card,
  CardContent,
  Box
} from '@mui/material';

const NewsTab = ({ networkNews = [], networkMembers = [] }) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Network News
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {networkNews.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No news posts available
        </Typography>
      ) : (
        networkNews.map(post => (
          <Card key={post.id} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {post.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Posted by {networkMembers.find(m => m.id === post.created_by)?.full_name || 'Admin'} • 
                {new Date(post.created_at).toLocaleDateString()}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box 
                className="tiptap-output"
                dangerouslySetInnerHTML={{ __html: post.content }}
                sx={{
                  '& ul': { listStyleType: 'disc', pl: 2 },
                  '& ol': { listStyleType: 'decimal', pl: 2 },
                  '& h1': { fontSize: '2em' },
                  '& h2': { fontSize: '1.5em' }
                }}
              />
            </CardContent>
          </Card>
        ))
      )}
    </Paper>
  );
};

export default NewsTab;