import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Email as EmailIcon,
} from '@mui/icons-material';
import UserContent from '../UserContent';
import { formatTimeAgo } from '../../utils/dateFormatting';

/**
 * AnnonceCard component - Card for displaying annonces from RezoProSpec mailing list
 * Displays approved annonces with category badges and parsed author info
 */
const AnnonceCard = React.memo(({
  item,
  darkMode,
  customLightText,
  customFadedText,
  customBorder,
  onMemberClick,
}) => {
  const muiTheme = useTheme();

  // Get category info from the item
  const categoryLabel = item.annonceCategoryLabel || 'Annonce';
  const categoryColor = item.annonceCategoryColor || '#00bcd4';

  return (
    <Card
      data-annoncecard-id={item?.id}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        minHeight: '150px',
        visibility: 'visible !important',
        display: 'block !important',
        transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px) !important',
          boxShadow: darkMode ? '0 6px 20px rgba(0,0,0,0.25)' : '0 6px 20px rgba(0,0,0,0.08)'
        },
        bgcolor: darkMode ? alpha('#1e1e1e', 0.5) : 'background.paper',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${customBorder}`
      }}
    >
      <Box sx={{ p: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Avatar - shows first letter of name or email icon */}
          <Avatar
            sx={{
              width: 40,
              height: 40,
              border: `2px solid ${customBorder}`,
              bgcolor: categoryColor,
              cursor: item.memberId ? 'pointer' : 'default',
              transition: 'transform 0.2s ease',
              '&:hover': item.memberId ? {
                transform: 'scale(1.1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              } : {}
            }}
            onClick={(e) => item.memberId && onMemberClick(item.memberId, e)}
          >
            {item.memberName ? item.memberName.charAt(0).toUpperCase() : <EmailIcon sx={{ fontSize: 20 }} />}
          </Avatar>

          {/* Name and Date */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: customLightText,
                cursor: item.memberId ? 'pointer' : 'default',
                '&:hover': item.memberId ? {
                  color: muiTheme.palette.primary.main,
                  textDecoration: 'underline'
                } : {},
                transition: 'color 0.2s ease',
                lineHeight: 1.4,
                mb: 0.5
              }}
              onClick={(e) => item.memberId && onMemberClick(item.memberId, e)}
            >
              {item.memberName}
            </Typography>
            <Typography
              variant="caption"
              color={customFadedText}
              sx={{
                whiteSpace: 'nowrap',
                fontSize: '0.75rem',
                fontWeight: 500,
                lineHeight: 1,
                display: 'block'
              }}
            >
              {formatTimeAgo(item.createdAt)}
            </Typography>
          </Box>

          {/* Category badge and annonce indicator */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Annonce/Email indicator */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: alpha(categoryColor, 0.12),
                  border: `1px solid ${alpha(categoryColor, 0.3)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(categoryColor, 0.18),
                    borderColor: alpha(categoryColor, 0.4),
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <EmailIcon
                  sx={{
                    fontSize: 14,
                    color: categoryColor
                  }}
                />
              </Box>
            </Box>

            {/* Category badge */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.5,
                py: 0.5,
                borderRadius: '16px',
                bgcolor: alpha(categoryColor, 0.12),
                border: `1px solid ${alpha(categoryColor, 0.3)}`,
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                '&:hover': {
                  bgcolor: alpha(categoryColor, 0.18),
                  borderColor: alpha(categoryColor, 0.4),
                }
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: categoryColor,
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap'
                }}
              >
                #{categoryLabel}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <CardContent sx={{ pt: 1, pb: 2 }}>
        {/* Title/Subject */}
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontSize: '1.1rem',
            fontWeight: 600,
            color: customLightText,
            mb: 1
          }}
        >
          {item.title}
        </Typography>

        {/* Content body */}
        <Box
          sx={{
            transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <UserContent
            content={item.content}
            html={false}
            maxLines={6}
            sx={{
              color: customFadedText,
              fontSize: '0.875rem'
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
});

AnnonceCard.displayName = 'AnnonceCard';

export default AnnonceCard;
