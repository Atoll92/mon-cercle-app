// Simple test endpoint to verify API routes work
export default function handler(req, res) {
  console.log('[TEST-API] Function invoked!');

  res.status(200).json({
    success: true,
    message: 'API routes are working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}
