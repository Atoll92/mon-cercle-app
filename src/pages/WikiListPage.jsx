// src/pages/WikiListPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseclient';
import {
  Container,
  Paper,
  Typography,
  Box,
  Breadcrumbs,
  Fade,
  alpha,
  useTheme
} from '@mui/material';
import { Link } from 'react-router-dom';
import WikiContent from '../components/WikiContent';

function WikiListPage() {
  const { networkId, categorySlug } = useParams();
  const theme = useTheme();
  const [currentCategory, setCurrentCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategory = async () => {
      if (!categorySlug) {
        setLoading(false);
        return;
      }

      try {
        const { data: categoriesData, error } = await supabase
          .from('wiki_categories')
          .select('*')
          .eq('network_id', networkId)
          .eq('slug', categorySlug)
          .single();

        if (!error) {
          setCurrentCategory(categoriesData);
        }
      } catch (error) {
        console.error('Error fetching category:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [networkId, categorySlug]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, borderRadius: 2, boxShadow: theme.shadows[1] }}>
          {/* Loading will be handled by WikiContent */}
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Fade in={true} timeout={300}>
        <Paper 
          sx={{ 
            p: 4, 
            mb: 3, 
            borderRadius: 2, 
            boxShadow: theme.shadows[1],
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%)'
              : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,1) 100%)'
          }}
        >
          {/* Breadcrumb navigation */}
          <Box sx={{ mb: 3 }}>
            <Breadcrumbs 
              sx={{ 
                '& .MuiBreadcrumbs-separator': { 
                  mx: 1 
                },
                '& a': {
                  textDecoration: 'none',
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.primary.main,
                    textDecoration: 'underline'
                  }
                }
              }}
            >
              <Link to={`/network/${networkId}`}>
                Network
              </Link>
              {currentCategory ? (
                <>
                  <Link to={`/network/${networkId}/wiki`}>
                    Wiki
                  </Link>
                  <Typography color="textPrimary" sx={{ fontWeight: 500 }}>
                    Category: {currentCategory.name}
                  </Typography>
                </>
              ) : (
                <Typography color="textPrimary" sx={{ fontWeight: 500 }}>Wiki</Typography>
              )}
            </Breadcrumbs>
          </Box>

          <WikiContent 
            networkId={networkId} 
            currentCategory={currentCategory}
            showBreadcrumbs={true}
          />
        </Paper>
      </Fade>
    </Container>
  );
}

export default WikiListPage;