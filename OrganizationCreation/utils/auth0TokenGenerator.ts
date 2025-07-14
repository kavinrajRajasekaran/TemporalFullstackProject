let cachedToken: string | null = null;
let tokenExpiry: number = 0;// Unix timestamp in ms

export async function getToken(): Promise<string|null|undefined> {
  const now = Date.now();

  // If token exists and not expired, reuse it
  if (cachedToken && now < tokenExpiry - 60 * 1000) {
    return cachedToken;
  }


 
  try {
      const response = await fetch('https://dev-z5htpfd1ttgn2n0d.us.auth0.com/oauth/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          "client_id":"dpNlNcUhHplzzCdQsMHopXpRj61v8odJ",
          "client_secret":"ZIVZ8MszY8AyhwQy6XyXusG8H-3cu3t3ZR0QVHYgtOrq8dFpbM5VV6NLEnDf0i9c",
          "audience":"https://dev-z5htpfd1ttgn2n0d.us.auth0.com/api/v2/",
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



