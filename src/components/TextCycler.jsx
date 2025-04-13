import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

const fadeOut = keyframes`
  0% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0; transform: translateX(-20px); }
`;

const fadeIn = keyframes`
  0% { opacity: 0; transform: translateX(20px); }
  100% { opacity: 1; transform: translateX(0); }
`;

const TextCycler = ({ phrases, interval = 3000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Start the cycle
    const startCycle = () => {
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(true);
        
        // After fade out animation, change text and start fade in
        setTimeout(() => {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % phrases.length);
          setIsAnimating(false);
        }, 250); // Half of the animation duration
        
        // Schedule the next cycle
        startCycle();
      }, interval);
    };

    startCycle();

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [phrases, interval]);

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: { xs: 'center', sm: 'flex-start', md: 'flex-start' },
        animation: isAnimating ? `${fadeOut} 0.5s forwards` : `${fadeIn} 0.5s forwards`
      }}
    >
      <Typography
        component="span"
        sx={{
          fontSize: { xs: '1.5rem', sm: '2.5rem', md: '4.5rem', lg: '6rem' },
          fontWeight: 800,
          whiteSpace: 'nowrap',
          lineHeight: 1,
          //accent colored text
          // color:'rgb(25, 118, 210)'
          // gradient text
          background: 'linear-gradient(173deg, rgb(25, 118, 210) 20%, rgb(131, 193, 255) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {phrases[currentIndex]}
      </Typography>
    </Box>
  );
};

export default TextCycler;