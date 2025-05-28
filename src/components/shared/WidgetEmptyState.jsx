import { Card, CardContent, Typography, Box } from '@mui/material';
import WidgetHeader from './WidgetHeader';

/**
 * Reusable widget empty state component
 * @param {object} props
 * @param {React.ReactNode} props.icon - Icon component for header
 * @param {string} props.title - Widget title
 * @param {React.ReactNode} props.emptyIcon - Large icon for empty state
 * @param {string} props.emptyMessage - Primary empty message
 * @param {string} props.emptySubMessage - Secondary empty message
 * @param {React.ReactNode} props.action - Optional action button
 */
const WidgetEmptyState = ({ 
  icon, 
  title, 
  emptyIcon,
  emptyMessage,
  emptySubMessage,
  action 
}) => {
  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)' 
    }}>
      <WidgetHeader icon={icon} title={title} />
      <CardContent sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <Box sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}>
          {emptyIcon}
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {emptyMessage}
        </Typography>
        {emptySubMessage && (
          <Typography variant="caption" color="text.secondary">
            {emptySubMessage}
          </Typography>
        )}
        {action && (
          <Box sx={{ mt: 2 }}>
            {action}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default WidgetEmptyState;