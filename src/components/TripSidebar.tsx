import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { HelpCircle, LogOut, Plus, Plane } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { HelpModal } from './HelpModal'

interface TripSidebarProps {
  tripId: string
  tripTitle?: string
  tripStatus?: string
  tripCoverImage?: string | null
  onAddStop?: () => void
}

export function TripSidebar({
  tripId,
  tripTitle = 'Current Trip',
  tripStatus = 'planning',
  tripCoverImage,
  onAddStop,
}: TripSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [showHelp, setShowHelp] = useState(false)

  const isOverview = location.pathname === `/trip/${tripId}`
  const isItinerary = location.pathname === `/trip/${tripId}/itinerary`
  const isBudget = location.pathname === `/trip/${tripId}/budget`
  const isMembers = location.pathname === `/trip/${tripId}/collaboration`

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleAddStopClick = () => {
    if (onAddStop) {
      onAddStop()
    } else {
      navigate(`/trip/${tripId}/itinerary?newStop=1`)
    }
  }

  return (
    <>
      <aside className="fixed left-0 top-16 hidden h-[calc(100vh-64px)] w-64 flex-col justify-between border-r border-[#d3e4fe] bg-[#eff4ff] p-4 lg:flex z-40">
        <div className="flex flex-col gap-6">
          {/* Trip Banner card */}
          <div className="flex items-center gap-3 rounded-xl border border-[#d3e4fe]/80 bg-white p-2.5 shadow-2xs">
            {tripCoverImage ? (
              <img
                src={tripCoverImage}
                alt={tripTitle}
                className="h-10 w-10 shrink-0 rounded-lg object-cover border border-[#d3e4fe]"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#006194] text-white">
                <Plane size={20} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold text-[#006194]" title={tripTitle}>
                {tripTitle}
              </h2>
              <p className="text-xs capitalize text-[#3f4850]">{tripStatus} Phase</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <Link
              to={`/trip/${tripId}`}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                isOverview
                  ? 'bg-[#007bb9] font-semibold text-white shadow-xs'
                  : 'text-[#3f4850] hover:bg-[#dce9ff] hover:text-[#006194]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isOverview ? "'FILL' 1" : "'FILL' 0" }}>
                dashboard
              </span>
              <span>Overview</span>
            </Link>

            <Link
              to={`/trip/${tripId}/itinerary`}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                isItinerary
                  ? 'bg-[#007bb9] font-semibold text-white shadow-xs'
                  : 'text-[#3f4850] hover:bg-[#dce9ff] hover:text-[#006194]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isItinerary ? "'FILL' 1" : "'FILL' 0" }}>
                event_note
              </span>
              <span>Itinerary</span>
            </Link>

            <Link
              to={`/trip/${tripId}/budget`}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                isBudget
                  ? 'bg-[#007bb9] font-semibold text-white shadow-xs'
                  : 'text-[#3f4850] hover:bg-[#dce9ff] hover:text-[#006194]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isBudget ? "'FILL' 1" : "'FILL' 0" }}>
                payments
              </span>
              <span>Budget</span>
            </Link>

            <Link
              to={`/trip/${tripId}/collaboration`}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                isMembers
                  ? 'bg-[#007bb9] font-semibold text-white shadow-xs'
                  : 'text-[#3f4850] hover:bg-[#dce9ff] hover:text-[#006194]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isMembers ? "'FILL' 1" : "'FILL' 0" }}>
                group
              </span>
              <span>Members</span>
            </Link>
          </nav>

          {/* Add Stop CTA */}
          <button
            type="button"
            onClick={handleAddStopClick}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#006194] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#007bb9] active:scale-[0.98]"
          >
            <Plus size={16} />
            <span>Add New Stop</span>
          </button>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col gap-1 border-t border-[#d3e4fe] pt-4">
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-medium text-[#3f4850] transition hover:bg-[#dce9ff] hover:text-[#006194]"
          >
            <HelpCircle size={16} />
            <span>Help & Guide</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold text-[#ba1a1a] transition hover:bg-[#ffdad6]"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  )
}
