import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'

import { apiClient, getApiErrorMessage } from '../api/client'
import { ErrorAlert } from '../components/ErrorAlert'

type Budget = {
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

type Trip = {
  title: string
  start_date: string
  end_date: string
  status: string
}

type TripSummary = {
  trip: Trip
  total_activity_cost: string | number
  remaining_budget: string | number | null
  budget: Budget | null
}

type BudgetForm = {
  total_budget: string
  currency: string
  accommodation_budget: string
  transportation_budget: string
  food_budget: string
  activities_budget: string
  miscellaneous_budget: string
}

const emptyBudgetForm: BudgetForm = {
  total_budget: '',
  currency: 'USD',
  accommodation_budget: '',
  transportation_budget: '',
  food_budget: '',
  activities_budget: '',
  miscellaneous_budget: '',
}

const formatShortDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

const formatCurrency = (value: string | number | null | undefined, currency = 'USD') => {
  const amount = Number(value ?? 0)
  if (Number.isNaN(amount)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
}

const toForm = (budget: Budget | null | undefined): BudgetForm => ({
  total_budget: budget ? String(budget.total_budget) : '',
  currency: budget?.currency ?? 'USD',
  accommodation_budget: budget?.accommodation_budget == null ? '' : String(budget.accommodation_budget),
  transportation_budget: budget?.transportation_budget == null ? '' : String(budget.transportation_budget),
  food_budget: budget?.food_budget == null ? '' : String(budget.food_budget),
  activities_budget: budget?.activities_budget == null ? '' : String(budget.activities_budget),
  miscellaneous_budget: budget?.miscellaneous_budget == null ? '' : String(budget.miscellaneous_budget),
})

const categories = [
  { key: 'accommodation_budget', label: 'Accommodation', icon: 'bed' },
  { key: 'transportation_budget', label: 'Transportation', icon: 'flight' },
  { key: 'food_budget', label: 'Food', icon: 'restaurant' },
  { key: 'activities_budget', label: 'Activities', icon: 'local_activity' },
  { key: 'miscellaneous_budget', label: 'Miscellaneous', icon: 'more_horiz' },
] as const

export function BudgetPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<BudgetForm>(emptyBudgetForm)

  const tripQuery = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => (await apiClient.get(`/api/v1/trips/${tripId}`)).data as Trip,
    enabled: Boolean(tripId),
  })

  const summaryQuery = useQuery({
    queryKey: ['trip-summary', tripId],
    queryFn: async () => (await apiClient.get(`/api/v1/trips/${tripId}/summary`)).data as TripSummary,
    enabled: Boolean(tripId),
  })

  const budgetQuery = useQuery({
    queryKey: ['trip', tripId, 'budget'],
    queryFn: async () => (await apiClient.get(`/api/v1/trips/${tripId}/budget`)).data as Budget,
    enabled: Boolean(tripId),
    retry: false,
  })

  const saveBudgetMutation = useMutation({
    mutationFn: async (budgetForm: BudgetForm) => {
      const payload = {
        total_budget: Number(budgetForm.total_budget),
        currency: budgetForm.currency,
        accommodation_budget: budgetForm.accommodation_budget ? Number(budgetForm.accommodation_budget) : null,
        transportation_budget: budgetForm.transportation_budget ? Number(budgetForm.transportation_budget) : null,
        food_budget: budgetForm.food_budget ? Number(budgetForm.food_budget) : null,
        activities_budget: budgetForm.activities_budget ? Number(budgetForm.activities_budget) : null,
        miscellaneous_budget: budgetForm.miscellaneous_budget ? Number(budgetForm.miscellaneous_budget) : null,
      }
      const method = budget ? 'patch' : 'post'
      const response = await apiClient[method](`/api/v1/trips/${tripId}/budget`, payload)
      return response.data as Budget
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'budget'] })
      queryClient.invalidateQueries({ queryKey: ['trip-summary', tripId] })
      setIsEditing(false)
    },
  })

  const budget = budgetQuery.data ?? summaryQuery.data?.budget
  const trip = tripQuery.data ?? summaryQuery.data?.trip
  const currency = budget?.currency ?? 'USD'
  const totalBudget = Number(budget?.total_budget ?? 0)
  const activityCost = Number(summaryQuery.data?.total_activity_cost ?? 0)
  const remainingBudget = summaryQuery.data?.remaining_budget ?? (budget ? totalBudget - activityCost : 0)
  const usedPercent = totalBudget > 0 ? Math.min(Math.max((activityCost / totalBudget) * 100, 0), 100) : 0
  const error = tripQuery.error ?? summaryQuery.error
  const budgetError = budgetQuery.error && (!axios.isAxiosError(budgetQuery.error) || budgetQuery.error.response?.status !== 404) ? budgetQuery.error : null
  const isLoading = tripQuery.isLoading || summaryQuery.isLoading || budgetQuery.isLoading

  const openEditor = () => {
    setForm(toForm(budget))
    setIsEditing(true)
  }

  const submitBudget = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveBudgetMutation.mutate(form)
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <header className="fixed left-0 top-0 z-50 flex w-full items-center justify-between border-b border-[#d3e4fe] bg-[#f8f9ff]/90 px-6 py-4 backdrop-blur-sm">
        <button type="button" onClick={() => navigate('/dashboard')} className="text-[24px] font-bold tracking-tight text-[#006194]">GlobeTrotter</button>
        <nav className="hidden items-center gap-6 md:flex"><button type="button" onClick={() => navigate('/dashboard')} className="text-sm font-medium text-[#3f4850] hover:text-[#006194]">Dashboard</button><span className="border-b-2 border-[#006194] pb-1 text-sm font-semibold text-[#006194]">Trips</span><button type="button" onClick={() => navigate(`/trip/${tripId}`)} className="text-sm font-medium text-[#3f4850] hover:text-[#006194]">Overview</button></nav>
        <div className="flex items-center gap-3 text-[#006194]"><button type="button" aria-label="Notifications" className="rounded-full p-2 hover:bg-[#eff4ff]"><span className="material-symbols-outlined">notifications</span></button><button type="button" aria-label="Settings" className="rounded-full p-2 hover:bg-[#eff4ff]"><span className="material-symbols-outlined">settings</span></button><span className="material-symbols-outlined">account_circle</span></div>
      </header>

      <aside className="fixed left-0 top-16 hidden h-[calc(100vh-64px)] w-64 flex-col border-r border-[#d3e4fe] bg-[#eff4ff] p-4 lg:flex">
        <div className="mb-8 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded bg-[#007bb9] text-white"><span className="material-symbols-outlined">flight_takeoff</span></div><div className="min-w-0"><h2 className="truncate text-[1.1rem] font-bold text-[#006194]">{trip?.title ?? 'Current Trip'}</h2><p className="text-sm capitalize text-[#3f4850]">{trip?.status ?? 'Planning'}</p></div></div>
        <nav className="flex flex-1 flex-col gap-2"><button type="button" onClick={() => navigate(`/trip/${tripId}`)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-[#3f4850] hover:bg-[#dce9ff]"><span className="material-symbols-outlined">dashboard</span>Overview</button><button type="button" onClick={() => navigate(`/trip/${tripId}/itinerary`)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-[#3f4850] hover:bg-[#dce9ff]"><span className="material-symbols-outlined">event_note</span>Itinerary</button><button type="button" className="flex items-center gap-3 rounded-xl bg-[#cce5ff] px-3 py-2 font-bold text-[#004b73]"><span className="material-symbols-outlined" style={{ fontVariationSettings: 'FILL 1' }}>payments</span>Budget</button><button type="button" onClick={() => navigate(`/trip/${tripId}/collaboration`)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-[#3f4850] hover:bg-[#dce9ff]"><span className="material-symbols-outlined">group</span>Members</button></nav>
        <div className="border-t border-[#bfc7d2] pt-4"><button type="button" className="flex items-center gap-3 px-3 py-2 text-[#3f4850]"><span className="material-symbols-outlined">help</span>Help</button></div>
      </aside>

      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-24 lg:ml-64 lg:px-12">
        <header className="mb-8 flex flex-col gap-4 border-b border-[#bfc7d2] pb-4 md:flex-row md:items-end md:justify-between"><div><h1 className="text-[2rem] font-semibold tracking-[-0.03em]">Budget</h1><p className="mt-2 text-lg text-[#3f4850]">{trip ? `${trip.title} · ${formatShortDate(trip.start_date)} - ${formatShortDate(trip.end_date)}` : 'Plan your trip budget.'}</p></div><button type="button" onClick={openEditor} className="flex items-center justify-center gap-2 rounded-lg bg-[#006194] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#007bb9]"><span className="material-symbols-outlined text-[18px]">{budget ? 'edit' : 'add'}</span>{budget ? 'Edit Budget' : 'Set Budget'}</button></header>
        {error ? <div className="mb-5"><ErrorAlert message={getApiErrorMessage(error)} /></div> : null}
        {budgetError ? <div className="mb-5"><ErrorAlert message={getApiErrorMessage(budgetError)} /></div> : null}
        {saveBudgetMutation.error ? <div className="mb-5"><ErrorAlert message={getApiErrorMessage(saveBudgetMutation.error)} /></div> : null}

        {isLoading ? <div className="grid gap-4 xl:grid-cols-3"><div className="h-96 animate-pulse rounded-xl bg-[#e5eeff] xl:col-span-2" /><div className="h-96 animate-pulse rounded-xl bg-[#e5eeff]" /></div> : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <section className="rounded-xl border border-[#bfc7d2] bg-white p-6 xl:col-span-2"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-semibold">Trip Budget</h2><span className="text-2xl font-bold text-[#006194]">{formatCurrency(activityCost, currency)} <span className="text-sm font-normal text-[#3f4850]">spent / {formatCurrency(totalBudget, currency)}</span></span></div><div className="mb-7"><div className="mb-2 flex justify-between text-sm text-[#3f4850]"><span>Activity spend</span><span>{Math.round(usedPercent)}%</span></div><div className="h-3 overflow-hidden rounded-full bg-[#d3e4fe]"><div className="h-full rounded-full bg-[#006194] transition-all" style={{ width: `${usedPercent}%` }} /></div><p className="mt-2 text-right text-sm text-[#3f4850]">{budget ? `${formatCurrency(remainingBudget, currency)} remaining` : 'Set a budget to track remaining funds'}</p></div><div className="space-y-5">{categories.map((category) => { const value = Number(budget?.[category.key] ?? 0); const allocationPercent = totalBudget > 0 ? Math.min((value / totalBudget) * 100, 100) : 0; return <div key={category.key} className="flex items-center gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dce9ff] text-[#006194]"><span className="material-symbols-outlined">{category.icon}</span></div><div className="min-w-0 flex-1"><div className="mb-1 flex justify-between gap-3"><span className="font-semibold">{category.label}</span><span className="font-semibold">{formatCurrency(value, currency)}</span></div><div className="h-2 w-full rounded-full bg-[#d3e4fe]"><div className="h-2 rounded-full bg-[#006194]" style={{ width: `${allocationPercent}%` }} /></div><p className="mt-1 text-xs text-[#3f4850]">{Math.round(allocationPercent)}% of total allocation</p></div></div> })}</div></section>
            <section className="flex flex-col rounded-xl border border-[#bfc7d2] bg-white p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-2xl font-semibold">Allocation</h2><p className="mt-1 text-sm text-[#3f4850]">Planned category limits</p></div><button type="button" onClick={openEditor} aria-label="Edit budget" className="rounded-full p-2 text-[#006194] hover:bg-[#eff4ff]"><span className="material-symbols-outlined">edit</span></button></div>{budget ? <div className="space-y-4">{categories.map((category) => <div key={category.key} className="flex items-center justify-between border-b border-[#e5eeff] pb-3 text-sm"><span className="text-[#3f4850]">{category.label}</span><span className="font-semibold">{formatCurrency(budget[category.key], currency)}</span></div>)}<div className="flex items-center justify-between pt-1 font-semibold"><span>Total budget</span><span className="text-[#006194]">{formatCurrency(totalBudget, currency)}</span></div></div> : <div className="flex flex-1 flex-col items-center justify-center text-center"><span className="material-symbols-outlined mb-3 text-5xl text-[#707881]">account_balance_wallet</span><p className="font-semibold">No budget set yet</p><p className="mt-1 text-sm text-[#3f4850]">Create an allocation to start tracking this trip.</p><button type="button" onClick={openEditor} className="mt-5 rounded-lg bg-[#006194] px-4 py-2 text-sm font-semibold text-white">Set Budget</button></div>}</section>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-[#d3e4fe] bg-[#f8f9ff] px-4 py-2 shadow-lg lg:hidden"><button type="button" onClick={() => navigate('/dashboard')} className="flex flex-col items-center text-[#3f4850]"><span className="material-symbols-outlined">home</span><span className="text-[10px]">Dashboard</span></button><button type="button" className="flex flex-col items-center rounded-full bg-[#dce9ff] px-4 py-1 text-[#004b73]"><span className="material-symbols-outlined">explore</span><span className="text-[10px]">Trips</span></button><button type="button" className="flex flex-col items-center text-[#3f4850]"><span className="material-symbols-outlined">person</span><span className="text-[10px]">Profile</span></button></nav>

      {isEditing ? <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0b1c30]/45 p-4" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setIsEditing(false) }}><form onSubmit={submitBudget} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-start justify-between"><div><h2 className="text-xl font-semibold">{budget ? 'Edit Budget' : 'Set Budget'}</h2><p className="mt-1 text-sm text-[#3f4850]">Set the total and category allocations for this trip.</p></div><button type="button" onClick={() => setIsEditing(false)} aria-label="Close dialog" className="rounded-full p-2 text-[#3f4850] hover:bg-[#eff4ff]"><span className="material-symbols-outlined">close</span></button></div><div className="grid gap-4"><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm font-semibold">Total budget<input required min="0" step="0.01" type="number" value={form.total_budget} onChange={(event) => setForm({ ...form, total_budget: event.target.value })} className="rounded-lg border-[#bfc7d2]" /></label><label className="grid gap-1 text-sm font-semibold">Currency<input required maxLength={10} value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} className="rounded-lg border-[#bfc7d2]" /></label></div>{categories.map((category) => <label key={category.key} className="grid gap-1 text-sm font-semibold">{category.label}<input min="0" step="0.01" type="number" value={form[category.key]} onChange={(event) => setForm({ ...form, [category.key]: event.target.value })} className="rounded-lg border-[#bfc7d2]" /></label>)}<button disabled={saveBudgetMutation.isPending} className="mt-2 rounded-lg bg-[#006194] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{saveBudgetMutation.isPending ? 'Saving...' : 'Save Budget'}</button></div></form></div> : null}
    </div>
  )
}
