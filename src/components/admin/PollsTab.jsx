import React, { useState, useEffect } from 'react';
import { formatDate, formatDateTime } from '../../utils/dateFormatting';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  Grid,
  Paper,
  LinearProgress,
  FormControlLabel,
  Switch,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Stack,
  Divider
} from '@mui/material';
import Spinner from '../Spinner';
import MemberDetailsModal from '../MembersDetailModal';
import {
  Add as AddIcon,
  Poll as PollIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  BarChart as StatsIcon,
  DateRange as DateRangeIcon,
  People as PeopleIcon,
  Download as DownloadIcon,
  HowToVote as HowToVoteIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  createPoll, 
  getNetworkPolls, 
  getPollWithVotes, 
  updatePollStatus, 
  deletePoll 
} from '../../api/polls';
import { useProfile } from '../../context/profileContext';

const exportPollToCsv = (poll) => {
  if (!poll || !poll.votes) return;

  const rows = [];
  const isAnonymous = poll.is_anonymous;

  if (poll.poll_type === 'multiple_choice') {
    const headers = isAnonymous
      ? ['Option', 'Vote Count', 'Percentage']
      : ['Voter', 'Selected Options', 'Voted At'];
    rows.push(headers);

    if (isAnonymous) {
      Object.values(poll.stats.options).forEach(opt => {
        rows.push([opt.text, opt.count, `${opt.percentage}%`]);
      });
      rows.push([]);
      rows.push(['Total Votes', poll.stats.totalVotes]);
    } else {
      poll.votes.forEach(vote => {
        const optionTexts = vote.selected_options.map(optId => {
          const opt = poll.options?.find(o => o.id === optId);
          return opt ? opt.text : optId;
        });
        rows.push([
          vote.user?.full_name || 'Unknown',
          optionTexts.join('; '),
          new Date(vote.created_at).toLocaleString()
        ]);
      });
    }
  } else if (poll.poll_type === 'yes_no') {
    const headers = isAnonymous
      ? ['Answer', 'Vote Count', 'Percentage']
      : ['Voter', 'Answer', 'Voted At'];
    rows.push(headers);

    if (isAnonymous) {
      rows.push(['Yes', poll.stats.options.yes.count, `${poll.stats.options.yes.percentage}%`]);
      rows.push(['No', poll.stats.options.no.count, `${poll.stats.options.no.percentage}%`]);
      rows.push([]);
      rows.push(['Total Votes', poll.stats.totalVotes]);
    } else {
      poll.votes.forEach(vote => {
        rows.push([
          vote.user?.full_name || 'Unknown',
          vote.selected_options[0],
          new Date(vote.created_at).toLocaleString()
        ]);
      });
    }
  } else if (poll.poll_type === 'date_picker') {
    const headers = isAnonymous
      ? ['Date', 'Vote Count']
      : ['Voter', 'Selected Dates', 'Voted At'];
    rows.push(headers);

    if (isAnonymous) {
      Object.entries(poll.stats.dateVotes)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .forEach(([date, data]) => {
          rows.push([new Date(date).toLocaleString(), data.count]);
        });
      rows.push([]);
      rows.push(['Total Votes', poll.stats.totalVotes]);
    } else {
      poll.votes.forEach(vote => {
        rows.push([
          vote.user?.full_name || 'Unknown',
          vote.selected_options.map(d => new Date(d).toLocaleString()).join('; '),
          new Date(vote.created_at).toLocaleString()
        ]);
      });
    }
  }

  const csvContent = rows.map(row =>
    row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `poll-${poll.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const PollsTab = ({ networkId }) => {
  const { activeProfile } = useProfile();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDetailsModal, setShowMemberDetailsModal] = useState(false);
  
  // Form state
  const [pollForm, setPollForm] = useState({
    title: '',
    description: '',
    poll_type: 'multiple_choice',
    options: [],
    allow_multiple_votes: false,
    is_anonymous: true,
    ends_at: null
  });
  const [newOption, setNewOption] = useState('');
  const [dateOptions, setDateOptions] = useState([]);

  useEffect(() => {
    fetchPolls();
  }, [networkId]);

  const fetchPolls = async () => {
    setLoading(true);
    const { data, error } = await getNetworkPolls(networkId);
    if (error) {
      setError('Failed to fetch polls');
      console.error(error);
    } else {
      setPolls(data || []);
    }
    setLoading(false);
  };

  const handleCreatePoll = async () => {
    if (!activeProfile) {
      setError('Profile is required to create a poll');
      return;
    }
    
    if (!pollForm.title.trim()) {
      setError('Poll title is required');
      return;
    }

    if (pollForm.poll_type === 'multiple_choice' && pollForm.options.length < 2) {
      setError('Please add at least 2 options');
      return;
    }

    if (pollForm.poll_type === 'date_picker' && dateOptions.length < 2) {
      setError('Please add at least 2 date options');
      return;
    }

    const pollData = {
      network_id: networkId,
      title: pollForm.title,
      description: pollForm.description,
      poll_type: pollForm.poll_type,
      allow_multiple_votes: pollForm.allow_multiple_votes,
      is_anonymous: pollForm.is_anonymous,
      ends_at: pollForm.ends_at,
      status: 'active'
    };

    if (pollForm.poll_type === 'multiple_choice') {
      pollData.options = pollForm.options.map((opt, index) => ({
        id: `option_${index}`,
        text: opt
      }));
    } else if (pollForm.poll_type === 'date_picker') {
      pollData.options = dateOptions;
    }

    const pollDataWithCreator = {
      ...pollData,
      created_by: activeProfile?.id
    };
    
    const { error } = await createPoll(pollDataWithCreator);
    if (error) {
      setError('Failed to create poll');
      console.error(error);
    } else {
      setSuccess('Poll created successfully');
      setCreateDialogOpen(false);
      resetForm();
      fetchPolls();
    }
  };

  const handleClosePoll = async (pollId) => {
    const { error } = await updatePollStatus(pollId, 'closed');
    if (error) {
      setError('Failed to close poll');
    } else {
      setSuccess('Poll closed successfully');
      fetchPolls();
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (window.confirm('Are you sure you want to delete this poll?')) {
      const { error } = await deletePoll(pollId);
      if (error) {
        setError('Failed to delete poll');
      } else {
        setSuccess('Poll deleted successfully');
        fetchPolls();
      }
    }
  };

  const handleViewStats = async (poll) => {
    setSelectedPoll(poll);
    setStatsDialogOpen(true);
    
    const { data, error } = await getPollWithVotes(poll.id);
    if (!error && data) {
      setSelectedPoll(data);
    }
  };

  const resetForm = () => {
    setPollForm({
      title: '',
      description: '',
      poll_type: 'multiple_choice',
      options: [],
      allow_multiple_votes: false,
      is_anonymous: true,
      ends_at: null
    });
    setNewOption('');
    setDateOptions([]);
  };

  const addOption = () => {
    if (newOption.trim()) {
      setPollForm({
        ...pollForm,
        options: [...pollForm.options, newOption.trim()]
      });
      setNewOption('');
    }
  };

  const removeOption = (index) => {
    setPollForm({
      ...pollForm,
      options: pollForm.options.filter((_, i) => i !== index)
    });
  };

  const addDateOption = (date) => {
    if (date) {
      setDateOptions([...dateOptions, date.toISOString()]);
    }
  };

  const removeDateOption = (index) => {
    setDateOptions(dateOptions.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <Spinner />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Polls Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setError(null);
            setCreateDialogOpen(true);
          }}
        >
          Create Poll
        </Button>
      </Box>

      {/* Alerts */}
      {error && !createDialogOpen && !statsDialogOpen && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Polls List */}
      {polls.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PollIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No polls yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create your first poll to engage with your network members
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create First Poll
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {polls.map((poll) => (
            <Grid item xs={12} md={6} key={poll.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {poll.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {poll.description}
                      </Typography>
                    </Box>
                    <Chip
                      label={poll.status}
                      color={poll.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<PollIcon />}
                      label={poll.poll_type.replace('_', ' ')}
                      size="small"
                      variant="outlined"
                    />
                    {poll.votes && (
                      <Chip
                        icon={<PeopleIcon />}
                        label={`${poll.votes[0]?.count || 0} votes`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {poll.is_anonymous && (
                      <Chip label="Anonymous" size="small" variant="outlined" />
                    )}
                    {poll.ends_at && (
                      <Chip
                        icon={<ScheduleIcon />}
                        label={`Ends ${formatDate(poll.ends_at)}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      startIcon={<StatsIcon />}
                      onClick={() => handleViewStats(poll)}
                    >
                      View Results
                    </Button>
                    {poll.status === 'active' && (
                      <Button
                        size="small"
                        color="warning"
                        onClick={() => handleClosePoll(poll.id)}
                      >
                        Close Poll
                      </Button>
                    )}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeletePoll(poll.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Poll Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setError(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Poll</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Poll Title"
              value={pollForm.title}
              onChange={(e) => setPollForm({ ...pollForm, title: e.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description (optional)"
              value={pollForm.description}
              onChange={(e) => setPollForm({ ...pollForm, description: e.target.value })}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Poll Type</InputLabel>
              <Select
                value={pollForm.poll_type}
                onChange={(e) => setPollForm({ ...pollForm, poll_type: e.target.value })}
                label="Poll Type"
              >
                <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                <MenuItem value="yes_no">Yes/No Question</MenuItem>
                <MenuItem value="date_picker">Date Picker</MenuItem>
              </Select>
            </FormControl>

            {/* Multiple Choice Options */}
            {pollForm.poll_type === 'multiple_choice' && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Options
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Add option"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addOption()}
                    />
                    <Button onClick={addOption} variant="outlined">
                      Add
                    </Button>
                  </Box>
                  <List dense>
                    {pollForm.options.map((option, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={option} />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => removeOption(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={pollForm.allow_multiple_votes}
                      onChange={(e) => setPollForm({ ...pollForm, allow_multiple_votes: e.target.checked })}
                    />
                  }
                  label="Allow multiple selections"
                  sx={{ mb: 2 }}
                />
              </>
            )}

            {/* Date Picker Options */}
            {pollForm.poll_type === 'date_picker' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Date Options
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Add date option"
                    onChange={addDateOption}
                    renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 1 }} />}
                  />
                </LocalizationProvider>
                <List dense>
                  {dateOptions.map((date, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={formatDateTime(date)} />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => removeDateOption(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={pollForm.is_anonymous}
                  onChange={(e) => setPollForm({ ...pollForm, is_anonymous: e.target.checked })}
                />
              }
              label="Anonymous voting"
              sx={{ mb: 2 }}
            />

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="End date (optional)"
                value={pollForm.ends_at}
                onChange={(date) => setPollForm({ ...pollForm, ends_at: date })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          {error && createDialogOpen && (
            <Alert severity="error" sx={{ flex: 1, mr: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Button onClick={() => {
            setCreateDialogOpen(false);
            setError(null);
          }}>Cancel</Button>
          <Button onClick={handleCreatePoll} variant="contained">
            Create Poll
          </Button>
        </DialogActions>
      </Dialog>

      {/* Poll Stats Dialog */}
      <Dialog
        open={statsDialogOpen}
        onClose={() => setStatsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" component="span">Poll Results: {selectedPoll?.title}</Typography>
              {selectedPoll?.is_anonymous && (
                <Chip icon={<VisibilityOffIcon />} label="Anonymous" size="small" sx={{ ml: 1 }} />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {selectedPoll?.stats && (
                <Tooltip title="Export to CSV">
                  <IconButton onClick={() => exportPollToCsv(selectedPoll)}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              )}
              <IconButton onClick={() => setStatsDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPoll?.stats && (
            <Box>
              {/* Poll meta info */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Chip
                  icon={<HowToVoteIcon />}
                  label={`${selectedPoll.stats.totalVotes} vote${selectedPoll.stats.totalVotes !== 1 ? 's' : ''}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={selectedPoll.status === 'active' ? 'Active' : 'Closed'}
                  color={selectedPoll.status === 'active' ? 'success' : 'default'}
                  size="small"
                />
                <Chip
                  label={selectedPoll.poll_type.replace('_', ' ')}
                  size="small"
                  variant="outlined"
                />
                {selectedPoll.ends_at && (
                  <Chip
                    icon={<ScheduleIcon />}
                    label={`Ends ${formatDateTime(selectedPoll.ends_at)}`}
                    size="small"
                    variant="outlined"
                  />
                )}
                {selectedPoll.created_by_profile && (
                  <Chip
                    label={`Created by ${selectedPoll.created_by_profile.full_name}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>

              {selectedPoll.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {selectedPoll.description}
                </Typography>
              )}

              <Divider sx={{ mb: 2 }} />

              {/* Multiple Choice Results */}
              {selectedPoll.poll_type === 'multiple_choice' && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Results Breakdown
                  </Typography>
                  {Object.values(selectedPoll.stats.options).map((option) => (
                    <Box key={option.id} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography>{option.text}</Typography>
                        <Typography fontWeight="bold">
                          {option.count} ({option.percentage}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={option.percentage}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  ))}
                </Box>
              )}

              {/* Yes/No Results */}
              {selectedPoll.poll_type === 'yes_no' && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Results Breakdown
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                        <Typography variant="h4">
                          {selectedPoll.stats.options.yes.percentage}%
                        </Typography>
                        <Typography>Yes ({selectedPoll.stats.options.yes.count})</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                        <Typography variant="h4">
                          {selectedPoll.stats.options.no.percentage}%
                        </Typography>
                        <Typography>No ({selectedPoll.stats.options.no.count})</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Date Picker Results */}
              {selectedPoll.poll_type === 'date_picker' && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Date Availability
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell align="center">Votes</TableCell>
                          {!selectedPoll.is_anonymous && <TableCell>Voters</TableCell>}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(selectedPoll.stats.dateVotes)
                          .sort(([a], [b]) => new Date(a) - new Date(b))
                          .map(([date, data]) => (
                            <TableRow key={date}>
                              <TableCell>{formatDateTime(date)}</TableCell>
                              <TableCell align="center">
                                <Chip label={data.count} size="small" color="primary" />
                              </TableCell>
                              {!selectedPoll.is_anonymous && (
                                <TableCell>
                                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                    {data.users.map((user) => (
                                      <Chip
                                        key={user.id}
                                        avatar={<Avatar sx={{ width: 20, height: 20 }}>{user.full_name?.[0]}</Avatar>}
                                        label={user.full_name}
                                        size="small"
                                        variant="outlined"
                                        onClick={() => {
                                          setSelectedMember(user);
                                          setShowMemberDetailsModal(true);
                                        }}
                                        sx={{ cursor: 'pointer' }}
                                      />
                                    ))}
                                  </Stack>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Detailed Voters Table (admin view) */}
              {selectedPoll.votes && selectedPoll.votes.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    <PeopleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    {selectedPoll.is_anonymous ? 'Vote Details (anonymous - names hidden from members)' : 'Voter Details'}
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Voter</TableCell>
                          <TableCell>Selection</TableCell>
                          <TableCell>Voted At</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedPoll.votes.map((vote) => {
                          const getSelectionDisplay = () => {
                            if (selectedPoll.poll_type === 'yes_no') {
                              return (
                                <Chip
                                  label={vote.selected_options[0]}
                                  size="small"
                                  color={vote.selected_options[0] === 'yes' ? 'success' : 'error'}
                                />
                              );
                            }
                            if (selectedPoll.poll_type === 'date_picker') {
                              return vote.selected_options.map(d => formatDateTime(d)).join(', ');
                            }
                            // multiple_choice
                            return vote.selected_options.map(optId => {
                              const opt = selectedPoll.options?.find(o => o.id === optId);
                              return opt ? opt.text : optId;
                            }).join(', ');
                          };

                          return (
                            <TableRow key={vote.id} hover>
                              <TableCell>
                                <Box
                                  sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
                                  onClick={() => {
                                    if (vote.user) {
                                      setSelectedMember(vote.user);
                                      setShowMemberDetailsModal(true);
                                    }
                                  }}
                                >
                                  <Avatar
                                    src={vote.user?.profile_picture_url}
                                    sx={{ width: 28, height: 28 }}
                                  >
                                    {vote.user?.full_name?.[0]}
                                  </Avatar>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      '&:hover': { color: 'primary.main', textDecoration: 'underline' }
                                    }}
                                  >
                                    {vote.user?.full_name || 'Unknown'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{getSelectionDisplay()}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {formatDateTime(vote.created_at)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* No votes yet */}
              {selectedPoll.stats.totalVotes === 0 && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <HowToVoteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary">No votes yet</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => exportPollToCsv(selectedPoll)}
            disabled={!selectedPoll?.stats || selectedPoll?.stats.totalVotes === 0}
          >
            Export CSV
          </Button>
          <Button onClick={() => setStatsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Member Details Modal */}
      {selectedMember && (
        <MemberDetailsModal
          open={showMemberDetailsModal}
          onClose={() => {
            setShowMemberDetailsModal(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
        />
      )}
    </Box>
  );
};

export default PollsTab;