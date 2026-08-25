import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'

import { apiClient, getApiErrorMessage } from '../api/client'
import { ErrorAlert } from '../components/ErrorAlert'
import { useAuth } from '../hooks/useAuth'

type Activity = {
  id: string
  name: string
  category?: string | null
  date?: string | null
  start_time?: string | null
  end_time?: string | null
  estimated_cost?: string | number | null
  currency?: string | null
  location_name?: string | null
  notes?: string | null
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

type TripDetail = {
  id: string
  title: string
  description?: string | null
  start_date: string
  end_date: string
  cover_image?: string | null
  status: string
  cities: TripCity[]
}

type BudgetSummary = {
  id: string
  trip_id: string
  total_budget: string | number
  currency: string
  accommodation_budget?: string | number | null
  transportation_budget?: string | number | null
  food_budget?: string | number | null
  activities_budget?: string | number | null
  miscellaneous_budget?: string | number | null
}

type TripSummary = {
  trip: {
    id: string
    title: string
    description?: string | null
    start_date: string
    end_date: string
    cover_image?: string | null
    status: string
    created_at: string
    updated_at: string
  }
  cities_count: number
  activities_count: number
  total_activity_cost: string | number
  budget: BudgetSummary | null
  remaining_budget: string | number | null
}

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
    return '—'
  }

  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return '—'
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
      return 'bg-[#f5f5f5] text-[#3f4850] border border-[#bfc7d2]'
    default:
      return 'bg-[#f3f4f6] text-[#3f4850] border border-[#d3e4fe]'
  }
}

