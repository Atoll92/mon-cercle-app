import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  FormHelperText,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
  useTheme,
  Tabs,
  Tab,
  Badge as MuiBadge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  Switch,
  FormControlLabel,
  Autocomplete,
  Checkbox
} from '@mui/material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  WorkspacePremium as PremiumIcon,
  TrendingUp as TrendingUpIcon,
  Event as EventIcon,
  Chat as ChatIcon,
  Loyalty as LoyaltyIcon,
  Security as SecurityIcon,
  Favorite as FavoriteIcon,
  Psychology as PsychologyIcon,
  Groups as GroupsIcon,
  School as SchoolIcon,
  Verified as VerifiedIcon,
  LocalFireDepartment as FireIcon,
  AutoAwesome as AutoAwesomeIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  EmojiPeople as EmojiPeopleIcon,
  Timer as TimerIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

import {
  fetchNetworkBadges,
  createBadge,
  updateBadge,
  deleteBadge,
  fetchUserBadges,
  awardBadge,
  revokeBadge,
  fetchTopEngagedUsers,
  awardBadgeToMultipleUsers
} from '../../api/badges';
import { useProfile } from '../../context/profileContext';

// Icon mapping for badge icons
const BADGE_ICONS = {
  Star: StarIcon,
  Trophy: TrophyIcon,
  Premium: PremiumIcon,
  TrendingUp: TrendingUpIcon,
  Event: EventIcon,
  Chat: ChatIcon,
  Loyalty: LoyaltyIcon,
  Security: SecurityIcon,
  Favorite: FavoriteIcon,
  Psychology: PsychologyIcon,
  Groups: GroupsIcon,
  School: SchoolIcon,
  Verified: VerifiedIcon,
  Fire: FireIcon,
  AutoAwesome: AutoAwesomeIcon,
  EmojiPeople: EmojiPeopleIcon,
  Timer: TimerIcon,
  Assignment: AssignmentIcon
};

