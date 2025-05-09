import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { createNewsPost, deleteNewsPost } from '../../api/networks';

const NewsTab = ({ networkId, userId, newsPosts, setNewsPosts, members }) => {
  const [newsTitle, setNewsTitle] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start writing your news post...</p>',
    onUpdate: ({ editor }) => {
      // You can access the content with editor.getHTML()
    },
  });

  const handleNewsSubmit = async () => {
    if (!newsTitle.trim() || !editor) {
      setError('Please fill in both title and content');
      return;
    }
  
    setUpdating(true);
    setError(null);
    setMessage('');
    
    const content = editor.getHTML();
    const result = await createNewsPost(networkId, userId, newsTitle, content);
  
    if (result.success) {
      setNewsPosts([result.post, ...newsPosts]);
      setNewsTitle('');
      editor.commands.clearContent();
      setMessage(result.message);
    } else {
      setError(result.message);
    }
  
    setUpdating(false);
  };
  
  const handleDeleteNews = async (postId) => {
    setError(null);
    setMessage('');
    
    const result = await deleteNewsPost(postId);
  
    if (result.success) {
      setNewsPosts(newsPosts.filter(post => post.id !== postId));
      setMessage(result.message);
    } else {
      setError(result.message);
    }
  };

  return (
    <>
      {message && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Create News Post
        </Typography>
        <TextField
          fullWidth
          label="Post Title"
          value={newsTitle}
          onChange={(e) => setNewsTitle(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Paper sx={{ 
          p: 2, 
          border: '1px solid #ddd',
          minHeight: '300px',
          '& .tiptap': {
            minHeight: '250px',
            padding: '8px',
            '&:focus-visible': {
              outline: 'none'
            }
          }
        }}>
          <EditorContent editor={editor} />
        </Paper>
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleNewsSubmit}
            startIcon={<SaveIcon />}
            disabled={updating}
          >
            {updating ? <CircularProgress size={24} /> : 'Publish Post'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => editor?.commands.clearContent()}
          >
            Clear
          </Button>
        </Box>
      </Card>

      <Typography variant="h5" gutterBottom>
        Previous Posts
      </Typography>
      {newsPosts.map(post => (
        <Card key={post.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">{post.title}</Typography>
            <Typography variant="caption" color="text.secondary">
              Posted by {members.find(m => m.id === post.created_by)?.full_name || 'Admin'} • 
              {new Date(post.created_at).toLocaleDateString()}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <div 
              className="tiptap-output"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </CardContent>
          <CardActions>
            <Button 
              size="small" 
              color="error"
              onClick={() => handleDeleteNews(post.id)}
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          </CardActions>
        </Card>
      ))}
    </>
  );
};

export default NewsTab;