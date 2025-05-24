import React, { forwardRef } from 'react';
import { Box, Card, Paper, Button, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

// Animated Box component with fade-in effect
export const AnimatedBox = styled(Box)(({ theme, delay = 0 }) => ({
  animation: `fadeInUp 0.4s ${theme.transitions.easing.easeInOut} ${delay}ms forwards`,
  opacity: 0,
  '@keyframes fadeInUp': {
    from: {
      opacity: 0,
      transform: 'translateY(20px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
}));

// Animated Card with hover effect
export const AnimatedCard = styled(Card)(({ theme }) => ({
  transition: theme.transitions.create(['transform', 'box-shadow'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

// Animated Paper with scale effect
export const AnimatedPaper = styled(Paper)(({ theme, delay = 0 }) => ({
  animation: `scaleIn 0.3s ${theme.transitions.easing.easeInOut} ${delay}ms forwards`,
  opacity: 0,
  '@keyframes scaleIn': {
    from: {
      opacity: 0,
      transform: 'scale(0.95)',
    },
    to: {
      opacity: 1,
      transform: 'scale(1)',
    },
  },
}));

// Animated Button with enhanced hover
export const AnimatedButton = styled(Button)(({ theme }) => ({
  transition: theme.transitions.create(['transform', 'box-shadow', 'background-color'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));

// Animated Icon Button
export const AnimatedIconButton = styled(IconButton)(({ theme }) => ({
  transition: theme.transitions.create(['transform', 'background-color'], {
    duration: theme.transitions.duration.short,
  }),
  '&:hover': {
    transform: 'scale(1.1)',
  },
  '&:active': {
    transform: 'scale(0.95)',
  },
}));

// List item with stagger animation
export const StaggeredListItem = forwardRef(({ index = 0, children, ...props }, ref) => {
  const delay = index * 50; // 50ms delay between items
  
  return (
    <Box
      ref={ref}
      sx={{
        animation: `fadeInLeft 0.4s ease-out ${delay}ms forwards`,
        opacity: 0,
        '@keyframes fadeInLeft': {
          from: {
            opacity: 0,
            transform: 'translateX(-20px)',
          },
          to: {
            opacity: 1,
            transform: 'translateX(0)',
          },
        },
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
});

// Skeleton pulse animation
export const SkeletonPulse = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover,
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(
      90deg,
      transparent,
      ${theme.palette.action.selected},
      transparent
    )`,
    animation: 'shimmer 1.5s infinite',
  },
  '@keyframes shimmer': {
    '100%': {
      left: '100%',
    },
  },
}));

// Page transition wrapper
export const PageTransition = forwardRef(({ children, ...props }, ref) => {
  return (
    <Box
      ref={ref}
      sx={{
        animation: 'pageEnter 0.3s ease-out forwards',
        '@keyframes pageEnter': {
          from: {
            opacity: 0,
            transform: 'translateY(10px)',
          },
          to: {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
});

// Smooth collapse/expand animation
export const AnimatedCollapse = forwardRef(({ open, children, ...props }, ref) => {
  return (
    <Box
      ref={ref}
      sx={{
        height: open ? 'auto' : 0,
        opacity: open ? 1 : 0,
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
});