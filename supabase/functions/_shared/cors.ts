// Shared CORS configuration for all Edge Functions

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://mon-cercle-app.vercel.app',
  // Add your production domains here
];

export const getCorsHeaders = (request: Request) => {
  const origin = request.headers.get('origin');
  const isAllowed = !origin || ALLOWED_ORIGINS.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin || ALLOWED_ORIGINS[0] : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
};