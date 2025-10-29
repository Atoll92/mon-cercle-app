/**
 * Analytics Dashboard Component
 * Comprehensive user experience monitoring for soft launch
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Create as CreateIcon,
  Login as LoginIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { supabase } from '../../supabaseclient';
import { getAnalyticsSummary, getRecentErrors } from '../../api/analytics';
import { formatDate } from '../../utils/dateFormatting';
import Spinner from '../Spinner';

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getAnalyticsSummary(supabase);

      if (result.error) {
        throw new Error(result.error);
      }

      setAnalytics(result.data);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Spinner size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Failed to load analytics: {error}
      </Alert>
    );
  }

  if (!analytics) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        No analytics data available
      </Alert>
    );
  }

  const { summary, onboardingFunnel, eventCounts, recentErrors, healthMetrics, engagementMetrics } = analytics;

  // Calculate funnel conversion rates
  const funnelSteps = [
    { label: 'Sign Ups', count: onboardingFunnel.signups, rate: 100 },
    { label: 'Network Created', count: onboardingFunnel.networkCreated, rate: (onboardingFunnel.networkCreated / onboardingFunnel.signups * 100) || 0 },
    { label: 'Members Invited', count: onboardingFunnel.membersInvited, rate: (onboardingFunnel.membersInvited / onboardingFunnel.signups * 100) || 0 },
    { label: 'Profile Completed', count: onboardingFunnel.profileCompleted, rate: (onboardingFunnel.profileCompleted / onboardingFunnel.signups * 100) || 0 },
    { label: 'First Post', count: onboardingFunnel.firstPostCreated, rate: (onboardingFunnel.firstPostCreated / onboardingFunnel.signups * 100) || 0 }
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            User Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor user experiences and onboarding flow
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Analytics">
            <IconButton onClick={loadAnalytics}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="overline">
                    Total Users
                  </Typography>
                  <Typography variant="h4" component="div">
                    {summary.totalUsers}
                  </Typography>
                </Box>
                <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="overline">
                    Active Users (7d)
                  </Typography>
                  <Typography variant="h4" component="div">
                    {summary.activeUsers7d}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {summary.totalUsers > 0 ? ((summary.activeUsers7d / summary.totalUsers) * 100).toFixed(1) : 0}% of total
                  </Typography>
                </Box>
                <LoginIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="overline">
                    Total Networks
                  </Typography>
                  <Typography variant="h4" component="div">
                    {summary.totalNetworks}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {summary.totalMembers} members
                  </Typography>
                </Box>
                <BusinessIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="overline">
                    Recent Errors
                  </Typography>
                  <Typography variant="h4" component="div">
                    {summary.errorCount7d}
                  </Typography>
                  <Typography variant="caption" color={summary.errorCount7d > 10 ? 'error' : 'text.secondary'}>
                    Last 7 days
                  </Typography>
                </Box>
                <ErrorIcon color={summary.errorCount7d > 10 ? 'error' : 'warning'} sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Onboarding Funnel */}
      <Card sx={{ mb: 4 }}>
        <CardHeader
          title="Onboarding Funnel"
          subheader="User progression through key onboarding steps"
          avatar={<TrendingUpIcon color="primary" />}
        />
        <CardContent>
          <Grid container spacing={3}>
            {funnelSteps.map((step, index) => (
              <Grid item xs={12} key={step.label}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {index + 1}. {step.label}
                      </Typography>
                      {step.rate >= 70 ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : step.rate >= 40 ? (
                        <WarningIcon color="warning" fontSize="small" />
                      ) : (
                        <ErrorIcon color="error" fontSize="small" />
                      )}
                    </Box>
                    <Typography variant="body1" fontWeight="bold">
                      {step.count} ({step.rate.toFixed(1)}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(step.rate, 100)}
                    color={step.rate >= 70 ? 'success' : step.rate >= 40 ? 'warning' : 'error'}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  {index < funnelSteps.length - 1 && (
                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Drop-off: {((1 - (funnelSteps[index + 1].count / step.count)) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Network Health Metrics */}
      <Card sx={{ mb: 4 }}>
        <CardHeader
          title="Network Health Metrics"
          subheader="Activity and engagement by network"
          avatar={<BusinessIcon color="info" />}
        />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Network</TableCell>
                <TableCell align="right">Members</TableCell>
                <TableCell align="right">New (7d)</TableCell>
                <TableCell align="right">Active (7d)</TableCell>
                <TableCell align="right">Profile Completion</TableCell>
                <TableCell align="right">Total Posts</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {healthMetrics.slice(0, 10).map((network) => (
                <TableRow key={network.network_id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {network.network_name}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{network.total_members}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={network.new_members_7d || 0}
                      size="small"
                      color={network.new_members_7d > 0 ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={network.active_posters_7d || 0}
                      size="small"
                      color={network.active_posters_7d > 0 ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                      <Typography variant="body2">
                        {network.profile_completion_rate?.toFixed(0) || 0}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={network.profile_completion_rate || 0}
                        sx={{ width: 60, height: 4, borderRadius: 2 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="right">{network.total_posts || 0}</TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(network.network_created)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* User Engagement Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Top Engaged Users"
              subheader="Users by login count"
              avatar={<LoginIcon color="success" />}
            />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell align="right">Total Logins</TableCell>
                    <TableCell align="right">Logins (7d)</TableCell>
                    <TableCell align="right">Posts</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {engagementMetrics
                    .sort((a, b) => b.total_logins - a.total_logins)
                    .slice(0, 10)
                    .map((user) => (
                      <TableRow key={user.user_id} hover>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {user.email}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={user.total_logins} size="small" color="primary" />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={user.logins_7d}
                            size="small"
                            color={user.logins_7d > 0 ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">{user.total_posts}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Feature Usage"
              subheader="Most used features (7d)"
              avatar={<CreateIcon color="info" />}
            />
            <CardContent>
              {Object.keys(eventCounts).length > 0 ? (
                <Box>
                  {Object.entries(eventCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([event, count]) => (
                      <Box key={event} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">
                            {event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {count}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((count / Math.max(...Object.values(eventCounts))) * 100, 100)}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    ))}
                </Box>
              ) : (
                <Alert severity="info">No feature usage data available</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Errors */}
      <Card>
        <CardHeader
          title="Recent Errors"
          subheader="Latest errors for debugging"
          avatar={<ErrorIcon color="error" />}
        />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Component</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Error Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentErrors.length > 0 ? (
                recentErrors.map((err) => (
                  <TableRow key={err.id} hover>
                    <TableCell>
                      <Typography variant="caption">
                        {formatDate(err.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {err.email || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={err.component || 'Unknown'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 100 }}>
                        {err.action || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={err.error_message || 'No details'}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                          {err.error_message || 'No details'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Alert severity="success" sx={{ my: 2 }}>
                      No recent errors - System is healthy! 🎉
                    </Alert>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default AnalyticsDashboard;