export function TripOverviewPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const tripQuery = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/trips/${tripId}`)
      return response.data as TripDetail
    },
    enabled: Boolean(tripId),
  })

  const summaryQuery = useQuery({
    queryKey: ['trip-summary', tripId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/trips/${tripId}/summary`)
      return response.data as TripSummary
    },
    enabled: Boolean(tripId),
  })

  const updateTripMutation = useMutation({
    mutationFn: async () => (await apiClient.patch(`/api/v1/trips/${tripId}`, {
      title: title.trim(),
      description: description.trim() || null,
      start_date: startDate,
      end_date: endDate,
    })).data as TripDetail,
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

  const trip = tripQuery.data
  const summary = summaryQuery.data
  const isLoading = tripQuery.isLoading || summaryQuery.isLoading
  const error = tripQuery.error ?? summaryQuery.error
  const cityCount = summary?.cities_count ?? trip?.cities?.length ?? 0
  const activityCount = summary?.activities_count ?? trip?.cities.reduce((count, city) => count + city.activities.length, 0) ?? 0
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
    setIsEditing(true)
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <header className="fixed left-0 top-0 z-50 flex w-full items-center justify-between border-b border-[#d3e4fe] bg-[#f8f9ff]/90 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-8">
          <div className="text-[24px] font-bold tracking-tight text-[#006194]">GlobeTrotter</div>
          <nav className="hidden items-center gap-6 md:flex">
            <button type="button" onClick={() => navigate('/dashboard')} className="text-sm font-medium text-[#3f4850] transition hover:text-[#006194]">
              Dashboard
            </button>
            <button type="button" className="border-b-2 border-[#006194] pb-1 text-sm font-semibold text-[#006194]">
              Trips
            </button>
            <button type="button" onClick={() => navigate(`/trip/${tripId}/budget`)} className="text-sm font-medium text-[#3f4850] transition hover:text-[#006194]">
              Budget
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button type="button" className="rounded-full p-2 text-[#006194] transition hover:bg-[#eff4ff]" aria-label="Search">
            <span className="material-symbols-outlined">search</span>
          </button>
          <button type="button" className="rounded-full p-2 text-[#006194] transition hover:bg-[#eff4ff]" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button type="button" className="rounded-full p-2 text-[#006194] transition hover:bg-[#eff4ff]" aria-label="Settings">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <img
            alt="User profile avatar"
            className="h-8 w-8 rounded-full border border-[#d3e4fe] object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgpE2E_1iGZk2qUVP0hfkNeCKGH8iQuPxA4zJHk_au-8RHhbdHOHED-ewsfoU_FkvrRRzxFabLJyjBQ5jxLQWYn0nPBXNWI2VeF1P1urcW5PoG7KNLLrCiwFyTT4lJz744PKImvTg0SYrnTfgtVmJ4pKNBkdlVREX1rr0uXlbBdFSyzC4pAhg0J23aJBCbrpSVELmQTwb6zbToYCWmPXZI02XRgJN6cxYLt45ceDjyGYsFomwtiI3kjA"
          />
        </div>
      </header>

      <aside className="fixed left-0 top-16 hidden h-[calc(100vh-64px)] w-64 flex-col justify-between border-r border-[#d3e4fe] bg-[#eff4ff] p-4 lg:flex">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2">
            <img
              alt="Trip cover icon"
              className="h-10 w-10 rounded-lg border border-[#d3e4fe] object-cover"
              src={trip?.cover_image ?? 'https://lh3.googleusercontent.com/aida-public/AB6AXuCG5bdnPPRnIlQvq_IjLD8LKQe-chpMlhyixxFTMfS-7CD3um7sNuuXGZD3flzMu_T71POIyYv6GNvA9OVdQM_DmIg5d4Wta05mFwB2Eu5rn-9gleIBerBNjw13N0N6nC7dAmDIX838tfF0rkaOyzVD3w3smvmVkTJ02XtLJPVHHaMH-JVtorZICHilkvXrakYYqFLHZ3bZWs8GJTe8lHU974TJ5OGDzB_00flzh86Dbq15iXjNlMmx4Q'}
            />
            <div>
              <h2 className="text-[1.1rem] font-bold text-[#006194]">Current Trip</h2>
              <p className="text-sm text-[#3f4850]">{trip?.status ? trip.status : 'Planning Phase'}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            <button type="button" className="flex items-center gap-3 rounded-xl bg-[#cce5ff] px-4 py-3 font-semibold text-[#004b73]">
              <span className="material-symbols-outlined">dashboard</span>
              Overview
            </button>
            <button type="button" onClick={() => navigate(`/trip/${tripId}/itinerary`)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-[#3f4850] transition hover:bg-[#dce9ff]">
              <span className="material-symbols-outlined">event_note</span>
              Itinerary
            </button>
            <button type="button" onClick={() => navigate(`/trip/${tripId}/budget`)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-[#3f4850] transition hover:bg-[#dce9ff]">
              <span className="material-symbols-outlined">payments</span>
              Budget
            </button>
            <button type="button" onClick={() => navigate(`/trip/${tripId}/collaboration`)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-[#3f4850] transition hover:bg-[#dce9ff]">
              <span className="material-symbols-outlined">group</span>
              Members
            </button>
          </nav>

          <button type="button" onClick={() => navigate(`/trip/${tripId}/itinerary`)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#006194] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#007bb9]">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add New Stop
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          <button type="button" onClick={handleLogout} className="flex items-center gap-3 rounded-xl px-4 py-3 text-[#3f4850] transition hover:bg-[#dce9ff]">
            <span className="material-symbols-outlined">help</span>
            Help
          </button>
          <button type="button" className="flex items-center gap-3 rounded-xl px-4 py-3 text-[#3f4850] transition hover:bg-[#dce9ff]">
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </nav>
      </aside>

      <main className="mx-auto max-w-[1600px] px-4 pb-12 pt-[88px] lg:pl-[280px] lg:pr-8">
        {error ? <div className="pt-4"><ErrorAlert message={getApiErrorMessage(error)} /></div> : null}

        {isLoading ? (
          <div className="space-y-6 pt-4">
            <div className="h-[240px] animate-pulse rounded-xl bg-[#dce9ff]" />
            <div className="h-8 w-2/3 animate-pulse rounded bg-[#dce9ff]" />
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-xl bg-[#e5eeff]" />
              ))}
            </div>
          </div>
        ) : trip ? (
          <>
            <section className="flex flex-col gap-6">
              <div className="relative h-[240px] overflow-hidden rounded-xl border border-[#d3e4fe] shadow-sm">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${trip.cover_image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80'})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#213145]/80 to-transparent" />
                <div className="absolute bottom-0 left-0 flex flex-col gap-2 p-6">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${getStatusBadgeClasses(trip.status)}`}>
                      {trip.status}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-[#f8f9ff]">
                      <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                      {formatDateRange(trip.start_date, trip.end_date)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3"><h1 className="text-[2rem] font-bold tracking-[-0.04em] text-white md:text-[2.5rem]">{trip.title}</h1><button type="button" onClick={openTripEditor} className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#006194] hover:bg-white">Edit trip</button><button type="button" onClick={() => { if (window.confirm(`Delete ${trip.title}?`)) deleteTripMutation.mutate() }} className="rounded-lg bg-[#ffdad6]/90 px-3 py-1.5 text-xs font-semibold text-[#93000a] hover:bg-[#ffdad6]">Delete</button></div>
                </div>
              </div>

              <p className="max-w-4xl text-lg text-[#3f4850]">
                {trip.description || 'No description provided yet for this trip.'}
              </p>
            </section>

            <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:col-span-8">
                <div className="rounded-xl border border-[#d3e4fe] bg-white p-6 shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#eff4ff] text-[#006194]">
                    <span className="material-symbols-outlined">location_city</span>
                  </div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#3f4850]">Destinations</p>
                  <p className="text-[1.5rem] font-semibold text-[#0b1c30]">{cityCount} {cityCount === 1 ? 'City' : 'Cities'}</p>
                </div>

                <div className="rounded-xl border border-[#d3e4fe] bg-white p-6 shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#eff4ff] text-[#006194]">
                    <span className="material-symbols-outlined">hiking</span>
                  </div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#3f4850]">Planned Activities</p>
                  <p className="text-[1.5rem] font-semibold text-[#0b1c30]">{activityCount} Items</p>
                </div>

                <div className="rounded-xl border border-[#d3e4fe] bg-white p-6 shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#eff4ff] text-[#006194]">
                    <span className="material-symbols-outlined">receipt_long</span>
                  </div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#3f4850]">Estimated Activity Cost</p>
                  <p className="text-[1.5rem] font-semibold text-[#0b1c30]">{formatCurrency(summary?.total_activity_cost ?? 0, budgetCurrency)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-[#d3e4fe] bg-white p-6 shadow-sm md:col-span-4">
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h3 className="text-[1.5rem] font-semibold text-[#0b1c30]">Budget</h3>
                    <p className="text-sm text-[#3f4850]">Overall trip allowance</p>
                  </div>
                  <button type="button" onClick={() => navigate(`/trip/${tripId}/budget`)} className="rounded-full p-2 text-[#006194] transition hover:bg-[#eff4ff]" aria-label="Edit budget">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#3f4850]">Activity Cost</span>
                      <span className="text-[1.5rem] font-semibold text-[#0b1c30]">{formatCurrency(summary?.total_activity_cost ?? 0, budgetCurrency)}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#3f4850]">Budget</span>
                      <span className="text-lg text-[#3f4850]">{formatCurrency(summary?.budget?.total_budget ?? totalBudget, budgetCurrency)}</span>
                    </div>
                  </div>

                  <div className="relative mt-2 h-3 w-full overflow-hidden rounded-full bg-[#d3e4fe]">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-[#006194] transition-all duration-1000 ease-out"
                      style={{ width: `${budgetProgress}%` }}
                    />
                  </div>

                  <p className="mt-1 text-right text-sm text-[#3f4850]">
                    {summary?.budget ? `${formatCurrency(remainingBudget, budgetCurrency)} Remaining` : 'Budget not set yet'}
                  </p>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-[#d3e4fe] bg-[#f8f9ff] px-4 py-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:hidden">
        <button type="button" className="flex flex-col items-center justify-center rounded-full bg-[#dce9ff] px-4 py-1 text-[#004b73]">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: 'FILL 1' }}>home</span>
          <span className="mt-1 text-[10px] font-semibold">Dashboard</span>
        </button>
        <button type="button" onClick={() => navigate(`/trip/${tripId}/itinerary`)} className="flex flex-col items-center justify-center text-[#3f4850]">
          <span className="material-symbols-outlined">explore</span>
          <span className="mt-1 text-[10px] font-semibold">Trips</span>
        </button>
        <button type="button" onClick={handleLogout} className="flex flex-col items-center justify-center text-[#3f4850]">
          <span className="material-symbols-outlined">map</span>
          <span className="mt-1 text-[10px] font-semibold">Map</span>
        </button>
        <button type="button" className="flex flex-col items-center justify-center text-[#3f4850]">
          <span className="material-symbols-outlined">person</span>
          <span className="mt-1 text-[10px] font-semibold">Logout</span>
        </button>
      </nav>

      {isEditing ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0b1c30]/45 p-4" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setIsEditing(false) }}>
          <form onSubmit={(event) => { event.preventDefault(); updateTripMutation.mutate() }} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between"><div><h2 className="text-xl font-semibold">Edit trip</h2><p className="mt-1 text-sm text-[#3f4850]">Keep the shared trip details up to date.</p></div><button type="button" onClick={() => setIsEditing(false)} aria-label="Close dialog" className="rounded-full px-3 py-1 text-xl text-[#3f4850] hover:bg-[#eff4ff]">&times;</button></div>
            {updateTripMutation.error ? <div className="mb-4"><ErrorAlert message={getApiErrorMessage(updateTripMutation.error)} /></div> : null}
            <div className="grid gap-4"><label className="grid gap-1 text-sm font-semibold">Trip name<input required value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-lg border-[#bfc7d2]" /></label><label className="grid gap-1 text-sm font-semibold">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} className="rounded-lg border-[#bfc7d2]" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm font-semibold">Start date<input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-lg border-[#bfc7d2]" /></label><label className="grid gap-1 text-sm font-semibold">End date<input required type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} className="rounded-lg border-[#bfc7d2]" /></label></div><button disabled={updateTripMutation.isPending} className="mt-2 rounded-lg bg-[#006194] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{updateTripMutation.isPending ? 'Saving...' : 'Save changes'}</button></div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
