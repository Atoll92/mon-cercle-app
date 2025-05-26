import { Box, Button, Typography } from '@mui/material';
import { Download as DownloadIcon, OpenInNew as OpenIcon } from '@mui/icons-material';

function SimplePDFViewer({ url, fileName, fileSize, compact = false }) {
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: compact ? 'auto' : '500px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: compact ? 2 : 4
      }}
    >
      {/* PDF embed using iframe */}
      {!compact && (
        <Box
          component="iframe"
          src={url}
          sx={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: 1,
            mb: 2
          }}
          title={fileName}
        />
      )}

      {/* PDF info and actions */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          {fileName}
        </Typography>
        {fileSize && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {formatFileSize(fileSize)}
          </Typography>
        )}
        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<OpenIcon />}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in New Tab
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            href={url}
            download={fileName}
          >
            Download
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default SimplePDFViewer;