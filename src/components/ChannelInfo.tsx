'use client'

import { memo } from 'react'
import { HeartIcon, ShareIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import type { ChannelWithStream } from '@/types/iptv'

interface ChannelInfoProps {
  channel: ChannelWithStream
  isFavorite: boolean
  onToggleFavorite: () => void
}

export const ChannelInfo = memo(({ channel, isFavorite, onToggleFavorite }: ChannelInfoProps) => {
  return (
    <div className="p-4 sm:p-6 border-t border-white/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 truncate">
            {channel.name}
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-400">
            {channel.categories[0] && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg">
                {channel.categories[0]}
              </span>
            )}
            <span>•</span>
            <span>{channel.country}</span>
            <span>•</span>
            <span>{channel.streams.length} streams</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFavorite}
            className="p-2.5 sm:p-3 glass hover:bg-white/10 rounded-xl transition-all"
          >
            {isFavorite ? (
              <HeartSolidIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
            ) : (
              <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </button>
          <button className="p-2.5 sm:p-3 glass hover:bg-white/10 rounded-xl transition-all">
            <ShareIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </div>
  )
})

ChannelInfo.displayName = 'ChannelInfo'
