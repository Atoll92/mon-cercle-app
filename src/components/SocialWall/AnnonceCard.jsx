import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  alpha,
  useTheme,
  Tooltip,
  IconButton,
  Snackbar,
  Fade,
  ClickAwayListener,
} from '@mui/material';
import {
  Email as EmailIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
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
  const [emailPopoverOpen, setEmailPopoverOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Get category info from the item
  const categoryLabel = item.annonceCategoryLabel || 'Annonce';
  const categoryColor = item.annonceCategoryColor || '#00bcd4';

  // Extract clean email address from sender_email
  const getCleanEmail = () => {
    if (!item.sender_email) return null;
    // Extract email from format: "Name <email@domain.com>" or just "email@domain.com"
    const emailMatch = item.sender_email.match(/<([^>]+)>/) || item.sender_email.match(/([^\s<]+@[^\s>]+)/);
    return emailMatch ? emailMatch[1] : item.sender_email;
  };

  const cleanEmail = getCleanEmail();

  const handleEmailClick = (e) => {
    e.stopPropagation();
    setEmailPopoverOpen(!emailPopoverOpen);
    setCopied(false);
  };

  const handleCopyEmail = async (e) => {
    e.stopPropagation();
    if (cleanEmail) {
      try {
        await navigator.clipboard.writeText(cleanEmail);
        setCopied(true);
        setSnackbarOpen(true);
        setTimeout(() => {
          setCopied(false);
          setEmailPopoverOpen(false);
        }, 1500);
      } catch (err) {
        console.error('Failed to copy email:', err);
      }
    }
  };

  const handleClickAway = () => {
    setEmailPopoverOpen(false);
    setCopied(false);
  };

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'relative' }}>
              {/* Annonce/Email indicator - clickable to show email */}
              <ClickAwayListener onClickAway={handleClickAway}>
                <Box sx={{ position: 'relative' }}>
                  <Tooltip title={cleanEmail ? "Voir l'email" : "Email non disponible"} arrow>
                    <IconButton
                      size="small"
                      onClick={handleEmailClick}
                      disabled={!cleanEmail}
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: alpha(categoryColor, 0.12),
                        border: `1px solid ${alpha(categoryColor, 0.3)}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: alpha(categoryColor, 0.22),
                          borderColor: alpha(categoryColor, 0.5),
                          transform: 'scale(1.08)'
                        },
                        '&:disabled': {
                          opacity: 0.5
                        }
                      }}
                    >
                      <EmailIcon
                        sx={{
                          fontSize: 14,
                          color: categoryColor
                        }}
                      />
                    </IconButton>
                  </Tooltip>

                  {/* Email popover */}
                  <Fade in={emailPopoverOpen}>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        mt: 1,
                        zIndex: 1000,
                        minWidth: 280,
                        bgcolor: darkMode ? alpha('#1e1e1e', 0.98) : 'background.paper',
                        borderRadius: 2,
                        boxShadow: darkMode
                          ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)'
                          : '0 8px 32px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                        overflow: 'hidden',
                        backdropFilter: 'blur(12px)',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <Box
                        sx={{
                          px: 2,
                          py: 1.5,
                          bgcolor: alpha(categoryColor, 0.1),
                          borderBottom: `1px solid ${alpha(categoryColor, 0.2)}`,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            color: categoryColor,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            fontSize: '0.65rem',
                          }}
                        >
                          Contacter l'auteur
                        </Typography>
                      </Box>

                      {/* Email content */}
                      <Box sx={{ p: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1.5,
                            bgcolor: darkMode ? alpha('#fff', 0.05) : alpha('#000', 0.03),
                            borderRadius: 1.5,
                            border: `1px solid ${darkMode ? alpha('#fff', 0.1) : alpha('#000', 0.08)}`,
                          }}
                        >
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              bgcolor: alpha(categoryColor, 0.15),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <EmailIcon sx={{ fontSize: 18, color: categoryColor }} />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              flex: 1,
                              fontFamily: 'monospace',
                              fontSize: '0.8rem',
                              color: customLightText,
                              wordBreak: 'break-all',
                              fontWeight: 500,
                            }}
                          >
                            {cleanEmail}
                          </Typography>
                          <Tooltip title={copied ? "Copié !" : "Copier l'email"} arrow>
                            <IconButton
                              size="small"
                              onClick={handleCopyEmail}
                              sx={{
                                bgcolor: copied
                                  ? alpha(muiTheme.palette.success.main, 0.15)
                                  : alpha(categoryColor, 0.1),
                                color: copied ? muiTheme.palette.success.main : categoryColor,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: copied
                                    ? alpha(muiTheme.palette.success.main, 0.25)
                                    : alpha(categoryColor, 0.2),
                                  transform: 'scale(1.1)',
                                },
                              }}
                            >
                              {copied ? (
                                <CheckIcon sx={{ fontSize: 18 }} />
                              ) : (
                                <CopyIcon sx={{ fontSize: 18 }} />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Box>

                        {/* Hint text */}
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 1.5,
                            color: customFadedText,
                            fontSize: '0.7rem',
                            textAlign: 'center',
                          }}
                        >
                          Cliquez pour copier l'adresse email
                        </Typography>
                      </Box>
                    </Box>
                  </Fade>
                </Box>
              </ClickAwayListener>
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

      {/* Success snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        message="Email copié dans le presse-papier"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            bgcolor: muiTheme.palette.success.main,
            color: '#fff',
            fontWeight: 500,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }
        }}
      />
    </Card>
  );
});

AnnonceCard.displayName = 'AnnonceCard';

export default AnnonceCard;
