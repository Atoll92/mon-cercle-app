import { supabase } from "../supabaseclient";

const logout = async () => {
    // const navigate = useNavigate();
    
    try {
        console.log("Attempting to log out...");
        // Force clear local storage first to ensure clean state
        localStorage.removeItem('supabase.auth.token');
        
        await supabase.auth.signOut();
      
        // Force navigation regardless of outcome
        window.location.href = '/login';
        
        // Optional: force page reload to clear any remaining state
    } catch (error) {
        console.error("Logout error:", error);
        alert(`Failed to log out: ${error.message}`);
        
        // Even if everything fails, force redirect to login
        window.location.href = '/login';
    }
};

export {
    logout
}