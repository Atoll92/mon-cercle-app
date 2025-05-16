import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Tabs,
  Tab,
  TextField,
  IconButton,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Assignment as AssignmentIcon,
  Clear as ClearIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled components for the file upload area
const UploadBox = styled(Paper)(({ theme }) => ({
  border: `2px dashed ${theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[400]}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(66, 165, 245, 0.08)' 
      : 'rgba(66, 165, 245, 0.04)',
  },
}));

// Supported file types
const ACCEPTED_FILE_TYPES = [
  'text/csv', 
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

// Helper function to validate emails
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const BatchInviteModal = ({ open, onClose, onInvite, network, user }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [file, setFile] = useState(null);
  const [manualEmails, setManualEmails] = useState('');
  const [extractedEmails, setExtractedEmails] = useState([]);
  const [invalidEmails, setInvalidEmails] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [invitationProgress, setInvitationProgress] = useState(0);
  const [isInviting, setIsInviting] = useState(false);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Reset states when switching tabs
    setFile(null);
    setExtractedEmails([]);
    setInvalidEmails([]);
    setError(null);
    setSuccess(null);
  };
  
  // Handle file selection
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;
    
    if (!ACCEPTED_FILE_TYPES.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload a CSV, Excel, or text file.');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    processFile(selectedFile);
  };
  
  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    
    if (e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      
      if (!ACCEPTED_FILE_TYPES.includes(droppedFile.type)) {
        setError('Invalid file type. Please upload a CSV, Excel, or text file.');
        return;
      }
      
      setFile(droppedFile);
      setError(null);
      processFile(droppedFile);
    }
  };
  
  // Prevent default behavior for drag events
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  // Process the uploaded file
  const processFile = async (file) => {
    setIsProcessing(true);
    setExtractedEmails([]);
    setInvalidEmails([]);
    
    try {
      const text = await file.text();
      let emails = [];
      
      // Process based on file type
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        // Basic CSV parsing - split by newlines and commas
        const rows = text.split(/\r?\n/);
        rows.forEach(row => {
          if (row.trim()) {
            const columns = row.split(',');
            columns.forEach(column => {
              const trimmed = column.trim();
              if (trimmed && trimmed.includes('@')) {
                emails.push(trimmed);
              }
            });
          }
        });
      } else if (file.type.includes('excel') || 
                file.name.endsWith('.xls') || 
                file.name.endsWith('.xlsx')) {
        // For Excel files, we're just extracting any email-like strings
        // A more robust solution would use a library like xlsx
        const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
        emails = emailMatches;
      } else {
        // Text file - extract anything that looks like an email
        const lines = text.split(/\r?\n/);
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed && trimmed.includes('@')) {
            emails.push(trimmed);
          }
        });
      }
      
      // Validate emails
      const validEmails = [];
      const invalidEmails = [];
      
      emails.forEach(email => {
        if (isValidEmail(email)) {
          // Only add unique emails
          if (!validEmails.includes(email)) {
            validEmails.push(email);
          }
        } else if (email.trim()) {
          invalidEmails.push(email);
        }
      });
      
      setExtractedEmails(validEmails);
      setInvalidEmails(invalidEmails);
      
      if (validEmails.length === 0) {
        setError('No valid email addresses found in the file.');
      } else {
        setSuccess(`Found ${validEmails.length} valid email addresses.`);
      }
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Error processing file. Please try again with a different file.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Process manual email input
  const processManualInput = () => {
    if (!manualEmails.trim()) {
      setError('Please enter at least one email address.');
      return;
    }
    
    // Split by commas, semicolons, spaces, or newlines
    const emailList = manualEmails.split(/[\s,;]+/);
    const validEmails = [];
    const invalidEmails = [];
    
    emailList.forEach(email => {
      const trimmedEmail = email.trim();
      if (trimmedEmail) {
        if (isValidEmail(trimmedEmail)) {
          // Only add unique emails
          if (!validEmails.includes(trimmedEmail)) {
            validEmails.push(trimmedEmail);
          }
        } else {
          invalidEmails.push(trimmedEmail);
        }
      }
    });
    
    setExtractedEmails(validEmails);
    setInvalidEmails(invalidEmails);
    
    if (validEmails.length === 0) {
      setError('No valid email addresses found.');
    } else {
      setSuccess(`Found ${validEmails.length} valid email addresses.`);
      
      // Clear any previous error
      setError(null);
    }
  };
  
  // Clear file selection
  const handleClearFile = () => {
    setFile(null);
    setExtractedEmails([]);
    setInvalidEmails([]);
    setError(null);
    setSuccess(null);
  };
  
  // Send invitations for all valid emails
  const handleSendInvitations = async () => {
    if (extractedEmails.length === 0) {
      setError('No valid email addresses to invite.');
      return;
    }
    
    setIsInviting(true);
    setInvitationProgress(0);
    setError(null);
    
    try {
      // Send invitations in batches to avoid overwhelming the server
      let successful = 0;
      let failed = 0;
      const failedEmails = [];
      
      for (let i = 0; i < extractedEmails.length; i++) {
        const email = extractedEmails[i];
        
        try {
          const result = await onInvite(email, network.id, user.id);
          
          if (result.success) {
            successful++;
          } else {
            failed++;
            failedEmails.push(`${email} (${result.message})`);
          }
        } catch (err) {
          console.error(`Error inviting ${email}:`, err);
          failed++;
          failedEmails.push(`${email} (Error: ${err.message || 'Unknown error'})`);
        }
        
        // Update progress
        setInvitationProgress(Math.round(((i + 1) / extractedEmails.length) * 100));
      }
      
      // Show final result
      if (failed === 0) {
        setSuccess(`Successfully sent ${successful} invitations.`);
      } else if (successful === 0) {
        setError(`Failed to send all ${failed} invitations.`);
      } else {
        setSuccess(`Successfully sent ${successful} invitations. Failed to send ${failed} invitations.`);
        setError(
          <Box>
            <Typography variant="body2" gutterBottom>
              Failed to send invitations to the following emails:
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              {failedEmails.map((failedEmail, index) => (
                <li key={index}>{failedEmail}</li>
              ))}
            </Box>
          </Box>
        );
      }
      
      // Clear forms after successful invitations
      if (successful > 0) {
        setFile(null);
        setManualEmails('');
        setExtractedEmails([]);
        setInvalidEmails([]);
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      setError('Error sending invitations. Please try again.');
    } finally {
      setIsInviting(false);
    }
  };
  
  // Render file upload tab
  const renderFileUploadTab = () => (
    <Box sx={{ mt: 2 }}>
      <input
        type="file"
        id="file-upload"
        accept=".csv,.xls,.xlsx,.txt"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      
      {!file ? (
        <label htmlFor="file-upload">
          <UploadBox
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6" gutterBottom>
              Drag & Drop or Click to Upload
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supported formats: CSV, Excel, TXT
            </Typography>
          </UploadBox>
        </label>
      ) : (
        <Box sx={{ mb: 3 }}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AssignmentIcon sx={{ mr: 1.5, color: 'primary.main' }} />
              <Box>
                <Typography variant="body1">
                  {file.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(file.size / 1024).toFixed(2)} KB
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={handleClearFile}
              size="small"
              aria-label="Clear file"
            >
              <ClearIcon />
            </IconButton>
          </Paper>
          
          {isProcessing && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Processing file...
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
  
  // Render manual input tab
  const renderManualInputTab = () => (
    <Box sx={{ mt: 2 }}>
      <TextField
        fullWidth
        multiline
        rows={6}
        label="Enter email addresses"
        placeholder="Enter email addresses separated by commas, spaces, or newlines"
        value={manualEmails}
        onChange={(e) => setManualEmails(e.target.value)}
        variant="outlined"
      />
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tooltip title="You can enter multiple email addresses separated by commas, spaces, or newlines">
          <IconButton size="small">
            <HelpIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Button
          variant="outlined"
          onClick={processManualInput}
          disabled={!manualEmails.trim()}
        >
          Process Emails
        </Button>
      </Box>
    </Box>
  );
  
  // Render email preview
  const renderEmailPreview = () => (
    <Box sx={{ mt: 3 }}>
      {extractedEmails.length > 0 && (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Valid Emails ({extractedEmails.length})
          </Typography>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              maxHeight: 200, 
              overflow: 'auto',
              mb: 2,
              backgroundColor: 'success.light',
              color: 'success.contrastText'
            }}
          >
            {extractedEmails.map((email, index) => (
              <Typography key={index} variant="body2">
                {email}
              </Typography>
            ))}
          </Paper>
        </>
      )}
      
      {invalidEmails.length > 0 && (
        <>
          <Typography variant="subtitle1" gutterBottom color="error">
            Invalid Emails ({invalidEmails.length})
          </Typography>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              maxHeight: 200, 
              overflow: 'auto',
              backgroundColor: 'error.light',
              color: 'error.contrastText'
            }}
          >
            {invalidEmails.map((email, index) => (
              <Typography key={index} variant="body2">
                {email}
              </Typography>
            ))}
          </Paper>
        </>
      )}
    </Box>
  );
  
  return (
    <Dialog
      open={open}
      onClose={!isInviting ? onClose : undefined}
      maxWidth="md"
      fullWidth
      aria-labelledby="batch-invite-dialog-title"
    >
      <DialogTitle id="batch-invite-dialog-title">
        Batch Invite Members
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          aria-label="invitation method tabs"
          centered
        >
          <Tab label="Upload File" id="tab-0" />
          <Tab label="Enter Manually" id="tab-1" />
        </Tabs>
        
        <Box sx={{ mt: 2 }}>
          {activeTab === 0 ? renderFileUploadTab() : renderManualInputTab()}
          
          {extractedEmails.length > 0 && renderEmailPreview()}
          
          {isInviting && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" gutterBottom>
                Sending invitations... ({invitationProgress}%)
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={invitationProgress}
                color="primary"
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={isInviting}>
          Cancel
        </Button>
        <Button
          onClick={handleSendInvitations}
          variant="contained"
          color="primary"
          disabled={extractedEmails.length === 0 || isInviting}
          startIcon={isInviting ? <CircularProgress size={20} /> : null}
        >
          {isInviting ? 'Sending...' : `Send ${extractedEmails.length} Invitation${extractedEmails.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchInviteModal;