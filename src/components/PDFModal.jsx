import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  Button,
  Toolbar,
  AppBar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  OpenInNew as OpenInNewIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';

function PDFModal({ open, onClose, url, fileName }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'document.pdf';
    link.click();
  };

  const handleOpenInNewTab = () => {
    window.open(url, '_blank');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          width: '90vw',
          maxWidth: '1200px',
          height: '90vh',
          m: 2
        }
      }}
    >
      <AppBar position="relative" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1, mr: 2 }} noWrap>
            {fileName}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleOpenInNewTab}
              aria-label="open in new tab"
              size="small"
            >
              <OpenInNewIcon />
            </IconButton>
            
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleDownload}
              aria-label="download"
              size="small"
            >
              <DownloadIcon />
            </IconButton>
            
            {!isMobile && (
              <IconButton
                edge="end"
                color="inherit"
                onClick={toggleFullscreen}
                aria-label="fullscreen"
                size="small"
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            )}
            
            <IconButton
              edge="end"
              color="inherit"
              onClick={onClose}
              aria-label="close"
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      <DialogContent sx={{ p: 0, bgcolor: '#525659' }}>
        <Box
          component="iframe"
          src={`${url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
          sx={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
          }}
          title={fileName}
        />
      </DialogContent>
    </Dialog>
  );
}

export default PDFModal;