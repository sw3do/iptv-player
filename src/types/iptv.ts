export interface Channel {
  id: string
  name: string
  alt_names: string[]
  network: string | null
  owners: string[]
  country: string
  subdivision: string | null
  city: string | null
  categories: string[]
  is_nsfw: boolean
  launched: string | null
  closed: string | null
  replaced_by: string | null
  website: string | null
  logo: string
}

export interface Stream {
  channel: string | null
  feed: string | null
  url: string
  referrer: string | null
  user_agent: string | null
  quality: string | null
}

export interface Feed {
  channel: string
  id: string
  name: string
  is_main: boolean
  broadcast_area: string[]
  timezones: string[]
  languages: string[]
  format: string
}

export interface Category {
  id: string
  name: string
}

export interface Country {
  name: string
  code: string
  languages: string[]
  flag: string
}

export interface Language {
  name: string
  code: string
}

export interface Region {
  code: string
  name: string
  countries: string[]
}

export interface ChannelWithStream extends Channel {
  streams: Stream[]
  feeds: Feed[]
}

export interface FilterOptions {
  country?: string
  category?: string
  language?: string
  region?: string
  search?: string
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
}

export interface PlayerState {
  isPlaying: boolean
  isLoading: boolean
  isMuted: boolean
  volume: number
  currentTime: number
  duration: number
  isFullscreen: boolean
  quality: string | null
}

export interface PlaylistItem {
  id: string
  name: string
  url: string
  logo?: string
  group?: string
} 