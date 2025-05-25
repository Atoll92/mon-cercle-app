import React from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Store error details in state for display (in development only)
    this.setState({
      error,
      errorInfo
    });

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
            
            <Typography variant="body1" color="text.secondary" paragraph>
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