'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store/usePlayerStore';
import Hls from 'hls.js';
import {
  ArrowLeft,
  Loader2,
  Maximize,
  Maximize2,
  Minimize2,
  Pause,
  PictureInPicture2,
  Play,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Wrapper component to handle key-based remounting and persistent state
export function VideoPlayer() {
  const { isPlaying, streamUrl, streamTitle, closePlayer } = usePlayerStore();
  
  // Persistent state (kept across video changes)
  const [isMinimized, setIsMinimized] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  if (!isPlaying || !streamUrl) return null;

  return (
    <VideoPlayerInner
      key={streamUrl} // Forces remount when URL changes, resetting video-specific state
      streamUrl={streamUrl}
      streamTitle={streamTitle || ''}
      closePlayer={closePlayer}
      isMinimized={isMinimized}
      setIsMinimized={setIsMinimized}
      volume={volume}
      setVolume={setVolume}
      isMuted={isMuted}
      setIsMuted={setIsMuted}
    />
  );
}

interface VideoPlayerInnerProps {
  streamUrl: string;
  streamTitle: string;
  closePlayer: () => void;
  isMinimized: boolean;
  setIsMinimized: (value: boolean) => void;
  volume: number;
  setVolume: (value: number) => void;
  isMuted: boolean;
  setIsMuted: (value: boolean) => void;
}

function VideoPlayerInner({
  streamUrl,
  streamTitle,
  closePlayer,
  isMinimized,
  setIsMinimized,
  volume,
  setVolume,
  isMuted,
  setIsMuted
}: VideoPlayerInnerProps) {
  // Video-specific state (resets on remount)
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [shouldShowControls, setShouldShowControls] = useState(true);
  const showControls = shouldShowControls || isPaused || isLoading || isMinimized;
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [, setIsFullscreen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect if stream is live or VOD based on URL
  const isLiveStream = streamUrl?.includes('/live/') ?? false;
  const isVOD = streamUrl?.includes('/movie/') || streamUrl?.includes('/series/');

  // Auto-hide controls after 3 seconds of inactivity
  const resetControlsTimeout = useCallback(() => {
    setShouldShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    // Don't auto-hide if paused, loading, or minimized
    if (!isPaused && !isLoading && !isMinimized) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShouldShowControls(false);
      }, 3000);
    }
  }, [isPaused, isLoading, isMinimized]);

  // Time update handlers
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleDurationChange = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      setCurrentTime(videoRef.current.currentTime);
      setIsLoading(false);
    }
  }, []);

  const handleVideoError = useCallback(() => {
      console.error("Video Error");
      setHasError(true);
      setIsLoading(false);
  }, []);

  // Initialize HLS player
  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const video = videoRef.current;
    
    // Explicit state resets are no longer needed here because
    // the component key={streamUrl} causes a remount on change.
    
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isM3U8 = streamUrl.toLowerCase().includes('.m3u8');

    if (isM3U8 && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxLoadingDelay: 4,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        xhrSetup: function (xhr) {
          xhr.withCredentials = false;
        },
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        // Explicitly set muted/volume state to video element on load
        video.muted = isMuted;
        video.volume = volume;

        video.play().catch(console.error);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error('HLS Fatal Error:', data);
          setHasError(true);
          setIsLoading(false);
          
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              break;
          }
        }
      });
    } else {
      // Native playback
      video.src = streamUrl;
      video.muted = isMuted;
      video.volume = volume;
      video.load(); // Force reload
      video.play().catch(console.error);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, isMuted, volume  ]); // Removed persistent state deps as they are handled via refs/props

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Clear timeout when paused, loading, or minimized
  useEffect(() => {
    if (isPaused || isLoading || isMinimized) {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
        hideControlsTimeoutRef.current = null;
      }
    }
  }, [isPaused, isLoading, isMinimized]);

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPaused(false);
    } else {
      videoRef.current.pause();
      setIsPaused(true);
    }
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const handleMuteToggle = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  }, [isMuted, setIsMuted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  }, [setVolume, setIsMuted]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleSkip = useCallback((seconds: number) => {
    if (!videoRef.current || !isVOD) return;
    const maxTime = isFinite(duration) ? duration : videoRef.current.duration;
    const newTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, maxTime));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    resetControlsTimeout();
  }, [duration, resetControlsTimeout, isVOD]);

  const handleVolumeAdjust = useCallback((delta: number) => {
    if (!videoRef.current) return;
    const newVolume = Math.max(0, Math.min(1, videoRef.current.volume + delta));
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    resetControlsTimeout();
  }, [resetControlsTimeout, setVolume, setIsMuted]);

  const handleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await containerRef.current.requestFullscreen();
    }
  }, []);

  const handlePiP = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  }, []);

  const handleClose = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    closePlayer();
  }, [closePlayer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          handleSkip(10);
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          handleSkip(-10);
          break;
        case 'm':
          e.preventDefault();
          handleMuteToggle();
          break;
        case 'f':
          e.preventDefault();
          handleFullscreen();
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeAdjust(0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeAdjust(-0.1);
          break;
        case 'p':
          e.preventDefault();
          handlePiP();
          break;
        default:
          // Numbers 0-9 to jump to 0-90% of video (only for VOD)
          if (e.key >= '0' && e.key <= '9' && isVOD && duration > 0 && isFinite(duration)) {
            e.preventDefault();
            const percent = parseInt(e.key) / 10;
            if (videoRef.current) {
              videoRef.current.currentTime = duration * percent;
            }
          }
          break;
      }
    };

    // Component is only mounted when playing, so we can just add listener
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePlayPause, handleSkip, handleMuteToggle, handleFullscreen, handleVolumeAdjust, handlePiP, duration, isVOD]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '--:--';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "fixed transition-all duration-300 z-100 bg-black shadow-2xl overflow-hidden",
        isMinimized 
            ? "bottom-4 right-4 w-96 h-56 rounded-xl border border-zinc-800" 
            : "inset-0 w-full h-full"
      )}
      onMouseMove={resetControlsTimeout}
      onMouseEnter={() => setShouldShowControls(true)}
    >
        {/* Video Element */}
        <video 
          ref={videoRef}
          className="w-full h-full object-contain bg-black cursor-pointer"
          playsInline
          autoPlay
          onClick={handlePlayPause}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleVideoError}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <span className="ml-3 text-white">Carregando stream...</span>
          </div>
        )}

        {/* Error Overlay */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
            <p className="text-red-500 text-lg mb-4">Erro ao carregar o stream</p>
            <Button variant="outline" onClick={handleClose}>Fechar</Button>
          </div>
        )}

        {/* Top Bar - Always visible with fade */}
        <div className={cn(
          "absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-linear-to-b from-black/90 via-black/50 to-transparent transition-opacity duration-300",
          showControls || isMinimized ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20"
                onClick={handleClose}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h3 className="text-white font-medium truncate max-w-[50vw]">{streamTitle}</h3>
            </div>
            <div className="flex gap-2">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsMinimized(!isMinimized)}
                >
                    {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-red-500/20 hover:text-red-500"
                    onClick={handleClose}
                >
                    <X className="w-5 h-5" />
                </Button>
            </div>
        </div>

        {/* Center Play/Pause Button (appears when paused or loading) */}
        {isPaused && !isLoading && (
          <div 
            className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
            onClick={handlePlayPause}
          >
            <div className="w-20 h-20 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
              <Play className="w-10 h-10 text-white fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Bottom Controls Bar */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 z-10 bg-linear-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300",
          showControls || isMinimized ? "opacity-100" : "opacity-0 pointer-events-none",
          isMinimized ? "p-2" : "p-4"
        )}>
          {/* Progress Bar (only for VOD, not live) */}
          {isVOD && !isMinimized && (
            <div className="mb-3 px-2">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-zinc-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          {/* Live indicator */}
          {isLiveStream && !isMinimized && (
            <div className="mb-2 px-2">
              <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                AO VIVO
              </span>
            </div>
          )}

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-2 px-2">
            <div className="flex items-center gap-1">
              {/* Play/Pause */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20 h-10 w-10"
                onClick={handlePlayPause}
              >
                {isPaused ? <Play className="w-5 h-5 fill-white" /> : <Pause className="w-5 h-5" />}
              </Button>

              {/* Volume */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20 h-10 w-10"
                onClick={handleMuteToggle}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>

              {/* Volume Slider (hide on minimized) */}
              {!isMinimized && (
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
                />
              )}
            </div>

            {/* Right side controls */}
            {!isMinimized && (
              <div className="flex items-center gap-1">
                {/* Picture in Picture */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20 h-10 w-10"
                  onClick={handlePiP}
                >
                  <PictureInPicture2 className="w-5 h-5" />
                </Button>

                {/* Fullscreen */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20 h-10 w-10"
                  onClick={handleFullscreen}
                >
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
