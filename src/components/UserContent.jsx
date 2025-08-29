import React from 'react';
import { Box, Typography, Link, useTheme, alpha } from '@mui/material';
import { linkifyText, linkifyHtml } from '../utils/textFormatting';
import { sanitizeRichText } from '../utils/sanitizeHtml';

/**
 * Component for displaying user-generated content with consistent formatting
 * Always handles: text overflow prevention and URL linkification
 * 
 * @param {Object} props
 * @param {string} props.content - The content to display
 * @param {boolean} props.html - Whether content contains HTML (default: false)
 * @param {string} props.component - Root component type (default: 'div')
 * @param {Object} props.sx - Additional styles
 */
const UserContent = ({
  content,
  html = false,
  component = 'div',
  sx = {},
  ...otherProps
}) => {
  const theme = useTheme();

  if (!content) return null;

  // Base overflow styles applied to all content
  const overflowStyles = {
    wordBreak: 'break-word',
    overflowWrap: 'break-word'
  };

  // Handle HTML content
  if (html) {
    const processedContent = linkifyHtml(sanitizeRichText(content));
    
    return (
      <Box
        component={component}
        sx={{
          ...overflowStyles,
          ...sx,
          // Apply overflow styles to all nested elements
          '& *': overflowStyles,
          // Links
          '& a': {
            color: theme.palette.primary.main,
            textDecoration: 'underline',
            wordBreak: 'break-all',
            '&:hover': { opacity: 0.8 }
          },
          // Code blocks
          '& code': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            padding: '2px 4px',
            borderRadius: '3px',
            fontFamily: 'monospace',
            fontSize: '0.9em',
            wordBreak: 'break-all'
          },
          '& pre': {
            backgroundColor: alpha(theme.palette.common.black, 0.05),
            padding: theme.spacing(1),
            borderRadius: theme.shape.borderRadius,
            overflowX: 'auto'
          },
          // Images
          '& img': {
            maxWidth: '100%',
            height: 'auto',
            borderRadius: theme.shape.borderRadius
          },
          // Tables
          '& table': {
            width: '100%',
            tableLayout: 'fixed',
            borderCollapse: 'collapse'
          },
          '& th, & td': {
            border: `1px solid ${theme.palette.divider}`,
            padding: theme.spacing(1),
            ...overflowStyles
          }
        }}
        dangerouslySetInnerHTML={{ __html: processedContent }}
        {...otherProps}
      />
    );
  }

  // Handle plain text content
  const parts = linkifyText(content);
  
  // No links found
  if (typeof parts === 'string') {
    return (
      <Typography component={component} sx={{ ...overflowStyles, ...sx }} {...otherProps}>
        {content}
      </Typography>
    );
  }

  // Render with links
  const elements = parts.map((part, index) => {
    if (typeof part === 'string') return part;
    
    return (
      <Link
        key={part.key || `link-${index}`}
        href={part.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        sx={{
          color: theme.palette.primary.main,
          textDecoration: 'underline',
          wordBreak: 'break-all',
          '&:hover': { opacity: 0.8 }
        }}
      >
        {part.text}
      </Link>
    );
  });

  return (
    <Typography component={component} sx={{ ...overflowStyles, ...sx }} {...otherProps}>
      {elements}
    </Typography>
  );
};

export default UserContent;