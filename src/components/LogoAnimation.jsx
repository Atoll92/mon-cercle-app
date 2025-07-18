import React, { useState, useEffect } from 'react';
import { Box, Typography, Fade } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import Spinner from './Spinner';

// Professional keyframe animations
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
`;

const breathe = keyframes`
  0%, 100% {
    transform: translate(-50%, -50%) scale(0.95);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.05);
  }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
`;

const orbitAnimation = keyframes`
  from {
    transform: rotate(0deg) translateX(120px) rotate(0deg);
  }
  to {
    transform: rotate(360deg) translateX(120px) rotate(-360deg);
  }
`;

const wave = keyframes`
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.5);
    opacity: 0;
  }
`;

const glow = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 15px rgba(249, 165, 0, 0.6));
  }
  50% {
    filter: drop-shadow(0 0 30px rgba(249, 165, 0, 0.9));
  }
`;

// Styled components
const StyledContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: theme.palette.mode === 'dark' ? '#0a0a0a' : '#fafafa',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: theme.palette.mode === 'dark' 
      ? 'radial-gradient(circle at center, rgba(249, 165, 0, 0.05) 0%, transparent 70%)'
      : 'radial-gradient(circle at center, rgba(249, 165, 0, 0.03) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
}));

const LogoContainer = styled(Box)({
  position: 'relative',
  width: '300px',
  height: '300px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

const AnimatedLogo = styled('div')({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '200px',
  height: '200px',
  animation: `${breathe} 4s ease-in-out infinite, ${glow} 3s ease-in-out infinite`,
  '& svg': {
    width: '100%',
    height: '100%',
    filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.1))',
  },
});

const OrbitingDot = styled('div')(({ delay, radius }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: '8px',
  height: '8px',
  backgroundColor: '#f9a500',
  borderRadius: '50%',
  opacity: 0.8,
  transformOrigin: '0 0',
  animation: `${orbitAnimation} ${6 + delay}s linear infinite`,
  animationDelay: `${delay * 0.5}s`,
  filter: 'blur(0.5px)',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-2px',
    left: '-2px',
    right: '-2px',
    bottom: '-2px',
    borderRadius: '50%',
    backgroundColor: 'rgba(249, 165, 0, 0.3)',
    filter: 'blur(2px)',
  },
}));

const WaveRing = styled('div')(({ delay }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: '200px',
  height: '200px',
  border: '1px solid rgba(249, 165, 0, 0.3)',
  borderRadius: '50%',
  transform: 'translate(-50%, -50%)',
  animation: `${wave} 4s ease-out infinite`,
  animationDelay: `${delay}s`,
}));

const LoadingText = styled(Typography)(({ theme }) => ({
  marginTop: '60px',
  fontSize: '16px',
  fontWeight: 500,
  letterSpacing: '0.1em',
  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  animation: `${fadeInUp} 1s ease-out`,
}));

const ProgressBar = styled(Box)(({ theme }) => ({
  width: '200px',
  height: '2px',
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  borderRadius: '2px',
  marginTop: '30px',
  overflow: 'hidden',
  position: 'relative',
}));

const ProgressFill = styled(Box)(({ progress }) => ({
  height: '100%',
  width: `${progress}%`,
  backgroundColor: '#f9a500',
  borderRadius: '2px',
  transition: 'width 0.3s ease-out',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '50px',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
    animation: `${shimmer} 1.5s linear infinite`,
  },
}));

const BackgroundOrb = styled('div')(
  ({ top, left, size, delay }) => ({
    position: 'absolute',
    top,
    left,
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(249, 165, 0, 0.1) 0%, transparent 70%)',
    filter: 'blur(40px)',
    animation: `${pulse} ${4 + delay}s ease-in-out infinite`,
    animationDelay: `${delay}s`,
    pointerEvents: 'none',
  })
);

