import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  TableSortLabel,
  Tooltip,
  IconButton,
  Chip,
  alpha
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Image as ImageIcon,
  Visibility as VisibilityIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import CreateNewsDialog from '../CreateNewsDialog';
import { deleteNewsPost } from '../../api/networks';
import { fetchNetworkCategories } from '../../api/categories';
import { formatDate } from '../../utils/dateFormatting';

const NewsTab = ({ networkId, userId, newsPosts, setNewsPosts, members, darkMode = false }) => {
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedNews, setSelectedNews] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState('desc');
  const [categories, setCategories] = useState([]);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await fetchNetworkCategories(networkId, true);
      if (data && !error) {
        setCategories(data);
      }
    };
    loadCategories();
  }, [networkId]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleViewNews = (newsId) => {
    navigate(`/network/${networkId}/news/${newsId}`);
  };

  const sortedNews = useMemo(() => {
    return [...newsPosts].sort((a, b) => {
      let aValue, bValue;
      
      switch (orderBy) {
        case 'date':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'author':
          const authorA = members.find(m => m.id === a.created_by)?.full_name || 'Unknown';
          const authorB = members.find(m => m.id === b.created_by)?.full_name || 'Unknown';
          aValue = authorA.toLowerCase();
          bValue = authorB.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [newsPosts, order, orderBy, members]);

  const handleOpenDialog = (mode, news = null) => {
    setDialogMode(mode);
    setSelectedNews(news);
    setOpenDialog(true);
  };

  const handleDelete = async (newsId) => {
    if (!confirm('Are you sure you want to delete this news?')) return;
    
    try {
      const result = await deleteNewsPost(newsId);
      
      if (result.success) {
        setNewsPosts(newsPosts.filter(p => p.id !== newsId));
        setMessage('News deleted successfully');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(`Failed to delete news: ${err.message}`);
    }
  };

  const getAuthorName = (createdBy) => {
    const member = members.find(m => m.id === createdBy);
    return member?.full_name || 'Unknown Author';
  };

  const truncateContent = (html, maxLength = 100) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <>
      {message && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      {error && !openDialog && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Network News</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          New News
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mt: 2, overflowX: 'auto' }}>
        <Table size="small" aria-label="news table" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ width: 60 }}>Image</TableCell>
              <TableCell sx={{ width: '30%', minWidth: 200 }}>
                <TableSortLabel
                  active={orderBy === 'title'}
                  direction={orderBy === 'title' ? order : 'asc'}
                  onClick={() => handleRequestSort('title')}
                >
                  Title
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: '20%', minWidth: 150 }}>
                <TableSortLabel
                  active={orderBy === 'author'}
                  direction={orderBy === 'author' ? order : 'asc'}
                  onClick={() => handleRequestSort('author')}
                >
                  Author
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: 120 }}>Category</TableCell>
              <TableCell sx={{ width: 140 }}>
                <TableSortLabel
                  active={orderBy === 'date'}
                  direction={orderBy === 'date' ? order : 'asc'}
                  onClick={() => handleRequestSort('date')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sx={{ width: 120 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedNews.map((post) => (
              <TableRow
                key={post.id}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' 
                  },
                  height: 60 
                }}
              >
                <TableCell padding="checkbox">
                  {(post.media_url && post.media_type === 'image') || post.image_url ? (
                    <Avatar
                      variant="rounded"
                      src={post.media_type === 'image' ? post.media_url : post.image_url}
                      sx={{ width: 40, height: 40 }}
                    >
                      <ImageIcon />
                    </Avatar>
                  ) : post.media_url ? (
                    <Avatar
                      variant="rounded"
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        bgcolor: darkMode ? 'grey.800' : 'grey.200' 
                      }}
                    >
                      <ArticleIcon color="action" />
                    </Avatar>
                  ) : (
                    <Avatar
                      variant="rounded"
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        bgcolor: darkMode ? 'grey.800' : 'grey.200' 
                      }}
                    >
                      <ImageIcon color="action" />
                    </Avatar>
                  )}
                </TableCell>
                <TableCell sx={{ maxWidth: 0, overflow: 'hidden' }}>
                  <Box>
                    <Typography variant="body2" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {post.title}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      noWrap 
                      sx={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        display: 'block'
                      }}
                    >
                      {truncateContent(post.content)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {getAuthorName(post.created_by)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {post.category && (
                    <Chip 
                      label={post.category.name}
                      size="small"
                      sx={{ 
                        bgcolor: post.category.color || '#666',
                        color: 'white',
                        fontSize: '0.75rem'
                      }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {formatDate(post.created_at)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                    <Tooltip title="View news">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewNews(post.id)}
                        sx={{ padding: 0.5 }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit news">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog('edit', post)}
                        sx={{ padding: 0.5 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete news">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(post.id)}
                        sx={{ padding: 0.5 }}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateNewsDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setError(null);
        }}
        networkId={networkId}
        profileId={userId}
        editingNews={dialogMode === 'edit' ? selectedNews : null}
        onNewsCreated={(newNews) => {
          setNewsPosts([newNews, ...newsPosts]);
          setMessage('News created successfully!');
          setOpenDialog(false);
        }}
        onNewsUpdated={(updatedNews) => {
          setNewsPosts(newsPosts.map(n => n.id === updatedNews.id ? updatedNews : n));
          setMessage('News updated successfully!');
          setOpenDialog(false);
        }}
        darkMode={darkMode}
      />

    </>
  );
};

export default NewsTab;