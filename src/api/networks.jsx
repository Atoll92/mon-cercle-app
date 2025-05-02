import { supabase } from '../supabaseclient';

const fetchNetworkMembers = async (networkId) => {
    try {
        console.log('Fetching network members for network:', networkId);
        const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, contact_email, role, profile_picture_url')
        .eq('network_id', networkId);
    
        if (error) throw error;
        console.log(`Found ${data?.length || 0} network members`);

        return data || [];
    } catch (error) {
        console.error("Error fetching network members:", error);
        setError("Failed to load network members. Please try again later.");
        return [];
    }
};

 const fetchNetworkDetails = async (networkId) => {
    try {
      console.log('Fetching network details for network:', networkId);
      const { data, error } = await supabase
        .from('networks')
        .select('*')
        .eq('id', networkId)
        .single();
        
      if (error) throw error;
      console.log('Network details:', data);
      return data;
    } catch (error) {
      console.error("Error fetching network details:", error);
      return null;
    }
  };

export {
    fetchNetworkMembers ,
    fetchNetworkDetails
}