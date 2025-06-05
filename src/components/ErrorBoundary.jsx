import React from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';
import { createSystemErrorTicket } from '../api/tickets';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  async componentDidCatch(error, errorInfo) {
    // Log error to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Store error details in state for display (in development only)
    this.setState({
      error,
      errorInfo
    });

    // Create system error ticket
    try {
      const errorData = {
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack
        },
        errorInfo,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };

      const ticketResult = await createSystemErrorTicket(errorData);
      
      if (ticketResult.error) {
        if (ticketResult.error === 'RLS_POLICY_RESTRICTION') {
          console.warn('System error ticket creation blocked by RLS policies. This is expected if policies need to be updated for system tickets.');
        } else {
          console.error('Failed to create system error ticket:', ticketResult.error);
        }
      } else if (ticketResult.data?.isDuplicate) {
        console.log('Error already reported in ticket:', ticketResult.data.existingTicketId);
      } else {
        console.log('System error ticket created successfully:', ticketResult.data?.id);
      }
    } catch (ticketError) {
      // Don't let ticket creation errors break the error boundary
      console.error('Error creating system ticket:', ticketError);
    }

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry or similar service
      // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optionally reload the page
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            
            <Typography variant="h4" component="h1" gutterBottom>
              Oops! Something went wrong
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              We're sorry for the inconvenience. The application encountered an unexpected error.
            </Typography>

            {/* Show error details in development */}
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <Box sx={{ mt: 2, mb: 3, textAlign: 'left' }}>
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Error Details:
                </Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    backgroundColor: 'grey.100',
                    maxHeight: 200,
                    overflowY: 'auto'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    component="pre" 
                    sx={{ 
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {this.state.error.toString()}
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </Typography>
                </Paper>
              </Box>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={this.handleReset}
              >
                Try Again
              </Button>
              
              <Button 
                variant="outlined"
                onClick={() => window.location.href = '/'}
              >
                Go to Home
              </Button>
            </Box>
          </Paper>
        </Container>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;