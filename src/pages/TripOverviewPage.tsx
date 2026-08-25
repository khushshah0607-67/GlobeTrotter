import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  DollarSign,
  Layers,
  ArrowRight,
  X,
} from 'lucide-react'

import { apiClient, getApiErrorMessage } from '../api/client'
import { ErrorAlert } from '../components/ErrorAlert'
import { TopNavBar } from '../components/TopNavBar'
import { TripSidebar } from '../components/TripSidebar'
import { TripBottomNav } from '../components/TripBottomNav'
import type { Trip, TripSpendingSummary } from '../types'

const formatDateRange = (start: string, end: string) => {
  const startDate = new Date(start)
  const endDate = new Date(end)

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return `${start || 'TBD'} - ${end || 'TBD'}`
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`
}

const formatCurrency = (value: string | number | null | undefined, currency = 'USD') => {
  if (value === null || value === undefined || value === '') {
    return '$0.00'
  }

  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return '$0.00'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

const getStatusBadgeClasses = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'planning':
      return 'bg-[#cce5ff] text-[#004b73] border border-[#006194]/20'
    case 'active':
      return 'bg-[#dce9ff] text-[#006194] border border-[#006194]/20'
    case 'completed':
      return 'bg-[#e5eeff] text-[#3f4850] border border-[#bfc7d2]'
    default:
      return 'bg-[#f3f4f6] text-[#3f4850] border border-[#d3e4fe]'
  }
}

export function TripOverviewPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [isAddStopOpen, setIsAddStopOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  // Edit trip fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [status, setStatus] = useState('planning')

  // Add stop fields
  const [cityName, setCityName] = useState('')
  const [country, setCountry] = useState('')
  const [arrivalDate, setArrivalDate] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [cityNotes, setCityNotes] = useState('')

  const tripQuery = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/trips/${tripId}`)
      return response.data as Trip
    },
    enabled: Boolean(tripId),
  })

  const summaryQuery = useQuery({
    queryKey: ['trip-summary', tripId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/trips/${tripId}/summary`)
      return response.data as TripSpendingSummary
    },
    enabled: Boolean(tripId),
  })

  const updateTripMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch(`/api/v1/trips/${tripId}`, {
        title: title.trim(),
        description: description.trim() || null,
        start_date: startDate,
        end_date: endDate,
        cover_image: coverImage.trim() || null,
        status,
      })
      return response.data as Trip
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] })
      queryClient.invalidateQueries({ queryKey: ['trip-summary', tripId] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      setIsEditing(false)
    },
  })

  const deleteTripMutation = useMutation({
    mutationFn: async () => apiClient.delete(`/api/v1/trips/${tripId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      navigate('/dashboard', { replace: true })
    },
  })

  const addCityMutation = useMutation({
    mutationFn: async () => {
      const currentCitiesCount = trip?.cities?.length ?? 0
      const response = await apiClient.post(`/api/v1/trips/${tripId}/cities`, {
        city_name: cityName.trim(),
        country: country.trim(),
        arrival_date: arrivalDate,
        departure_date: departureDate,
        notes: cityNotes.trim() || null,
        order_index: currentCitiesCount,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] })
      queryClient.invalidateQueries({ queryKey: ['trip-summary', tripId] })
      setIsAddStopOpen(false)
      setCityName('')
      setCountry('')
      setArrivalDate('')
      setDepartureDate('')
      setCityNotes('')
    },
  })

  const trip = tripQuery.data
  const summary = summaryQuery.data
  const isLoading = tripQuery.isLoading || summaryQuery.isLoading
  const error = tripQuery.error ?? summaryQuery.error

  const cityCount = summary?.cities_count ?? trip?.cities?.length ?? 0
  const activityCount =
    summary?.activities_count ??
    trip?.cities?.reduce((count, city) => count + (city.activities?.length || 0), 0) ??
    0
  const totalActivityCost = Number(summary?.total_activity_cost ?? 0)
  const totalBudget = Number(summary?.budget?.total_budget ?? 0)
  const remainingBudget = summary?.remaining_budget ?? Math.max(totalBudget - totalActivityCost, 0)
  const budgetCurrency = summary?.budget?.currency ?? 'USD'
  const budgetProgress = totalBudget > 0 ? Math.min((totalActivityCost / totalBudget) * 100, 100) : 0

  const openTripEditor = () => {
    if (!trip) return
    setTitle(trip.title)
    setDescription(trip.description ?? '')
    setStartDate(trip.start_date)
    setEndDate(trip.end_date)
    setCoverImage(trip.cover_image ?? '')
    setStatus(trip.status ?? 'planning')
    setIsEditing(true)
  }

  const openAddStopModal = () => {
    if (trip) {
      setArrivalDate(trip.start_date || '')
      setDepartureDate(trip.end_date || '')
    }
    setIsAddStopOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <TopNavBar currentTripId={tripId} />

      {tripId && (
        <TripSidebar
          tripId={tripId}
          tripTitle={trip?.title}
          tripStatus={trip?.status}
          tripCoverImage={trip?.cover_image}
          onAddStop={openAddStopModal}
        />
      )}

      {/* Main Content Canvas */}
      <main className="mx-auto max-w-[1600px] px-4 pb-24 pt-20 sm:px-6 lg:pl-[280px] lg:pr-8">
        {error && (
          <div className="mb-6">
            <ErrorAlert message={getApiErrorMessage(error)} />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <div className="h-[240px] animate-pulse rounded-2xl bg-[#dce9ff]" />
            <div className="h-8 w-2/3 animate-pulse rounded bg-[#dce9ff]" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-xl bg-white shadow-xs" />
              ))}
            </div>
          </div>
        ) : trip ? (
          <div className="space-y-8">
            {/* Header Cover Banner */}
            <section className="flex flex-col gap-5">
              <div className="relative h-[260px] w-full overflow-hidden rounded-2xl border border-[#d3e4fe] shadow-sm">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                  style={{
                    backgroundImage: `url(${
                      trip.cover_image ||
                      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80'
                    })`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c30]/90 via-[#0b1c30]/40 to-transparent" />

                <div className="absolute bottom-0 left-0 flex w-full flex-col justify-between gap-3 p-6 md:flex-row md:items-end">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${getStatusBadgeClasses(
                          trip.status,
                        )}`}
                      >
                        {trip.status}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
                        <Calendar size={14} />
                        {formatDateRange(trip.start_date, trip.end_date)}
                      </span>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                      {trip.title}
                    </h1>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={openTripEditor}
                      className="flex items-center gap-1.5 rounded-xl bg-white/90 px-3.5 py-2 text-xs font-semibold text-[#006194] shadow-sm backdrop-blur-xs transition hover:bg-white active:scale-95"
                    >
                      <Edit2 size={14} />
                      <span>Edit Trip</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-[#ffdad6]/90 px-3.5 py-2 text-xs font-semibold text-[#ba1a1a] shadow-sm backdrop-blur-xs transition hover:bg-[#ffdad6] active:scale-95"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#d3e4fe] bg-white p-5 shadow-xs md:flex-row md:items-center">
                <p className="text-sm leading-relaxed text-[#3f4850] max-w-4xl">
                  {trip.description ||
                    'No description provided yet for this trip. Click "Edit Trip" to add notes, trip goals, or reservation highlights.'}
                </p>
                <button
                  type="button"
                  onClick={openAddStopModal}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#006194] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#007bb9] active:scale-95"
                >
                  <Plus size={15} />
                  <span>Add Stop / City</span>
                </button>
              </div>
            </section>

            {/* Summary & Bento Grid Area */}
            <section className="grid grid-cols-1 gap-6 md:grid-cols-12">
              {/* Summary Metric Cards (Span 8 on desktop) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:col-span-8">
                {/* Card 1: Destinations */}
                <div className="flex flex-col justify-between rounded-2xl border border-[#d3e4fe] bg-white p-6 shadow-xs transition hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#cce5ff] text-[#006194]">
                    <MapPin size={24} />
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#3f4850]">
                      Destinations
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#0b1c30]">
                      {cityCount} {cityCount === 1 ? 'City' : 'Cities'}
                    </p>
                  </div>
                </div>

                {/* Card 2: Planned Activities */}
                <div className="flex flex-col justify-between rounded-2xl border border-[#d3e4fe] bg-white p-6 shadow-xs transition hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fea619]/20 text-[#855300]">
                    <Layers size={24} />
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#3f4850]">
                      Planned Activities
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#0b1c30]">
                      {activityCount} {activityCount === 1 ? 'Item' : 'Items'}
                    </p>
                  </div>
                </div>

                {/* Card 3: Estimated Activity Cost */}
                <div className="flex flex-col justify-between rounded-2xl border border-[#d3e4fe] bg-white p-6 shadow-xs transition hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8a4cfc]/20 text-[#712ae2]">
                    <DollarSign size={24} />
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#3f4850]">
                      Est. Activity Cost
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#0b1c30]">
                      {formatCurrency(totalActivityCost, budgetCurrency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Budget Overview (Span 4 on desktop) */}
              <div className="flex flex-col justify-between rounded-2xl border border-[#d3e4fe] bg-white p-6 shadow-xs transition hover:shadow-md md:col-span-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#0b1c30]">Trip Budget</h3>
                    <p className="text-xs text-[#3f4850]">Overall trip allowance</p>
                  </div>
                  <Link
                    to={`/trip/${tripId}/budget`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#006194] transition hover:bg-[#eff4ff]"
                    title="Edit Budget"
                  >
                    <Edit2 size={16} />
                  </Link>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3f4850]">
                        Activity Cost
                      </span>
                      <p className="text-xl font-bold text-[#0b1c30]">
                        {formatCurrency(totalActivityCost, budgetCurrency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3f4850]">
                        Total Budget
                      </span>
                      <p className="text-sm font-semibold text-[#3f4850]">
                        {totalBudget > 0 ? formatCurrency(totalBudget, budgetCurrency) : 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[#d3e4fe]">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${
                        budgetProgress > 90 ? 'bg-[#ba1a1a]' : 'bg-[#006194]'
                      }`}
                      style={{ width: `${budgetProgress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#3f4850]">
                    <span>{budgetProgress.toFixed(0)}% allocated</span>
                    <span className="font-semibold text-[#006194]">
                      {summary?.budget
                        ? `${formatCurrency(remainingBudget, budgetCurrency)} Remaining`
                        : 'Set a trip budget'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Destinations & Itinerary Route Overview */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#e5eeff] pb-3">
                <div>
                  <h2 className="text-xl font-bold text-[#0b1c30]">Trip Destinations & Route</h2>
                  <p className="text-xs text-[#3f4850]">
                    Ordered timeline of your stops across this journey.
                  </p>
                </div>
                <Link
                  to={`/trip/${tripId}/itinerary`}
                  className="flex items-center gap-1 text-xs font-bold text-[#006194] transition hover:underline"
                >
                  <span>Open Full Itinerary</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              {trip.cities && trip.cities.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {trip.cities.map((city, index) => (
                    <div
                      key={city.id}
                      className="group flex flex-col justify-between rounded-2xl border border-[#d3e4fe] bg-white p-5 shadow-xs transition hover:border-[#006194] hover:shadow-md"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#cce5ff] text-xs font-bold text-[#004b73]">
                            {index + 1}
                          </span>
                          <span className="text-xs font-medium text-[#707881]">
                            {formatDateRange(city.arrival_date, city.departure_date)}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-[#0b1c30]">
                          {city.city_name}
                          <span className="ml-1 text-sm font-normal text-[#3f4850]">
                            , {city.country}
                          </span>
                        </h3>
                        {city.notes && (
                          <p className="line-clamp-2 text-xs text-[#3f4850]">{city.notes}</p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-[#e5eeff] pt-3">
                        <span className="text-xs font-semibold text-[#006194]">
                          {city.activities?.length || 0} Activities
                        </span>
                        <Link
                          to={`/trip/${tripId}/itinerary?city=${city.id}`}
                          className="flex items-center gap-1 text-xs font-bold text-[#006194] transition group-hover:translate-x-1"
                        >
                          <span>View Days</span>
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#bfc7d2] bg-white p-8 text-center">
                  <MapPin size={28} className="text-[#707881]" />
                  <h3 className="mt-2 text-base font-bold text-[#0b1c30]">No destinations yet</h3>
                  <p className="mt-1 text-xs text-[#3f4850]">
                    Add your first stop (e.g. Rome, Tokyo, Paris) to begin mapping activities and schedules.
                  </p>
                  <button
                    type="button"
                    onClick={openAddStopModal}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#006194] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#007bb9]"
                  >
                    <Plus size={14} />
                    <span>Add First Stop</span>
                  </button>
                </div>
              )}
            </section>
          </div>
        ) : null}
      </main>

      {tripId && <TripBottomNav tripId={tripId} />}

      {/* Edit Trip Modal */}
      {isEditing && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-[#0b1c30]/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-trip-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsEditing(false)
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#d3e4fe] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between border-b border-[#e5eeff] pb-4">
              <div>
                <h2 id="edit-trip-title" className="text-xl font-bold text-[#0b1c30]">
                  Edit Trip Details
                </h2>
                <p className="text-xs text-[#3f4850]">Keep dates, title, and cover image updated.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                aria-label="Close dialog"
                className="rounded-full p-1.5 text-[#3f4850] hover:bg-[#eff4ff]"
              >
                <X size={18} />
              </button>
            </div>

            {updateTripMutation.error && (
              <div className="mb-4">
                <ErrorAlert message={getApiErrorMessage(updateTripMutation.error)} />
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                updateTripMutation.mutate()
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Trip Title *</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3.5 py-2.5 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3.5 py-2 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Start Date *</label>
                  <input
                    required
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3 py-2 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3f4850]">End Date *</label>
                  <input
                    required
                    type="date"
                    min={startDate || undefined}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3 py-2 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3 py-2.5 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Cover Image URL</label>
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3 py-2 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-[#e5eeff] pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl border border-[#bfc7d2] px-4 py-2 text-sm font-semibold text-[#3f4850] hover:bg-[#eff4ff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateTripMutation.isPending}
                  className="rounded-xl bg-[#006194] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007bb9] disabled:opacity-60"
                >
                  {updateTripMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Stop Modal */}
      {isAddStopOpen && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-[#0b1c30]/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-stop-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsAddStopOpen(false)
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#d3e4fe] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between border-b border-[#e5eeff] pb-4">
              <div>
                <h2 id="add-stop-title" className="text-xl font-bold text-[#0b1c30]">
                  Add New Stop
                </h2>
                <p className="text-xs text-[#3f4850]">Add a destination city to your itinerary.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStopOpen(false)}
                aria-label="Close dialog"
                className="rounded-full p-1.5 text-[#3f4850] hover:bg-[#eff4ff]"
              >
                <X size={18} />
              </button>
            </div>

            {addCityMutation.error && (
              <div className="mb-4">
                <ErrorAlert message={getApiErrorMessage(addCityMutation.error)} />
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                addCityMutation.mutate()
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3f4850]">City Name *</label>
                  <input
                    required
                    type="text"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="e.g. Florence"
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3.5 py-2.5 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Country *</label>
                  <input
                    required
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. Italy"
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3.5 py-2.5 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Arrival Date *</label>
                  <input
                    required
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3 py-2 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Departure Date *</label>
                  <input
                    required
                    type="date"
                    min={arrivalDate || undefined}
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3 py-2 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Notes / Accommodations</label>
                <textarea
                  rows={2}
                  value={cityNotes}
                  onChange={(e) => setCityNotes(e.target.value)}
                  placeholder="Hotel reservations, transport arrival info, etc."
                  className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3.5 py-2 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-[#e5eeff] pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddStopOpen(false)}
                  className="rounded-xl border border-[#bfc7d2] px-4 py-2 text-sm font-semibold text-[#3f4850] hover:bg-[#eff4ff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addCityMutation.isPending}
                  className="rounded-xl bg-[#006194] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007bb9] disabled:opacity-60"
                >
                  {addCityMutation.isPending ? 'Adding...' : 'Add Stop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Trip Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0b1c30]/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#ffdad6] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#ffdad6] text-[#ba1a1a]">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-[#0b1c30]">Delete &ldquo;{trip.title}&rdquo;?</h3>
            <p className="mt-2 text-sm text-[#3f4850]">
              This will permanently remove this trip, its cities, activities, budget, and member permissions. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="rounded-xl border border-[#bfc7d2] px-4 py-2 text-sm font-semibold text-[#3f4850] hover:bg-[#eff4ff]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteTripMutation.isPending}
                onClick={() => deleteTripMutation.mutate()}
                className="rounded-xl bg-[#ba1a1a] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#93000a] disabled:opacity-60"
              >
                {deleteTripMutation.isPending ? 'Deleting...' : 'Yes, Delete Trip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
