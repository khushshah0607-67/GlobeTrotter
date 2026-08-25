import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'

import { apiClient, getApiErrorMessage } from '../api/client'
import { ErrorAlert } from '../components/ErrorAlert'

type Activity = {
  id: string
  name: string
  description?: string | null
  category?: string | null
  date: string
  start_time?: string | null
  end_time?: string | null
  duration_minutes?: number | null
  estimated_cost?: string | number | null
  currency?: string | null
  location_name?: string | null
  notes?: string | null
  order_index: number
}

type TripCity = {
  id: string
  city_name: string
  country: string
  arrival_date: string
  departure_date: string
  order_index: number
  notes?: string | null
  activities: Activity[]
}

type TripSummary = {
  title: string
  start_date: string
  end_date: string
  status: string
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
  category: '',
  date: '',
  start_time: '',
  end_time: '',
  estimated_cost: '',
  currency: '',
  location_name: '',
  order_index: '0',
}

const formatShortDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
}

const formatTime = (value?: string | null) => {
  if (!value) return 'Time TBD'
  const [hours, minutes] = value.split(':')
  const date = new Date()
  date.setHours(Number(hours), Number(minutes), 0, 0)
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date)
}

const formatCost = (value?: string | number | null, currency?: string | null) => {
  if (value === null || value === undefined || value === '') return null
  const amount = Number(value)
  if (Number.isNaN(amount)) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount)
}

const cityNights = (arrival: string, departure: string) => {
  const nights = Math.round((new Date(departure).getTime() - new Date(arrival).getTime()) / 86400000)
  return `${Math.max(nights, 0)} ${nights === 1 ? 'Night' : 'Nights'}`
}

