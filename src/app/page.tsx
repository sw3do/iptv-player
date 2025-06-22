'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  MagnifyingGlassIcon, 
  PlayIcon, 
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  ShareIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import toast, { Toaster } from 'react-hot-toast'
import Hls from 'hls.js'
import { 
  fetchChannelsWithStreams, 
  searchChannels, 
  fetchCategories, 
  fetchCountries
} from '@/lib/api'
import type { ChannelWithStream, Category, Country, FilterOptions } from '@/types/iptv'

const Home = () => {
  const [channels, setChannels] = useState<ChannelWithStream[]>([])
  const [filteredChannels, setFilteredChannels] = useState<ChannelWithStream[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [currentChannel, setCurrentChannel] = useState<ChannelWithStream | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [favorites, setFavorites] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const channelsPerPage = 12
  const maxRetries = 3
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  const filterChannels = useCallback(async () => {
    const filters: FilterOptions = {
      search: searchTerm,
      category: selectedCategory || undefined,
      country: selectedCountry || undefined
    }
    
    const filtered = await searchChannels(channels, filters)
    setFilteredChannels(filtered)
    setCurrentPage(1)
  }, [channels, searchTerm, selectedCategory, selectedCountry])

  useEffect(() => {
    filterChannels()
  }, [filterChannels])

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
      }
    }
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [channelsData, categoriesData, countriesData] = await Promise.all([
        fetchChannelsWithStreams(),
        fetchCategories(),
        fetchCountries()
      ])
      
      setChannels(channelsData)
      setCategories(categoriesData)
      setCountries(countriesData)
      
      if (channelsData.length > 0) {
        setCurrentChannel(channelsData[0])
      }
    } catch {
      toast.error('Kanallar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const cleanupVideo = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.src = ''
    }
    setIsPlaying(false)
    setIsVideoLoading(false)
  }

  const tryNextStream = (channel: ChannelWithStream, startIndex: number = 0) => {
    if (!channel.streams || channel.streams.length === 0) {
      toast.error('Bu kanal için uygun stream bulunamadı')
      setIsVideoLoading(false)
      return
    }

    if (startIndex >= channel.streams.length) {
      toast.error('Tüm streamler denendi, kanal oynatılamadı')
      setIsVideoLoading(false)
      return
    }

    const stream = channel.streams[startIndex]
    
    playStreamWithRetry(stream.url, () => {
      tryNextStream(channel, startIndex + 1)
    })
  }

  const playStreamWithRetry = (streamUrl: string, onFallback: () => void) => {
    if (!videoRef.current) return

    cleanupVideo()
    setIsVideoLoading(true)

    const video = videoRef.current

    const handleVideoError = () => {
      console.error('Video oynatma hatası:', streamUrl)
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1)
        setTimeout(() => {
          playStreamWithRetry(streamUrl, onFallback)
        }, 1000)
      } else {
        setRetryCount(0)
        onFallback()
      }
    }

    const handleVideoCanPlay = () => {
      setIsVideoLoading(false)
      video.play().then(() => {
        setIsPlaying(true)
        setRetryCount(0)
      }).catch(handleVideoError)
    }

    const handleVideoWaiting = () => {
      setIsVideoLoading(true)
    }

    const handleVideoPlaying = () => {
      setIsVideoLoading(false)
      setIsPlaying(true)
    }

    const cleanupEventListeners = () => {
      video.removeEventListener('error', handleVideoError)
      video.removeEventListener('canplay', handleVideoCanPlay)
      video.removeEventListener('waiting', handleVideoWaiting)
      video.removeEventListener('playing', handleVideoPlaying)
      video.removeEventListener('stalled', handleVideoWaiting)
    }

    video.addEventListener('error', handleVideoError)
    video.addEventListener('canplay', handleVideoCanPlay)
    video.addEventListener('waiting', handleVideoWaiting)
    video.addEventListener('playing', handleVideoPlaying)
    video.addEventListener('stalled', handleVideoWaiting)
    
    video.addEventListener('loadstart', cleanupEventListeners, { once: true })

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        startLevel: -1,
        capLevelToPlayerSize: true,
        debug: false
      })
      
      hlsRef.current = hls
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        handleVideoCanPlay()
      })
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data)
        
        if (data.fatal) {
          switch(data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (retryCount < maxRetries) {
                toast.error(`Ağ hatası, tekrar deneniyor... (${retryCount + 1}/${maxRetries})`)
                setRetryCount(prev => prev + 1)
                setTimeout(() => {
                  hls.startLoad()
                }, 1000)
              } else {
                toast.error('Ağ bağlantısı hatası')
                setRetryCount(0)
                onFallback()
              }
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              if (retryCount < maxRetries) {
                toast.error(`Medya hatası, tekrar deneniyor... (${retryCount + 1}/${maxRetries})`)
                setRetryCount(prev => prev + 1)
                setTimeout(() => {
                  hls.recoverMediaError()
                }, 1000)
              } else {
                toast.error('Medya oynatma hatası')
                setRetryCount(0)
                onFallback()
              }
              break
            default:
              toast.error('Stream hatası: ' + data.details)
              onFallback()
              break
          }
        }
      })
      
      hls.on(Hls.Events.BUFFER_APPENDING, () => {
        setIsVideoLoading(true)
      })
      
      hls.on(Hls.Events.BUFFER_APPENDED, () => {
        setIsVideoLoading(false)
      })

      hls.loadSource(streamUrl)
      hls.attachMedia(video)
      
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl
      video.load()
    } else {
      toast.error('Bu tarayıcı HLS formatını desteklemiyor')
      setIsVideoLoading(false)
    }
  }

  const playChannel = (channel: ChannelWithStream) => {
    if (!videoRef.current) return

    setCurrentChannel(channel)
    setRetryCount(0)
    
    if (!channel.streams || channel.streams.length === 0) {
      toast.error('Bu kanal için stream bulunamadı')
      return
    }

    tryNextStream(channel, 0)
  }

  const togglePlayPause = () => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {
        toast.error('Video oynatılamadı')
      })
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }

  const toggleFavorite = (channelId: string) => {
    setFavorites(prev => 
      prev.includes(channelId) 
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    )
  }

  const totalPages = Math.ceil(filteredChannels.length / channelsPerPage)
  const startIndex = (currentPage - 1) * channelsPerPage
  const currentChannels = filteredChannels.slice(startIndex, startIndex + channelsPerPage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Toaster position="top-right" />
      
      <header className="sticky top-0 z-50 glass-dark border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
            >
              IPTV Player
            </motion.h1>
            
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 glass rounded-lg hover:bg-white/20 transition-colors"
              >
                <AdjustmentsHorizontalIcon className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-dark border-b border-white/10 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search channels..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 glass rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none text-white placeholder-gray-400"
                  />
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 glass rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none text-white bg-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id} className="bg-slate-800">
                      {category.name}
                    </option>
                  ))}
                </select>
                
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="px-4 py-2 glass rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none text-white bg-transparent"
                >
                  <option value="">All Countries</option>
                  {countries.map(country => (
                    <option key={country.code} value={country.code} className="bg-slate-800">
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl overflow-hidden"
            >
              <div className="aspect-video bg-black relative">
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  controls={false}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                {isVideoLoading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                      <p className="text-white text-sm">Yükleniyor...</p>
                      {retryCount > 0 && (
                        <p className="text-gray-400 text-xs">Deneme {retryCount}/{maxRetries}</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={togglePlayPause}
                        className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                      >
                        {isPlaying ? (
                          <PauseIcon className="w-6 h-6" />
                        ) : (
                          <PlayIcon className="w-6 h-6" />
                        )}
                      </button>
                      
                      <button
                        onClick={toggleMute}
                        className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                      >
                        {isMuted ? (
                          <SpeakerXMarkIcon className="w-5 h-5" />
                        ) : (
                          <SpeakerWaveIcon className="w-5 h-5" />
                        )}
                      </button>
                      
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-20 accent-blue-400"
                      />
                      
                      <div className="flex-1" />
                      
                      <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                        <ArrowsPointingOutIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {currentChannel && (
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {currentChannel.name}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        {currentChannel.categories.join(', ')} • {currentChannel.country}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFavorite(currentChannel.id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {favorites.includes(currentChannel.id) ? (
                          <HeartSolidIcon className="w-5 h-5 text-red-400" />
                        ) : (
                          <HeartIcon className="w-5 h-5" />
                        )}
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <ShareIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-xl h-[600px] flex flex-col"
            >
              <div className="p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">
                  Channels ({filteredChannels.length})
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="loading-dots text-gray-400">Loading</div>
                  </div>
                ) : (
                  <div className="space-y-2 p-2">
                    {currentChannels.map((channel, index) => (
                      <motion.div
                        key={channel.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => playChannel(channel)}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/10 ${
                          currentChannel?.id === channel.id ? 'bg-blue-500/20 border border-blue-400' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {channel.logo && (
                            <Image
                              src={channel.logo}
                              alt={channel.name}
                              width={40}
                              height={40}
                              className="rounded-lg object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-white truncate">
                              {channel.name}
                            </h3>
                            <p className="text-xs text-gray-400 truncate">
                              {channel.country} • {channel.streams.length} stream
                              {currentChannel?.id === channel.id && isVideoLoading && (
                                <span className="ml-2 text-blue-400">• Yükleniyor...</span>
                              )}
                            </p>
                          </div>
                          {favorites.includes(channel.id) && (
                            <HeartSolidIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              
              {totalPages > 1 && (
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 glass rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    
                    <span className="text-sm text-gray-400">
                      {currentPage} / {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 glass rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home