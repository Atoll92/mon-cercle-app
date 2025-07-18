import React from 'react';
import { Box } from '@mui/material';
import { styled, keyframes, useTheme } from '@mui/material/styles';

// Keyframe animations
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const breathe = keyframes`
  0%, 100% {
    transform: scale(0.95);
  }
  50% {
    transform: scale(1.05);
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

// Create orbit animation dynamically based on size
const createOrbitAnimation = (radius) => keyframes`
  from {
    transform: rotate(0deg) translateX(${radius}px) rotate(0deg);
  }
  to {
    transform: rotate(360deg) translateX(${radius}px) rotate(-360deg);
  }
`;

// Create glow animation dynamically based on color
const createGlowAnimation = (color) => keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 15px ${color}60) drop-shadow(0 0 5px ${color}40);
  }
  50% {
    filter: drop-shadow(0 0 30px ${color}90) drop-shadow(0 0 10px ${color}60);
  }
`;

// Styled component for the spinning container
const SpinnerContainer = styled(Box)(({ size }) => ({
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: size,
  height: size,
  animation: `${rotate} 3s linear infinite`,
  position: 'relative',
}));

// Styled component for the logo
const AnimatedLogo = styled('div')(({ size, color, showGlow }) => ({
  width: size,
  height: size,
  animation: showGlow 
    ? `${breathe} 4s ease-in-out infinite, ${createGlowAnimation(color)} 3s ease-in-out infinite`
    : `${breathe} 4s ease-in-out infinite`,
  position: 'relative',
  zIndex: 2,
}));

// Wave ring component
const WaveRing = styled('div')(({ delay, color }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: '100%',
  height: '100%',
  border: `1px solid ${color}30`,
  borderRadius: '50%',
  transform: 'translate(-50%, -50%)',
  animation: `${wave} 4s ease-out infinite`,
  animationDelay: `${delay}s`,
  zIndex: 1,
}));

// Orbiting dot component
const OrbitingDot = styled('div')(({ delay, color, size }) => {
  const orbitRadius = size * 0.6; // 60% of spinner size
  return {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: size * 0.06,
    height: size * 0.06,
    minWidth: 4,
    minHeight: 4,
    maxWidth: 8,
    maxHeight: 8,
    backgroundColor: color,
    borderRadius: '50%',
    opacity: 0.8,
    transformOrigin: '0 0',
    animation: `${createOrbitAnimation(orbitRadius)} ${6 + delay}s linear infinite`,
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
      backgroundColor: `${color}30`,
      filter: 'blur(2px)',
    },
  };
});

/**
 * Spinner component using Conclav logo design
 * 
 * @param {Object} props
 * @param {number|string} props.size - Size of the spinner (16, 20, 24, 30, 32, 40, 60) or 'small'|'medium'|'large'
 * @param {string} props.color - Color variant ('primary', 'secondary', 'inherit', 'white', 'success', or any color string)
 * @param {Object} props.sx - Custom styling object
 * @param {string} props.className - CSS class name for custom styling
 * @returns {JSX.Element} Spinner component
 */
const Spinner = ({ 
  size = 'medium',
  color = 'primary',
  sx = {},
  className = '',
  ...otherProps 
}) => {
  const theme = useTheme();
  
  // Handle size prop - convert string sizes to pixel values
  const getSize = (sizeValue) => {
    if (typeof sizeValue === 'number') {
      return sizeValue;
    }
    
    switch (sizeValue) {
      case 'small':
        return 40;
      case 'medium':
        return 70;
      case 'large':
        return 120;
      default:
        return 70; // default to medium if unknown string
    }
  };

  // Get the color value based on theme or direct color
  const getColor = (colorValue) => {
    // Handle theme color values
    switch (colorValue) {
      case 'primary':
        return theme.palette.primary.main;
      case 'secondary':
        return theme.palette.secondary.main;
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'info':
        return theme.palette.info.main;
      case 'success':
        return theme.palette.success.main;
      case 'inherit':
        return 'currentColor';
      case 'white':
        return '#ffffff';
      default:
        // If it starts with # or rgb, use it directly
        if (colorValue.startsWith('#') || colorValue.startsWith('rgb')) {
          return colorValue;
        }
        // Otherwise default to primary
        return theme.palette.primary.main;
    }
  };

  const finalSize = getSize(size);
  const finalColor = getColor(color);
  const showEnhancements = finalSize >= 100;

  return (
    <SpinnerContainer 
      size={finalSize}
      className={className}
      sx={sx}
      {...otherProps}
    >
      {/* Wave rings for large spinners */}
      {showEnhancements && (
        <>
          <WaveRing delay={0} color={finalColor} />
          <WaveRing delay={1} color={finalColor} />
          <WaveRing delay={2} color={finalColor} />
        </>
      )}
      
      {/* Orbiting dots for large spinners */}
      {showEnhancements && (
        <>
          <OrbitingDot delay={0} color={finalColor} size={finalSize} />
          <OrbitingDot delay={1} color={finalColor} size={finalSize} />
          <OrbitingDot delay={2} color={finalColor} size={finalSize} />
          <OrbitingDot delay={3} color={finalColor} size={finalSize} />
        </>
      )}
      
      <AnimatedLogo size={finalSize} color={finalColor} showGlow={showEnhancements}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width={finalSize} 
          height={finalSize} 
          viewBox="-125 -125 250 250"
        >
          <defs>
            <linearGradient id={`spinner-gradient-${finalColor}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={finalColor} stopOpacity="1" />
              <stop offset="100%" stopColor={finalColor} stopOpacity="0.8" />
            </linearGradient>
          </defs>
          
          {/* Central big disk */}
          <circle cx="0" cy="0" r="35" fill={`url(#spinner-gradient-${finalColor})`}/>
          
          {/* Medium disks with animation */}
          <g fill={`url(#spinner-gradient-${finalColor})`}>
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
          <g fill={finalColor}>
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
    </SpinnerContainer>
  );
};

export default Spinner;