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

// Styled component for the spinning container
const SpinnerContainer = styled(Box)(({ size }) => ({
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: size,
  height: size,
  animation: `${rotate} 3s linear infinite`,
}));

// Styled component for the logo
const AnimatedLogo = styled('div')(({ size }) => ({
  width: size,
  height: size,
  animation: `${breathe} 4s ease-in-out infinite`,
}));

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
        return 20;
      case 'medium':
        return 40;
      case 'large':
        return 60;
      default:
        return 40; // default to medium if unknown string
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

  return (
    <SpinnerContainer 
      size={finalSize}
      className={className}
      sx={sx}
      {...otherProps}
    >
      <AnimatedLogo size={finalSize}>
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