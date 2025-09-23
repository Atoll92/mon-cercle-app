import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Link, Button, useTheme, alpha } from '@mui/material';
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
 * @param {boolean} props.noShowMore - Prevent showing "Show more"/"Show less" button even if truncated (default: false)
 * @param {number} props.maxLines - Maximum lines before truncation (optional)
 * @param {Object} props.sx - Additional styles
 */
const UserContent = ({
  content,
  html = false,
  component = 'div',
  noShowMore = false,
  maxLines,
  sx = {},
  ...otherProps
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const contentRef = useRef(null);

  // Check if content is actually truncated
  useEffect(() => {
    if (maxLines && contentRef.current) {
      const element = contentRef.current;
      // Temporarily remove truncation to measure real height
      const originalWebkitLineClamp = element.style.webkitLineClamp;
      const originalOverflow = element.style.overflow;
      
      element.style.webkitLineClamp = 'unset';
      element.style.overflow = 'visible';
      
      const lineHeight = parseFloat(window.getComputedStyle(element).lineHeight);
      const maxHeight = lineHeight * maxLines;
      const actualHeight = element.scrollHeight;
      
      // Restore truncation styles
      element.style.webkitLineClamp = originalWebkitLineClamp;
      element.style.overflow = originalOverflow;
      
      setIsTruncated(actualHeight > maxHeight);
    }
  }, [content, maxLines]);

  if (!content) return null;

  // Base overflow styles applied to all content
  const overflowStyles = {
    wordBreak: 'break-word',
    overflowWrap: 'break-word'
  };

  // Truncation styles when maxLines is specified and not expanded
  const truncationStyles = maxLines && !expanded ? {
    display: '-webkit-box',
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  } : {};

  // Handle HTML content
  if (html) {
    const processedContent = linkifyHtml(sanitizeRichText(content));
    
    return (
      <>
        <Box
          ref={contentRef}
          component={component}
          sx={{
            ...overflowStyles,
            ...truncationStyles,
            ...sx,
          // Apply overflow styles to all nested elements
          '& *': overflowStyles,
          // Empty paragraphs - ensure they take up space
          '& p': {
            minHeight: '1em',
            '&:empty::before': {
              content: '"\\00a0"', // Non-breaking space
              display: 'inline-block'
            }
          },
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
      {maxLines && isTruncated && !noShowMore && (
        <Button
          size="small"
          onClick={() => setExpanded(!expanded)}
          sx={{
            textTransform: 'none',
            mt: 0.5,
            p: 0,
            minWidth: 'auto',
            color: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: 'transparent',
              textDecoration: 'underline'
            }
          }}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      )}
      </>
    );
  }

  // Handle plain text content
  const parts = linkifyText(content);

  sx.whiteSpace = sx.whiteSpace || 'pre-wrap';
  
  // No links found
  if (typeof parts === 'string') {
    return (
      <>
        <Typography ref={contentRef} component={component} sx={{ ...overflowStyles, ...truncationStyles, ...sx }} {...otherProps}>
          {content}
        </Typography>
        {maxLines && isTruncated && !noShowMore && (
          <Button
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{
              textTransform: 'none',
              mt: 0.5,
              p: 0,
              minWidth: 'auto',
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: 'transparent',
                textDecoration: 'underline'
              }
            }}
          >
            {expanded ? 'Show less' : 'Show more'}
          </Button>
        )}
      </>
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
    <>
      <Typography ref={contentRef} component={component} sx={{ ...overflowStyles, ...truncationStyles, ...sx }} {...otherProps}>
        {elements}
      </Typography>
      {maxLines && isTruncated && !noShowMore && (
        <Button
          size="small"
          onClick={() => setExpanded(!expanded)}
          sx={{
            textTransform: 'none',
            mt: 0.5,
            p: 0,
            minWidth: 'auto',
            color: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: 'transparent',
              textDecoration: 'underline'
            }
          }}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      )}
    </>
  );
};

export default UserContent;