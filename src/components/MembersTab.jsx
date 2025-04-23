import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Typography,
  Avatar,
  Grid,
  TextField,
  InputAdornment,
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Tooltip,
  Paper,
  Badge,
  alpha
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Mail as MailIcon,
  FilterList as FilterListIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationOnIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  EventBusy as EventBusyIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import VirtualizedMemberList from './VirtualizedMemberList';

const MembersTab = ({ 
  networkMembers = [], 
  user, 
  isUserAdmin, 
  networkId, 
  loading = false,
  darkMode = false,
  onMemberSelect
}) => {
  // State for filtering and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [displayMembers, setDisplayMembers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [uniqueSkills, setUniqueSkills] = useState([]);
  
  const itemsPerPage = viewMode === 'grid' ? 12 : 10;
  
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
  
  // Filter and sort members based on search, filters, and sort criteria
  const filterAndSortMembers = useCallback(() => {
    // First apply filters
    let filtered = networkMembers;
    
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
    
    // Update pagination
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayMembers(filtered.slice(startIndex, endIndex));
  }, [networkMembers, searchTerm, roleFilter, skillFilter, sortBy, sortDirection, page, itemsPerPage]);
  
  // Update filtered members when filters or sort changes
  useEffect(() => {
    filterAndSortMembers();
  }, [filterAndSortMembers]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, roleFilter, skillFilter, sortBy, sortDirection, viewMode]);
  
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
  
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  
  // Check if there are too many members for efficient rendering
  const useLargeDataStrategy = networkMembers.length > 500;
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ position: 'relative' }}>
      {/* Header with search and filters */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap',
        mb: 3,
        gap: 2
      }}>
        <Typography variant="h5" component="h2">
          Network Members ({networkMembers.length})
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isUserAdmin && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAddIcon />}
              component={Link}
              to="/admin"
              sx={{ height: 40 }}
            >
              Invite Members
            </Button>
          )}
          
          <Button 
            variant={darkMode ? "outlined" : "contained"}
            color={darkMode ? "inherit" : "primary"}
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ 
              height: 40,
              backgroundColor: darkMode ? alpha('#fff', 0.1) : null
            }}
          >
            Filters
          </Button>
        </Box>
      </Box>
      
      {/* Search and filters */}
      <Paper 
        sx={{ 
          p: 2, 
          mb: 3,
          backgroundColor: darkMode ? alpha('#000', 0.2) : alpha('#f5f5f5', 0.7),
          backdropFilter: 'blur(8px)',
          display: showFilters ? 'block' : 'none'
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
                      sx={{ color: darkMode ? 'white' : 'text.secondary' }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: { 
                  bgcolor: darkMode ? alpha('#000', 0.1) : alpha('#fff', 0.9),
                  color: darkMode ? 'white' : 'inherit' 
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl 
              fullWidth 
              size="small"
              sx={{ 
                bgcolor: darkMode ? alpha('#000', 0.1) : alpha('#fff', 0.9),
                '& .MuiOutlinedInput-root': {
                  color: darkMode ? 'white' : 'inherit'
                },
                '& .MuiInputLabel-root': {
                  color: darkMode ? alpha('white', 0.7) : 'inherit'
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
                bgcolor: darkMode ? alpha('#000', 0.1) : alpha('#fff', 0.9),
                '& .MuiOutlinedInput-root': {
                  color: darkMode ? 'white' : 'inherit'
                },
                '& .MuiInputLabel-root': {
                  color: darkMode ? alpha('white', 0.7) : 'inherit'
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
              color={darkMode ? "inherit" : "secondary"}
              onClick={handleClearFilters}
              startIcon={<ClearIcon />}
              sx={{ height: '40px' }}
            >
              Clear
            </Button>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  color={sortBy === 'name' ? 'primary' : 'inherit'}
                  onClick={() => handleSortChange('name')}
                  startIcon={sortBy === 'name' && (sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)}
                  sx={{ 
                    color: darkMode ? (sortBy === 'name' ? 'primary.light' : 'white') : 'inherit',
                    textTransform: 'none'
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
                    color: darkMode ? (sortBy === 'joinDate' ? 'primary.light' : 'white') : 'inherit',
                    textTransform: 'none'
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
                    color: darkMode ? (sortBy === 'skillCount' ? 'primary.light' : 'white') : 'inherit',
                    textTransform: 'none'
                  }}
                >
                  Skills Count
                </Button>
              </Box>
              
              <Typography variant="body2" color={darkMode ? "white" : "text.secondary"}>
                Showing {filteredMembers.length} of {networkMembers.length} members
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Members grid/list */}
      {filteredMembers.length === 0 ? (
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            bgcolor: darkMode ? alpha('#000', 0.2) : alpha('#f5f5f5', 0.7),
            backdropFilter: 'blur(8px)'
          }}
        >
          <EventBusyIcon sx={{ fontSize: 60, color: darkMode ? 'gray' : 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom color={darkMode ? "white" : "text.primary"}>
            No members found
          </Typography>
          <Typography variant="body2" color={darkMode ? "gray" : "text.secondary"}>
            Try adjusting your filters or search criteria
          </Typography>
          {(searchTerm || roleFilter !== 'all' || skillFilter) && (
            <Button
              variant="outlined"
              color={darkMode ? "inherit" : "primary"}
              onClick={handleClearFilters}
              sx={{ mt: 2 }}
            >
              Clear Filters
            </Button>
          )}
        </Paper>
      ) : useLargeDataStrategy ? (
        // For very large datasets, use a virtualized list
        <VirtualizedMemberList 
          members={filteredMembers} 
          user={user} 
          darkMode={darkMode}
          onMemberSelect={onMemberSelect}
        />
      ) : (
        // Regular grid display for normal sized datasets
        <Grid container spacing={3}>
          {displayMembers.map((member) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={member.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  },
                  bgcolor: darkMode ? alpha('#000', 0.3) : 'background.paper',
                  backdropFilter: darkMode ? 'blur(8px)' : 'none',
                  borderRadius: 2,
                  border: darkMode ? `1px solid ${alpha('#fff', 0.1)}` : 'none'
                }}
                onClick={() => onMemberSelect && onMemberSelect(member)}
              >
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                  <Badge
                    overlap="circular"
                    badgeContent={member.role === 'admin' ? '★' : null}
                    color="primary"
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '1rem',
                        height: '22px',
                        minWidth: '22px'
                      }
                    }}
                  >
                    <Avatar
                      src={member.profile_picture_url}
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        mb: 2,
                        border: `3px solid ${darkMode ? alpha('#fff', 0.2) : '#f0f0f0'}`,
                        boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    >
                      {member.full_name ? member.full_name.charAt(0).toUpperCase() : '?'}
                    </Avatar>
                  </Badge>
                  
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    align="center" 
                    gutterBottom
                    sx={{ 
                      mt: 1, 
                      fontWeight: 600,
                      color: darkMode ? 'white' : 'text.primary'
                    }}
                  >
                    {member.full_name || 'Unnamed User'}
                    {member.id === user?.id && ' (You)'}
                  </Typography>
                  
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip 
                      label={member.role === 'admin' ? 'Admin' : 'Member'} 
                      color={member.role === 'admin' ? 'primary' : 'default'}
                      size="small"
                      sx={{ 
                        bgcolor: darkMode ? 
                          (member.role === 'admin' ? alpha('#1976d2', 0.8) : alpha('#333', 0.8)) : 
                          undefined
                      }}
                    />
                    
                    {member.skills && member.skills.length > 0 && (
                      <Tooltip title={member.skills.join(', ')}>
                        <Chip
                          label={`${member.skills.length} skills`}
                          size="small"
                          color="secondary"
                          sx={{ 
                            bgcolor: darkMode ? alpha('#9c27b0', 0.8) : undefined
                          }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                  
                  {member.bio && (
                    <Typography 
                      variant="body2" 
                      color={darkMode ? alpha('white', 0.7) : "text.secondary"} 
                      align="center" 
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        mb: 2
                      }}
                    >
                      {member.bio}
                    </Typography>
                  )}
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'center', p: 2, pt: 0 }}>
                  <Button
                    variant={darkMode ? "outlined" : "contained"}
                    component={Link}
                    to={`/profile/${member.id}`}
                    size="small"
                    onClick={(e) => e.stopPropagation()}
                    sx={{ 
                      minWidth: '120px',
                      color: darkMode ? 'white' : undefined,
                      borderColor: darkMode ? alpha('white', 0.3) : undefined,
                      '&:hover': {
                        borderColor: darkMode ? 'white' : undefined
                      }
                    }}
                  >
                    View Profile
                  </Button>
                  
                  {member.id !== user?.id && (
                    <IconButton
                      component={Link}
                      to={`/messages/${member.id}`}
                      size="small"
                      onClick={(e) => e.stopPropagation()}
                      color={darkMode ? "inherit" : "primary"}
                      sx={{ 
                        ml: 1,
                        color: darkMode ? 'white' : undefined,
                        '&:hover': { 
                          bgcolor: darkMode ? alpha('white', 0.1) : undefined
                        }
                      }}
                    >
                      <MailIcon fontSize="small" />
                    </IconButton>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Pagination controls */}
      {!useLargeDataStrategy && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            siblingCount={1}
          />
        </Box>
      )}
    </Box>
  );
};

export default MembersTab;