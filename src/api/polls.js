import { supabase } from '../supabaseclient';
import { withErrorHandling, handleSupabaseResponse, createApiResponse } from '../utils/apiHelpers';

// Create a new poll
export const createPoll = withErrorHandling(async (pollData) => {
  const { data: userData } = await supabase.auth.getUser();
  
  const response = await supabase
    .from('network_polls')
    .insert([{
      ...pollData,
      created_by: userData.user.id
    }])
    .select()
    .single();
  
  const data = handleSupabaseResponse(response, 'Failed to create poll');
  return createApiResponse(data);
}, 'Error creating poll');

// Get all polls for a network
export const getNetworkPolls = withErrorHandling(async (networkId, status = null) => {
  let query = supabase
    .from('network_polls')
    .select(`
      *,
      created_by_profile:profiles!network_polls_created_by_fkey(
        id,
        full_name,
        profile_picture_url
      ),
      votes:network_poll_votes(count)
    `)
    .eq('network_id', networkId)
    .order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const response = await query;
  const data = handleSupabaseResponse(response, 'Failed to fetch polls');
  return createApiResponse(data);
}, 'Error fetching polls');

// Get a single poll with vote details
export const getPollWithVotes = withErrorHandling(async (pollId) => {
  // Fetch poll details
  const pollResponse = await supabase
    .from('network_polls')
    .select(`
      *,
      created_by_profile:profiles!network_polls_created_by_fkey(
        id,
        full_name,
        profile_picture_url
      )
    `)
    .eq('id', pollId)
    .single();
  
  const poll = handleSupabaseResponse(pollResponse, 'Failed to fetch poll');
  
  // Get all votes for this poll
  const votesResponse = await supabase
    .from('network_poll_votes')
    .select(`
      *,
      user:profiles!network_poll_votes_user_id_fkey(
        id,
        full_name,
        profile_picture_url
      )
    `)
    .eq('poll_id', pollId);
  
  const votes = handleSupabaseResponse(votesResponse, 'Failed to fetch votes') || [];
  
  // Calculate vote statistics
  const voteStats = calculateVoteStats(poll, votes);
  
  return createApiResponse({ 
    ...poll, 
    votes,
    stats: voteStats 
  });
}, 'Error fetching poll with votes');

// Submit a vote
export const submitVote = withErrorHandling(async (pollId, selectedOptions) => {
  const { data: userData } = await supabase.auth.getUser();
  
  const response = await supabase
    .from('network_poll_votes')
    .upsert({
      poll_id: pollId,
      user_id: userData.user.id,
      selected_options: selectedOptions
    }, {
      onConflict: 'poll_id,user_id'
    })
    .select()
    .single();
  
  const data = handleSupabaseResponse(response, 'Failed to submit vote');
  return createApiResponse(data);
}, 'Error submitting vote');

// Get user's vote for a poll
export const getUserVote = withErrorHandling(async (pollId) => {
  const { data: userData } = await supabase.auth.getUser();
  
  const response = await supabase
    .from('network_poll_votes')
    .select('*')
    .eq('poll_id', pollId)
    .eq('user_id', userData.user.id)
    .single();
  
  const data = handleSupabaseResponse(response, 'Failed to fetch user vote');
  return createApiResponse(data);
}, 'Error fetching user vote');

// Update poll status
export const updatePollStatus = withErrorHandling(async (pollId, status) => {
  const response = await supabase
    .from('network_polls')
    .update({ status })
    .eq('id', pollId)
    .select()
    .single();
  
  const data = handleSupabaseResponse(response, 'Failed to update poll status');
  return createApiResponse(data);
}, 'Error updating poll status');

// Delete a poll
export const deletePoll = withErrorHandling(async (pollId) => {
  const response = await supabase
    .from('network_polls')
    .delete()
    .eq('id', pollId);
  
  handleSupabaseResponse(response, 'Failed to delete poll');
  return createApiResponse(true);
}, 'Error deleting poll');

// Helper function to calculate vote statistics
const calculateVoteStats = (poll, votes) => {
  const stats = {
    totalVotes: votes.length,
    options: {}
  };
  
  if (poll.poll_type === 'multiple_choice') {
    // Initialize option counts
    poll.options.forEach(option => {
      stats.options[option.id] = {
        ...option,
        count: 0,
        percentage: 0
      };
    });
    
    // Count votes for each option
    votes.forEach(vote => {
      vote.selected_options.forEach(optionId => {
        if (stats.options[optionId]) {
          stats.options[optionId].count++;
        }
      });
    });
    
    // Calculate percentages
    Object.values(stats.options).forEach(option => {
      option.percentage = stats.totalVotes > 0 
        ? Math.round((option.count / stats.totalVotes) * 100) 
        : 0;
    });
  } else if (poll.poll_type === 'yes_no') {
    stats.options = {
      yes: { count: 0, percentage: 0 },
      no: { count: 0, percentage: 0 }
    };
    
    votes.forEach(vote => {
      const answer = vote.selected_options[0];
      if (answer === 'yes' || answer === 'no') {
        stats.options[answer].count++;
      }
    });
    
    // Calculate percentages
    ['yes', 'no'].forEach(option => {
      stats.options[option].percentage = stats.totalVotes > 0
        ? Math.round((stats.options[option].count / stats.totalVotes) * 100)
        : 0;
    });
  } else if (poll.poll_type === 'date_picker') {
    // Group votes by date
    const dateVotes = {};
    votes.forEach(vote => {
      vote.selected_options.forEach(date => {
        if (!dateVotes[date]) {
          dateVotes[date] = { count: 0, users: [] };
        }
        dateVotes[date].count++;
        dateVotes[date].users.push(vote.user);
      });
    });
    
    stats.dateVotes = dateVotes;
  }
  
  return stats;
};

// Get active polls for news feed
export const getActivePolls = withErrorHandling(async (networkId) => {
  const response = await supabase
    .from('network_polls')
    .select(`
      *,
      created_by_profile:profiles!network_polls_created_by_fkey(
        id,
        full_name,
        profile_picture_url
      ),
      votes:network_poll_votes(count)
    `)
    .eq('network_id', networkId)
    .eq('status', 'active')
    .or('ends_at.is.null,ends_at.gt.now()')
    .order('created_at', { ascending: false });
  
  const data = handleSupabaseResponse(response, 'Failed to fetch active polls');
  return createApiResponse(data);
}, 'Error fetching active polls');