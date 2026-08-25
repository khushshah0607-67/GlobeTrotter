import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { apiClient, getApiErrorMessage } from '../api/client'
import { ErrorAlert } from '../components/ErrorAlert'
import { TripCard, type TripCardData } from '../components/TripCard'
import { useAuth } from '../hooks/useAuth'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

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
        start_date: startDate,
        end_date: endDate,
        description: null,
        cover_image: null,
        status: 'planning',
      })
      return response.data as { id: string }
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      setIsCreateOpen(false)
      setTitle('')
      setStartDate('')
      setEndDate('')
      navigate(`/trip/${trip.id}`)
    },
  })

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const submitCreateTrip = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    createTripMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <nav className="fixed left-0 top-0 z-50 hidden w-full items-center justify-between border-b border-[#d3e4fe] bg-[#f8f9ff]/90 px-6 py-4 backdrop-blur-sm md:flex">
        <div className="flex items-center gap-8">
          <div className="text-[24px] font-bold tracking-tight text-[#006194]">GlobeTrotter</div>
          <div className="flex items-center gap-6">
            <button type="button" className="border-b-2 border-[#006194] pb-1 text-sm font-semibold text-[#006194]">
              Dashboard
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="text-sm font-medium text-[#3f4850] transition hover:text-[#006194]">
              Trips
            </button>
            <button type="button" onClick={() => trips[0] && navigate(`/trip/${trips[0].id}/budget`)} className="text-sm font-medium text-[#3f4850] transition hover:text-[#006194]">
              Budget
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button type="button" className="rounded-full p-2 text-[#006194] transition hover:bg-[#eff4ff]" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button type="button" className="rounded-full p-2 text-[#006194] transition hover:bg-[#eff4ff]" aria-label="Settings">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-[#d3e4fe] bg-[#eff4ff] px-3 py-2 text-sm font-medium text-[#006194] transition hover:bg-[#dce9ff]"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-20 md:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#0b1c30] md:text-[2rem]">
              Welcome back, {user?.full_name?.split(' ')[0] ?? 'traveler'}.
            </h1>
            <p className="mt-2 text-base text-[#3f4850]">Here is a summary of your upcoming travels.</p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#fea619] px-5 py-3 text-sm font-semibold text-[#2a1700] transition hover:opacity-90"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Create Trip
          </button>
        </div>

        {isError ? <ErrorAlert message={getApiErrorMessage(error)} /> : null}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-xl border border-[#d3e4fe] bg-[#ffffff] shadow-sm">
                <div className="h-40 animate-pulse bg-[#dce9ff]" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-[#dce9ff]" />
                  <div className="h-4 w-full animate-pulse rounded bg-[#eff4ff]" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-[#eff4ff]" />
                </div>
              </div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#bfc7d2] bg-[#ffffff] p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#cce5ff] text-[#006194]">
              <span className="material-symbols-outlined text-3xl">travel_explore</span>
            </div>
            <h2 className="text-2xl font-semibold text-[#0b1c30]">Plan a new trip</h2>
            <p className="mt-2 text-[#3f4850]">Start organizing your next adventure.</p>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="mt-6 rounded-xl bg-[#006194] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#007bb9]"
            >
              Create Trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </main>

      {isCreateOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0b1c30]/45 p-4"
          role="presentation"
          onMouseDown={(event) => { if (event.currentTarget === event.target) setIsCreateOpen(false) }}
        >
          <form onSubmit={submitCreateTrip} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">Create a trip</h2>
                <p className="mt-1 text-sm text-[#3f4850]">Set the essentials, then build your itinerary.</p>
              </div>
              <button type="button" onClick={() => setIsCreateOpen(false)} aria-label="Close dialog" className="rounded-full px-3 py-1 text-xl text-[#3f4850] hover:bg-[#eff4ff]">&times;</button>
            </div>
            {createTripMutation.error ? <div className="mb-4"><ErrorAlert message={getApiErrorMessage(createTripMutation.error)} /></div> : null}
            <div className="grid gap-4">
              <label className="grid gap-1 text-sm font-semibold">Trip name<input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Summer in Europe" className="rounded-lg border-[#bfc7d2]" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-semibold">Start date<input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-lg border-[#bfc7d2]" /></label>
                <label className="grid gap-1 text-sm font-semibold">End date<input required type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} className="rounded-lg border-[#bfc7d2]" /></label>
              </div>
              <button disabled={createTripMutation.isPending} className="mt-2 rounded-lg bg-[#006194] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{createTripMutation.isPending ? 'Creating...' : 'Create Trip'}</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
