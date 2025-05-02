// src/components/SubscriptionBadge.jsx
import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { 
  WorkspacePremium as PremiumIcon,
  Verified as VerifiedIcon,
  Business as BusinessIcon,
  School as SchoolIcon
} from '@mui/icons-material';

const SubscriptionBadge = ({ plan, status }) => {
  // Only show badge for active subscriptions
  if (status !== 'active' || plan === 'community' || !plan) {
    return null;
  }
  
  // Helper function to determine icon and color based on plan
  const getPlanDetails = (plan) => {
    switch (plan) {
      case 'organization':
        return {
          label: 'Organization Plan',
          icon: <BusinessIcon fontSize="small" />,
          color: 'primary',
          tooltip: 'Organization Plan: Up to 500 members & 100GB storage'
        };
      case 'network':
        return {
          label: 'Network Plan',
          icon: <PremiumIcon fontSize="small" />,
          color: 'secondary',
          tooltip: 'Network Plan: Up to 2,500 members & 1TB storage'
        };
      // Add more cases for other plans
      default:
        return {
          label: 'Premium Plan',
          icon: <VerifiedIcon fontSize="small" />,
          color: 'primary',
          tooltip: 'Premium subscription'
        };
    }
  };

  const planDetails = getPlanDetails(plan);

  return (
    <Tooltip title={planDetails.tooltip}>
      <Chip
        icon={planDetails.icon}
        label={planDetails.label}
        color={planDetails.color}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 500 }}
      />
    </Tooltip>
  );
};

export default SubscriptionBadge;