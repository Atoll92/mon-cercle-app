import { Card, CardContent, Alert, Button } from '@mui/material';
import WidgetHeader from './WidgetHeader';

/**
 * Reusable widget error state component
 * @param {object} props
 * @param {React.ReactNode} props.icon - Icon component for header
 * @param {string} props.title - Widget title
 * @param {string} props.error - Error message
 * @param {function} props.onRetry - Optional retry callback
 */
const WidgetErrorState = ({ icon, title, error, onRetry }) => {
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
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Alert 
          severity="error" 
          sx={{ width: '100%' }}
          action={
            onRetry && (
              <Button color="inherit" size="small" onClick={onRetry}>
                Retry
              </Button>
            )
          }
        >
          {error}
        </Alert>
      </CardContent>
    </Card>
  );
};

export default WidgetErrorState;