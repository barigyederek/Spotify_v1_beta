// netlify/functions/spotify-auth.js
exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { code, refresh_token } = JSON.parse(event.body);
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

  // Validate required parameters based on grant type
  if (!refresh_token && !code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Either code or refresh_token must be provided' })
    };
  }

  try {
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);

    if (refresh_token) {
      // Handle refresh token flow
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', refresh_token);
    } else {
      // Handle initial authorization flow
      params.append('grant_type', 'authorization_code');
      params.append('code', code);
      params.append('redirect_uri', REDIRECT_URI);
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
      },
      body: params
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Spotify API error:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: data.error_description || 'Token exchange failed',
          spotify_error: data.error
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token || refresh_token, // Spotify may not return new refresh_token
        expires_in: data.expires_in
      })
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};