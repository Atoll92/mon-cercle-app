# Giphy API Setup for Chat GIF Feature

## Overview
The chat feature now includes a GIF picker powered by Giphy. To enable this feature, you need to obtain a free API key from Giphy.

## Getting Your Giphy API Key

1. **Visit Giphy Developers Portal**
   - Go to https://developers.giphy.com/

2. **Create an Account**
   - Sign up or log in with your existing account

3. **Create an App**
   - Click on "Create an App"
   - Choose "API" (not SDK)
   - Fill in the required information:
     - App Name: "Conclav Chat" (or your preferred name)
     - App Description: Brief description of your application
   - Accept the terms and conditions

4. **Get Your API Key**
   - Once created, you'll receive an API key
   - Copy this key

## Configuration

1. **Update Environment Variables**
   - Open the `.env` file in the root of your project
   - Find or add the line: `VITE_GIPHY_API_KEY=your_giphy_api_key_here`
   - Replace `your_giphy_api_key_here` with your actual API key

   Example:
   ```
   VITE_GIPHY_API_KEY=abc123XYZ456def789
   ```

2. **Restart Development Server**
   - If running in development mode, restart your server:
     ```bash
     npm run dev
     ```

## Features

### GIF Picker
- **Access**: Click the GIF button (square icon) in the chat input area
- **Search**: Search for GIFs using keywords
- **Trending**: Browse trending GIFs when no search term is entered
- **Selection**: Click any GIF to add it to your message
- **Preview**: Selected GIFs appear as pending media before sending

### Emoji Picker with Skin Tones
- **Access**: Click the emoji button (smiley face icon) in the chat input area
- **Skin Tones**: Click on the preview area at the bottom to select skin tone variations
- **Search**: Search for emojis by name or keyword
- **Categories**: Browse emojis by category

## Usage Notes

- **Free Tier Limits**: Giphy's free tier allows 42 API calls per hour per IP address, which is sufficient for most use cases
- **Attribution**: The GIF picker displays "Powered by GIPHY" as required by Giphy's terms of service
- **GIF Storage**: GIFs are linked from Giphy's servers, not stored on your infrastructure

## Troubleshooting

### GIFs Not Loading
1. Check that your API key is correctly set in `.env`
2. Ensure the environment variable starts with `VITE_` prefix
3. Verify your API key is active on the Giphy developers dashboard
4. Check browser console for any error messages

### Rate Limiting
- If you see errors about rate limits, you may need to upgrade to a paid Giphy plan
- Monitor your usage on the Giphy developers dashboard

## Support

For issues related to:
- **Giphy API**: Visit https://support.giphy.com/
- **Conclav Chat**: Contact your development team
