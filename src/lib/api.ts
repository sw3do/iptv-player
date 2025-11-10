import axios from 'axios'
import type { 
  Channel, 
  Stream, 
  Feed, 
  Category, 
  Country, 
  Language, 
  Region,
  ChannelWithStream,
  FilterOptions 
} from '@/types/iptv'

const API_BASE_URL = 'https://iptv-org.github.io/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

// API Functions
export const fetchChannels = async (): Promise<Channel[]> => {
  try {
    const response = await api.get('/channels.json')
    return response.data
  } catch (error) {
    console.error('Error fetching channels:', error)
    throw new Error('Failed to fetch channels')
  }
}

export const fetchStreams = async (): Promise<Stream[]> => {
  try {
    const response = await api.get('/streams.json')
    return response.data
  } catch (error) {
    console.error('Error fetching streams:', error)
    throw new Error('Failed to fetch streams')
  }
}

export const fetchFeeds = async (): Promise<Feed[]> => {
  try {
    const response = await api.get('/feeds.json')
    return response.data
  } catch (error) {
    console.error('Error fetching feeds:', error)
    throw new Error('Failed to fetch feeds')
  }
}

export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const response = await api.get('/categories.json')
    return response.data
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw new Error('Failed to fetch categories')
  }
}

export const fetchCountries = async (): Promise<Country[]> => {
  try {
    const response = await api.get('/countries.json')
    return response.data
  } catch (error) {
    console.error('Error fetching countries:', error)
    throw new Error('Failed to fetch countries')
  }
}

export const fetchLanguages = async (): Promise<Language[]> => {
  try {
    const response = await api.get('/languages.json')
    return response.data
  } catch (error) {
    console.error('Error fetching languages:', error)
    throw new Error('Failed to fetch languages')
  }
}

export const fetchRegions = async (): Promise<Region[]> => {
  try {
    const response = await api.get('/regions.json')
    return response.data
  } catch (error) {
    console.error('Error fetching regions:', error)
    throw new Error('Failed to fetch regions')
  }
}

export const fetchChannelsWithStreams = async (): Promise<ChannelWithStream[]> => {
  try {
    const [channels, streams, feeds] = await Promise.all([
      fetchChannels(),
      fetchStreams(),
      fetchFeeds()
    ])

    const channelsWithStreams: ChannelWithStream[] = channels.map(channel => {
      const channelStreams = streams.filter(stream => stream.channel === channel.id)
      const channelFeeds = feeds.filter(feed => feed.channel === channel.id)
      
      return {
        ...channel,
        streams: channelStreams,
        feeds: channelFeeds
      }
    })

    return channelsWithStreams.filter(channel => channel.streams.length > 0)
  } catch (error) {
    console.error('Error fetching channels with streams:', error)
    throw new Error('Failed to fetch channels with streams')
  }
}

export const fetchChannelsProgressively = async (
  onProgress?: (channels: ChannelWithStream[], progress: number) => void
): Promise<ChannelWithStream[]> => {
  try {
    const [channels, streams, feeds] = await Promise.all([
      fetchChannels(),
      fetchStreams(),
      fetchFeeds()
    ])

    const BATCH_SIZE = 500
    const allChannels: ChannelWithStream[] = []
    const totalChannels = channels.length

    for (let i = 0; i < channels.length; i += BATCH_SIZE) {
      const batch = channels.slice(i, i + BATCH_SIZE)
      
      const processedBatch = batch.map(channel => {
        const channelStreams = streams.filter(stream => stream.channel === channel.id)
        const channelFeeds = feeds.filter(feed => feed.channel === channel.id)
        
        return {
          ...channel,
          streams: channelStreams,
          feeds: channelFeeds
        }
      }).filter(channel => channel.streams.length > 0)

      allChannels.push(...processedBatch)
      
      if (onProgress) {
        const progress = Math.min(100, Math.round(((i + BATCH_SIZE) / totalChannels) * 100))
        onProgress([...allChannels], progress)
      }

      await new Promise(resolve => setTimeout(resolve, 0))
    }

    return allChannels
  } catch (error) {
    console.error('Error fetching channels progressively:', error)
    throw new Error('Failed to fetch channels')
  }
}

export const searchChannels = async (
  channels: ChannelWithStream[], 
  filters: FilterOptions
): Promise<ChannelWithStream[]> => {
  let filteredChannels = [...channels]

  if (filters.search) {
    const searchTerm = filters.search.toLowerCase()
    filteredChannels = filteredChannels.filter(channel =>
      channel.name.toLowerCase().includes(searchTerm) ||
      channel.alt_names.some(name => name.toLowerCase().includes(searchTerm)) ||
      channel.categories.some(cat => cat.toLowerCase().includes(searchTerm)) ||
      (channel.network && channel.network.toLowerCase().includes(searchTerm))
    )
  }

  if (filters.country) {
    filteredChannels = filteredChannels.filter(channel =>
      channel.country === filters.country
    )
  }

  if (filters.category) {
    filteredChannels = filteredChannels.filter(channel =>
      channel.categories.includes(filters.category!)
    )
  }

  if (filters.language) {
    filteredChannels = filteredChannels.filter(channel =>
      channel.feeds.some(feed =>
        feed.languages.includes(filters.language!)
      )
    )
  }

  return filteredChannels
}

export const getChannelsByCategory = async (category: string): Promise<ChannelWithStream[]> => {
  try {
    const channels = await fetchChannelsWithStreams()
    return channels.filter(channel => 
      channel.categories.includes(category)
    )
  } catch (error) {
    console.error('Error fetching channels by category:', error)
    throw new Error('Failed to fetch channels by category')
  }
}

export const getChannelsByCountry = async (countryCode: string): Promise<ChannelWithStream[]> => {
  try {
    const channels = await fetchChannelsWithStreams()
    return channels.filter(channel => 
      channel.country === countryCode
    )
  } catch (error) {
    console.error('Error fetching channels by country:', error)
    throw new Error('Failed to fetch channels by country')
  }
}

export const getPopularChannels = async (limit: number = 50): Promise<ChannelWithStream[]> => {
  try {
    const channels = await fetchChannelsWithStreams()
    
    // Sort by number of streams and feeds (popularity indicator)
    const sortedChannels = channels.sort((a, b) => {
      const aScore = a.streams.length + a.feeds.length
      const bScore = b.streams.length + b.feeds.length
      return bScore - aScore
    })

    return sortedChannels.slice(0, limit)
  } catch (error) {
    console.error('Error fetching popular channels:', error)
    throw new Error('Failed to fetch popular channels')
  }
}

// Utility function to get best quality stream
export const getBestQualityStream = (streams: Stream[]): Stream | null => {
  if (streams.length === 0) return null
  
  const qualityOrder = ['1080p', '720p', '480p', '360p', '240p']
  
  for (const quality of qualityOrder) {
    const stream = streams.find(s => s.quality === quality)
    if (stream) return stream
  }
  
  return streams[0] // Return first stream if no quality specified
}

// Error handling wrapper
export const withErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  errorMessage: string
): Promise<T> => {
  try {
    return await apiCall()
  } catch (error) {
    console.error(errorMessage, error)
    throw new Error(errorMessage)
  }
} 