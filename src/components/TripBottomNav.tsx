import { Link, useLocation } from 'react-router-dom'

interface TripBottomNavProps {
  tripId: string
}

export function TripBottomNav({ tripId }: TripBottomNavProps) {
  const location = useLocation()

  const isDashboard = location.pathname === '/dashboard'
  const isOverview = location.pathname === `/trip/${tripId}`
  const isItinerary = location.pathname === `/trip/${tripId}/itinerary`
  const isBudget = location.pathname === `/trip/${tripId}/budget`
  const isMembers = location.pathname === `/trip/${tripId}/collaboration`

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-[#d3e4fe] bg-white/95 px-2 py-2 shadow-lg backdrop-blur-md lg:hidden">
      <Link
        to="/dashboard"
        className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-medium transition ${
          isDashboard ? 'text-[#006194] font-semibold' : 'text-[#3f4850] hover:text-[#006194]'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">home</span>
        <span>Dashboard</span>
      </Link>

      <Link
        to={`/trip/${tripId}`}
        className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-medium transition ${
          isOverview ? 'rounded-full bg-[#dce9ff] px-3 font-bold text-[#004b73]' : 'text-[#3f4850] hover:text-[#006194]'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">dashboard</span>
        <span>Overview</span>
      </Link>

      <Link
        to={`/trip/${tripId}/itinerary`}
        className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-medium transition ${
          isItinerary ? 'rounded-full bg-[#dce9ff] px-3 font-bold text-[#004b73]' : 'text-[#3f4850] hover:text-[#006194]'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">event_note</span>
        <span>Itinerary</span>
      </Link>

      <Link
        to={`/trip/${tripId}/budget`}
        className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-medium transition ${
          isBudget ? 'rounded-full bg-[#dce9ff] px-3 font-bold text-[#004b73]' : 'text-[#3f4850] hover:text-[#006194]'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">payments</span>
        <span>Budget</span>
      </Link>

      <Link
        to={`/trip/${tripId}/collaboration`}
        className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-medium transition ${
          isMembers ? 'rounded-full bg-[#dce9ff] px-3 font-bold text-[#004b73]' : 'text-[#3f4850] hover:text-[#006194]'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">group</span>
        <span>Members</span>
      </Link>
    </nav>
  )
}
