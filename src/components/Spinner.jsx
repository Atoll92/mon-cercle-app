import React from 'react';
import { CircularProgress } from '@mui/material';

/**
 * Spinner component that wraps Material-UI CircularProgress
 * This component will eventually replace all CircularProgress usage throughout the app
 * 
 * @param {Object} props - All props are forwarded to CircularProgress
 * @param {number|string} props.size - Size of the spinner (16, 20, 24, 30, 32, 40, 60) or 'small'|'medium'|'large'
 * @param {string} props.color - Color variant ('primary', 'secondary', 'inherit', 'white', 'success')
 * @param {Object} props.sx - Custom styling object
 * @param {string} props.className - CSS class name for custom styling
 * @param {string} props.variant - 'indeterminate' (default) or 'determinate'
 * @param {number} props.value - Progress value (0-100) when variant is 'determinate'
 * @param {...Object} props.otherProps - Any other props to forward to CircularProgress
 * @returns {JSX.Element} Spinner component
 */
const Spinner = ({ 
  size = 'medium',
  color = 'primary',
  sx = {},
  className = '',
  variant = 'indeterminate',
  value,
  ...otherProps 
}) => {
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
        return sizeValue;
    }
  };

  // Handle color prop - convert 'white' to sx styling
  const getColorAndSx = (colorValue, sxValue) => {
    if (colorValue === 'white') {
      return {
        color: 'inherit',
        sx: {
          color: 'white',
          ...sxValue
        }
      };
    }
    
    return {
      color: colorValue,
      sx: sxValue
    };
  };

  const { color: finalColor, sx: finalSx } = getColorAndSx(color, sx);

  return (
    <CircularProgress
      size={getSize(size)}
      color={finalColor}
      sx={finalSx}
      className={className}
      variant={variant}
      value={value}
      {...otherProps}
    />
  );
};

export default Spinner;