export function ItineraryPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<'city' | 'activity' | null>(null)
  const [selectedCity, setSelectedCity] = useState<TripCity | null>(null)
  const [editingCity, setEditingCity] = useState<TripCity | null>(null)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [cityForm, setCityForm] = useState(emptyCityForm)
  const [activityForm, setActivityForm] = useState(emptyActivityForm)

  const tripQuery = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/trips/${tripId}`)
      return response.data as TripSummary
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

  const createCityMutation = useMutation({
    mutationFn: async (form: CityForm) => {
      const response = await apiClient.post(`/api/v1/trips/${tripId}/cities`, {
        city_name: form.city_name,
        country: form.country,
        arrival_date: form.arrival_date,
        departure_date: form.departure_date,
        order_index: Number(form.order_index),
        notes: form.notes || null,
      })
      return response.data as TripCity
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'cities'] })
      setModal(null)
      setCityForm(emptyCityForm)
    },
  })

  const createActivityMutation = useMutation({
    mutationFn: async ({ city, form }: { city: TripCity; form: ActivityForm }) => {
      const payload: Record<string, string | number | null> = {
        name: form.name,
        category: form.category || null,
        date: form.date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : null,
        currency: form.currency || null,
        location_name: form.location_name || null,
        order_index: Number(form.order_index),
      }
      const response = await apiClient.post(`/api/v1/trips/${tripId}/cities/${city.id}/activities`, payload)
      return response.data as Activity
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'cities'] })
      setModal(null)
      setActivityForm(emptyActivityForm)
      setSelectedCity(null)
    },
  })

  const deleteCityMutation = useMutation({
    mutationFn: async (city: TripCity) => apiClient.delete(`/api/v1/trips/${tripId}/cities/${city.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'cities'] }),
  })

  const deleteActivityMutation = useMutation({
    mutationFn: async ({ city, activity }: { city: TripCity; activity: Activity }) =>
      apiClient.delete(`/api/v1/trips/${tripId}/cities/${city.id}/activities/${activity.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'cities'] }),
  })

  const updateCityMutation = useMutation({
    mutationFn: async ({ city, form }: { city: TripCity; form: CityForm }) => (await apiClient.patch(`/api/v1/trips/${tripId}/cities/${city.id}`, {
      city_name: form.city_name,
      country: form.country,
      arrival_date: form.arrival_date,
      departure_date: form.departure_date,
      order_index: Number(form.order_index),
      notes: form.notes || null,
    })).data as TripCity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'cities'] })
      setModal(null)
      setEditingCity(null)
    },
  })

  const updateActivityMutation = useMutation({
    mutationFn: async ({ city, activity, form }: { city: TripCity; activity: Activity; form: ActivityForm }) => (await apiClient.patch(`/api/v1/trips/${tripId}/cities/${city.id}/activities/${activity.id}`, {
      name: form.name,
      category: form.category || null,
      date: form.date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : null,
      currency: form.currency || null,
      location_name: form.location_name || null,
      order_index: Number(form.order_index),
    })).data as Activity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'cities'] })
      setModal(null)
      setSelectedCity(null)
      setEditingActivity(null)
    },
  })

  const openActivityModal = (city: TripCity) => {
    setEditingActivity(null)
    setSelectedCity(city)
    setActivityForm({ ...emptyActivityForm, date: city.arrival_date, order_index: String(city.activities.length) })
    setModal('activity')
  }

  const openCityEditor = (city: TripCity) => {
    setEditingCity(city)
    setCityForm({ city_name: city.city_name, country: city.country, arrival_date: city.arrival_date, departure_date: city.departure_date, order_index: String(city.order_index), notes: city.notes ?? '' })
    setModal('city')
  }

  const openActivityEditor = (city: TripCity, activity: Activity) => {
    setSelectedCity(city)
    setEditingActivity(activity)
    setActivityForm({ name: activity.name, category: activity.category ?? '', date: activity.date, start_time: activity.start_time ?? '', end_time: activity.end_time ?? '', estimated_cost: activity.estimated_cost == null ? '' : String(activity.estimated_cost), currency: activity.currency ?? '', location_name: activity.location_name ?? '', order_index: String(activity.order_index) })
    setModal('activity')
  }

  const submitCity = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (editingCity) updateCityMutation.mutate({ city: editingCity, form: cityForm })
    else createCityMutation.mutate(cityForm)
  }

  const submitActivity = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedCity && editingActivity) updateActivityMutation.mutate({ city: selectedCity, activity: editingActivity, form: activityForm })
    else if (selectedCity) createActivityMutation.mutate({ city: selectedCity, form: activityForm })
  }

  const cities = [...(citiesQuery.data ?? [])].sort((first, second) => first.order_index - second.order_index)
  const mutationError = createCityMutation.error ?? createActivityMutation.error ?? deleteCityMutation.error ?? deleteActivityMutation.error ?? updateCityMutation.error ?? updateActivityMutation.error

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <header className="fixed left-0 top-0 z-50 flex w-full items-center justify-between border-b border-[#d3e4fe] bg-[#f8f9ff]/90 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-8">
          <button type="button" onClick={() => navigate('/dashboard')} className="text-[24px] font-bold tracking-tight text-[#006194]">GlobeTrotter</button>
          <nav className="hidden items-center gap-6 md:flex">
            <button type="button" onClick={() => navigate('/dashboard')} className="text-sm font-medium text-[#3f4850] transition hover:text-[#006194]">Dashboard</button>
            <span className="border-b-2 border-[#006194] pb-1 text-sm font-semibold text-[#006194]">Trips</span>
            <button type="button" onClick={() => navigate(`/trip/${tripId}/budget`)} className="text-sm font-medium text-[#3f4850] transition hover:text-[#006194]">Budget</button>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-[#006194]">
          <button type="button" aria-label="Notifications" className="rounded-full p-2 transition hover:bg-[#eff4ff]"><span className="material-symbols-outlined">notifications</span></button>
          <button type="button" aria-label="Settings" className="rounded-full p-2 transition hover:bg-[#eff4ff]"><span className="material-symbols-outlined">settings</span></button>
          <span className="material-symbols-outlined">account_circle</span>
        </div>
      </header>

      <aside className="fixed left-0 top-16 hidden h-[calc(100vh-64px)] w-64 flex-col border-r border-[#d3e4fe] bg-[#eff4ff] p-4 lg:flex">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-[#007bb9] text-white"><span className="material-symbols-outlined">flight_takeoff</span></div>
          <div><h2 className="text-[1.1rem] font-bold text-[#006194]">{tripQuery.data?.title ?? 'Current Trip'}</h2><p className="text-sm capitalize text-[#3f4850]">{tripQuery.data?.status ?? 'Planning'}</p></div>
        </div>
        <nav className="flex flex-1 flex-col gap-2">
          <button type="button" onClick={() => navigate(`/trip/${tripId}`)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-[#3f4850] transition hover:bg-[#dce9ff]"><span className="material-symbols-outlined">dashboard</span>Overview</button>
          <button type="button" className="flex items-center gap-3 rounded-xl bg-[#cce5ff] px-3 py-2 font-bold text-[#004b73]"><span className="material-symbols-outlined">event_note</span>Itinerary</button>
          <button type="button" onClick={() => navigate(`/trip/${tripId}/budget`)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-[#3f4850] transition hover:bg-[#dce9ff]"><span className="material-symbols-outlined">payments</span>Budget</button>
          <button type="button" onClick={() => navigate(`/trip/${tripId}/collaboration`)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-[#3f4850] transition hover:bg-[#dce9ff]"><span className="material-symbols-outlined">group</span>Members</button>
        </nav>
        <button type="button" onClick={() => setModal('city')} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#855300] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#684000]"><span className="material-symbols-outlined text-[18px]">add</span>Add New Stop</button>
        <div className="mt-5 border-t border-[#bfc7d2] pt-4"><button type="button" className="flex items-center gap-3 px-3 py-2 text-[#3f4850]"><span className="material-symbols-outlined">help</span>Help</button></div>
      </aside>

      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-24 lg:ml-64 lg:px-12">
        <header className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><h1 className="mb-2 text-[2rem] font-semibold tracking-[-0.03em]">{tripQuery.data?.title ?? 'Trip Itinerary'}</h1><p className="flex items-center gap-2 text-[#3f4850]"><span className="material-symbols-outlined text-[18px]">calendar_month</span>{tripQuery.data ? `${formatShortDate(tripQuery.data.start_date)} - ${formatShortDate(tripQuery.data.end_date)}` : 'Plan your cities and activities'}</p></div>
          <button type="button" onClick={() => setModal('city')} className="flex items-center justify-center gap-2 rounded-lg bg-[#006194] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007bb9]"><span className="material-symbols-outlined text-[18px]">add</span>Add City</button>
        </header>

        {citiesQuery.isError ? <ErrorAlert message={getApiErrorMessage(citiesQuery.error)} /> : null}
        {mutationError ? <div className="mb-5"><ErrorAlert message={getApiErrorMessage(mutationError)} /></div> : null}

        {citiesQuery.isLoading ? (
          <div className="space-y-8 border-l-2 border-[#bfc7d2] pl-8 md:pl-12">{[1, 2].map((item) => <div key={item} className="h-48 animate-pulse rounded-xl bg-[#e5eeff]" />)}</div>
        ) : cities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#707881] bg-[#e5eeff] px-6 py-16 text-center"><span className="material-symbols-outlined mb-4 text-5xl text-[#707881]">map</span><h2 className="text-2xl font-semibold">No Destinations Yet</h2><p className="mt-2 text-[#3f4850]">Start planning by adding your first city.</p><button type="button" onClick={() => setModal('city')} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#006194] px-6 py-3 text-sm font-semibold text-white"><span className="material-symbols-outlined text-[18px]">add</span>Add First Destination</button></div>
        ) : (
          <div className="relative space-y-12 pl-8 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-0.5 before:bg-[#bfc7d2] md:pl-12 md:before:left-[23px]">
            {cities.map((city) => (
              <section key={city.id} className="relative">
                <div className="absolute -left-[35px] top-4 z-10 h-6 w-6 rounded-full border-4 border-[#006194] bg-[#f8f9ff] md:-left-[43px]" />
                <div className="overflow-hidden rounded-xl border border-[#bfc7d2] bg-white shadow-sm">
                  <div className="flex flex-col justify-between gap-4 border-b border-[#bfc7d2] bg-[#eff4ff] p-6 sm:flex-row sm:items-center">
                    <div><h2 className="flex flex-wrap items-baseline gap-2 text-2xl font-semibold">{city.city_name} <span className="text-lg font-normal text-[#707881]">{city.country}</span></h2><p className="mt-1 text-sm text-[#3f4850]">{formatShortDate(city.arrival_date)} - {formatShortDate(city.departure_date)} ({cityNights(city.arrival_date, city.departure_date)})</p></div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button type="button" onClick={() => openActivityModal(city)} className="flex items-center gap-1 rounded-lg border border-[#006194] px-3 py-1.5 text-sm font-semibold text-[#006194] transition hover:bg-[#cce5ff]"><span className="material-symbols-outlined text-[16px]">add</span>Activity</button>
                      <button type="button" onClick={() => openCityEditor(city)} aria-label={`Edit ${city.city_name}`} className="rounded-full p-2 text-[#006194] transition hover:bg-[#cce5ff]"><Pencil size={16} aria-hidden="true" /></button>
                      <button type="button" onClick={() => { if (window.confirm(`Delete ${city.city_name} and its activities?`)) deleteCityMutation.mutate(city) }} aria-label={`Delete ${city.city_name}`} className="rounded-full p-2 text-[#ba1a1a] transition hover:bg-[#ffdad6]"><Trash2 size={16} aria-hidden="true" /></button>
                    </div>
                  </div>
                  <div className="flex flex-col p-4 sm:p-6">
                    {city.activities.length === 0 ? <p className="py-5 text-sm text-[#3f4850]">No activities planned for this stop yet.</p> : city.activities.map((activity, index) => (
                      <div key={activity.id} className="flex items-start gap-4 rounded-lg border border-transparent p-4 transition hover:border-[#bfc7d2] hover:bg-[#eff4ff]">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${index % 2 === 0 ? 'bg-[#fea619] text-[#2a1700]' : 'bg-[#8a4cfc] text-white'}`}><span className="material-symbols-outlined">{activity.category?.toLowerCase() === 'accommodation' ? 'bed' : 'local_activity'}</span></div>
                        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold">{activity.name}</h3><div className="flex items-center gap-2"><span className="rounded bg-[#d3e4fe] px-2 py-1 text-[11px] font-medium text-[#3f4850]">{activity.category || 'Activity'}</span><button type="button" onClick={() => openActivityEditor(city, activity)} aria-label={`Edit ${activity.name}`} className="rounded-full p-1 text-[#006194] transition hover:bg-[#cce5ff]"><Pencil size={15} aria-hidden="true" /></button><button type="button" onClick={() => { if (window.confirm(`Delete ${activity.name}?`)) deleteActivityMutation.mutate({ city, activity }) }} aria-label={`Delete ${activity.name}`} className="rounded-full p-1 text-[#ba1a1a] transition hover:bg-[#ffdad6]"><Trash2 size={15} aria-hidden="true" /></button></div></div>{activity.location_name ? <p className="mt-1 text-sm text-[#3f4850]">{activity.location_name}</p> : null}<div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#3f4850]"><span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span>{formatShortDate(activity.date)} · {formatTime(activity.start_time)}</span>{formatCost(activity.estimated_cost, activity.currency) ? <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">payments</span>{formatCost(activity.estimated_cost, activity.currency)}</span> : null}</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {modal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0b1c30]/45 p-4" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setModal(null) }}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between"><div><h2 className="text-xl font-semibold">{modal === 'city' ? (editingCity ? 'Edit City' : 'Add City') : (editingActivity ? 'Edit Activity' : `Add Activity in ${selectedCity?.city_name}`)}</h2><p className="mt-1 text-sm text-[#3f4850]">Add details to the shared itinerary.</p></div><button type="button" onClick={() => setModal(null)} aria-label="Close dialog" className="rounded-full p-2 text-[#3f4850] hover:bg-[#eff4ff]"><span className="material-symbols-outlined">close</span></button></div>
            {modal === 'city' ? (
              <form className="grid gap-4" onSubmit={submitCity}>
                <label className="grid gap-1 text-sm font-semibold">City<input required value={cityForm.city_name} onChange={(event) => setCityForm({ ...cityForm, city_name: event.target.value })} className="rounded-lg border-[#bfc7d2]" /></label>
                <label className="grid gap-1 text-sm font-semibold">Country<input required value={cityForm.country} onChange={(event) => setCityForm({ ...cityForm, country: event.target.value })} className="rounded-lg border-[#bfc7d2]" /></label>
                <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm font-semibold">Arrival date<input required type="date" value={cityForm.arrival_date} onChange={(event) => setCityForm({ ...cityForm, arrival_date: event.target.value })} className="rounded-lg border-[#bfc7d2]" /></label><label className="grid gap-1 text-sm font-semibold">Departure date<input required type="date" value={cityForm.departure_date} onChange={(event) => setCityForm({ ...cityForm, departure_date: event.target.value })} className="rounded-lg border-[#bfc7d2]" /></label></div>
                <label className="grid gap-1 text-sm font-semibold">Order index<input required min="0" type="number" value={cityForm.order_index} onChange={(event) => setCityForm({ ...cityForm, order_index: event.target.value })} className="rounded-lg border-[#bfc7d2]" /></label>
                <label className="grid gap-1 text-sm font-semibold">Notes<textarea value={cityForm.notes} onChange={(event) => setCityForm({ ...cityForm, notes: event.target.value })} className="rounded-lg border-[#bfc7d2]" /></label>
                <button disabled={createCityMutation.isPending || updateCityMutation.isPending} className="mt-2 rounded-lg bg-[#006194] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{createCityMutation.isPending || updateCityMutation.isPending ? 'Saving...' : editingCity ? 'Save City' : 'Add City'}</button>
              </form>
            ) : (
              <form className="grid gap-4" onSubmit={submitActivity}>
                <label className="grid gap-1 text-sm font-semibold">Activity name<input required value={activityForm.name} onChange={(event) => setActivityForm({ ...activityForm, name: event.target.value })} className="rounded-lg border-[#bfc7d2]" /></label>
                <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm font-semibold">Date<input required type="date" value={activityForm.date} onChange={(event) => setActivityForm({ ...activityForm, date: event.target.value })} className="rounded-lg border-[#bfc7d2]" /></label><label className="grid gap-1 text-sm font-semibold">Category<input value={activityForm.category} onChange={(event) => setActivityForm({ ...activityForm, category: event.target.value })} className="rounded-lg border-[#bfc7d2]" /></label></div>
                <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm font-semibold">Start time<input type="time" value={activityForm.start_time} onChange={(event) => setActivityForm({ ...activityForm, start_time: event.target.value })} className="rounded-lg border-[#bfc7d2]" /></label><label className="grid gap-1 text-sm font-semibold">End time<input type="time" value={activityForm.end_time} onChange={(event) => setActivityForm({ ...activityForm, end_time: event.target.value })} className="rounded-lg border-[#bfc7d2]" /></label></div>
                <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm font-semibold">Estimated cost<input min="0" type="number" step="0.01" value={activityForm.estimated_cost} onChange={(event) => setActivityForm({ ...activityForm, estimated_cost: event.target.value })} className="rounded-lg border-[#bfc7d2]" /></label><label className="grid gap-1 text-sm font-semibold">Currency<input maxLength={10} value={activityForm.currency} onChange={(event) => setActivityForm({ ...activityForm, currency: event.target.value })} className="rounded-lg border-[#bfc7d2]" /></label></div>
                <label className="grid gap-1 text-sm font-semibold">Location<input value={activityForm.location_name} onChange={(event) => setActivityForm({ ...activityForm, location_name: event.target.value })} className="rounded-lg border-[#bfc7d2]" /></label><label className="grid gap-1 text-sm font-semibold">Order index<input required min="0" type="number" value={activityForm.order_index} onChange={(event) => setActivityForm({ ...activityForm, order_index: event.target.value })} className="rounded-lg border-[#bfc7d2]" /></label>
                <button disabled={createActivityMutation.isPending || updateActivityMutation.isPending} className="mt-2 rounded-lg bg-[#006194] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{createActivityMutation.isPending || updateActivityMutation.isPending ? 'Saving...' : editingActivity ? 'Save Activity' : 'Add Activity'}</button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
