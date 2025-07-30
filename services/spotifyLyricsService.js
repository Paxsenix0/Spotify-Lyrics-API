import axios from 'axios';
import { getToken } from './spotifyAuthService.js';

export async function getLyrics(trackId) {
  try {
    const accessToken = await getToken();

    const response = await axios.get(
      `https://spclient.wg.spotify.com/color-lyrics/v2/track/${trackId}?format=json&market=from_token`,
      {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en',
          'User-Agent': 'Spotify/9.0.34.593 iOS/18.4 (iPhone15,3)',
          'Accept-Encoding': 'gzip, deflate, br',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status !== 200) {
      console.error(`Lyrics fetch failed: ${response.status} ${response.statusText}`);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error(`Lyrics request error:`, error);
    return null;
  }
}
