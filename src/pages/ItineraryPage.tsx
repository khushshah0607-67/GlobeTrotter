import { useState, useEffect } from 'react'
import {
  Pencil,
  Trash2,
  Plus,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  X,
  Compass,
  Utensils,
  Bed,
  Plane,
  Ticket,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'

import { apiClient, getApiErrorMessage } from '../api/client'
import { ErrorAlert } from '../components/ErrorAlert'
import { TopNavBar } from '../components/TopNavBar'
import { TripSidebar } from '../components/TripSidebar'
import { TripBottomNav } from '../components/TripBottomNav'
import type { Activity, TripCity, Trip } from '../types'

const CATEGORIES = [
  { value: 'Sightseeing', label: 'Sightseeing & Landmark', icon: Compass, color: 'bg-[#fea619]/20 text-[#855300]' },
  { value: 'Dining', label: 'Dining & Food', icon: Utensils, color: 'bg-[#8a4cfc]/20 text-[#712ae2]' },
  { value: 'Accommodation', label: 'Hotel & Lodging', icon: Bed, color: 'bg-[#cce5ff] text-[#006194]' },
  { value: 'Transport', label: 'Flight & Transport', icon: Plane, color: 'bg-[#eff4ff] text-[#004b73]' },
  { value: 'Tour', label: 'Tour & Excursion', icon: Ticket, color: 'bg-[#dce9ff] text-[#006194]' },
  { value: 'Shopping', label: 'Shopping', icon: ShoppingBag, color: 'bg-[#ffddb8] text-[#855300]' },
  { value: 'Entertainment', label: 'Entertainment & Nightlife', icon: Sparkles, color: 'bg-[#eaddff] text-[#712ae2]' },
]

const getCategoryBadge = (categoryName?: string | null) => {
  const match = CATEGORIES.find((c) => c.value.toLowerCase() === categoryName?.toLowerCase())
  if (match) {
    const Icon = match.icon
    return {
      label: match.value,
      icon: <Icon size={14} />,
      badgeClass: match.color,
    }
  }
  return {
    label: categoryName || 'Activity',
    icon: <Compass size={14} />,
    badgeClass: 'bg-[#eff4ff] text-[#3f4850]',
  }
}

type CityForm = {
  city_name: string
  country: string
  arrival_date: string
  departure_date: string
  order_index: string
  notes: string
}

type ActivityForm = {
  name: string
  category: string
  date: string
  start_time: string
  end_time: string
  estimated_cost: string
  currency: string
  location_name: string
  order_index: string
  notes: string
}

const emptyCityForm: CityForm = {
  city_name: '',
  country: '',
  arrival_date: '',
  departure_date: '',
  order_index: '0',
  notes: '',
}

const emptyActivityForm: ActivityForm = {
  name: '',
  category: 'Sightseeing',
  date: '',
  start_time: '',
  end_time: '',
  estimated_cost: '',
  currency: 'USD',
  location_name: '',
  order_index: '0',
  notes: '',
}

const formatShortDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
}

const formatTime = (value?: string | null) => {
  if (!value) return null
  const [hours, minutes] = value.split(':')
  if (!hours) return value
  const date = new Date()
  date.setHours(Number(hours), Number(minutes || 0), 0, 0)
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date)
}

const formatCost = (value?: string | number | null, currency = 'USD') => {
  if (value === null || value === undefined || value === '') return null
  const amount = Number(value)
  if (Number.isNaN(amount)) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount)
}

const calculateNights = (arrival: string, departure: string) => {
  const arrivalDate = new Date(arrival).getTime()
  const departureDate = new Date(departure).getTime()
  if (Number.isNaN(arrivalDate) || Number.isNaN(departureDate)) return '—'
  const diffDays = Math.round((departureDate - arrivalDate) / (1000 * 60 * 60 * 24))
  return `${Math.max(diffDays, 0)} ${diffDays === 1 ? 'Night' : 'Nights'}`
}

