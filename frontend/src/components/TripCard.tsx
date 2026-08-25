import { useNavigate } from 'react-router-dom'
import { CalendarDays, Plane } from 'lucide-react'

export type TripCardData = {
  id: string
  title: string
  description?: string | null
  start_date: string
  end_date: string
  cover_image?: string | null
  status: string
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

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

export function TripCard({ trip }: { trip: TripCardData }) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(`/trip/${trip.id}`)}
      className="group w-full overflow-hidden rounded-xl border border-[#d3e4fe] bg-[#ffffff] text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:bg-[#eff4ff] hover:shadow-md"
    >
      <div className="relative h-40 w-full bg-[#d3e4fe]">
        {trip.cover_image ? (
          <img
            src={trip.cover_image}
            alt={trip.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#cce5ff] via-[#dce9ff] to-[#f8f9ff] text-[#006194]">
            <Plane size={42} strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}

        <div
          className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${getStatusBadgeClasses(trip.status)}`}
        >
          {trip.status}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-[1.5rem] font-semibold leading-tight text-[#0b1c30]">
            {trip.title}
          </h3>
          {trip.description ? (
            <p className="mt-2 line-clamp-2 text-sm text-[#3f4850]">{trip.description}</p>
          ) : null}
        </div>

        <p className="text-sm text-[#3f4850]">
          {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
        </p>

        <div className="flex items-center gap-2 text-sm text-[#3f4850]">
          <CalendarDays size={18} strokeWidth={2} aria-hidden="true" />
          {trip.status === 'completed' ? 'Trip completed' : 'Trip planning'}
        </div>
      </div>
    </button>
  )
}
