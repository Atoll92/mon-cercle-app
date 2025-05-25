// Centralized CORS configuration for Edge Functions

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://mon-cercle-app.vercel.app',
  'https://www.conclav.club',
  'https://www.conclav.network'

  // Add your production domain here when deployed
];

export const getCorsHeaders = (origin) => {
  // Check if the origin is allowed
  const isAllowed = !origin || ALLOWED_ORIGINS.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin || ALLOWED_ORIGINS[0] : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
};

// For Deno edge functions, export as string
export const CORS_HEADERS_STRING = `
const ALLOWED_ORIGINS = ${JSON.stringify(ALLOWED_ORIGINS)};

const getCorsHeaders = (origin) => {
  const isAllowed = !origin || ALLOWED_ORIGINS.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin || ALLOWED_ORIGINS[0] : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
};
`;