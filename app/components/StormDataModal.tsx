'use client'

import { useState, useEffect } from 'react'

interface StormDataModalProps {
  repName: string
  onClose?: () => void
}

interface StormEvent {
  id: number
  event_date: string
  state: string
  county?: string
  city?: string
  zip_code?: string
  latitude?: number
  longitude?: number
  hail_size?: number
  event_narrative?: string
  begin_time?: string
  end_time?: string
  source: string
}

interface StormSummary {
  total_events: number
  severe_hail_events: number
  very_severe_hail_events: number
  max_hail_size: number
  avg_hail_size: number
  earliest_event: string
  most_recent_event: string
  years_with_events: number[]
}

interface SearchResult {
  location: {
    address?: string
    city?: string
    state?: string
    zipCode?: string
    latitude?: number
    longitude?: number
    radiusMiles: number
  }
  summary: StormSummary | null
  storms: StormEvent[]
  count: number
}

export default function StormDataModal({ repName, onClose }: StormDataModalProps) {
  const [showModal, setShowModal] = useState(false)
  const [searchType, setSearchType] = useState<'address' | 'city' | 'gps'>('gps')

  // Search inputs
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('VA')
  const [zipCode, setZipCode] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [radiusMiles, setRadiusMiles] = useState(25)

  // GPS
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  // Results
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-detect GPS location when modal opens
  useEffect(() => {
    if (showModal && searchType === 'gps' && gpsStatus === 'idle') {
      detectGPSLocation()
    }
  }, [showModal, searchType])

  const handleOpenModal = () => {
    setShowModal(true)
    setError(null)
    setSearchResults(null)
    if (searchType === 'gps') {
      detectGPSLocation()
    }
  }

  const handleCloseModal = () => {
    if (!isSearching) {
      setShowModal(false)
      if (onClose) onClose()
      // Reset after animation
      setTimeout(() => {
        setSearchResults(null)
        setError(null)
        setGpsStatus('idle')
        setGpsLocation(null)
      }, 300)
    }
  }

  const detectGPSLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error')
      setError('GPS not supported by your browser')
      return
    }

    setGpsStatus('loading')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setGpsLocation(location)
        setGpsStatus('success')
        console.log('[GPS] Location detected:', location)
      },
      (err) => {
        console.error('[GPS] Error:', err)
        setGpsStatus('error')
        setError('Unable to detect location. Please enable GPS or search by address.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleSearch = async () => {
    setIsSearching(true)
    setError(null)

    try {
      let searchParams: any = {
        radiusMiles,
        startYear: year - 1, // Search current year and previous year
        endYear: year,
        includeSummary: true
      }

      if (searchType === 'gps' && gpsLocation) {
        searchParams.latitude = gpsLocation.lat
        searchParams.longitude = gpsLocation.lng
      } else if (searchType === 'address' && address.trim()) {
        searchParams.address = address.trim()
      } else if (searchType === 'city') {
        if (city.trim()) searchParams.city = city.trim()
        if (state) searchParams.state = state
        if (zipCode.trim()) searchParams.zipCode = zipCode.trim()
      }

      console.log('[Storm Search] Searching with params:', searchParams)

      const response = await fetch('/api/weather/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Search failed')
      }

      const data = await response.json()

      if (data.success) {
        setSearchResults(data)
      } else {
        throw new Error(data.error || 'Search failed')
      }

    } catch (err: any) {
      console.error('[Storm Search] Error:', err)
      setError(err.message || 'Failed to search storm data')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
      >
        <span>🌩️</span>
        <span>Storm Data</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-70 transition-opacity"
            onClick={handleCloseModal}
          />

          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-2xl">🌩️</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Storm Data Search</h2>
                    <p className="text-xs text-white/80">NOAA Historical Hail & Wind Events</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  disabled={isSearching}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                {/* Error Message */}
                {error && (
                  <div className="mb-4 bg-red-500/20 border-2 border-red-500 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl text-white">!</span>
                    </div>
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                {/* Search Type Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-700">
                  <button
                    onClick={() => setSearchType('gps')}
                    className={`px-4 py-2 font-semibold transition-colors ${
                      searchType === 'gps'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    📍 GPS Location
                  </button>
                  <button
                    onClick={() => setSearchType('address')}
                    className={`px-4 py-2 font-semibold transition-colors ${
                      searchType === 'address'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    🏠 Address
                  </button>
                  <button
                    onClick={() => setSearchType('city')}
                    className={`px-4 py-2 font-semibold transition-colors ${
                      searchType === 'city'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    🏙️ City/State
                  </button>
                </div>

                {/* GPS Location Search */}
                {searchType === 'gps' && (
                  <div className="space-y-4 mb-6">
                    <div className="bg-blue-500/20 border-2 border-blue-400 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">📍</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-blue-200 font-semibold text-sm mb-1">GPS Location Detection</p>
                          {gpsStatus === 'loading' && (
                            <p className="text-blue-300 text-sm">Detecting your location...</p>
                          )}
                          {gpsStatus === 'success' && gpsLocation && (
                            <div>
                              <p className="text-green-300 text-sm mb-1">✅ Location detected!</p>
                              <p className="text-blue-300 text-xs">
                                Lat: {gpsLocation.lat.toFixed(6)}, Lng: {gpsLocation.lng.toFixed(6)}
                              </p>
                            </div>
                          )}
                          {gpsStatus === 'error' && (
                            <p className="text-red-300 text-sm">❌ Location detection failed</p>
                          )}
                          {gpsStatus === 'idle' && (
                            <button
                              onClick={detectGPSLocation}
                              className="text-sm text-blue-300 hover:text-blue-200 underline"
                            >
                              Click to detect location
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Address Search */}
                {searchType === 'address' && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">
                        Full Address
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 Main St, Richmond, VA 23220"
                        className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 focus:border-blue-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all text-white placeholder-gray-500"
                      />
                    </div>
                  </div>
                )}

                {/* City/State Search */}
                {searchType === 'city' && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Richmond"
                        className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 focus:border-blue-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all text-white placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">State</label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 focus:border-blue-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all text-white"
                      >
                        <option value="VA">Virginia</option>
                        <option value="MD">Maryland</option>
                        <option value="PA">Pennsylvania</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">ZIP Code (Optional)</label>
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="23220"
                        className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 focus:border-blue-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all text-white placeholder-gray-500"
                      />
                    </div>
                  </div>
                )}

                {/* Common Search Options */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">Year</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 focus:border-blue-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all text-white"
                    >
                      {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">Search Radius</label>
                    <select
                      value={radiusMiles}
                      onChange={(e) => setRadiusMiles(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 focus:border-blue-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all text-white"
                    >
                      <option value={10}>10 miles</option>
                      <option value={25}>25 miles</option>
                      <option value={50}>50 miles</option>
                      <option value={100}>100 miles</option>
                    </select>
                  </div>
                </div>

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  disabled={isSearching || (searchType === 'gps' && !gpsLocation) || (searchType === 'address' && !address.trim()) || (searchType === 'city' && !city.trim() && !zipCode.trim())}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
                >
                  {isSearching ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>Search Storm Data</span>
                    </>
                  )}
                </button>

                {/* Results */}
                {searchResults && (
                  <div className="space-y-4">
                    {/* Summary Card */}
                    {searchResults.summary && (
                      <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-2 border-blue-500 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-blue-300 mb-4">
                          📊 Storm Summary ({radiusMiles} mile radius)
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-gray-800/50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Total Events</p>
                            <p className="text-2xl font-bold text-white">{searchResults.summary.total_events}</p>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Severe Hail (1"+)</p>
                            <p className="text-2xl font-bold text-orange-400">{searchResults.summary.severe_hail_events}</p>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Very Severe (2"+)</p>
                            <p className="text-2xl font-bold text-red-400">{searchResults.summary.very_severe_hail_events}</p>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Max Hail Size</p>
                            <p className="text-2xl font-bold text-purple-400">{searchResults.summary.max_hail_size?.toFixed(2) || 0}"</p>
                          </div>
                        </div>
                        {searchResults.summary.years_with_events && searchResults.summary.years_with_events.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-300">
                              Years with events: <span className="text-blue-300 font-semibold">{searchResults.summary.years_with_events.join(', ')}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Storm Events List */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-200 mb-3">
                        🌩️ Storm Events ({searchResults.count} found)
                      </h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {searchResults.storms.length === 0 ? (
                          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
                            <p className="text-gray-400">No storm events found for this location and time period.</p>
                          </div>
                        ) : (
                          searchResults.storms.map((storm) => (
                            <div key={storm.id} className="bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-lg p-4 transition-colors">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-semibold text-white">
                                    {new Date(storm.event_date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {storm.city}, {storm.county} County, {storm.state}
                                  </p>
                                </div>
                                {storm.hail_size && (
                                  <div className="bg-red-500/20 border border-red-500 rounded-lg px-3 py-1">
                                    <p className="text-red-300 font-bold text-sm">{storm.hail_size}" hail</p>
                                  </div>
                                )}
                              </div>
                              {storm.event_narrative && (
                                <p className="text-sm text-gray-300 mt-2">{storm.event_narrative}</p>
                              )}
                              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                <span>Source: {storm.source}</span>
                                {storm.zip_code && <span>ZIP: {storm.zip_code}</span>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
