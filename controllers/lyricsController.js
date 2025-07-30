import { getLyrics } from '../services/spotifyLyricsService.js';
import { getLrcLyrics, getSrtLyrics } from '../utils/lyricsFormatter.js';

const regexSpotifyUrl = /https?:\/\/open\.spotify\.com\/track\/([A-Za-z0-9]+)/;

export const fetchLyrics = async (req, res) => {
  let { trackId, url, format } = req.query;
  
  if (!trackId && !url) {
    return res.status(400).json({ error: 'Missing url or trackId parameter' });
  }
  
  if (url) {
    const match = url.match(regexSpotifyUrl);
    if (!match || !match[1]) {
      return res.status(400).json({ error: 'Invalid Spotify track URL.' });
    }
    trackId = match[1];
  }

  try {
    const lyricsData = await getLyrics(trackId);
    
    if (!lyricsData || !lyricsData.lyrics) {
      return res.status(404).json({ error: 'Lyrics for this track not available on spotify!' });
    }
    
    let lines;
    if (format === 'lrc') {
      lines = getLrcLyrics(lyricsData.lyrics.lines);
    } else if (format === 'srt') {
      lines = getSrtLyrics(lyricsData.lyrics.lines);
    } else {
      lines = lyricsData.lyrics.lines;
    }

    return res.status(200).json({
      syncType: lyricsData.lyrics.syncType,
      lines
    });
  } catch (err) {
    console.error('Error fetching lyrics:', err);
    return res.status(500).json({
      error: "Internal server error. Please check logs if you're owner of this!"
    });
  }
};