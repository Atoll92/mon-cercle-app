import { supabase } from '../supabaseclient';

// Create a new poll
export const createPoll = async (pollData) => {
  try {
    const { data, error } = await supabase
      .from('network_polls')
      .insert([{
        ...pollData,
        created_by: (await supabase.auth.getUser()).data.user.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating poll:', error);
    return { data: null, error };
  }
};

// Get all polls for a network
export const getNetworkPolls = async (networkId, status = null) => {
  try {
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
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching polls:', error);
    return { data: null, error };
  }
};

// Get a single poll with vote details
export const getPollWithVotes = async (pollId) => {
  try {
    const { data: poll, error: pollError } = await supabase
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
    
    if (pollError) throw pollError;
    
    // Get all votes for this poll
    const { data: votes, error: votesError } = await supabase
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
    
    if (votesError) throw votesError;
    
    // Calculate vote statistics
    const voteStats = calculateVoteStats(poll, votes);
    
    return { 
      data: { 
        ...poll, 
        votes,
        stats: voteStats 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error fetching poll with votes:', error);
    return { data: null, error };
  }
};

// Submit a vote
export const submitVote = async (pollId, selectedOptions) => {
  try {
    const userId = (await supabase.auth.getUser()).data.user.id;
    
    const { data, error } = await supabase
      .from('network_poll_votes')
      .upsert({
        poll_id: pollId,
        user_id: userId,
        selected_options: selectedOptions
      }, {
        onConflict: 'poll_id,user_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error submitting vote:', error);
    return { data: null, error };
  }
};

// Get user's vote for a poll
export const getUserVote = async (pollId) => {
  try {
    const userId = (await supabase.auth.getUser()).data.user.id;
    
    const { data, error } = await supabase
      .from('network_poll_votes')
      .select('*')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user vote:', error);
    return { data: null, error };
  }
};

// Update poll status
export const updatePollStatus = async (pollId, status) => {
  try {
    const { data, error } = await supabase
      .from('network_polls')
      .update({ status })
      .eq('id', pollId)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating poll status:', error);
    return { data: null, error };
  }
};

// Delete a poll
export const deletePoll = async (pollId) => {
  try {
    const { error } = await supabase
      .from('network_polls')
      .delete()
      .eq('id', pollId);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting poll:', error);
    return { error };
  }
};

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
export const getActivePolls = async (networkId) => {
  try {
    const { data, error } = await supabase
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
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching active polls:', error);
    return { data: null, error };
  }
};