import { Box, Typography, Button } from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';

/**
 * Reusable widget header component with consistent styling
 * @param {object} props
 * @param {React.ReactNode} props.icon - Icon component
 * @param {string} props.title - Widget title
 * @param {string} props.viewAllLink - Optional link for "View All" button
 * @param {string} props.viewAllText - Custom text for view all button
 * @param {function} props.onViewAll - Optional callback for view all click
 */
const WidgetHeader = ({ 
  icon, 
  title, 
  viewAllLink, 
  viewAllText = 'View All',
  onViewAll 
}) => {
  const viewAllButton = viewAllLink || onViewAll ? (
    <Button
      component={viewAllLink ? Link : 'button'}
      to={viewAllLink}
      onClick={onViewAll}
      size="small"
      endIcon={<ArrowForwardIcon />}
      className="view-all-button"
      sx={{ 
        transition: 'transform 0.2s ease',
        textTransform: 'none'
      }}
    >
      {viewAllText}
    </Button>
  ) : null;

  return (
    <Box 
      sx={{ 
        p: 1.5, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'rgba(25, 118, 210, 0.05)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {icon}
        <Typography variant="subtitle1" sx={{ ml: 1.5 }}>
          {title}
        </Typography>
      </Box>
      {viewAllButton}
    </Box>
  );
};

export default WidgetHeader;