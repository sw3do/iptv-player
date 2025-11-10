'use client'

import { useRef, useEffect, useState, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PlayIcon, 
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline'
import { 
  SignalIcon as SignalSolidIcon
} from '@heroicons/react/24/solid'
import Hls from 'hls.js'

interface VideoPlayerProps {
  streamUrl: string | null
  channelName: string
  onError?: () => void
}

export const VideoPlayer = memo(({ streamUrl, channelName, onError }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [isLoading, setIsLoading] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLive, setIsLive] = useState(true)
  const [bufferLevel, setBufferLevel] = useState(0)
  const [streamQuality, setStreamQuality] = useState<string>('Auto')

  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }, [isPlaying])

  const toggleFullscreen = useCallback(() => {
    if (!playerContainerRef.current) return
    
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }, [isMuted])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }, [])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }, [])

  const formatTime = useCallback((seconds: number) => {
    if (!isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleWaiting = () => setIsLoading(true)
    const handlePlaying = () => setIsLoading(false)
    const handleError = () => {
      console.error('Video element error:', video.error)
      setIsLoading(false)
      setIsPlaying(false)
    }

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('error', handleError)
    }
  }, [])

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return

    setIsLoading(true)
    const video = videoRef.current

    const cleanup = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }

    cleanup()

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        startLevel: -1,
        maxLoadingDelay: 4,
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 2,
      })

      hlsRef.current = hls

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setIsLoading(false)
        setIsLive(data.levels[0]?.details?.live ?? true)
        
        video.play().catch((error) => {
          console.warn('Autoplay prevented:', error)
          setIsLoading(false)
        })
      })

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        const level = hls.levels[data.level]
        if (level) {
          setStreamQuality(level.height ? `${level.height}p` : 'Auto')
        }
      })

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        if (hls.media) {
          const buffered = hls.media.buffered
          if (buffered.length > 0) {
            const bufferEnd = buffered.end(buffered.length - 1)
            const currentTime = hls.media.currentTime
            setBufferLevel(bufferEnd - currentTime)
          }
        }
      })

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.warn('HLS Event:', data.type, data.details, data.fatal)
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error, trying to recover...')
              setTimeout(() => {
                if (hlsRef.current) {
                  hlsRef.current.startLoad()
                }
              }, 1000)
              break
            
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error, trying to recover...')
              if (hlsRef.current) {
                hlsRef.current.recoverMediaError()
              }
              break
            
            default:
              console.error('Fatal HLS error:', data)
              setIsLoading(false)
              onError?.()
              break
          }
        }
      })

      try {
        hls.loadSource(streamUrl)
        hls.attachMedia(video)
      } catch (error) {
        console.error('Failed to load HLS:', error)
        setIsLoading(false)
        onError?.()
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl
      
      const handleLoadedMetadata = () => {
        setIsLoading(false)
        video.play().catch((error) => {
          console.warn('Autoplay prevented:', error)
          setIsLoading(false)
        })
      }
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      video.load()
    } else {
      console.error('HLS not supported in this browser')
      setIsLoading(false)
      onError?.()
    }

    return cleanup
  }, [streamUrl, onError])

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div 
      ref={playerContainerRef}
      className="relative aspect-video bg-black rounded-2xl overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
      />

      <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none z-10">
        <div className="flex flex-col gap-2">
          {isLive && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/90 backdrop-blur-sm rounded-lg pointer-events-auto"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span className="text-white text-xs font-bold uppercase tracking-wide">Live</span>
            </motion.div>
          )}
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="px-3 py-1.5 glass-dark backdrop-blur-xl rounded-lg"
          >
            <p className="text-white text-sm font-semibold truncate max-w-[200px] sm:max-w-xs">
              {channelName}
            </p>
          </motion.div>
        </div>

        <div className="flex flex-col gap-2 items-end">
          {streamQuality && streamQuality !== 'Auto' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-2.5 py-1 glass-dark backdrop-blur-xl rounded-md"
            >
              <span className="text-purple-300 text-xs font-bold">{streamQuality}</span>
            </motion.div>
          )}
          
          {isPlaying && bufferLevel > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 px-2.5 py-1 glass-dark backdrop-blur-xl rounded-md"
            >
              <SignalSolidIcon className={`w-3 h-3 ${bufferLevel > 5 ? 'text-green-400' : bufferLevel > 2 ? 'text-yellow-400' : 'text-red-400'}`} />
              <span className="text-white text-xs font-medium">{bufferLevel.toFixed(1)}s</span>
            </motion.div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="loading-spinner" />
            <p className="text-sm text-white/80">Loading {channelName}...</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none"
          >
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 space-y-3 pointer-events-auto">
              {!isLive && duration > 0 && (
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 
                      [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-125 
                      [&::-webkit-slider-thumb]:transition-transform"
                  />
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={togglePlayPause}
                    className="p-2.5 sm:p-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl transition-all hover:scale-105 shadow-lg shadow-purple-500/30"
                  >
                    {isPlaying ? (
                      <PauseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      className="p-2 glass rounded-lg hover:bg-white/20 transition-all"
                    >
                      {isMuted ? (
                        <SpeakerXMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <SpeakerWaveIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="hidden sm:block w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white 
                        [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-125 
                        [&::-webkit-slider-thumb]:transition-transform"
                    />
                  </div>

                  {isLive && (
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 glass rounded-lg">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-white/90">Live Streaming</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="p-2 glass rounded-lg hover:bg-white/20 transition-all"
                >
                  <ArrowsPointingOutIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer'
