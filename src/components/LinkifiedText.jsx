import React from 'react';
import { linkifyText } from '../utils/textFormatting';
import { Link } from '@mui/material';

/**
 * Component that renders text with URLs converted to clickable links
 * @param {Object} props
 * @param {string} props.text - Text content that may contain URLs
 * @param {Object} props.linkProps - Additional props to pass to Link components
 * @param {Object} props.sx - Additional styles for the container
 * @param {string} props.component - Component type for the container (default: 'span')
 * @returns {JSX.Element}
 */
const LinkifiedText = ({ text, linkProps = {}, sx = {}, component = 'span' }) => {
  const parts = linkifyText(text);
  
  if (typeof parts === 'string') {
    return React.createElement(component, { sx }, text);
  }
  
  const children = parts.map((part, index) => {
    if (typeof part === 'string') {
      return part;
    }
    
    if (part.type === 'link') {
      return (
        <Link
          key={part.key || `link-${index}`}
          href={part.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          sx={{
            textDecoration: 'underline',
            '&:hover': {
              textDecoration: 'underline',
              opacity: 0.8
            },
            ...linkProps.sx
          }}
          {...linkProps}
        >
          {part.text}
        </Link>
      );
    }
    
    return part;
  });
  
  return React.createElement(component, { sx }, children);
};

export default LinkifiedText;