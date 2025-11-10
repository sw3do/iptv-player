'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  FunnelIcon,
  GlobeAltIcon,
  RectangleStackIcon
} from '@heroicons/react/24/outline'
import type { Category, Country } from '@/types/iptv'

interface FilterPanelProps {
  searchInput: string
  selectedCategory: string
  selectedCountry: string
  categories: Category[]
  countries: Country[]
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onCountryChange: (value: string) => void
  onClearAll: () => void
}

export const FilterPanel = memo(({
  searchInput,
  selectedCategory,
  selectedCountry,
  categories,
  countries,
  onSearchChange,
  onCategoryChange,
  onCountryChange,
  onClearAll
}: FilterPanelProps) => {
  const hasActiveFilters = searchInput || selectedCategory || selectedCountry

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="glass-dark border-b border-white/5 overflow-hidden backdrop-blur-2xl"
    >
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Filters
            </h3>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                Active
              </span>
            )}
          </div>
          
          {hasActiveFilters && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all text-xs font-medium"
            >
              <XMarkIcon className="w-4 h-4" />
              Clear All
            </motion.button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
              <MagnifyingGlassIcon className="w-4 h-4 text-purple-400" />
            </div>
            <input
              type="text"
              placeholder="Search channels, categories..."
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-3 glass rounded-xl border border-white/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none text-white placeholder-gray-400 transition-all duration-200 bg-black/30 text-sm"
            />
            {searchInput && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-md transition-colors"
              >
                <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            )}
          </div>
          
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <RectangleStackIcon className="w-4 h-4 text-purple-400" />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full pl-10 pr-10 py-3 glass rounded-xl border border-white/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none text-white transition-all duration-200 bg-black/30 appearance-none cursor-pointer text-sm"
            >
              <option value="" className="bg-black/95 text-white">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id} className="bg-black/95 text-white">
                  {category.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {selectedCategory && (
              <button
                onClick={() => onCategoryChange('')}
                className="absolute right-9 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-md transition-colors z-10"
              >
                <XMarkIcon className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
              </button>
            )}
          </div>
          
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <GlobeAltIcon className="w-4 h-4 text-purple-400" />
            </div>
            <select
              value={selectedCountry}
              onChange={(e) => onCountryChange(e.target.value)}
              className="w-full pl-10 pr-10 py-3 glass rounded-xl border border-white/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none text-white transition-all duration-200 bg-black/30 appearance-none cursor-pointer text-sm"
            >
              <option value="" className="bg-black/95 text-white">All Countries</option>
              {countries.map(country => (
                <option key={country.code} value={country.code} className="bg-black/95 text-white">
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {selectedCountry && (
              <button
                onClick={() => onCountryChange('')}
                className="absolute right-9 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-md transition-colors z-10"
              >
                <XMarkIcon className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
              </button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5"
          >
            {searchInput && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs">
                Search: {searchInput}
                <button onClick={() => onSearchChange('')} className="hover:text-white">
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs">
                Category: {categories.find(c => c.id === selectedCategory)?.name}
                <button onClick={() => onCategoryChange('')} className="hover:text-white">
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCountry && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 text-green-300 rounded-lg text-xs">
                Country: {countries.find(c => c.code === selectedCountry)?.name}
                <button onClick={() => onCountryChange('')} className="hover:text-white">
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
})

FilterPanel.displayName = 'FilterPanel'

