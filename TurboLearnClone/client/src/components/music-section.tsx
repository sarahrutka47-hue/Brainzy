import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX } from "lucide-react";
import { initializeSpotify, getCurrentTrack, togglePlayback, nextTrack, previousTrack, setVolume } from "@/lib/spotify";

interface StudyPlaylist {
  id: string;
  name: string;
  description: string;
  tracks: { total: number };
  images: { url: string }[];
}

interface CurrentTrack {
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  duration_ms: number;
  progress_ms: number;
}

export default function MusicSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  const [volume, setVolumeValue] = useState([65]);
  const [autoPause, setAutoPause] = useState(true);
  const [crossfade, setCrossfade] = useState(false);
  const [isSpotifyReady, setIsSpotifyReady] = useState(false);
  const [showConnectSpotify, setShowConnectSpotify] = useState(true);
  const { toast } = useToast();

  const { data: studyPlaylists, isLoading } = useQuery<StudyPlaylist[]>({
    queryKey: ['/api/spotify/study-playlists'],
  });

  useEffect(() => {
    const initSpotify = async () => {
      try {
        const ready = await initializeSpotify();
        setIsSpotifyReady(ready);
        if (ready) {
          setShowConnectSpotify(false);
          const track = await getCurrentTrack();
          setCurrentTrack(track);
        }
      } catch (error) {
        console.error('Failed to initialize Spotify:', error);
      }
    };

    initSpotify();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && currentTrack) {
      interval = setInterval(async () => {
        try {
          const track = await getCurrentTrack();
          if (track) {
            setCurrentTrack(track);
          }
        } catch (error) {
          console.error('Failed to get current track:', error);
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, currentTrack]);

  const handlePlayPause = async () => {
    if (!isSpotifyReady) {
      toast({
        title: "Spotify not connected",
        description: "Please connect your Spotify account first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newPlayingState = await togglePlayback();
      setIsPlaying(newPlayingState);
    } catch (error) {
      toast({
        title: "Playback error",
        description: "Failed to control playback. Make sure Spotify is active.",
        variant: "destructive",
      });
    }
  };

  const handleNextTrack = async () => {
    if (!isSpotifyReady) return;
    
    try {
      await nextTrack();
      // Small delay to allow Spotify to update
      setTimeout(async () => {
        const track = await getCurrentTrack();
        setCurrentTrack(track);
      }, 500);
    } catch (error) {
      toast({
        title: "Skip error",
        description: "Failed to skip track.",
        variant: "destructive",
      });
    }
  };

  const handlePreviousTrack = async () => {
    if (!isSpotifyReady) return;
    
    try {
      await previousTrack();
      setTimeout(async () => {
        const track = await getCurrentTrack();
        setCurrentTrack(track);
      }, 500);
    } catch (error) {
      toast({
        title: "Previous track error",
        description: "Failed to go to previous track.",
        variant: "destructive",
      });
    }
  };

  const handleVolumeChange = async (newVolume: number[]) => {
    setVolumeValue(newVolume);
    if (isSpotifyReady) {
      try {
        await setVolume(newVolume[0]);
      } catch (error) {
        console.error('Failed to set volume:', error);
      }
    }
  };

  const connectSpotify = async () => {
    try {
      const ready = await initializeSpotify();
      if (ready) {
        setIsSpotifyReady(true);
        setShowConnectSpotify(false);
        toast({
          title: "Spotify connected! 🎵",
          description: "You can now control your music while studying.",
        });
      }
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Failed to connect to Spotify. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = currentTrack 
    ? (currentTrack.progress_ms / currentTrack.duration_ms) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50 mb-6">
          <CardContent className="p-6">
            <h2 className="font-display font-semibold text-xl text-gray-800 mb-6 flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">♪</span>
              </div>
              <span>Study Music</span>
            </h2>
            
            {/* Now Playing */}
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-2xl p-6 mb-6">
              {currentTrack ? (
                <div className="flex items-center space-x-4">
                  <img 
                    src={currentTrack.album.images[0]?.url || "https://via.placeholder.com/64x64"} 
                    alt="Album cover" 
                    className="w-16 h-16 rounded-lg object-cover"
                    data-testid="current-track-image"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800" data-testid="current-track-name">
                      {currentTrack.name}
                    </h3>
                    <p className="text-sm text-gray-600" data-testid="current-track-artist">
                      {currentTrack.artists.map(artist => artist.name).join(', ')}
                    </p>
                    <div className="flex items-center mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1 mr-3">
                        <div 
                          className="bg-green-500 h-1 rounded-full transition-all duration-1000" 
                          style={{ width: `${progress}%` }}
                          data-testid="progress-bar"
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500" data-testid="track-time">
                        {formatTime(currentTrack.progress_ms)} / {formatTime(currentTrack.duration_ms)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <span className="text-2xl">🎵</span>
                  </div>
                  <p>No track playing</p>
                </div>
              )}
              
              <div className="flex items-center justify-center space-x-6 mt-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-green-500"
                  data-testid="button-shuffle"
                >
                  <Shuffle className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePreviousTrack}
                  className="text-gray-600 hover:text-green-500"
                  data-testid="button-previous"
                >
                  <SkipBack className="w-6 h-6" />
                </Button>
                <Button
                  onClick={handlePlayPause}
                  className="bg-green-500 hover:bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center"
                  data-testid="button-play-pause"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextTrack}
                  className="text-gray-600 hover:text-green-500"
                  data-testid="button-next"
                >
                  <SkipForward className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-green-500"
                  data-testid="button-repeat"
                >
                  <Repeat className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            {/* Study Playlists */}
            <div>
              <h3 className="font-medium text-gray-800 mb-4">Curated Study Playlists</h3>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-xl h-32 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : studyPlaylists && studyPlaylists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studyPlaylists.slice(0, 4).map((playlist) => (
                    <div
                      key={playlist.id}
                      className="card-hover bg-white/60 rounded-xl p-4 border border-white/50 cursor-pointer"
                      data-testid={`playlist-${playlist.id}`}
                    >
                      <img 
                        src={playlist.images[0]?.url || "https://via.placeholder.com/300x200"} 
                        alt={playlist.name}
                        className="rounded-lg w-full h-32 object-cover mb-3" 
                      />
                      <h3 className="font-medium text-gray-800 mb-1 line-clamp-1">{playlist.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{playlist.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{playlist.tracks.total} tracks</span>
                        <Button size="sm" className="h-6 px-2 text-xs">
                          Play
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl mb-3 block">🎵</span>
                  <p>No playlists available. Connect Spotify to access study playlists!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Music Settings Sidebar */}
      <div className="space-y-6">
        {/* Volume & Settings */}
        <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50">
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-800 mb-4">Music Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Volume</label>
                <div className="flex items-center space-x-3">
                  <VolumeX className="text-gray-400" size={16} />
                  <Slider
                    value={volume}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="flex-1"
                    data-testid="volume-slider"
                  />
                  <Volume2 className="text-gray-400" size={16} />
                </div>
                <div className="text-center text-xs text-gray-500 mt-1">
                  {volume[0]}%
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Auto-pause on focus loss</span>
                <Switch
                  checked={autoPause}
                  onCheckedChange={setAutoPause}
                  data-testid="switch-auto-pause"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Crossfade</span>
                <Switch
                  checked={crossfade}
                  onCheckedChange={setCrossfade}
                  data-testid="switch-crossfade"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Connect Spotify */}
        {showConnectSpotify && (
          <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-2xl">♪</span>
                </div>
                <h3 className="font-medium text-gray-800 mb-2">Connect Spotify</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Access your personal playlists and premium features
                </p>
                <Button
                  onClick={connectSpotify}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                  data-testid="button-connect-spotify"
                >
                  Connect Account
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Spotify Status */}
        {isSpotifyReady && (
          <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <h3 className="font-medium text-gray-800 mb-1">Spotify Connected</h3>
                <p className="text-sm text-green-600">Ready to play music</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Focus Timer Integration */}
        <Card className="bg-white/70 backdrop-blur-sm shadow-lg border border-white/50">
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-800 mb-4">Focus Sessions</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Today's Music Time</span>
                <span className="font-semibold text-brainzy-purple" data-testid="stat-music-time">
                  2h 15m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Favorite Genre</span>
                <span className="font-semibold text-brainzy-mint" data-testid="stat-genre">
                  Lo-Fi
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Focus Score</span>
                <span className="font-semibold text-brainzy-coral" data-testid="stat-focus-score">
                  87%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
