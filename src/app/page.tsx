"use client"

import { useState, useEffect, useMemo, useCallback, Suspense, lazy, useTransition } from "react"
import { AnimatePresence } from "framer-motion"
import { Toaster } from "react-hot-toast"
import toast from "react-hot-toast"
import { fetchChannelsProgressively, fetchCategories, fetchCountries } from "@/lib/api"
import type { ChannelWithStream, Category, Country } from "@/types/iptv"

const VideoPlayer = lazy(() => import("@/components/VideoPlayer").then((m) => ({ default: m.VideoPlayer })))
const ChannelList = lazy(() => import("@/components/ChannelList").then((m) => ({ default: m.ChannelList })))
const FilterPanel = lazy(() => import("@/components/FilterPanel").then((m) => ({ default: m.FilterPanel })))
const ChannelInfo = lazy(() => import("@/components/ChannelInfo").then((m) => ({ default: m.ChannelInfo })))

export default function Page() {
  const [channels, setChannels] = useState<ChannelWithStream[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isPending, startTransition] = useTransition()

  const [searchInput, setSearchInput] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("")

  const [currentChannel, setCurrentChannel] = useState<ChannelWithStream | null>(null)
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(null)
  const [streamIndex, setStreamIndex] = useState(0)
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const [hlsError, setHlsError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])

  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    let mounted = true
    let hasSetInitialChannel = false
    
    const load = async () => {
      try {
        setIsInitialLoad(true)
        
        const [cats, cnts] = await Promise.all([
          fetchCategories(),
          fetchCountries(),
        ])
        
        if (!mounted) return
        setCategories(cats)
        setCountries(cnts)

          await fetchChannelsProgressively((progressiveChannels, progress) => {
          if (!mounted) return
          
          startTransition(() => {
            setChannels(progressiveChannels)
            setLoadingProgress(progress)
          })

          if (progress >= 20 && progressiveChannels.length > 0 && !hasSetInitialChannel) {
            hasSetInitialChannel = true
            setCurrentChannel(progressiveChannels[0])
            setCurrentStreamUrl(progressiveChannels[0].streams?.[0]?.url ?? null)
            setStreamIndex(0)
          }
        })

        if (mounted) {
          setIsInitialLoad(false)
        }
      } catch (e) {
        console.error(e)
        toast.error("Kanallar yüklenemedi")
        setIsInitialLoad(false)
      }
    }
    load()

    const saved = localStorage.getItem("iptv_favs_v2")
    if (saved) {
      try {
        setFavorites(JSON.parse(saved))
      } catch {}
    }

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("iptv_favs_v2", JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput), 250)
    return () => clearTimeout(t)
  }, [searchInput])

  const filteredChannels = useMemo(() => {
    let r = channels
    if (searchTerm) {
      const s = searchTerm.toLowerCase()
      r = r.filter((c) => c.name.toLowerCase().includes(s) || c.country.toLowerCase().includes(s) || c.categories.some((x) => x.toLowerCase().includes(s)))
    }
    if (selectedCategory) r = r.filter((c) => c.categories.includes(selectedCategory))
    if (selectedCountry) r = r.filter((c) => c.country === selectedCountry)
    return r
  }, [channels, searchTerm, selectedCategory, selectedCountry])

  const setChannelAndPlay = useCallback((ch: ChannelWithStream, startIdx = 0) => {
    if (!ch) return
    if (!ch.streams || ch.streams.length === 0) {
      toast.error("Stream bulunamadı")
      return
    }
    setCurrentChannel(ch)
    setStreamIndex(startIdx)
    setCurrentStreamUrl(ch.streams[startIdx]?.url ?? null)
    setIsVideoLoading(true)
    setHlsError(null)
  }, [])

  const handleVideoError = useCallback(() => {
    // Try next stream for current channel, otherwise show error UI
    if (!currentChannel) return
    const next = (streamIndex ?? 0) + 1
    if (currentChannel.streams && next < currentChannel.streams.length) {
      setStreamIndex(next)
      setCurrentStreamUrl(currentChannel.streams[next].url)
      toast(`Deniyor: ${next + 1}/${currentChannel.streams.length}`)
      setIsVideoLoading(true)
      setHlsError(null)
    } else {
      setHlsError("Oynatma hatası oluştu. Alternatif kaynak bulunamadı.")
      setIsVideoLoading(false)
    }
  }, [currentChannel, streamIndex])

  const handleRetry = useCallback((idx = 0) => {
    if (!currentChannel) return
    const i = idx < currentChannel.streams.length ? idx : 0
    setStreamIndex(i)
    setCurrentStreamUrl(currentChannel.streams[i].url)
    setHlsError(null)
    setIsVideoLoading(true)
  }, [currentChannel])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  return (
    <div className="min-h-screen w-full relative">
      <div className="fixed inset-0 bg-gradient-to-br from-[#9400D3] to-[#4B0082] -z-20" />
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-black/30 to-black -z-10" />

      <Toaster position="top-right" />

      {isInitialLoad && loadingProgress < 100 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="glass-dark p-8 rounded-2xl max-w-md w-full mx-4">
            <div className="text-center space-y-4">
              <div className="loading-spinner mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Kanallar yükleniyor...</h3>
                <p className="text-sm text-gray-400">{channels.length} kanal yüklendi</p>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">%{loadingProgress}</p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-8 xl:col-span-9">
            <div className="glass rounded-2xl overflow-hidden shadow-lg">
              <Suspense fallback={<div className="aspect-video bg-black flex items-center justify-center"><div className="loading-spinner" /></div>}>
                <VideoPlayer
                  streamUrl={currentStreamUrl}
                  channelName={currentChannel?.name ?? ""}
                  onError={handleVideoError}
                />
              </Suspense>
              {hlsError && (
                <div className="p-4 bg-gradient-to-t from-black/80 to-transparent text-sm text-red-300">
                  <div className="flex items-center justify-between gap-4">
                    <div>{hlsError}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleRetry(streamIndex)} className="px-3 py-1 rounded-md bg-purple-600/80">Tekrar dene</button>
                      <button onClick={() => handleRetry(0)} className="px-3 py-1 rounded-md bg-white/5">Ana kaynağa dön</button>
                    </div>
                  </div>
                  {currentChannel?.streams && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentChannel.streams.map((s, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 bg-white/3 p-2 rounded">
                          <div className="truncate text-xs">{s.quality ?? s.url}</div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleRetry(i)} className="text-xs px-2 py-1 bg-purple-600/70 rounded">Use</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {currentChannel && (
              <Suspense fallback={<div className="h-24 glass mt-4" />}>
                <ChannelInfo channel={currentChannel} isFavorite={favorites.includes(currentChannel.id)} onToggleFavorite={() => toggleFavorite(currentChannel.id)} />
              </Suspense>
            )}
          </section>

          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="glass rounded-2xl h-[70vh] overflow-hidden shadow-lg flex flex-col">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="text-sm font-semibold">Channels</div>
                <div className="flex items-center gap-2">
                  {isPending && <div className="w-3 h-3 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />}
                  <div className="text-xs text-gray-300">{filteredChannels.length}</div>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <Suspense fallback={<div className="p-6 flex items-center justify-center"><div className="loading-spinner" /></div>}>
                  <ChannelList channels={filteredChannels} currentChannel={currentChannel} favorites={favorites} isLoading={isVideoLoading} onChannelClick={(c) => setChannelAndPlay(c, 0)} />
                </Suspense>
              </div>
              <div className="p-3 border-t border-white/5 flex items-center gap-2">
                <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search" className="input-modern" />
                <button onClick={() => setShowFilters((s) => !s)} className="p-2 bg-white/5 rounded">Filters</button>
              </div>
              <AnimatePresence>
                {showFilters && (
                  <Suspense fallback={<div className="p-4">Loading filters...</div>}>
                    <FilterPanel searchInput={searchInput} selectedCategory={selectedCategory} selectedCountry={selectedCountry} categories={categories} countries={countries} onSearchChange={setSearchInput} onCategoryChange={setSelectedCategory} onCountryChange={setSelectedCountry} onClearAll={() => { setSearchInput(""); setSelectedCategory(""); setSelectedCountry("") }} />
                  </Suspense>
                )}
              </AnimatePresence>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
