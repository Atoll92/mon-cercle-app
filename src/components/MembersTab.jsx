import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import UserBadges from './UserBadges';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Typography,
  Avatar,
  Grid,
  TextField,
  InputAdornment,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
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
  Mail as MailIcon,
  FilterList as FilterListIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  EventBusy as EventBusyIcon,
  Clear as ClearIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Language as LanguageIcon,
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
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [uniqueSkills, setUniqueSkills] = useState([]);
  
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
    setSortBy('name');
    setSortDirection('asc');
  };
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Sample social media profiles
  const getSocialMedia = (member) => {
    return {
      facebook: member.facebook_url || null,
      twitter: member.twitter_url || null,
      linkedin: member.linkedin_url || null,
      website: member.website_url || null
    };
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Paper 
      sx={{ 
        p: { xs: 2, md: 3 },
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
        <Typography 
          variant="h5" 
          component="h2"
          sx={{
            color: customLightText,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Box 
            component="span" 
            sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: darkMode ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.light, 0.1),
              color: darkMode ? theme.palette.primary.light : theme.palette.primary.main,
              borderRadius: '50%',
              width: 40,
              height: 40,
              mr: 1.5
            }}
          >
            <Badge
              badgeContent={networkMembers.length}
              color="primary"
              max={999}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.7rem',
                  height: 20,
                  minWidth: 20,
                  padding: '0 4px'
                }
              }}
            >
              <PersonAddIcon />
            </Badge>
          </Box>
          Network Members
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isUserAdmin && (
            <Button
              variant={darkMode ? "contained" : "outlined"}
              color="primary"
              startIcon={<PersonAddIcon />}
              component={Link}
              to="/admin?tab=members"
              sx={{ 
                height: 40,
                borderRadius: 2,
                px: 2,
                boxShadow: darkMode ? '0 4px 12px rgba(25, 118, 210, 0.3)' : 'none'
              }}
            >
              Invite Members
            </Button>
          )}
          
          <Button 
            variant={darkMode ? "contained" : "outlined"}
            color={darkMode ? "secondary" : "primary"}
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ 
              height: 40,
              borderRadius: 2,
              boxShadow: darkMode ? '0 4px 12px rgba(156, 39, 176, 0.3)' : 'none'
            }}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
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
                placeholder="Search members..."
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
                <InputLabel id="role-filter-label">Role</InputLabel>
                <Select
                  labelId="role-filter-label"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="Role"
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="admin">Admins Only</MenuItem>
                  <MenuItem value="member">Regular Members</MenuItem>
                </Select>
              </FormControl>
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
                <InputLabel id="skill-filter-label">Skill</InputLabel>
                <Select
                  labelId="skill-filter-label"
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  label="Skill"
                >
                  <MenuItem value="">All Skills</MenuItem>
                  {uniqueSkills.map(skill => (
                    <MenuItem key={skill} value={skill}>
                      {skill}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
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
                Clear
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
                    Name
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
                    Join Date
                  </Button>
                  
                  <Button
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
                    Skills Count
                  </Button>
                </Box>
                
                <Typography 
                  variant="body2" 
                  color={customFadedText}
                  sx={{ mt: { xs: 2, sm: 0 } }}
                >
                  Showing {displayMembers.length} of {filteredMembers.length} members
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
            No members found
          </Typography>
          <Typography variant="body2" color={customFadedText}>
            Try adjusting your filters or search criteria
          </Typography>
          {(searchTerm || roleFilter !== 'all' || skillFilter) && (
            <Button
              variant="outlined"
              color={darkMode ? "primary" : "secondary"}
              onClick={handleClearFilters}
              sx={{ mt: 3, borderRadius: 2 }}
            >
              Clear Filters
            </Button>
          )}
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',            // Mobile: 2 columns
              sm: 'repeat(3, 1fr)',            // Tablet: 3 columns
              md: 'repeat(4, 1fr)',            // Desktop: 4 columns
              lg: 'repeat(6, 1fr)'             // Large screens: 6 columns
            },
            gap: 3
          }}
        >
          {displayMembers.map((member, index) => {
            const isLastMember = index === displayMembers.length - 1;
            const socialMedia = getSocialMedia(member);
            
            return (
              <Box
                key={member.id}
                ref={isLastMember ? lastMemberRef : null}
                sx={{ width: '100%' }}
              >
                <Card 
                  sx={{ 
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: darkMode ? '0 14px 28px rgba(0,0,0,0.4)' : '0 14px 28px rgba(0,0,0,0.1)'
                    },
                    bgcolor: darkMode ? alpha('#121212', 0.7) : 'background.paper',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: `1px solid ${customBorder}`,
                    position: 'relative'
                  }}
                  onClick={() => onMemberSelect && onMemberSelect(member)}
                  elevation={darkMode ? 4 : 1}
                >
                  {/* Decorative top bar, color based on role */}
                  <Box 
                    sx={{ 
                      height: 8, 
                      width: '100%', 
                      bgcolor: member.role === 'admin' ? 'primary.main' : 'secondary.main',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      zIndex: 1
                    }} 
                  />
                  
                  <CardContent 
                    sx={{ 
                      flexGrow: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      p: 3,
                      pt: 4,
                      position: 'relative',
                      width: '100%'
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <Badge
                        overlap="circular"
                        badgeContent={member.role === 'admin' ? '★' : null}
                        color="primary"
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '1rem',
                            height: '22px',
                            minWidth: '22px',
                            fontWeight: 'bold'
                          }
                        }}
                      >
                        <Avatar
                          src={member.profile_picture_url}
                          sx={{ 
                            width: 90, 
                            height: 90, 
                            mb: 2.5,
                            border: `4px solid ${darkMode ? alpha('#ffffff', 0.1) : theme.palette.primary.light}`,
                            boxShadow: darkMode ? '0 8px 16px rgba(0,0,0,0.5)' : '0 8px 16px rgba(0,0,0,0.1)'
                          }}
                        >
                          {member.full_name ? member.full_name.charAt(0).toUpperCase() : '?'}
                        </Avatar>
                      </Badge>
                      
                      {/* Message button */}
                      {member.id !== activeProfile?.id && (
                        <Tooltip title="Send Message">
                          <IconButton
                            component={Link}
                            to={`/messages/${member.id}`}
                            size="small"
                            onClick={(e) => e.stopPropagation()}
                            color={darkMode ? "inherit" : "primary"}
                            sx={{ 
                              position: 'absolute',
                              bottom: 10,
                              right: -10,
                              color: '#ffffff',
                              bgcolor: darkMode ? theme.palette.primary.dark : theme.palette.primary.main,
                              '&:hover': { 
                                bgcolor: darkMode ? theme.palette.primary.main : theme.palette.primary.dark,
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease',
                              width: 32,
                              height: 32,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                            }}
                          >
                            <MailIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    
                    {/* Name with fixed width container */}
                    <Box 
                      sx={{ 
                        width: '100%',
                        height: '2.4em',
                        mb: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden'
                      }}
                    >
                      <Typography 
                        variant="h6" 
                        component="h3"
                        noWrap={false}
                        sx={{ 
                          fontWeight: 600,
                          color: customLightText,
                          lineHeight: 1.2,
                          textAlign: 'center',
                          width: '100%',
                          maxWidth: '100%',
                          padding: '0 4px',
                          // Proper text truncation with ellipsis
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word',
                          fontSize: '0.8rem',
                        }}
                      >
                        {member.full_name || 'Unnamed User'}
                        {member.id === activeProfile?.id && ' (You)'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      mb: 2, 
                      display: 'flex', 
                      justifyContent: 'center', 
                      flexWrap: 'wrap', 
                      gap: 0.7
                    }}>
                      <Chip 
                        label={member.role === 'admin' ? 'Admin' : 'Member'} 
                        color={member.role === 'admin' ? 'primary' : 'default'}
                        size="small"
                        sx={{ 
                          fontWeight: 500,
                          bgcolor: darkMode ? 
                            (member.role === 'admin' ? alpha('#1976d2', 0.8) : alpha('#333333', 0.8)) : 
                            undefined,
                          '& .MuiChip-label': {
                            px: 1
                          }
                        }}
                      />
                      
                      {member.skills && member.skills.length > 0 && (
                        <Tooltip title={member.skills.join(', ')}>
                          <Chip
                            label={`${member.skills.length} skills`}
                            size="small"
                            color="secondary"
                            sx={{ 
                              fontWeight: 500,
                              bgcolor: darkMode ? alpha('#9c27b0', 0.8) : undefined,
                              '& .MuiChip-label': {
                                px: 1
                              }
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                    
                    {/* User Badges */}
                    {member.badge_count > 0 && (
                      <Box sx={{ mb: 1.5, width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <UserBadges 
                          userId={member.id} 
                          displayMode="icons"
                          maxDisplay={2}
                          showTotal={true}
                        />
                      </Box>
                    )}
                    
                    {/* Social Media Links */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      mb: 2,
                      gap: 1
                    }}>
                      {socialMedia.facebook && (
                        <Tooltip title="Facebook Profile">
                          <IconButton 
                            size="small" 
                            component="a" 
                            href={socialMedia.facebook} 
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            sx={{ 
                              bgcolor: darkMode ? alpha('#3b5998', 0.2) : alpha('#3b5998', 0.1),
                              color: '#3b5998',
                              width: 30,
                              height: 30,
                              '&:hover': { 
                                bgcolor: darkMode ? alpha('#3b5998', 0.3) : alpha('#3b5998', 0.2) 
                              }
                            }}
                          >
                            <FacebookIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {socialMedia.twitter && (
                        <Tooltip title="Twitter Profile">
                          <IconButton 
                            size="small" 
                            component="a" 
                            href={socialMedia.twitter} 
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            sx={{ 
                              bgcolor: darkMode ? alpha('#1DA1F2', 0.2) : alpha('#1DA1F2', 0.1),
                              color: '#1DA1F2',
                              width: 30,
                              height: 30,
                              '&:hover': { 
                                bgcolor: darkMode ? alpha('#1DA1F2', 0.3) : alpha('#1DA1F2', 0.2) 
                              }
                            }}
                          >
                            <TwitterIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {socialMedia.linkedin && (
                        <Tooltip title="LinkedIn Profile">
                          <IconButton 
                            size="small" 
                            component="a" 
                            href={socialMedia.linkedin} 
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            sx={{ 
                              bgcolor: darkMode ? alpha('#0077B5', 0.2) : alpha('#0077B5', 0.1),
                              color: '#0077B5',
                              width: 30,
                              height: 30,
                              '&:hover': { 
                                bgcolor: darkMode ? alpha('#0077B5', 0.3) : alpha('#0077B5', 0.2) 
                              }
                            }}
                          >
                            <LinkedInIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {socialMedia.website && (
                        <Tooltip title="Personal Website">
                          <IconButton 
                            size="small" 
                            component="a" 
                            href={socialMedia.website} 
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            sx={{ 
                              bgcolor: darkMode ? alpha('#4CAF50', 0.2) : alpha('#4CAF50', 0.1),
                              color: '#4CAF50',
                              width: 30,
                              height: 30,
                              '&:hover': { 
                                bgcolor: darkMode ? alpha('#4CAF50', 0.3) : alpha('#4CAF50', 0.2) 
                              }
                            }}
                          >
                            <LanguageIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    
                    {/* Bio with consistent height */}
                    {member.bio && (
                      <Typography 
                        variant="body2" 
                        color={customFadedText} 
                        align="center" 
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.4,
                          height: '2.8em',
                          width: '100%',
                          padding: '0 4px',
                          wordBreak: 'break-word'
                        }}
                      >
                        {member.bio}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>
      )}
      
      {/* Loading indicator for infinite scroll */}
      {loadingMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={32} />
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
            You've reached the end of the member list
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