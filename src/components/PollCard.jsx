import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Checkbox,
  FormGroup,
  LinearProgress,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Poll as PollIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { submitVote, getUserVote, getPollWithVotes } from '../api/polls';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';

const PollCard = ({ poll, onVoteSubmit }) => {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [userVote, setUserVote] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [pollStats, setPollStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeProfile) {
      fetchUserVote();
    }
  }, [poll.id, activeProfile]);

  const fetchUserVote = async () => {
    if (!activeProfile) return;
    
    setLoading(true);
    const { data: voteData } = await getUserVote(poll.id, activeProfile.id);
    if (voteData) {
      setUserVote(voteData);
      setHasVoted(true);
      setSelectedOptions(voteData.selected_options);
      // Fetch poll stats if user has voted
      fetchPollStats();
    } else {
      setHasVoted(false);
    }
    setLoading(false);
  };

  const fetchPollStats = async () => {
    const { data } = await getPollWithVotes(poll.id);
    if (data) {
      setPollStats(data.stats);
    }
  };

  const handleVote = async () => {
    if (!activeProfile) {
      setError('Please select a profile to vote');
      return;
    }
    
    if (selectedOptions.length === 0) {
      setError('Please select at least one option');
      return;
    }

    setSubmitting(true);
    setError(null);

    const { data, error } = await submitVote(poll.id, selectedOptions, activeProfile.id);
    
    if (error) {
      setError('Failed to submit vote');
      setSubmitting(false);
    } else {
      setHasVoted(true);
      setUserVote(data);
      await fetchPollStats();
      if (onVoteSubmit) {
        onVoteSubmit(poll.id);
      }
      setSubmitting(false);
    }
  };

  const handleOptionChange = (value) => {
    if (poll.poll_type === 'multiple_choice' && poll.allow_multiple_votes) {
      // Toggle selection for checkboxes
      setSelectedOptions(prev => 
        prev.includes(value) 
          ? prev.filter(v => v !== value)
          : [...prev, value]
      );
    } else {
      // Single selection for radio buttons
      setSelectedOptions([value]);
    }
  };

  const handleDateToggle = (date) => {
    setSelectedOptions(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  const isExpired = poll.ends_at && new Date(poll.ends_at) < new Date();
  const canVote = !hasVoted && !isExpired && poll.status === 'active';

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <PollIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              {poll.title}
            </Typography>
            {poll.description && (
              <Typography variant="body2" color="text.secondary" paragraph>
                {poll.description}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            icon={<PeopleIcon />}
            label={`${pollStats?.totalVotes || 0} votes`}
            size="small"
            variant="outlined"
          />
          {poll.ends_at && (
            <Chip
              icon={<ScheduleIcon />}
              label={`${isExpired ? 'Ended' : 'Ends'} ${new Date(poll.ends_at).toLocaleDateString()}`}
              size="small"
              variant="outlined"
              color={isExpired ? 'default' : 'primary'}
            />
          )}
          {poll.is_anonymous && (
            <Chip label="Anonymous" size="small" variant="outlined" />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Multiple Choice Poll */}
        {poll.poll_type === 'multiple_choice' && (
          <Box>
            {canVote ? (
              <FormControl component="fieldset" fullWidth>
                {poll.allow_multiple_votes ? (
                  <FormGroup>
                    {poll.options.map((option) => (
                      <FormControlLabel
                        key={option.id}
                        control={
                          <Checkbox
                            checked={selectedOptions.includes(option.id)}
                            onChange={() => handleOptionChange(option.id)}
                          />
                        }
                        label={option.text}
                      />
                    ))}
                  </FormGroup>
                ) : (
                  <RadioGroup
                    value={selectedOptions[0] || ''}
                    onChange={(e) => handleOptionChange(e.target.value)}
                  >
                    {poll.options.map((option) => (
                      <FormControlLabel
                        key={option.id}
                        value={option.id}
                        control={<Radio />}
                        label={option.text}
                      />
                    ))}
                  </RadioGroup>
                )}
              </FormControl>
            ) : (
              <Box>
                {pollStats?.options && Object.values(pollStats.options).map((option) => (
                  <Box key={option.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">
                        {option.text}
                        {userVote?.selected_options.includes(option.id) && (
                          <CheckCircleIcon sx={{ ml: 1, fontSize: 16, color: 'primary.main' }} />
                        )}
                      </Typography>
                      <Typography variant="body2">
                        {option.count} ({option.percentage}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={option.percentage}
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: userVote?.selected_options.includes(option.id) 
                            ? 'primary.main' 
                            : 'grey.400'
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Yes/No Poll */}
        {poll.poll_type === 'yes_no' && (
          <Box>
            {canVote ? (
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={selectedOptions[0] || ''}
                  onChange={(e) => handleOptionChange(e.target.value)}
                  row
                >
                  <FormControlLabel
                    value="yes"
                    control={<Radio />}
                    label="Yes"
                    sx={{ flex: 1 }}
                  />
                  <FormControlLabel
                    value="no"
                    control={<Radio />}
                    label="No"
                    sx={{ flex: 1 }}
                  />
                </RadioGroup>
              </FormControl>
            ) : (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {pollStats?.options.yes.percentage}%
                  </Typography>
                  <Typography variant="body2">
                    Yes ({pollStats?.options.yes.count})
                    {userVote?.selected_options[0] === 'yes' && (
                      <CheckCircleIcon sx={{ ml: 1, fontSize: 16 }} />
                    )}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {pollStats?.options.no.percentage}%
                  </Typography>
                  <Typography variant="body2">
                    No ({pollStats?.options.no.count})
                    {userVote?.selected_options[0] === 'no' && (
                      <CheckCircleIcon sx={{ ml: 1, fontSize: 16 }} />
                    )}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Date Picker Poll */}
        {poll.poll_type === 'date_picker' && (
          <Box>
            <List dense>
              {poll.options.map((dateStr) => {
                const date = new Date(dateStr);
                const isSelected = selectedOptions.includes(dateStr);
                const voteCount = pollStats?.dateVotes?.[dateStr]?.count || 0;
                
                return (
                  <ListItem key={dateStr} disablePadding>
                    <ListItemButton
                      onClick={() => canVote && handleDateToggle(dateStr)}
                      selected={isSelected}
                      disabled={!canVote}
                    >
                      <ListItemIcon>
                        {canVote ? (
                          <Checkbox
                            edge="start"
                            checked={isSelected}
                            tabIndex={-1}
                            disableRipple
                          />
                        ) : (
                          <EventIcon />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={date.toLocaleDateString()}
                        secondary={date.toLocaleTimeString()}
                      />
                      {hasVoted && (
                        <Chip
                          label={`${voteCount} vote${voteCount !== 1 ? 's' : ''}`}
                          size="small"
                          color={userVote?.selected_options.includes(dateStr) ? 'primary' : 'default'}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}

        {/* Vote Button */}
        {canVote && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleVote}
              disabled={submitting || selectedOptions.length === 0}
              startIcon={submitting ? <CircularProgress size={16} /> : null}
            >
              {submitting ? 'Submitting...' : 'Submit Vote'}
            </Button>
          </Box>
        )}

        {/* Status Messages */}
        {hasVoted && !isExpired && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Thank you for voting!
          </Alert>
        )}

        {isExpired && (
          <Alert severity="info" sx={{ mt: 2 }}>
            This poll has ended.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default PollCard;