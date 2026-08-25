import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import {
  Edit2,
  Plus,
  DollarSign,
  Bed,
  Plane,
  Utensils,
  Ticket,
  MoreHorizontal,
  X,
  Wallet,
} from 'lucide-react'

import { apiClient, getApiErrorMessage } from '../api/client'
import { ErrorAlert } from '../components/ErrorAlert'
import { TopNavBar } from '../components/TopNavBar'
import { TripSidebar } from '../components/TripSidebar'
import { TripBottomNav } from '../components/TripBottomNav'
import type { Budget, Trip, TripSpendingSummary } from '../types'

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

const formatCurrency = (value: string | number | null | undefined, currency = 'USD') => {
  const amount = Number(value ?? 0)
  if (Number.isNaN(amount)) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

const toForm = (budget: Budget | null | undefined): BudgetForm => ({
  total_budget: budget ? String(budget.total_budget) : '',
  currency: budget?.currency ?? 'USD',
  accommodation_budget:
    budget?.accommodation_budget == null ? '' : String(budget.accommodation_budget),
  transportation_budget:
    budget?.transportation_budget == null ? '' : String(budget.transportation_budget),
  food_budget: budget?.food_budget == null ? '' : String(budget.food_budget),
  activities_budget:
    budget?.activities_budget == null ? '' : String(budget.activities_budget),
  miscellaneous_budget:
    budget?.miscellaneous_budget == null ? '' : String(budget.miscellaneous_budget),
})

const CATEGORY_CONFIG = [
  {
    key: 'accommodation_budget' as const,
    label: 'Accommodation',
    icon: Bed,
    color: 'bg-[#cce5ff] text-[#006194]',
    barColor: 'bg-[#006194]',
  },
  {
    key: 'transportation_budget' as const,
    label: 'Transportation & Flights',
    icon: Plane,
    color: 'bg-[#fea619]/20 text-[#855300]',
    barColor: 'bg-[#fea619]',
  },
  {
    key: 'food_budget' as const,
    label: 'Food & Dining',
    icon: Utensils,
    color: 'bg-[#8a4cfc]/20 text-[#712ae2]',
    barColor: 'bg-[#8a4cfc]',
  },
  {
    key: 'activities_budget' as const,
    label: 'Activities & Tours',
    icon: Ticket,
    color: 'bg-[#dce9ff] text-[#004b73]',
    barColor: 'bg-[#007bb9]',
  },
  {
    key: 'miscellaneous_budget' as const,
    label: 'Miscellaneous & Shopping',
    icon: MoreHorizontal,
    color: 'bg-[#ffddb8] text-[#855300]',
    barColor: 'bg-[#855300]',
  },
]

export function BudgetPage() {
  const { tripId } = useParams<{ tripId: string }>()
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
    queryFn: async () =>
      (await apiClient.get(`/api/v1/trips/${tripId}/summary`)).data as TripSpendingSummary,
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
        accommodation_budget: budgetForm.accommodation_budget
          ? Number(budgetForm.accommodation_budget)
          : null,
        transportation_budget: budgetForm.transportation_budget
          ? Number(budgetForm.transportation_budget)
          : null,
        food_budget: budgetForm.food_budget ? Number(budgetForm.food_budget) : null,
        activities_budget: budgetForm.activities_budget
          ? Number(budgetForm.activities_budget)
          : null,
        miscellaneous_budget: budgetForm.miscellaneous_budget
          ? Number(budgetForm.miscellaneous_budget)
          : null,
      }
      const isExisting = Boolean(budgetQuery.data || summaryQuery.data?.budget)
      const method = isExisting ? 'patch' : 'post'
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
  const remainingBudget = summaryQuery.data?.remaining_budget ?? (budget ? Math.max(totalBudget - activityCost, 0) : 0)
  const usedPercent = totalBudget > 0 ? Math.min((activityCost / totalBudget) * 100, 100) : 0

  const error = tripQuery.error ?? summaryQuery.error
  const budgetError =
    budgetQuery.error &&
    (!axios.isAxiosError(budgetQuery.error) || budgetQuery.error.response?.status !== 404)
      ? budgetQuery.error
      : null
  const isLoading = tripQuery.isLoading || summaryQuery.isLoading

  const openEditor = () => {
    setForm(toForm(budget))
    setIsEditing(true)
  }

  const submitBudget = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    saveBudgetMutation.mutate(form)
  }

  // Calculate sum of category allocations
  const allocatedCategoriesSum = CATEGORY_CONFIG.reduce((acc, cat) => {
    return acc + Number(budget?.[cat.key] ?? 0)
  }, 0)

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <TopNavBar currentTripId={tripId} />

      {tripId && (
        <TripSidebar
          tripId={tripId}
          tripTitle={trip?.title}
          tripStatus={trip?.status}
          tripCoverImage={trip?.cover_image}
        />
      )}

      {/* Main Budget Layout */}
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-20 sm:px-6 lg:pl-[280px] lg:pr-10">
        {/* Header Bar */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#e5eeff] pb-5 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0b1c30]">Trip Budget & Expenses</h1>
            <p className="mt-1 text-sm text-[#3f4850]">
              {trip
                ? `Manage spending limits and allowances for ${trip.title}`
                : 'Plan and track your expenses'}
            </p>
          </div>

          <button
            type="button"
            onClick={openEditor}
            className="inline-flex items-center gap-2 rounded-xl bg-[#006194] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007bb9] active:scale-95"
          >
            {budget ? <Edit2 size={16} /> : <Plus size={16} />}
            <span>{budget ? 'Edit Budget Allocation' : 'Set Trip Budget'}</span>
          </button>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={getApiErrorMessage(error)} />
          </div>
        )}
        {budgetError && (
          <div className="mb-6">
            <ErrorAlert message={getApiErrorMessage(budgetError)} />
          </div>
        )}
        {saveBudgetMutation.error && (
          <div className="mb-6">
            <ErrorAlert message={getApiErrorMessage(saveBudgetMutation.error)} />
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="h-96 animate-pulse rounded-2xl bg-white shadow-xs xl:col-span-2" />
            <div className="h-96 animate-pulse rounded-2xl bg-white shadow-xs" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Left Section: Overview & Category Progress (Span 2) */}
            <section className="flex flex-col justify-between rounded-2xl border border-[#d3e4fe] bg-white p-6 shadow-xs xl:col-span-2">
              <div>
                <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-[#e5eeff] pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#0b1c30]">Expense Allocation</h2>
                    <p className="text-xs text-[#3f4850]">Tracking scheduled activities against budget</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-[#006194]">
                      {formatCurrency(activityCost, currency)}
                    </span>
                    <span className="ml-1 text-sm font-normal text-[#3f4850]">
                      / {formatCurrency(totalBudget, currency)}
                    </span>
                  </div>
                </div>

                {/* Overall spend progress */}
                <div className="mb-8 rounded-xl bg-[#eff4ff] p-4">
                  <div className="mb-2 flex justify-between text-xs font-semibold text-[#3f4850]">
                    <span>Total Planned Activity Spend</span>
                    <span>{Math.round(usedPercent)}% allocated</span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-[#d3e4fe]">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        usedPercent > 90 ? 'bg-[#ba1a1a]' : 'bg-[#006194]'
                      }`}
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-[#707881]">
                      {activityCost > 0 ? `${formatCurrency(activityCost, currency)} scheduled` : 'No activity cost yet'}
                    </span>
                    <span className="font-bold text-[#006194]">
                      {budget
                        ? `${formatCurrency(remainingBudget, currency)} Remaining`
                        : 'No budget set yet'}
                    </span>
                  </div>
                </div>

                {/* Category Bars */}
                <h3 className="mb-4 text-sm font-bold text-[#0b1c30]">Category Allocations</h3>
                <div className="space-y-5">
                  {CATEGORY_CONFIG.map((category) => {
                    const value = Number(budget?.[category.key] ?? 0)
                    const percentOfTotal =
                      totalBudget > 0 ? Math.min((value / totalBudget) * 100, 100) : 0
                    const Icon = category.icon

                    return (
                      <div key={category.key} className="flex items-center gap-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${category.color}`}
                        >
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="font-bold text-[#0b1c30]">{category.label}</span>
                            <span className="font-semibold text-[#3f4850]">
                              {formatCurrency(value, currency)}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-[#eff4ff]">
                            <div
                              className={`h-full rounded-full ${category.barColor} transition-all duration-500`}
                              style={{ width: `${percentOfTotal}%` }}
                            />
                          </div>
                          <div className="mt-0.5 flex justify-between text-[11px] text-[#707881]">
                            <span>{percentOfTotal.toFixed(0)}% of total allowance</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Right Section: Summary Box */}
            <section className="flex flex-col justify-between rounded-2xl border border-[#d3e4fe] bg-white p-6 shadow-xs">
              <div>
                <div className="mb-6 flex items-center justify-between border-b border-[#e5eeff] pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#0b1c30]">Budget Breakdown</h2>
                    <p className="text-xs text-[#3f4850]">Planned limits by bucket</p>
                  </div>
                  <button
                    type="button"
                    onClick={openEditor}
                    className="rounded-full p-2 text-[#006194] transition hover:bg-[#eff4ff]"
                    title="Edit categories"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>

                {budget ? (
                  <div className="space-y-3.5">
                    {CATEGORY_CONFIG.map((category) => {
                      const value = Number(budget[category.key] ?? 0)
                      return (
                        <div
                          key={category.key}
                          className="flex items-center justify-between rounded-lg p-1.5 text-xs text-[#3f4850] transition hover:bg-[#eff4ff]/60"
                        >
                          <span className="font-medium">{category.label}</span>
                          <span className="font-bold text-[#0b1c30]">
                            {formatCurrency(value, currency)}
                          </span>
                        </div>
                      )
                    })}

                    <div className="mt-4 border-t border-[#e5eeff] pt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#707881]">Allocated Categories:</span>
                        <span className="font-bold text-[#0b1c30]">
                          {formatCurrency(allocatedCategoriesSum, currency)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm font-bold">
                        <span className="text-[#0b1c30]">Total Trip Budget:</span>
                        <span className="text-base text-[#006194]">
                          {formatCurrency(totalBudget, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#cce5ff] text-[#006194]">
                      <Wallet size={28} />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-[#0b1c30]">No budget set yet</h3>
                    <p className="mt-1 text-xs text-[#3f4850]">
                      Set up your total travel allowance to track flight, hotel, and activity expenses.
                    </p>
                    <button
                      type="button"
                      onClick={openEditor}
                      className="mt-5 rounded-xl bg-[#006194] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#007bb9]"
                    >
                      Set Budget Now
                    </button>
                  </div>
                )}
              </div>

              {budget && (
                <div className="mt-6 rounded-xl bg-[#eff4ff] p-4 text-xs text-[#004b73]">
                  <p className="font-semibold">💡 Budgeting Tip</p>
                  <p className="mt-0.5 text-[11px] text-[#3f4850]">
                    Keep an extra 10-15% in your miscellaneous allocation for local transport, tips, and spontaneous excursions.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {tripId && <TripBottomNav tripId={tripId} />}

      {/* Set / Edit Budget Modal */}
      {isEditing && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-[#0b1c30]/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsEditing(false)
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#d3e4fe] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between border-b border-[#e5eeff] pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#0b1c30]">
                  {budget ? 'Edit Trip Budget' : 'Set Trip Budget'}
                </h2>
                <p className="text-xs text-[#3f4850]">
                  Define overall allowance and category spending limits.
                </p>
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

            <form onSubmit={submitBudget} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-[#3f4850]">
                    <DollarSign size={13} />
                    <span>Total Budget *</span>
                  </label>
                  <input
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    value={form.total_budget}
                    onChange={(e) => setForm({ ...form, total_budget: e.target.value })}
                    placeholder="5000"
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3.5 py-2.5 text-sm font-semibold text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Currency *</label>
                  <select
                    required
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3 py-2.5 text-sm font-semibold text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                    <option value="CHF">CHF (Fr)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-[#e5eeff] pt-3">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#3f4850]">
                  Category Allocations (Optional)
                </p>
                <div className="space-y-3">
                  {CATEGORY_CONFIG.map((cat) => (
                    <div key={cat.key}>
                      <label className="mb-1 block text-xs font-semibold text-[#3f4850]">
                        {cat.label}
                      </label>
                      <input
                        min="0"
                        step="0.01"
                        type="number"
                        value={form[cat.key]}
                        onChange={(e) => setForm({ ...form, [cat.key]: e.target.value })}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3.5 py-2 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                      />
                    </div>
                  ))}
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
                  disabled={saveBudgetMutation.isPending}
                  className="rounded-xl bg-[#006194] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007bb9] disabled:opacity-60"
                >
                  {saveBudgetMutation.isPending ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
