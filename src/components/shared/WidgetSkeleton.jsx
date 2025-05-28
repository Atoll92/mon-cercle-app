import { Card, CardContent, Box, Skeleton } from '@mui/material';

/**
 * Reusable widget skeleton for loading states
 * @param {object} props
 * @param {boolean} props.showHeader - Whether to show header skeleton
 * @param {number} props.contentLines - Number of content line skeletons
 * @param {boolean} props.showImage - Whether to show image skeleton
 */
const WidgetSkeleton = ({ 
  showHeader = true, 
  contentLines = 3,
  showImage = false 
}) => {
  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)' 
    }}>
      {showHeader && (
        <Box 
          sx={{ 
            p: 1.5, 
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(25, 118, 210, 0.05)'
          }}
        >
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 1.5 }} />
          <Box>
            <Skeleton width={120} height={24} />
            <Skeleton width={80} height={16} />
          </Box>
        </Box>
      )}
      <CardContent sx={{ flex: 1 }}>
        {showImage && (
          <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 1 }} />
        )}
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        {Array.from({ length: contentLines }).map((_, index) => (
          <Skeleton 
            key={index} 
            width={index === contentLines - 1 ? '60%' : '80%'} 
            sx={{ mb: 0.5 }}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export default WidgetSkeleton;