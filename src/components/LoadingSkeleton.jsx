import React from 'react';
import { Box, Skeleton } from '@mui/material';

// Card skeleton loader
export const CardSkeleton = ({ height = 200 }) => (
  <Box className="animate-fade-in">
    <Skeleton 
      variant="rectangular" 
      height={height} 
      sx={{ borderRadius: 2, mb: 2 }}
      animation="wave"
    />
    <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 1 }} animation="wave" />
    <Skeleton variant="text" width="80%" animation="wave" />
    <Skeleton variant="text" width="60%" animation="wave" />
  </Box>
);

// List item skeleton
export const ListItemSkeleton = () => (
  <Box display="flex" alignItems="center" p={2} className="animate-fade-in">
    <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} animation="wave" />
    <Box flex={1}>
      <Skeleton variant="text" width="30%" sx={{ mb: 0.5 }} animation="wave" />
      <Skeleton variant="text" width="80%" animation="wave" />
    </Box>
  </Box>
);

// Table row skeleton
export const TableRowSkeleton = ({ columns = 4 }) => (
  <Box display="flex" alignItems="center" p={2} gap={2} className="animate-fade-in">
    {[...Array(columns)].map((_, index) => (
      <Skeleton 
        key={index} 
        variant="text" 
        width={`${100 / columns}%`} 
        animation="wave"
      />
    ))}
  </Box>
);

// Profile skeleton
export const ProfileSkeleton = () => (
  <Box className="animate-fade-in">
    <Box display="flex" alignItems="center" mb={3}>
      <Skeleton variant="circular" width={80} height={80} sx={{ mr: 2 }} animation="wave" />
      <Box>
        <Skeleton variant="text" width={200} sx={{ fontSize: '1.5rem', mb: 1 }} animation="wave" />
        <Skeleton variant="text" width={150} animation="wave" />
      </Box>
    </Box>
    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} animation="wave" />
  </Box>
);

// Grid skeleton
export const GridSkeleton = ({ items = 6, columns = 3 }) => (
  <Box 
    display="grid" 
    gridTemplateColumns={`repeat(${columns}, 1fr)`} 
    gap={2}
  >
    {[...Array(items)].map((_, index) => (
      <Box key={index} className={`animate-fade-in-up stagger-${(index % 6) + 1}`}>
        <CardSkeleton />
      </Box>
    ))}
  </Box>
);

// News item skeleton
export const NewsItemSkeleton = () => (
  <Box className="animate-fade-in" sx={{ mb: 3 }}>
    <Box display="flex" alignItems="center" mb={2}>
      <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} animation="wave" />
      <Box flex={1}>
        <Skeleton variant="text" width="30%" animation="wave" />
        <Skeleton variant="text" width="20%" sx={{ fontSize: '0.875rem' }} animation="wave" />
      </Box>
    </Box>
    <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 1 }} animation="wave" />
    <Skeleton variant="text" width="100%" animation="wave" />
    <Skeleton variant="text" width="90%" animation="wave" />
    <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2, mt: 2 }} animation="wave" />
  </Box>
);

// Event skeleton
export const EventSkeleton = () => (
  <Box className="animate-fade-in">
    <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2, mb: 2 }} animation="wave" />
    <Skeleton variant="text" sx={{ fontSize: '1.25rem', mb: 1 }} animation="wave" />
    <Box display="flex" gap={2} mb={1}>
      <Skeleton variant="text" width={100} animation="wave" />
      <Skeleton variant="text" width={100} animation="wave" />
    </Box>
    <Skeleton variant="text" width="80%" animation="wave" />
  </Box>
);

// Chat message skeleton
export const ChatMessageSkeleton = ({ isOwnMessage = false }) => (
  <Box 
    display="flex" 
    justifyContent={isOwnMessage ? 'flex-end' : 'flex-start'}
    mb={2}
    className="animate-fade-in"
  >
    {!isOwnMessage && (
      <Skeleton variant="circular" width={32} height={32} sx={{ mr: 1 }} animation="wave" />
    )}
    <Box maxWidth="70%">
      <Skeleton 
        variant="rectangular" 
        width={200} 
        height={40} 
        sx={{ borderRadius: 2 }}
        animation="wave"
      />
    </Box>
  </Box>
);