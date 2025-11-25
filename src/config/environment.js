// src/config/environment.js
// Centralized environment configuration and validation

const env = import.meta.env;

// Required environment variables
const requiredVars = {
  VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY,
};

// Optional environment variables with defaults
const optionalVars = {
  VITE_SITE_URL: env.VITE_SITE_URL || window.location.origin,
  VITE_STRIPE_PUBLIC_KEY: env.VITE_STRIPE_PUBLIC_KEY || '',
  NODE_ENV: env.NODE_ENV || 'development',
  MODE: env.MODE || 'development',
};

// Validate required variables
const missingVars = [];
for (const [key, value] of Object.entries(requiredVars)) {
  if (!value) {
    missingVars.push(key);
  }
}

if (missingVars.length > 0) {
  console.error(
    `Missing required environment variables: ${missingVars.join(', ')}. ` +
    'Please check your .env file and ensure all required variables are set.'
  );
  // In development, show a helpful error message
  if (import.meta.env.MODE === 'development') {
    console.error('Required environment variables:', Object.keys(requiredVars));
    console.error('Current env values:', {
      VITE_SUPABASE_URL: env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
      VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      VITE_STRIPE_PUBLIC_KEY: env.VITE_STRIPE_PUBLIC_KEY ? 'Set' : 'Missing',
    });
  }
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}. ` +
    'Please check your .env file and ensure all required variables are set.'
  );
}

// Environment helpers
export const isDevelopment = () => optionalVars.NODE_ENV === 'development';
export const isProduction = () => optionalVars.NODE_ENV === 'production';
export const isTest = () => optionalVars.NODE_ENV === 'test';

// Get base URL for the application
export const getBaseUrl = () => {
  if (isProduction()) {
    return optionalVars.VITE_SITE_URL || 'https://mon-cercle-app.vercel.app';
  }
  return optionalVars.VITE_SITE_URL || 'http://localhost:5173';
};

// Export validated configuration
export const config = {
  supabase: {
    url: requiredVars.VITE_SUPABASE_URL,
    anonKey: requiredVars.VITE_SUPABASE_ANON_KEY,
  },
  stripe: {
    publicKey: optionalVars.VITE_STRIPE_PUBLIC_KEY,
  },
  app: {
    url: optionalVars.VITE_SITE_URL,
    baseUrl: getBaseUrl(),
    env: optionalVars.NODE_ENV,
    mode: optionalVars.MODE,
  },
};

// Environment-specific price IDs
export const STRIPE_PRICE_IDS = {
  development: {
    community: 'price_1RSxxQ2KqNIKpvjTYs9cYDin', // Community plan €17/month - PRODUCTION PRICE ID
    nonprofit: 'price_test_nonprofit',
    organization: 'price_1RK6qr2KqNIKpvjTZh47uSJO',
    network: 'price_test_network',
    business: 'price_test_business',
  },
  production: {
    community: 'price_1RSxxQ2KqNIKpvjTYs9cYDin', // Community plan €17/month - PRODUCTION PRICE ID
    nonprofit: 'price_prod_nonprofit',
    organization: 'price_1RK6Vk2KqNIKpvjTKgFNpV0y', // Professional 97€/month
    network: 'price_prod_network',
    business: 'price_prod_business',
  },
};

export const getPriceIds = () => {
  return isProduction() ? STRIPE_PRICE_IDS.production : STRIPE_PRICE_IDS.development;
};