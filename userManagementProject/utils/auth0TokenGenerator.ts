let cachedToken: string | null = null;
let tokenExpiry: number = 0;// Unix timestamp in ms

export async function getAUth0Token(): Promise<string|null|undefined> {
  const now = Date.now();

  // If token exists and not expired, reuse it
  if (cachedToken && now < tokenExpiry - 60 * 1000) {
    return cachedToken;
  }


  try {
      const response = await fetch(process.env.AUTH0_TOKEN_URL!, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
         "client_id":process.env.AUTH0_CLIENT_ID,
        "client_secret":process.env.AUTH0_CLIENT_SECRET,
        "audience":process.env.AUTH0_AUDIENCE,
        "grant_type":process.env.GRANT_TYPE
        }),
      });

      if (!response.ok) {
          throw new Error('Network response was not ok');
      }

      const data = await response.json();
      cachedToken = data.access_token;
  tokenExpiry = now +data.expires_in * 1000; 

  return cachedToken;
  } catch (error) {
      console.error('Error fetching token:', error);
  }

 
}



