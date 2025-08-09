export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  duration_ms: number;
  preview_url: string | null;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  tracks: { total: number };
  images: { url: string }[];
}

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID || "your-client-id";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "your-client-secret";

export async function getSpotifyAccessToken(): Promise<string> {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error('Failed to get Spotify access token');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    throw new Error("Failed to get Spotify access token: " + (error as Error).message);
  }
}

export async function searchSpotifyTracks(query: string, accessToken: string): Promise<SpotifyTrack[]> {
  try {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to search Spotify tracks');
    }

    const data = await response.json();
    return data.tracks.items;
  } catch (error) {
    throw new Error("Failed to search Spotify tracks: " + (error as Error).message);
  }
}

export async function getStudyPlaylists(accessToken: string): Promise<SpotifyPlaylist[]> {
  try {
    // Search for study-related playlists
    const queries = ['study music', 'focus music', 'lo-fi study', 'classical study', 'ambient study'];
    const allPlaylists: SpotifyPlaylist[] = [];

    for (const query of queries) {
      const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=10`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        allPlaylists.push(...data.playlists.items);
      }
    }

    // Remove duplicates and return top playlists
    const uniquePlaylists = allPlaylists.filter((playlist, index, self) => 
      index === self.findIndex(p => p.id === playlist.id)
    );

    return uniquePlaylists.slice(0, 20);
  } catch (error) {
    throw new Error("Failed to get study playlists: " + (error as Error).message);
  }
}