const BadgesTab = ({ networkId, members, darkMode }) => {
  const theme = useTheme();
  const { activeProfile } = useProfile();
  const [activeTab, setActiveTab] = useState(0);
  const [badges, setBadges] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Dialog states
  const [badgeDialog, setBadgeDialog] = useState({ open: false, badge: null });
  const [awardDialog, setAwardDialog] = useState({ open: false, badge: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, badge: null });

  // Form states
  const [badgeForm, setBadgeForm] = useState({
    name: '',
    description: '',
    icon: 'Star',
    color: 'primary',
    criteria_type: 'manual',
    criteria_value: 0
  });

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [awardReason, setAwardReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadBadges();
    loadTopUsers();
  }, [networkId]);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const data = await fetchNetworkBadges(networkId);
      setBadges(data);
    } catch (err) {
      console.error('Error loading badges:', err);
      setError('Failed to load badges');
    } finally {
      setLoading(false);
    }
  };

  const loadTopUsers = async () => {
    try {
      const data = await fetchTopEngagedUsers(networkId, 10);
      setTopUsers(data);
    } catch (err) {
      console.error('Error loading top users:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadBadges(), loadTopUsers()]);
    setRefreshing(false);
  };

  const handleCreateBadge = async () => {
    try {
      const result = await createBadge({
        ...badgeForm,
        network_id: networkId,
        criteria_value: parseInt(badgeForm.criteria_value) || 0
      });

      if (result.success) {
        setSuccess(result.message);
        await loadBadges();
        setBadgeDialog({ open: false, badge: null });
        resetBadgeForm();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to create badge');
    }
  };

  const handleUpdateBadge = async () => {
    try {
      const result = await updateBadge(badgeDialog.badge.id, {
        ...badgeForm,
        criteria_value: parseInt(badgeForm.criteria_value) || 0
      });

      if (result.success) {
        setSuccess(result.message);
        await loadBadges();
        setBadgeDialog({ open: false, badge: null });
        resetBadgeForm();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to update badge');
    }
  };

  const handleDeleteBadge = async () => {
    try {
      const result = await deleteBadge(deleteDialog.badge.id);

      if (result.success) {
        setSuccess(result.message);
        await loadBadges();
        setDeleteDialog({ open: false, badge: null });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to delete badge');
    }
  };

  const handleAwardBadge = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    try {
      const result = await awardBadgeToMultipleUsers(
        selectedUsers.map(u => u.id),
        awardDialog.badge.id,
        activeProfile?.id,
        awardReason || null
      );

      if (result.success) {
        setSuccess(result.message);
        setAwardDialog({ open: false, badge: null });
        setSelectedUsers([]);
        setAwardReason('');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to award badge');
    }
  };

  const resetBadgeForm = () => {
    setBadgeForm({
      name: '',
      description: '',
      icon: 'Star',
      color: 'primary',
      criteria_type: 'manual',
      criteria_value: 0
    });
  };

  const openBadgeDialog = (badge = null) => {
    if (badge) {
      setBadgeForm({
        name: badge.name,
        description: badge.description || '',
        icon: badge.icon,
        color: badge.color,
        criteria_type: badge.criteria_type,
        criteria_value: badge.criteria_value
      });
    } else {
      resetBadgeForm();
    }
    setBadgeDialog({ open: true, badge });
  };

  const renderBadgeIcon = (iconName, color = 'primary', size = 'medium') => {
    const IconComponent = BADGE_ICONS[iconName] || StarIcon;
    return (
      <IconComponent
        color={color}
        fontSize={size}
        sx={{
          filter: darkMode ? 'brightness(1.2)' : 'none'
        }}
      />
    );
  };

  const renderCriteriaText = (badge) => {
    switch (badge.criteria_type) {
      case 'manual':
        return 'Manually awarded by admins';
      case 'posts_count':
        return `Automatically awarded after ${badge.criteria_value} posts`;
      case 'events_attended':
        return `Automatically awarded after attending ${badge.criteria_value} events`;
      case 'messages_sent':
        return `Automatically awarded after sending ${badge.criteria_value} messages`;
      case 'member_duration':
        return `Automatically awarded after ${badge.criteria_value} days of membership`;
      default:
        return badge.criteria_type;
    }
  };

  const filteredMembers = members.filter(member =>
    member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.contact_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={600}>
          Engagement & Badges
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={20} /> : <TrendingUpIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh Stats
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openBadgeDialog()}
          >
            Create Badge
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Badge Management" />
          <Tab label="Top Contributors" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        /* Badge Management Tab */
        <Grid container spacing={3}>
          {badges.map((badge) => (
            <Grid item xs={12} sm={6} md={4} key={badge.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[8]
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette[badge.color].main, 0.1),
                        width: 56,
                        height: 56,
                        mr: 2
                      }}
                    >
                      {renderBadgeIcon(badge.icon, badge.color, 'large')}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {badge.name}
                      </Typography>
                      {badge.is_active ? (
                        <Chip
                          label="Active"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          label="Inactive"
                          color="default"
                          size="small"
                        />
                      )}
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {badge.description}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    {renderCriteriaText(badge)}
                  </Typography>
                </CardContent>

                <Divider />

                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EmojiPeopleIcon />}
                    onClick={() => setAwardDialog({ open: true, badge })}
                    disabled={badge.criteria_type !== 'manual'}
                  >
                    Award
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => openBadgeDialog(badge)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteDialog({ open: true, badge })}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 1 && (
        /* Top Contributors Tab */
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Most Active Members
              </Typography>
              <List>
                {topUsers.map((stat, index) => (
                  <React.Fragment key={stat.user_id}>
                    <ListItem>
                      <ListItemAvatar>
                        <MuiBadge
                          badgeContent={index + 1}
                          color={index < 3 ? 'primary' : 'default'}
                        >
                          <Avatar src={stat.user?.profile_picture_url}>
                            {stat.user?.full_name?.charAt(0).toUpperCase()}
                          </Avatar>
                        </MuiBadge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={stat.user?.full_name || 'Unknown User'}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                            <Chip
                              size="small"
                              icon={<AssignmentIcon />}
                              label={`${stat.posts_count} posts`}
                            />
                            <Chip
                              size="small"
                              icon={<EventIcon />}
                              label={`${stat.events_attended} events`}
                            />
                            <Chip
                              size="small"
                              icon={<ChatIcon />}
                              label={`${stat.messages_sent} messages`}
                            />
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        {stat.user?.badge_count > 0 && (
                          <Chip
                            icon={<VerifiedIcon />}
                            label={`${stat.user.badge_count} badges`}
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < topUsers.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Engagement Overview
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.1)
                  }}
                >
                  <Typography variant="h4" color="primary">
                    {badges.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Badges Created
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.success.main, 0.1)
                  }}
                >
                  <Typography variant="h4" color="success.main">
                    {badges.filter(b => b.is_active).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Badges
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.info.main, 0.1)
                  }}
                >
                  <Typography variant="h4" color="info.main">
                    {badges.filter(b => b.criteria_type !== 'manual').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Automatic Badges
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Create/Edit Badge Dialog */}
      <Dialog
        open={badgeDialog.open}
        onClose={() => setBadgeDialog({ open: false, badge: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {badgeDialog.badge ? 'Edit Badge' : 'Create New Badge'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Badge Name"
              value={badgeForm.name}
              onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Description"
              value={badgeForm.description}
              onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Icon</InputLabel>
                  <Select
                    value={badgeForm.icon}
                    onChange={(e) => setBadgeForm({ ...badgeForm, icon: e.target.value })}
                    label="Icon"
                  >
                    {Object.keys(BADGE_ICONS).map((iconName) => (
                      <MenuItem key={iconName} value={iconName}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {renderBadgeIcon(iconName)}
                          <span>{iconName}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Color</InputLabel>
                  <Select
                    value={badgeForm.color}
                    onChange={(e) => setBadgeForm({ ...badgeForm, color: e.target.value })}
                    label="Color"
                  >
                    <MenuItem value="primary">Primary</MenuItem>
                    <MenuItem value="secondary">Secondary</MenuItem>
                    <MenuItem value="success">Success</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <FormControl fullWidth>
              <InputLabel>Award Criteria</InputLabel>
              <Select
                value={badgeForm.criteria_type}
                onChange={(e) => setBadgeForm({ ...badgeForm, criteria_type: e.target.value })}
                label="Award Criteria"
              >
                <MenuItem value="manual">Manual (Admin awards)</MenuItem>
                <MenuItem value="posts_count">Post Count</MenuItem>
                <MenuItem value="events_attended">Events Attended</MenuItem>
                <MenuItem value="messages_sent">Messages Sent</MenuItem>
                <MenuItem value="member_duration">Days as Member</MenuItem>
              </Select>
              <FormHelperText>
                {badgeForm.criteria_type === 'manual'
                  ? 'Admins will manually award this badge'
                  : 'Badge will be automatically awarded when threshold is met'}
              </FormHelperText>
            </FormControl>

            {badgeForm.criteria_type !== 'manual' && (
              <TextField
                label="Threshold Value"
                type="number"
                value={badgeForm.criteria_value}
                onChange={(e) => setBadgeForm({ ...badgeForm, criteria_value: e.target.value })}
                fullWidth
                InputProps={{
                  inputProps: { min: 0 }
                }}
                helperText={
                  badgeForm.criteria_type === 'member_duration'
                    ? 'Number of days'
                    : `Number of ${badgeForm.criteria_type.replace('_', ' ')}`
                }
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBadgeDialog({ open: false, badge: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={badgeDialog.badge ? handleUpdateBadge : handleCreateBadge}
            disabled={!badgeForm.name}
          >
            {badgeDialog.badge ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Award Badge Dialog */}
      <Dialog
        open={awardDialog.open}
        onClose={() => setAwardDialog({ open: false, badge: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Award "{awardDialog.badge?.name}" Badge
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Search members"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />

            <TextField
              label="Reason for awarding (optional)"
              value={awardReason}
              onChange={(e) => setAwardReason(e.target.value)}
              fullWidth
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" gutterBottom>
              Select members to award badge:
            </Typography>

            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={
                          selectedUsers.length > 0 &&
                          selectedUsers.length < filteredMembers.length
                        }
                        checked={
                          filteredMembers.length > 0 &&
                          selectedUsers.length === filteredMembers.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(filteredMembers);
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>Member</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Current Badges</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMembers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((member) => {
                      const isSelected = selectedUsers.some(u => u.id === member.id);
                      return (
                        <TableRow
                          key={member.id}
                          hover
                          onClick={() => {
                            if (isSelected) {
                              setSelectedUsers(selectedUsers.filter(u => u.id !== member.id));
                            } else {
                              setSelectedUsers([...selectedUsers, member]);
                            }
                          }}
                          selected={isSelected}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox checked={isSelected} />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar
                                src={member.profile_picture_url}
                                sx={{ width: 32, height: 32 }}
                              >
                                {member.full_name?.charAt(0).toUpperCase()}
                              </Avatar>
                              {member.full_name || 'Unknown'}
                            </Box>
                          </TableCell>
                          <TableCell>{member.contact_email}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={`${member.badge_count || 0} badges`}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredMembers.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAwardDialog({ open: false, badge: null });
            setSelectedUsers([]);
            setAwardReason('');
            setSearchQuery('');
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAwardBadge}
            disabled={selectedUsers.length === 0}
            startIcon={<CheckCircleIcon />}
          >
            Award to {selectedUsers.length} Member{selectedUsers.length !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Badge Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, badge: null })}
      >
        <DialogTitle>Delete Badge</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the "{deleteDialog.badge?.name}" badge?
            This will also remove it from all users who have earned it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, badge: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteBadge}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BadgesTab;