export function ItineraryPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const [modal, setModal] = useState<'city' | 'activity' | null>(null)
  const [selectedCity, setSelectedCity] = useState<TripCity | null>(null)
  const [editingCity, setEditingCity] = useState<TripCity | null>(null)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [cityToDelete, setCityToDelete] = useState<TripCity | null>(null)
  const [activityToDelete, setActivityToDelete] = useState<{ city: TripCity; activity: Activity } | null>(null)

  const [cityForm, setCityForm] = useState<CityForm>(emptyCityForm)
  const [activityForm, setActivityForm] = useState<ActivityForm>(emptyActivityForm)

  const tripQuery = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/trips/${tripId}`)
      return response.data as Trip
    },
    enabled: Boolean(tripId),
  })

  const citiesQuery = useQuery({
    queryKey: ['trip', tripId, 'cities'],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/trips/${tripId}/cities`)
      return response.data as TripCity[]
    },
    enabled: Boolean(tripId),
  })

  // Trigger Add City if navigated with ?newStop=1 or ?addStop=1
  useEffect(() => {
    if (searchParams.get('newStop') || searchParams.get('addStop')) {
      openAddCityModal()
    }
  }, [searchParams])

  const createCityMutation = useMutation({
    mutationFn: async (form: CityForm) => {
      const response = await apiClient.post(`/api/v1/trips/${tripId}/cities`, {
        city_name: form.city_name.trim(),
        country: form.country.trim(),
        arrival_date: form.arrival_date,
        departure_date: form.departure_date,
        order_index: Number(form.order_index),
        notes: form.notes.trim() || null,
      })
      return response.data as TripCity
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] })
      queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'cities'] })
      queryClient.invalidateQueries({ queryKey: ['trip-summary', tripId] })
      setModal(null)
      setCityForm(emptyCityForm)
    },
  })

  const updateCityMutation = useMutation({
    mutationFn: async ({ city, form }: { city: TripCity; form: CityForm }) => {
      const response = await apiClient.patch(`/api/v1/trips/${tripId}/cities/${city.id}`, {
        city_name: form.city_name.trim(),
        country: form.country.trim(),
        arrival_date: form.arrival_date,
        departure_date: form.departure_date,
        order_index: Number(form.order_index),
        notes: form.notes.trim() || null,
      })
      return response.data as TripCity
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] })
      queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'cities'] })
      queryClient.invalidateQueries({ queryKey: ['trip-summary', tripId] })
      setModal(null)
      setEditingCity(null)
    },
  })

  const deleteCityMutation = useMutation({
    mutationFn: async (city: TripCity) => apiClient.delete(`/api/v1/trips/${tripId}/cities/${city.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] })
      queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'cities'] })
      queryClient.invalidateQueries({ queryKey: ['trip-summary', tripId] })
      setCityToDelete(null)
    },
  })

  const createActivityMutation = useMutation({
    mutationFn: async ({ city, form }: { city: TripCity; form: ActivityForm }) => {
      const payload = {
        name: form.name.trim(),
        category: form.category || null,
        date: form.date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : null,
        currency: form.currency || 'USD',
        location_name: form.location_name.trim() || null,
        notes: form.notes.trim() || null,
        order_index: Number(form.order_index),
      }
      const response = await apiClient.post(
        `/api/v1/trips/${tripId}/cities/${city.id}/activities`,
        payload,
      )
      return response.data as Activity
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'cities'] })
      queryClient.invalidateQueries({ queryKey: ['trip-summary', tripId] })
      setModal(null)
      setActivityForm(emptyActivityForm)
      setSelectedCity(null)
    },
  })

  const updateActivityMutation = useMutation({
    mutationFn: async ({
      city,
      activity,
      form,
    }: {
      city: TripCity
      activity: Activity
      form: ActivityForm
    }) => {
      const payload = {
        name: form.name.trim(),
        category: form.category || null,
        date: form.date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : null,
        currency: form.currency || 'USD',
        location_name: form.location_name.trim() || null,
        notes: form.notes.trim() || null,
        order_index: Number(form.order_index),
      }
      const response = await apiClient.patch(
        `/api/v1/trips/${tripId}/cities/${city.id}/activities/${activity.id}`,
        payload,
      )
      return response.data as Activity
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'cities'] })
      queryClient.invalidateQueries({ queryKey: ['trip-summary', tripId] })
      setModal(null)
      setSelectedCity(null)
      setEditingActivity(null)
    },
  })

  const deleteActivityMutation = useMutation({
    mutationFn: async ({ city, activity }: { city: TripCity; activity: Activity }) =>
      apiClient.delete(`/api/v1/trips/${tripId}/cities/${city.id}/activities/${activity.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'cities'] })
      queryClient.invalidateQueries({ queryKey: ['trip-summary', tripId] })
      setActivityToDelete(null)
    },
  })

  const openAddCityModal = () => {
    setEditingCity(null)
    setCityForm({
      ...emptyCityForm,
      arrival_date: tripQuery.data?.start_date || '',
      departure_date: tripQuery.data?.end_date || '',
      order_index: String(citiesQuery.data?.length ?? 0),
    })
    setModal('city')
  }

  const openEditCityModal = (city: TripCity) => {
    setEditingCity(city)
    setCityForm({
      city_name: city.city_name,
      country: city.country,
      arrival_date: city.arrival_date,
      departure_date: city.departure_date,
      order_index: String(city.order_index),
      notes: city.notes || '',
    })
    setModal('city')
  }

  const openAddActivityModal = (city: TripCity) => {
    setEditingActivity(null)
    setSelectedCity(city)
    setActivityForm({
      ...emptyActivityForm,
      date: city.arrival_date,
      order_index: String(city.activities?.length ?? 0),
    })
    setModal('activity')
  }

  const openEditActivityModal = (city: TripCity, activity: Activity) => {
    setSelectedCity(city)
    setEditingActivity(activity)
    setActivityForm({
      name: activity.name,
      category: activity.category || 'Sightseeing',
      date: activity.date,
      start_time: activity.start_time || '',
      end_time: activity.end_time || '',
      estimated_cost: activity.estimated_cost == null ? '' : String(activity.estimated_cost),
      currency: activity.currency || 'USD',
      location_name: activity.location_name || '',
      order_index: String(activity.order_index),
      notes: activity.notes || '',
    })
    setModal('activity')
  }

  const submitCity = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (editingCity) {
      updateCityMutation.mutate({ city: editingCity, form: cityForm })
    } else {
      createCityMutation.mutate(cityForm)
    }
  }

  const submitActivity = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selectedCity && editingActivity) {
      updateActivityMutation.mutate({
        city: selectedCity,
        activity: editingActivity,
        form: activityForm,
      })
    } else if (selectedCity) {
      createActivityMutation.mutate({ city: selectedCity, form: activityForm })
    }
  }

  const cities = [...(citiesQuery.data ?? [])].sort(
    (a, b) => a.order_index - b.order_index || new Date(a.arrival_date).getTime() - new Date(b.arrival_date).getTime(),
  )

  const mutationError =
    createCityMutation.error ??
    updateCityMutation.error ??
    deleteCityMutation.error ??
    createActivityMutation.error ??
    updateActivityMutation.error ??
    deleteActivityMutation.error

  const trip = tripQuery.data

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <TopNavBar currentTripId={tripId} />

      {tripId && (
        <TripSidebar
          tripId={tripId}
          tripTitle={trip?.title}
          tripStatus={trip?.status}
          tripCoverImage={trip?.cover_image}
          onAddStop={openAddCityModal}
        />
      )}

      {/* Main Itinerary Content */}
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-20 sm:px-6 lg:pl-[280px] lg:pr-10">
        {/* Header bar */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#e5eeff] pb-5 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0b1c30]">Trip Itinerary</h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-[#3f4850]">
              <Calendar size={15} />
              <span>
                {trip
                  ? `${formatShortDate(trip.start_date)} - ${formatShortDate(trip.end_date)}`
                  : 'Map out your destinations and schedules'}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={openAddCityModal}
            className="inline-flex items-center gap-2 rounded-xl bg-[#006194] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007bb9] active:scale-95"
          >
            <Plus size={16} />
            <span>Add Destination City</span>
          </button>
        </div>

        {citiesQuery.isError && (
          <div className="mb-6">
            <ErrorAlert message={getApiErrorMessage(citiesQuery.error)} />
          </div>
        )}

        {mutationError && (
          <div className="mb-6">
            <ErrorAlert message={getApiErrorMessage(mutationError)} />
          </div>
        )}

        {citiesQuery.isLoading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-white shadow-xs" />
            ))}
          </div>
        ) : cities.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#bfc7d2] bg-white p-12 text-center shadow-xs">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#cce5ff] text-[#006194]">
              <MapPin size={32} />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[#0b1c30]">No destinations yet</h2>
            <p className="mt-1 max-w-sm text-xs text-[#3f4850]">
              Add your first destination city (e.g. Rome, Tokyo, Paris) to begin scheduling activities, museum tours, and dinners.
            </p>
            <button
              type="button"
              onClick={openAddCityModal}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#006194] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#007bb9]"
            >
              <Plus size={16} />
              <span>Add First Destination</span>
            </button>
          </div>
        ) : (
          /* Timeline view of cities and activities */
          <div className="relative space-y-10 pl-6 sm:pl-8 before:absolute before:bottom-6 before:left-[11px] before:top-6 before:w-0.5 before:bg-[#bfc7d2] sm:before:left-[15px]">
            {cities.map((city, index) => {
              const cityActivities = [...(city.activities || [])].sort(
                (a, b) =>
                  a.order_index - b.order_index ||
                  new Date(a.date).getTime() - new Date(b.date).getTime() ||
                  (a.start_time || '').localeCompare(b.start_time || ''),
              )

              const cityCostTotal = cityActivities.reduce(
                (sum, a) => sum + (Number(a.estimated_cost) || 0),
                0,
              )

              return (
                <section key={city.id} className="relative">
                  {/* Timeline connector dot */}
                  <div className="absolute -left-[27px] top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border-4 border-[#006194] bg-[#f8f9ff] text-[10px] font-bold text-[#006194] sm:-left-[31px]">
                    {index + 1}
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-[#d3e4fe] bg-white shadow-xs transition hover:shadow-md">
                    {/* City Stop Header */}
                    <div className="flex flex-col justify-between gap-4 border-b border-[#e5eeff] bg-[#eff4ff] p-5 sm:flex-row sm:items-center">
                      <div>
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h2 className="text-xl font-bold text-[#0b1c30]">{city.city_name}</h2>
                          <span className="text-sm font-semibold text-[#707881]">
                            {city.country}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-[#3f4850]">
                          {formatShortDate(city.arrival_date)} &ndash;{' '}
                          {formatShortDate(city.departure_date)} ({calculateNights(
                            city.arrival_date,
                            city.departure_date,
                          )})
                          {cityCostTotal > 0 && (
                            <span className="ml-2 font-semibold text-[#006194]">
                              &bull; Est. {formatCost(cityCostTotal, cityActivities[0]?.currency || 'USD')}
                            </span>
                          )}
                        </p>
                        {city.notes && (
                          <p className="mt-1 text-xs text-[#707881] italic">{city.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openAddActivityModal(city)}
                          className="flex items-center gap-1.5 rounded-xl border border-[#006194] bg-white px-3 py-1.5 text-xs font-semibold text-[#006194] transition hover:bg-[#cce5ff] active:scale-95"
                        >
                          <Plus size={14} />
                          <span>Add Activity</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditCityModal(city)}
                          aria-label={`Edit ${city.city_name}`}
                          className="rounded-lg p-2 text-[#707881] transition hover:bg-[#dce9ff] hover:text-[#006194]"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCityToDelete(city)}
                          aria-label={`Delete ${city.city_name}`}
                          className="rounded-lg p-2 text-[#ba1a1a] transition hover:bg-[#ffdad6]"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Activities List */}
                    <div className="divide-y divide-[#f8f9ff] p-4 sm:p-5">
                      {cityActivities.length === 0 ? (
                        <div className="py-6 text-center">
                          <p className="text-xs text-[#707881]">
                            No activities planned for {city.city_name} yet.
                          </p>
                          <button
                            type="button"
                            onClick={() => openAddActivityModal(city)}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#006194] hover:underline"
                          >
                            <Plus size={13} />
                            <span>Add first activity</span>
                          </button>
                        </div>
                      ) : (
                        cityActivities.map((activity) => {
                          const badge = getCategoryBadge(activity.category)
                          return (
                            <div
                              key={activity.id}
                              className="group flex flex-col justify-between gap-3 rounded-xl p-3 transition hover:bg-[#eff4ff]/60 sm:flex-row sm:items-center"
                            >
                              <div className="flex items-start gap-3.5">
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${badge.badgeClass}`}
                                >
                                  {badge.icon}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-sm font-bold text-[#0b1c30]">
                                      {activity.name}
                                    </h3>
                                    <span
                                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${badge.badgeClass}`}
                                    >
                                      {badge.label}
                                    </span>
                                  </div>

                                  {activity.location_name && (
                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-[#707881]">
                                      <MapPin size={12} />
                                      <span>{activity.location_name}</span>
                                    </p>
                                  )}

                                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[#3f4850]">
                                    <span className="flex items-center gap-1">
                                      <Calendar size={12} />
                                      {formatShortDate(activity.date)}
                                    </span>

                                    {activity.start_time && (
                                      <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {formatTime(activity.start_time)}
                                        {activity.end_time && ` - ${formatTime(activity.end_time)}`}
                                      </span>
                                    )}

                                    {formatCost(activity.estimated_cost, activity.currency) && (
                                      <span className="flex items-center gap-1 font-semibold text-[#006194]">
                                        <DollarSign size={12} />
                                        {formatCost(activity.estimated_cost, activity.currency)}
                                      </span>
                                    )}
                                  </div>

                                  {activity.notes && (
                                    <p className="mt-1 text-xs text-[#707881]">{activity.notes}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 self-end sm:self-center">
                                <button
                                  type="button"
                                  onClick={() => openEditActivityModal(city, activity)}
                                  className="rounded-lg p-1.5 text-[#707881] transition hover:bg-[#dce9ff] hover:text-[#006194]"
                                  title="Edit activity"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActivityToDelete({ city, activity })}
                                  className="rounded-lg p-1.5 text-[#ba1a1a] transition hover:bg-[#ffdad6]"
                                  title="Delete activity"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </main>

      {tripId && <TripBottomNav tripId={tripId} />}

      {/* Add / Edit City Modal */}
      {modal === 'city' && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-[#0b1c30]/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(null)
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#d3e4fe] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between border-b border-[#e5eeff] pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#0b1c30]">
                  {editingCity ? 'Edit Destination City' : 'Add Destination City'}
                </h2>
                <p className="text-xs text-[#3f4850]">Add a stop along your travel route.</p>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                aria-label="Close dialog"
                className="rounded-full p-1.5 text-[#3f4850] hover:bg-[#eff4ff]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitCity} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3f4850]">City Name *</label>
                  <input
                    required
                    type="text"
                    value={cityForm.city_name}
                    onChange={(e) => setCityForm({ ...cityForm, city_name: e.target.value })}
                    placeholder="e.g. Kyoto"
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3.5 py-2.5 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Country *</label>
                  <input
                    required
                    type="text"
                    value={cityForm.country}
                    onChange={(e) => setCityForm({ ...cityForm, country: e.target.value })}
                    placeholder="e.g. Japan"
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
                    value={cityForm.arrival_date}
                    onChange={(e) => setCityForm({ ...cityForm, arrival_date: e.target.value })}
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3 py-2 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Departure Date *</label>
                  <input
                    required
                    type="date"
                    min={cityForm.arrival_date || undefined}
                    value={cityForm.departure_date}
                    onChange={(e) => setCityForm({ ...cityForm, departure_date: e.target.value })}
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3 py-2 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Notes & Highlights</label>
                <textarea
                  rows={2}
                  value={cityForm.notes}
                  onChange={(e) => setCityForm({ ...cityForm, notes: e.target.value })}
                  placeholder="Hotel reservations, train station info, travel tips..."
                  className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3.5 py-2 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-[#e5eeff] pt-4">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="rounded-xl border border-[#bfc7d2] px-4 py-2 text-sm font-semibold text-[#3f4850] hover:bg-[#eff4ff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCityMutation.isPending || updateCityMutation.isPending}
                  className="rounded-xl bg-[#006194] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007bb9] disabled:opacity-60"
                >
                  {createCityMutation.isPending || updateCityMutation.isPending
                    ? 'Saving...'
                    : editingCity
                    ? 'Save City'
                    : 'Add City'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Activity Modal */}
      {modal === 'activity' && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-[#0b1c30]/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(null)
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#d3e4fe] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between border-b border-[#e5eeff] pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#0b1c30]">
                  {editingActivity
                    ? 'Edit Activity'
                    : `Add Activity in ${selectedCity?.city_name}`}
                </h2>
                <p className="text-xs text-[#3f4850]">Schedule tours, dinners, or attractions.</p>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                aria-label="Close dialog"
                className="rounded-full p-1.5 text-[#3f4850] hover:bg-[#eff4ff]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitActivity} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Activity Name *</label>
                <input
                  required
                  type="text"
                  value={activityForm.name}
                  onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                  placeholder="e.g. Fushimi Inari Shrine Tour"
                  className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3.5 py-2.5 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Category</label>
                  <select
                    value={activityForm.category}
                    onChange={(e) => setActivityForm({ ...activityForm, category: e.target.value })}
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3 py-2.5 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Date *</label>
                  <input
                    required
                    type="date"
                    value={activityForm.date}
                    onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })}
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3 py-2 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Start Time</label>
                  <input
                    type="time"
                    value={activityForm.start_time}
                    onChange={(e) => setActivityForm({ ...activityForm, start_time: e.target.value })}
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3 py-2 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3f4850]">End Time</label>
                  <input
                    type="time"
                    value={activityForm.end_time}
                    onChange={(e) => setActivityForm({ ...activityForm, end_time: e.target.value })}
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3 py-2 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Est. Cost</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={activityForm.estimated_cost}
                    onChange={(e) => setActivityForm({ ...activityForm, estimated_cost: e.target.value })}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3.5 py-2 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Currency</label>
                  <select
                    value={activityForm.currency}
                    onChange={(e) => setActivityForm({ ...activityForm, currency: e.target.value })}
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3 py-2 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Location / Address</label>
                <input
                  type="text"
                  value={activityForm.location_name}
                  onChange={(e) => setActivityForm({ ...activityForm, location_name: e.target.value })}
                  placeholder="e.g. 68 Fukakusa Yabunouchicho, Fushimi Ward"
                  className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3.5 py-2 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-[#e5eeff] pt-4">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="rounded-xl border border-[#bfc7d2] px-4 py-2 text-sm font-semibold text-[#3f4850] hover:bg-[#eff4ff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createActivityMutation.isPending || updateActivityMutation.isPending}
                  className="rounded-xl bg-[#006194] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007bb9] disabled:opacity-60"
                >
                  {createActivityMutation.isPending || updateActivityMutation.isPending
                    ? 'Saving...'
                    : editingActivity
                    ? 'Save Activity'
                    : 'Add Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete City Confirmation Modal */}
      {cityToDelete && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0b1c30]/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#ffdad6] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#ffdad6] text-[#ba1a1a]">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-[#0b1c30]">
              Delete stop &ldquo;{cityToDelete.city_name}&rdquo;?
            </h3>
            <p className="mt-2 text-sm text-[#3f4850]">
              This will remove this destination and all {cityToDelete.activities?.length || 0} scheduled activities from your trip.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCityToDelete(null)}
                className="rounded-xl border border-[#bfc7d2] px-4 py-2 text-sm font-semibold text-[#3f4850] hover:bg-[#eff4ff]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteCityMutation.isPending}
                onClick={() => deleteCityMutation.mutate(cityToDelete)}
                className="rounded-xl bg-[#ba1a1a] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#93000a] disabled:opacity-60"
              >
                {deleteCityMutation.isPending ? 'Deleting...' : 'Delete Stop'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Activity Confirmation Modal */}
      {activityToDelete && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0b1c30]/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#ffdad6] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#ffdad6] text-[#ba1a1a]">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-[#0b1c30]">
              Delete &ldquo;{activityToDelete.activity.name}&rdquo;?
            </h3>
            <p className="mt-2 text-sm text-[#3f4850]">
              Are you sure you want to remove this activity from {activityToDelete.city.city_name}?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActivityToDelete(null)}
                className="rounded-xl border border-[#bfc7d2] px-4 py-2 text-sm font-semibold text-[#3f4850] hover:bg-[#eff4ff]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteActivityMutation.isPending}
                onClick={() => deleteActivityMutation.mutate(activityToDelete)}
                className="rounded-xl bg-[#ba1a1a] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#93000a] disabled:opacity-60"
              >
                {deleteActivityMutation.isPending ? 'Deleting...' : 'Delete Activity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
