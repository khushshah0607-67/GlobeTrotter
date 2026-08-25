import { useState, type FormEvent, useMemo, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Filter, Calendar, MapPin, X } from 'lucide-react'

import { apiClient, getApiErrorMessage } from '../api/client'
import { ErrorAlert } from '../components/ErrorAlert'
import { TripCard, type TripCardData } from '../components/TripCard'
import { TopNavBar } from '../components/TopNavBar'
import { useAuth } from '../hooks/useAuth'

const SAMPLE_COVERS = [
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80',
]

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [status, setStatus] = useState('planning')

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    if (searchParams.get('newTrip') === '1' || searchParams.get('create') === '1') {
      setIsCreateOpen(true)
      // Clean query param without navigation reload
      searchParams.delete('newTrip')
      searchParams.delete('create')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const {
    data: trips = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/trips')
      return response.data as TripCardData[]
    },
  })

  const createTripMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/api/v1/trips', {
        title: title.trim(),
        description: description.trim() || null,
        start_date: startDate,
        end_date: endDate,
        cover_image: coverImage.trim() || null,
        status: status || 'planning',
      })
      return response.data as { id: string }
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      setIsCreateOpen(false)
      resetForm()
      navigate(`/trip/${trip.id}`)
    },
  })

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setStartDate('')
    setEndDate('')
    setCoverImage('')
    setStatus('planning')
  }

  const submitCreateTrip = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    createTripMutation.mutate()
  }

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const matchesSearch =
        trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (trip.description && trip.description.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesStatus =
        statusFilter === 'all' || trip.status?.toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [trips, searchQuery, statusFilter])

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <TopNavBar />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        {/* Welcome Header & CTA */}
        <div className="mb-8 flex flex-col justify-between items-start gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.03em] text-[#0b1c30] md:text-4xl">
              Welcome back, {user?.full_name?.split(' ')[0] ?? 'Traveler'}.
            </h1>
            <p className="mt-1.5 text-base text-[#3f4850]">
              Here is a summary of your upcoming travels and collaborative plans.
            </p>
          </div>

          <button
            id="create-trip-header-btn"
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#fea619] px-6 py-3 font-semibold text-[#2a1700] shadow-sm transition hover:opacity-90 active:scale-[0.98] cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Create Trip</span>
          </button>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707881]" size={17} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destinations or trips..."
              className="w-full rounded-xl border border-[#bfc7d2] bg-white py-2.5 pl-10 pr-4 text-sm text-[#0b1c30] placeholder-[#707881] outline-none transition focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#707881] hover:text-[#0b1c30]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Filter size={15} className="mr-1 text-[#707881]" />
            {(['all', 'planning', 'active', 'completed'] as const).map((filterVal) => (
              <button
                key={filterVal}
                type="button"
                onClick={() => setStatusFilter(filterVal)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  statusFilter === filterVal
                    ? 'bg-[#006194] text-white shadow-2xs'
                    : 'border border-[#d3e4fe] bg-white text-[#3f4850] hover:bg-[#eff4ff]'
                }`}
              >
                {filterVal}
              </button>
            ))}
          </div>
        </div>

        {isError ? (
          <div className="mb-6">
            <ErrorAlert message={getApiErrorMessage(error)} />
          </div>
        ) : null}

        {isLoading ? (
          <div id="trips-section" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-xl border border-[#d3e4fe] bg-white shadow-sm">
                <div className="h-40 animate-pulse bg-[#dce9ff]" />
                <div className="space-y-3 p-5">
                  <div className="h-6 w-3/4 animate-pulse rounded bg-[#dce9ff]" />
                  <div className="h-4 w-full animate-pulse rounded bg-[#eff4ff]" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-[#eff4ff]" />
                </div>
              </div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          /* Empty state when no trips exist */
          <div id="trips-section" className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#bfc7d2] bg-white px-6 py-16 text-center shadow-xs">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#cce5ff] text-[#006194]">
              <MapPin size={32} />
            </div>
            <h2 className="text-2xl font-bold text-[#0b1c30]">Start planning your first trip</h2>
            <p className="mt-2 max-w-md text-sm text-[#3f4850]">
              Leave chaotic spreadsheets behind. Create a new trip to start building your itinerary, managing budgets, and organizing your travel.
            </p>
            <button
              id="empty-state-create-trip-btn"
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="mt-6 flex items-center gap-2 rounded-xl bg-[#fea619] px-6 py-3 font-semibold text-[#2a1700] shadow-sm transition hover:opacity-90 cursor-pointer"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Create Trip</span>
            </button>
          </div>
        ) : filteredTrips.length === 0 ? (
          /* Filtered empty state */
          <div id="trips-section" className="rounded-2xl border border-[#d3e4fe] bg-white p-12 text-center shadow-xs">
            <p className="text-base font-semibold text-[#0b1c30]">No trips match your filters</p>
            <p className="mt-1 text-sm text-[#3f4850]">Try changing your search term or filter selection.</p>
            <button
              id="reset-filters-btn"
              type="button"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
              className="mt-4 rounded-lg bg-[#006194] px-4 py-2 text-xs font-semibold text-white hover:bg-[#007bb9] cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Trips Grid */
          <div id="trips-section" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}

            {/* In-Grid Plan a New Trip Card (Stitch design component) */}
            <button
              id="grid-plan-new-trip-btn"
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#bfc7d2] bg-[#eff4ff]/60 p-8 text-center transition hover:border-[#006194] hover:bg-[#eff4ff] group cursor-pointer"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#006194] text-white shadow-xs transition group-hover:scale-105 group-hover:bg-[#007bb9]">
                <Plus size={26} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-[#0b1c30]">Plan a new trip</h3>
              <p className="mt-1 text-xs text-[#3f4850]">Start organizing your next adventure.</p>
            </button>
          </div>
        )}
      </main>

      {/* Create Trip Modal */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0b1c30]/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) setIsCreateOpen(false)
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#d3e4fe] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between border-b border-[#e5eeff] pb-4">
              <div>
                <h2 id="modal-title" className="text-xl font-bold text-[#0b1c30]">
                  Create a Trip
                </h2>
                <p className="mt-0.5 text-xs text-[#3f4850]">Set the trip details and travel dates.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Close dialog"
                className="rounded-full p-1.5 text-[#3f4850] transition hover:bg-[#eff4ff] hover:text-[#0b1c30]"
              >
                <X size={18} />
              </button>
            </div>

            {createTripMutation.error && (
              <div className="mb-4">
                <ErrorAlert message={getApiErrorMessage(createTripMutation.error)} />
              </div>
            )}

            <form onSubmit={submitCreateTrip} className="space-y-4">
              <div>
                <label htmlFor="trip-title" className="mb-1 block text-xs font-semibold text-[#3f4850]">
                  Trip Title *
                </label>
                <input
                  id="trip-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Japanese Temples & Tokyo Adventure"
                  className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3.5 py-2.5 text-sm text-[#0b1c30] outline-none transition focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                />
              </div>

              <div>
                <label htmlFor="trip-desc" className="mb-1 block text-xs font-semibold text-[#3f4850]">
                  Description
                </label>
                <textarea
                  id="trip-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief notes on goals, destinations, or purpose..."
                  className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3.5 py-2 text-sm text-[#0b1c30] outline-none transition focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="trip-start" className="mb-1 flex items-center gap-1 text-xs font-semibold text-[#3f4850]">
                    <Calendar size={13} />
                    <span>Start Date *</span>
                  </label>
                  <input
                    id="trip-start"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3 py-2 text-sm text-[#0b1c30] outline-none transition focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  />
                </div>

                <div>
                  <label htmlFor="trip-end" className="mb-1 flex items-center gap-1 text-xs font-semibold text-[#3f4850]">
                    <Calendar size={13} />
                    <span>End Date *</span>
                  </label>
                  <input
                    id="trip-end"
                    type="date"
                    required
                    min={startDate || undefined}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3 py-2 text-sm text-[#0b1c30] outline-none transition focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="trip-status" className="mb-1 block text-xs font-semibold text-[#3f4850]">
                  Initial Status
                </label>
                <select
                  id="trip-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3 py-2.5 text-sm text-[#0b1c30] outline-none transition focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#3f4850]">
                  Cover Image
                </label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3.5 py-2 text-sm text-[#0b1c30] outline-none transition focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                />
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] text-[#707881]">Presets:</span>
                  {SAMPLE_COVERS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCoverImage(url)}
                      className={`h-7 w-10 overflow-hidden rounded border transition ${
                        coverImage === url ? 'ring-2 ring-[#006194] border-[#006194]' : 'border-[#bfc7d2] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Preset ${i + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-[#e5eeff] pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-[#bfc7d2] px-4 py-2.5 text-sm font-semibold text-[#3f4850] hover:bg-[#eff4ff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTripMutation.isPending}
                  className="rounded-xl bg-[#006194] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007bb9] disabled:opacity-60"
                >
                  {createTripMutation.isPending ? 'Creating...' : 'Create Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
