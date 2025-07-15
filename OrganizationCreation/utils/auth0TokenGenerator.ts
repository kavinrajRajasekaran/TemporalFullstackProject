let cachedToken: string | null = null;
let tokenExpiry: number = 0;// Unix timestamp in ms

export async function getToken(): Promise<string|null|undefined> {
  const now = Date.now();

  // If token exists and not expired, reuse it
  if (cachedToken && now < tokenExpiry - 60 * 1000) {
    return cachedToken;
  }


 
  try {
      const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          "client_id":process.env.AUTH0_CLIENT_ID,
          "client_secret":process.env.AUTH0_CLIENT_SECRET,
          "audience":`https://${process.env.AUTH0_DOMAIN}/api/v2/`,
          "grant_type":"client_credentials"
        }),
      });

      if (!response.ok) {
          throw new Error('Network response was not ok');
      }

      const data = await response.json();
      return data.access_token
  } catch (error) {
      console.error('Error fetching token:', error);
  }


 
}



