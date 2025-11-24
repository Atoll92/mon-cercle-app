import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Link } from 'react-router-dom';
import MemberCard from './MemberCard';
import Spinner from './Spinner';
import {
  Box,
  Button,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Paper,
  Badge,
  alpha,
  useTheme,
  useMediaQuery,
  Fade
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  FilterList as FilterListIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  EventBusy as EventBusyIcon,
  Clear as ClearIcon,
  ArrowUpward as ScrollTopIcon
} from '@mui/icons-material';

// Number of items to load per batch
const ITEMS_PER_BATCH = 24;

const MembersTab = ({ 
  networkMembers = [], 
  user, 
  activeProfile,
  isUserAdmin, 
  networkId, 
  loading = false,
  darkMode = false,
  onMemberSelect,
  onMemberCountChange
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // When using theme.palette.custom, check first if it exists
  // This is for compatibility with both your custom theme and the default theme
  const customLightText = theme.palette.custom?.lightText || (darkMode ? '#ffffff' : '#000000');
  const customFadedText = theme.palette.custom?.fadedText || (darkMode ? alpha('#ffffff', 0.7) : alpha('#000000', 0.7));
  const customBorder = theme.palette.custom?.border || (darkMode ? alpha('#ffffff', 0.1) : alpha('#000000', 0.1));
  
  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('');
  const [sortBy, setSortBy] = useState('random');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [uniqueSkills, setUniqueSkills] = useState([]);
  const [randomSeed, setRandomSeed] = useState(Math.random());

  // Regenerate random seed when component mounts or networkMembers change
  useEffect(() => {
    if (sortBy === 'random') {
      setRandomSeed(Math.random());
    }
  }, [networkMembers.length, sortBy]); // Only regenerate when member count changes or sort becomes random
  
  // State for infinite scrolling
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [displayMembers, setDisplayMembers] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Ref for intersection observer
  const observer = useRef();
  
  // Scroll position tracking
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Extract all unique skills from members for filter dropdown
  useEffect(() => {
    const skills = new Set();
    networkMembers.forEach(member => {
      if (member.skills && Array.isArray(member.skills)) {
        member.skills.forEach(skill => skills.add(skill.toLowerCase()));
      }
    });
    setUniqueSkills(Array.from(skills).sort());
  }, [networkMembers]);

  // Track member count changes for onboarding
  useEffect(() => {
    if (onMemberCountChange) {
      onMemberCountChange(networkMembers.length);
    }
  }, [networkMembers.length, onMemberCountChange]);
  
  // Filter and sort members based on criteria
  const filterAndSortMembers = useCallback(() => {
    // First apply filters
    let filtered = [...networkMembers];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(member => 
        (member.full_name?.toLowerCase().includes(term)) ||
        (member.bio?.toLowerCase().includes(term)) ||
        (member.skills?.some(skill => skill.toLowerCase().includes(term)))
      );
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter);
    }
    
    if (skillFilter) {
      filtered = filtered.filter(member => 
        member.skills?.some(skill => 
          skill.toLowerCase() === skillFilter.toLowerCase()
        )
      );
    }
    
    // Then sort the filtered results
    filtered.sort((a, b) => {
      let compareResult = 0;

      switch (sortBy) {
        case 'random':
          // Use a deterministic random sort based on the seed and member IDs
          const hashA = (a.id + randomSeed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const hashB = (b.id + randomSeed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          compareResult = hashA - hashB;
          break;
        case 'name':
          compareResult = (a.full_name || '').localeCompare(b.full_name || '');
          break;
        case 'joinDate':
          compareResult = new Date(a.created_at || 0) - new Date(b.created_at || 0);
          break;
        case 'skillCount':
          compareResult = (a.skills?.length || 0) - (b.skills?.length || 0);
          break;
        default:
          compareResult = (a.full_name || '').localeCompare(b.full_name || '');
      }

      return sortDirection === 'asc' ? compareResult : -compareResult;
    });
    
    setFilteredMembers(filtered);
    setHasMore(filtered.length > ITEMS_PER_BATCH);
    
    // Update display members
    const initialBatch = filtered.slice(0, ITEMS_PER_BATCH);
    setDisplayMembers(initialBatch);
    
    // Scroll to top when filters change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [networkMembers, searchTerm, roleFilter, skillFilter, sortBy, sortDirection]);
  
  // Load more members for infinite scroll
  const loadMoreMembers = useCallback(() => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      const currentCount = displayMembers.length;
      const nextBatch = filteredMembers.slice(
        currentCount, 
        currentCount + ITEMS_PER_BATCH
      );
      
      if (nextBatch.length === 0) {
        setHasMore(false);
      } else {
        setDisplayMembers(prevMembers => [...prevMembers, ...nextBatch]);
        setHasMore(currentCount + nextBatch.length < filteredMembers.length);
      }
      
      setLoadingMore(false);
    }, 300);
  }, [filteredMembers, displayMembers.length, hasMore, loadingMore]);
  
  // Callback for intersection observer
  const lastMemberRef = useCallback(node => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreMembers();
      }
    }, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    });
    
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, loadMoreMembers]);
  
  // Initial filtering and when filters change
  useEffect(() => {
    filterAndSortMembers();
  }, [filterAndSortMembers, networkMembers, searchTerm, roleFilter, skillFilter, sortBy, sortDirection]);
  
  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('asc');
    }
  };
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setSkillFilter('');
    setSortBy('random');
    setSortDirection('asc');
    setRandomSeed(Math.random()); // Generate new random order
  };
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Spinner size={120} />
      </Box>
    );
  }
  
  return (
    <Paper 
      sx={{ 
        p: { xs: 2, md: 3 },
        mt: 1.5,
        borderRadius: 2,
        bgcolor: darkMode ? alpha('#000000', 0.2) : 'background.paper',
        boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)'
      }}
      elevation={darkMode ? 4 : 1}
    >
      {/* Header with search and filters */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap',
        mb: 3,
        gap: 2
      }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-end' } }}>
          {isUserAdmin && (
            <Button
              variant={darkMode ? "contained" : "outlined"}
              color="primary"
              startIcon={<PersonAddIcon />}
              component={Link}
              to="/admin?tab=members"
              sx={{ 
                minHeight: 40,
                height: 'auto',
                borderRadius: 2,
                px: 2,
                py: 1,
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                textAlign: 'center',
                boxShadow: darkMode ? '0 4px 12px rgba(25, 118, 210, 0.3)' : 'none'
              }}
            >
              {t('membersTab.inviteMembers')}
            </Button>
          )}
          
          <Button 
            variant={darkMode ? "contained" : "outlined"}
            color={darkMode ? "secondary" : "primary"}
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ 
              minHeight: 40,
              height: 'auto',
              borderRadius: 2,
              py: 1,
              px: 2,
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              textAlign: 'center',
              boxShadow: darkMode ? '0 4px 12px rgba(156, 39, 176, 0.3)' : 'none'
            }}
          >
            {showFilters ? t('membersTab.hideFilters') : t('membersTab.showFilters')}
          </Button>
        </Box>
      </Box>
      
      {/* Search and filters */}
      {showFilters && (
        <Paper 
          sx={{ 
            p: { xs: 2, md: 3 }, 
            mb: 3,
            backgroundColor: darkMode ? alpha('#121212', 0.6) : alpha('#f5f5f5', 0.7),
            backdropFilter: 'blur(8px)',
            borderRadius: 2,
            border: `1px solid ${customBorder}`
          }}
          elevation={darkMode ? 3 : 1}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder={t('membersTab.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color={darkMode ? "primary" : "action"} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton 
                        size="small" 
                        onClick={() => setSearchTerm('')}
                        sx={{ color: customLightText }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                  sx: { 
                    bgcolor: darkMode ? alpha('#000000', 0.2) : alpha('#ffffff', 0.9),
                    color: customLightText,
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: customBorder
                    }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl 
                fullWidth 
                size="small"
                sx={{ 
                  bgcolor: darkMode ? alpha('#000000', 0.2) : alpha('#ffffff', 0.9),
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    color: customLightText,
                    borderRadius: 2
                  },
                  '& .MuiInputLabel-root': {
                    color: customFadedText
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: customBorder
                  }
                }}
              >
                <InputLabel id="role-filter-label">{t('membersTab.role')}</InputLabel>
                <Select
                  labelId="role-filter-label"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="Role"
                >
                  <MenuItem value="all">{t('membersTab.allRoles')}</MenuItem>
                  <MenuItem value="admin">{t('membersTab.adminsOnly')}</MenuItem>
                  <MenuItem value="member">{t('membersTab.regularMembers')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* <Grid item xs={12} sm={6} md={3}>
              <FormControl 
                fullWidth 
                size="small"
                sx={{ 
                  bgcolor: darkMode ? alpha('#000000', 0.2) : alpha('#ffffff', 0.9),
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    color: customLightText,
                    borderRadius: 2
                  },
                  '& .MuiInputLabel-root': {
                    color: customFadedText
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: customBorder
                  }
                }}
              >
                <InputLabel id="skill-filter-label">{t('membersTab.skill')}</InputLabel>
                <Select
                  labelId="skill-filter-label"
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  label="Skill"
                >
                  <MenuItem value="">{t('membersTab.allSkills')}</MenuItem>
                  {uniqueSkills.map(skill => (
                    <MenuItem key={skill} value={skill}>
                      {skill}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid> */}
            
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                color={darkMode ? "error" : "secondary"}
                onClick={handleClearFilters}
                startIcon={<ClearIcon />}
                sx={{ 
                  height: '40px',
                  borderRadius: 2,
                  borderColor: darkMode ? alpha('#f44336', 0.5) : undefined
                }}
              >
                {t('membersTab.clear')}
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                mt: 1
              }}>
                <Box sx={{
                  display: 'flex',
                  gap: 1,
                  flexWrap: 'wrap',
                  '& button': {
                    minWidth: 'auto',
                    borderRadius: 8
                  }
                }}>
                  <Button
                    size="small"
                    color={sortBy === 'random' ? 'primary' : 'inherit'}
                    onClick={() => {
                      setSortBy('random');
                      setRandomSeed(Math.random()); // Generate new random order
                    }}
                    sx={{
                      color: darkMode ? (sortBy === 'random' ? 'primary.light' : customLightText) : 'inherit',
                      textTransform: 'none',
                      fontWeight: sortBy === 'random' ? 600 : 400,
                      bgcolor: sortBy === 'random' ? (darkMode ? alpha('#1976d2', 0.1) : alpha('#1976d2', 0.05)) : 'transparent'
                    }}
                  >
                    {t('membersTab.random') || 'Random'}
                  </Button>

                  <Button
                    size="small"
                    color={sortBy === 'name' ? 'primary' : 'inherit'}
                    onClick={() => handleSortChange('name')}
                    startIcon={sortBy === 'name' && (sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                    sx={{
                      color: darkMode ? (sortBy === 'name' ? 'primary.light' : customLightText) : 'inherit',
                      textTransform: 'none',
                      fontWeight: sortBy === 'name' ? 600 : 400,
                      bgcolor: sortBy === 'name' ? (darkMode ? alpha('#1976d2', 0.1) : alpha('#1976d2', 0.05)) : 'transparent'
                    }}
                  >
                    {t('membersTab.name')}
                  </Button>

                  <Button
                    size="small"
                    color={sortBy === 'joinDate' ? 'primary' : 'inherit'}
                    onClick={() => handleSortChange('joinDate')}
                    startIcon={sortBy === 'joinDate' && (sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                    sx={{
                      color: darkMode ? (sortBy === 'joinDate' ? 'primary.light' : customLightText) : 'inherit',
                      textTransform: 'none',
                      fontWeight: sortBy === 'joinDate' ? 600 : 400,
                      bgcolor: sortBy === 'joinDate' ? (darkMode ? alpha('#1976d2', 0.1) : alpha('#1976d2', 0.05)) : 'transparent'
                    }}
                  >
                    {t('membersTab.joinDate')}
                  </Button>
                  
                  {/* <Button
                    size="small"
                    color={sortBy === 'skillCount' ? 'primary' : 'inherit'}
                    onClick={() => handleSortChange('skillCount')}
                    startIcon={sortBy === 'skillCount' && (sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                    sx={{ 
                      color: darkMode ? (sortBy === 'skillCount' ? 'primary.light' : customLightText) : 'inherit',
                      textTransform: 'none',
                      fontWeight: sortBy === 'skillCount' ? 600 : 400,
                      bgcolor: sortBy === 'skillCount' ? (darkMode ? alpha('#1976d2', 0.1) : alpha('#1976d2', 0.05)) : 'transparent'
                    }}
                  >
                    {t('membersTab.skillsCount')}
                  </Button> */}
                </Box>
                
                <Typography 
                  variant="body2" 
                  color={customFadedText}
                  sx={{ mt: { xs: 2, sm: 0 } }}
                >
                  {t('membersTab.showingMembers', { showing: displayMembers.length, total: filteredMembers.length })}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Members grid/list */}
      {filteredMembers.length === 0 ? (
        <Paper 
          sx={{ 
            py: 6,
            px: 4, 
            textAlign: 'center',
            bgcolor: darkMode ? alpha('#000000', 0.2) : alpha('#f5f5f5', 0.7),
            backdropFilter: 'blur(8px)',
            borderRadius: 2,
            border: `1px solid ${customBorder}`
          }}
          elevation={darkMode ? 2 : 0}
        >
          <EventBusyIcon sx={{ fontSize: 70, color: darkMode ? alpha('#ffffff', 0.2) : 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom color={customLightText}>
            {t('membersTab.noMembersFound')}
          </Typography>
          <Typography variant="body2" color={customFadedText}>
            {t('membersTab.adjustFilters')}
          </Typography>
          {(searchTerm || roleFilter !== 'all' || skillFilter) && (
            <Button
              variant="outlined"
              color={darkMode ? "primary" : "secondary"}
              onClick={handleClearFilters}
              sx={{ mt: 3, borderRadius: 2 }}
            >
              {t('membersTab.clearFilters')}
            </Button>
          )}
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',            // Mobile: 1 column
              sm: 'repeat(2, 1fr)',            // Small tablets: 2 columns
              md: 'repeat(3, 1fr)',            // Tablets/Small desktop: 3 columns
              lg: 'repeat(4, 1fr)',            // Desktop and up: 4 columns max
              xl: 'repeat(4, 1fr)'             // Large screens: still 4 columns max
            },
            gap: 3
          }}
        >
          {displayMembers.map((member, index) => {
            const isLastMember = index === displayMembers.length - 1;
            
            return (
              <MemberCard
                key={member.id}
                member={member}
                activeProfile={activeProfile}
                darkMode={darkMode}
                onMemberSelect={onMemberSelect}
                isLastMember={isLastMember}
                lastMemberRef={lastMemberRef}
              />
            );
          })}
        </Box>
      )}
      
      {/* Loading indicator for infinite scroll */}
      {loadingMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <Spinner size={64} />
        </Box>
      )}
      
      {/* End of content message */}
      {!hasMore && displayMembers.length > 0 && !loadingMore && (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 3,
            mt: 2,
            color: customFadedText,
            borderTop: `1px solid ${customBorder}`
          }}
        >
          <Typography variant="body2">
            {t('membersTab.endOfList')}
          </Typography>
        </Box>
      )}
      
      {/* Scroll to top button */}
      {displayMembers.length > 10 && showScrollTop && (
        <Fade in={showScrollTop}>
          <IconButton 
            onClick={scrollToTop}
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 100,
              bgcolor: theme.palette.primary.main,
              color: '#ffffff',
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <ScrollTopIcon />
          </IconButton>
        </Fade>
      )}
    </Paper>
  );
};

export default MembersTab;