import { supabase } from '../supabaseclient';

/**
 * Fetch all files for a specific network
 * 
 * @param {string} networkId - The ID of the network
 * @returns {Promise<Array>} - Array of file objects
 */
export const fetchNetworkFiles = async (networkId) => {
  try {
    // Fetch files from the database table
    const { data, error } = await supabase
      .from('network_files')
      .select('*')
      .eq('network_id', networkId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Enhance file data with uploader information
    const filesWithUploaders = await Promise.all(data.map(async (file) => {
      const { data: uploaderData } = await supabase
        .from('profiles')
        .select('full_name, profile_picture_url')
        .eq('id', file.uploaded_by)
        .single();
        
      return {
        ...file,
        uploader: uploaderData || { full_name: 'Unknown User' }
      };
    }));
    
    return filesWithUploaders;
  } catch (error) {
    console.error('Error fetching network files:', error);
    throw error;
  }
};

/**
 * Upload a file to a network
 * 
 * @param {string} networkId - The ID of the network
 * @param {string} userId - The ID of the user uploading the file
 * @param {File} file - The file object to upload
 * @param {string} description - Optional description for the file
 * @returns {Promise<Object>} - The created file object
 */
export const uploadNetworkFile = async (networkId, userId, file, description = '') => {
  try {
    // Sanitize filename to avoid issues with special characters
    const sanitizedFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    
    // Create a unique file path in the 'shared' bucket
    const filePath = `${networkId}/${Date.now()}_${sanitizedFileName}`;
    
    // Upload the file to storage
    const { error: uploadError } = await supabase.storage
      .from('shared')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) throw uploadError;
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('shared')
      .getPublicUrl(filePath);
    
    // Add a record to the network_files table
    const { data, error: dbError } = await supabase
      .from('network_files')
      .insert([{ 
        network_id: networkId,
        uploaded_by: userId,
        filename: file.name,
        filepath: filePath,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        description: description || null
      }])
      .select();
      
    if (dbError) throw dbError;
    
    // Get uploader information
    const { data: uploaderData } = await supabase
      .from('profiles')
      .select('full_name, profile_picture_url')
      .eq('id', userId)
      .single();
      
    return {
      ...data[0],
      uploader: uploaderData
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Delete a network file
 * 
 * @param {string} fileId - The ID of the file to delete
 * @param {string} userId - The ID of the user attempting to delete
 * @param {string} userRole - The role of the user (to check admin privileges)
 * @returns {Promise<boolean>} - True if deletion was successful
 */
export const deleteNetworkFile = async (fileId, userId, userRole) => {
  try {
    // First get the file details to check permissions and get filepath
    const { data: fileData, error: fileError } = await supabase
      .from('network_files')
      .select('*')
      .eq('id', fileId)
      .single();
      
    if (fileError) throw fileError;
    
    // Check if user has permission to delete this file
    if (fileData.uploaded_by !== userId && userRole !== 'admin') {
      throw new Error('Permission denied. You can only delete your own files unless you are an admin.');
    }
    
    // Delete the file from storage
    const { error: storageError } = await supabase.storage
      .from('shared')
      .remove([fileData.filepath]);
      
    if (storageError) throw storageError;
    
    // Delete the database record
    const { error: dbError } = await supabase
      .from('network_files')
      .delete()
      .eq('id', fileId);
      
    if (dbError) throw dbError;
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Update the download count for a file
 * 
 * @param {string} fileId - The ID of the file being downloaded
 * @returns {Promise<Object>} - The updated file object
 */
export const incrementDownloadCount = async (fileId) => {
  try {
    // Get current download count
    const { data: fileData, error: fileError } = await supabase
      .from('network_files')
      .select('download_count')
      .eq('id', fileId)
      .single();
      
    if (fileError) throw fileError;
    
    // Increment download count
    const { data, error: updateError } = await supabase
      .from('network_files')
      .update({ download_count: (fileData.download_count || 0) + 1 })
      .eq('id', fileId)
      .select();
      
    if (updateError) throw updateError;
    
    return data[0];
  } catch (error) {
    console.error('Error updating download count:', error);
    throw error;
  }
};