const LogoAnimation = () => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('VIBE CHECKING');
  const [baseMessage, setBaseMessage] = useState('VIBE CHECKING');

  // Funny loading messages, Claude-style
  const loadingMessages = [
    'VIBE CHECKING',
    'WARMING UP NEURONS',
    'CONSULTING THE ORACLE',
    'SYNCHRONIZING CHAKRAS',
    'CALIBRATING EMPATHY',
    'DOWNLOADING WISDOM',
    'BREWING DIGITAL COFFEE',
    'ASSEMBLING PIXELS',
    'TUNING FREQUENCIES',
    'CHARGING CREATIVITY',
    'MANIFESTING CONTENT',
    'ALIGNING ALGORITHMS',
    'SUMMONING INSPIRATION',
    'PARSING GOOD VIBES',
    'LOADING SERENITY',
    'INITIALIZING ZEN MODE',
    'GATHERING STARDUST',
    'COMPUTING HARMONY',
    'BUFFERING BRILLIANCE',
    'QUANTUM ENTANGLING'
  ];

  useEffect(() => {
    // Pick a random message on mount
    const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    setBaseMessage(randomMessage);
    setLoadingText(randomMessage);

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 3;
      });
    }, 100);

    // Animate loading text with dots
    const dots = ['', '.', '..', '...'];
    let dotIndex = 0;
    let currentMessage = randomMessage;
    
    const textInterval = setInterval(() => {
      dotIndex = (dotIndex + 1) % dots.length;
      setLoadingText(currentMessage + dots[dotIndex]);
    }, 500);

    // Change message every 3 seconds
    const messageInterval = setInterval(() => {
      const newMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
      currentMessage = newMessage;
      setBaseMessage(newMessage);
      dotIndex = 0; // Reset dots when changing message
      setLoadingText(newMessage);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
      clearInterval(messageInterval);
    };
  }, []);

  return (<>
      Adaptable spinner :
      <Spinner
        size={200}
      />
      Fullek spinner :
      <StyledContainer>
        {/* Background orbs for depth */}
        <BackgroundOrb top="10%" left="10%" size="300px" delay={0} />
        <BackgroundOrb top="60%" left="70%" size="250px" delay={1} />
        <BackgroundOrb top="30%" left="80%" size="200px" delay={2} />

        <Fade in={true} timeout={1000}>
          <LogoContainer>
            {/* Wave rings */}
            <WaveRing delay={0} />
            <WaveRing delay={1} />
            <WaveRing delay={2} />

            {/* Orbiting dots */}
            <OrbitingDot delay={0} radius={120} />
            <OrbitingDot delay={1} radius={120} />
            <OrbitingDot delay={2} radius={120} />
            <OrbitingDot delay={3} radius={120} />

            {/* Main logo */}
            <AnimatedLogo>
              <svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="-125 -125 250 250">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f9a500" stopOpacity="1" />
                    <stop offset="100%" stopColor="#ff6b00" stopOpacity="1" />
                  </linearGradient>
                  <filter id="logoBlur">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
                  </filter>
                </defs>
                
                {/* Central big disk */}
                <circle cx="0" cy="0" r="35" fill="url(#logoGradient)"/>
                
                {/* Medium disks with animation */}
                <g fill="url(#logoGradient)">
                  <circle cx="70.00" cy="0.00" r="25" opacity="0.9">
                    <animate attributeName="r" values="25;27;25" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="43.64" cy="54.72" r="25" opacity="0.9">
                    <animate attributeName="r" values="25;27;25" dur="3s" begin="0.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-15.57" cy="68.24" r="25" opacity="0.9">
                    <animate attributeName="r" values="25;27;25" dur="3s" begin="1s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-63.06" cy="30.37" r="25" opacity="0.9">
                    <animate attributeName="r" values="25;27;25" dur="3s" begin="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-63.06" cy="-30.37" r="25" opacity="0.9">
                    <animate attributeName="r" values="25;27;25" dur="3s" begin="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-15.57" cy="-68.24" r="25" opacity="0.9">
                    <animate attributeName="r" values="25;27;25" dur="3s" begin="2.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="43.64" cy="-54.72" r="25" opacity="0.9">
                    <animate attributeName="r" values="25;27;25" dur="3s" begin="3s" repeatCount="indefinite" />
                  </circle>
                </g>
                
                {/* Small disks with staggered animation */}
                <g fill="#f9a500">
                  <circle cx="85.59" cy="41.21" r="12" opacity="0.7">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="21.13" cy="92.61" r="12" opacity="0.7">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="0.3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-59.23" cy="74.27" r="12" opacity="0.7">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="0.6s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-95.00" cy="0" r="12" opacity="0.7">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="0.9s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-59.23" cy="-74.27" r="12" opacity="0.7">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="1.2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="21.13" cy="-92.61" r="12" opacity="0.7">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="85.59" cy="-41.21" r="12" opacity="0.7">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="1.8s" repeatCount="indefinite" />
                  </circle>
                </g>
              </svg>
            </AnimatedLogo>
          </LogoContainer>
        </Fade>

        <Fade in={true} timeout={1500}>
          <Box sx={{ textAlign: 'center' }}>
            <LoadingText>{loadingText}</LoadingText>
            <ProgressBar>
              <ProgressFill progress={Math.min(progress, 100)} />
            </ProgressBar>
          </Box>
        </Fade>
      </StyledContainer>
    </>
  );
};

export default LogoAnimation;