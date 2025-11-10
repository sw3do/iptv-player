'use client'

import { memo, useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { HeartIcon as HeartSolidIcon, ClockIcon } from '@heroicons/react/24/solid'
import type { ChannelWithStream } from '@/types/iptv'

const ITEM_HEIGHT = 76
const OVERSCAN_COUNT = 5

interface ChannelItemProps {
  channel: ChannelWithStream
  isActive: boolean
  isFavorite: boolean
  isLoading: boolean
  onClick: () => void
}

const ChannelItem = memo(({ channel, isActive, isFavorite, isLoading, onClick }: ChannelItemProps) => {
  return (
    <div
      onClick={onClick}
      className={`p-3 mx-2 mb-2 rounded-xl cursor-pointer transition-all duration-200 ${
        isActive 
          ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400 shadow-lg shadow-purple-500/20' 
          : 'glass-hover'
      }`}
    >
      <div className="flex items-center gap-3">
        {channel.logo ? (
          <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
            <Image
              src={channel.logo}
              alt={channel.name}
              fill
              sizes="48px"
              className="object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
        ) : (
          <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <span className="text-lg font-bold text-purple-300">
              {channel.name.charAt(0)}
            </span>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white truncate">
            {channel.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-gray-400 truncate">
              {channel.country}
            </p>
            {isActive && isLoading && (
              <ClockIcon className="w-3 h-3 text-purple-400 animate-spin" />
            )}
          </div>
        </div>
        
        {isFavorite && (
          <HeartSolidIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
        )}
      </div>
    </div>
  )
})

ChannelItem.displayName = 'ChannelItem'

interface ChannelListProps {
  channels: ChannelWithStream[]
  currentChannel: ChannelWithStream | null
  favorites: string[]
  isLoading: boolean
  onChannelClick: (channel: ChannelWithStream) => void
}

export const ChannelList = memo(({ 
  channels, 
  currentChannel, 
  favorites, 
  isLoading: videoLoading,
  onChannelClick 
}: ChannelListProps) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(600)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollTop(container.scrollTop)
    }

    const updateHeight = () => {
      setContainerHeight(container.clientHeight)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    updateHeight()
    
    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
    }
  }, [])

  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN_COUNT)
  const endIndex = Math.min(
    channels.length - 1,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN_COUNT
  )

  const visibleChannels = channels.slice(startIndex, endIndex + 1)
  const totalHeight = channels.length * ITEM_HEIGHT
  const offsetY = startIndex * ITEM_HEIGHT

  if (channels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400 text-sm">No channels found</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      style={{ height: '100%', width: '100%', overflow: 'auto' }}
      className="custom-scrollbar"
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleChannels.map((channel) => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              isActive={currentChannel?.id === channel.id}
              isFavorite={favorites.includes(channel.id)}
              isLoading={currentChannel?.id === channel.id && videoLoading}
              onClick={() => onChannelClick(channel)}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

ChannelList.displayName = 'ChannelList'
