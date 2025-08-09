declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

interface SpotifyPlayer {
  addListener: (event: string, callback: (data: any) => void) => void;
  removeListener: (event: string, callback?: (data: any) => void) => void;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  getCurrentState: () => Promise<any>;
  getVolume: () => Promise<number>;
  nextTrack: () => Promise<void>;
  pause: () => Promise<void>;
  previousTrack: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (position_ms: number) => Promise<void>;
  setName: (name: string) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  togglePlay: () => Promise<void>;
}

let player: SpotifyPlayer | null = null;
let deviceId: string | null = null;
let accessToken: string | null = null;

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'your-spotify-client-id';
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin;

export const initializeSpotify = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if we already have a valid access token
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('access_token') || localStorage.getItem('spotify_access_token');
    
    if (token) {
      accessToken = token;
      localStorage.setItem('spotify_access_token', token);
      // Clear the hash
      window.location.hash = '';
    }

    if (!accessToken) {
      // If no token, we need to authenticate
      resolve(false);
      return;
    }

    // Load Spotify Web Playback SDK
    if (!window.Spotify) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.head.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        initializePlayer(resolve);
      };
    } else {
      initializePlayer(resolve);
    }
  });
};

const initializePlayer = (resolve: (value: boolean) => void) => {
  if (!accessToken) {
    resolve(false);
    return;
  }

  player = new window.Spotify.Player({
    name: 'Brainzy Study Player',
    getOAuthToken: (cb: (token: string) => void) => {
      cb(accessToken!);
    },
    volume: 0.5
  });

  // Error handling
  player!.addListener('initialization_error', ({ message }: { message: string }) => {
    console.error('Spotify initialization error:', message);
    resolve(false);
  });

  player!.addListener('authentication_error', ({ message }: { message: string }) => {
    console.error('Spotify authentication error:', message);
    // Clear invalid token
    localStorage.removeItem('spotify_access_token');
    accessToken = null;
    resolve(false);
  });

  player!.addListener('account_error', ({ message }: { message: string }) => {
    console.error('Spotify account error:', message);
    resolve(false);
  });

  // Ready
  player!.addListener('ready', ({ device_id }: { device_id: string }) => {
    console.log('Spotify player ready with device ID:', device_id);
    deviceId = device_id;
    resolve(true);
  });

  // Not ready
  player!.addListener('not_ready', ({ device_id }: { device_id: string }) => {
    console.log('Spotify player not ready with device ID:', device_id);
    resolve(false);
  });

  // Connect to the player
  player!.connect().then((success: boolean) => {
    if (!success) {
      console.error('Failed to connect to Spotify player');
      resolve(false);
    }
  });
};

export const authenticateSpotify = () => {
  const scopes = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'playlist-read-private',
    'playlist-read-collaborative'
  ].join(' ');

  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}`;
  
  window.location.href = authUrl;
};

export const getCurrentTrack = async () => {
  if (!player) {
    throw new Error('Spotify player not initialized');
  }

  try {
    const state = await player!.getCurrentState();
    if (!state || !state.track_window?.current_track) {
      return null;
    }

    const track = state.track_window.current_track;
    return {
      name: track.name,
      artists: track.artists,
      album: track.album,
      duration_ms: track.duration_ms,
      progress_ms: state.position,
    };
  } catch (error) {
    console.error('Error getting current track:', error);
    return null;
  }
};

export const togglePlayback = async (): Promise<boolean> => {
  if (!player) {
    throw new Error('Spotify player not initialized');
  }

  try {
    const state = await player!.getCurrentState();
    if (!state) {
      throw new Error('No active playback');
    }

    if (state.paused) {
      await player!.resume();
      return true;
    } else {
      await player!.pause();
      return false;
    }
  } catch (error) {
    console.error('Error toggling playback:', error);
    throw error;
  }
};

export const nextTrack = async (): Promise<void> => {
  if (!player) {
    throw new Error('Spotify player not initialized');
  }

  try {
    await player!.nextTrack();
  } catch (error) {
    console.error('Error skipping to next track:', error);
    throw error;
  }
};

export const previousTrack = async (): Promise<void> => {
  if (!player) {
    throw new Error('Spotify player not initialized');
  }

  try {
    await player!.previousTrack();
  } catch (error) {
    console.error('Error going to previous track:', error);
    throw error;
  }
};

export const setVolume = async (volume: number): Promise<void> => {
  if (!player) {
    throw new Error('Spotify player not initialized');
  }

  try {
    // Volume should be between 0 and 1
    const normalizedVolume = Math.max(0, Math.min(1, volume / 100));
    await player!.setVolume(normalizedVolume);
  } catch (error) {
    console.error('Error setting volume:', error);
    throw error;
  }
};

export const searchTracks = async (query: string) => {
  if (!accessToken) {
    throw new Error('No Spotify access token');
  }

  try {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to search tracks');
    }

    const data = await response.json();
    return data.tracks.items;
  } catch (error) {
    console.error('Error searching tracks:', error);
    throw error;
  }
};

export const getPlaylists = async () => {
  if (!accessToken) {
    throw new Error('No Spotify access token');
  }

  try {
    const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get playlists');
    }

    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error('Error getting playlists:', error);
    throw error;
  }
};

export const playTrack = async (uri: string) => {
  if (!deviceId || !accessToken) {
    throw new Error('Spotify not ready');
  }

  try {
    const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: [uri],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to play track');
    }
  } catch (error) {
    console.error('Error playing track:', error);
    throw error;
  }
};

export const isSpotifyReady = (): boolean => {
  return !!(player && deviceId && accessToken);
};

export const getAccessToken = (): string | null => {
  return accessToken;
};

export const disconnectSpotify = () => {
  if (player) {
    player.disconnect();
  }
  player = null;
  deviceId = null;
  accessToken = null;
  localStorage.removeItem('spotify_access_token');
};
