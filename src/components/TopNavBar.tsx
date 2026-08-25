import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Globe,
  LogOut,
  HelpCircle,
  Menu,
  X,
  Check,
  ChevronDown,
  Plus,
  Compass,
  Calendar,
  MapPin,
} from 'lucide-react'
import { apiClient } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { HelpModal } from './HelpModal'
import type { TripCardData } from './TripCard'

interface TopNavBarProps {
  currentTripId?: string
}

const formatDateShort = (val?: string) => {
  if (!val) return ''
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d)
}

export function TopNavBar({ currentTripId }: TopNavBarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [showHelp, setShowHelp] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showTripsDropdown, setShowTripsDropdown] = useState(false)
  const [notificationToast, setNotificationToast] = useState(false)
  const tripsMenuRef = useRef<HTMLDivElement>(null)

  const isDashboard = location.pathname === '/dashboard'
  const isTripSection = location.pathname.startsWith('/trip')
  const isBudget = location.pathname.endsWith('/budget')

  const { data: trips = [] } = useQuery<TripCardData[]>({
    queryKey: ['trips'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/trips')
      return response.data
    },
  })

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tripsMenuRef.current && !tripsMenuRef.current.contains(e.target as Node)) {
        setShowTripsDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const triggerNotification = () => {
    setNotificationToast(true)
    setTimeout(() => setNotificationToast(false), 3000)
  }

  const handleTripsClick = () => {
    if (isDashboard) {
      setShowTripsDropdown((prev) => !prev)
      const section = document.getElementById('trips-section')
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      setShowTripsDropdown((prev) => !prev)
    }
  }

  const userInitials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'GT'

  return (
    <>
      <header className="fixed left-0 top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[#d3e4fe] bg-[#f8f9ff]/95 px-4 backdrop-blur-md transition-colors duration-200 sm:px-6">
        <div className="flex items-center gap-6 md:gap-8">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-[#006194] transition hover:opacity-90"
          >
            <Globe className="h-6 w-6 text-[#006194]" />
            <span>GlobeTrotter</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              to="/dashboard"
              className={`text-sm font-medium transition-colors ${
                isDashboard && !showTripsDropdown
                  ? 'border-b-2 border-[#006194] pb-1 font-semibold text-[#006194]'
                  : 'text-[#3f4850] hover:text-[#006194]'
              }`}
            >
              Dashboard
            </Link>

            {/* Trips Interactive Dropdown & Link */}
            <div className="relative" ref={tripsMenuRef}>
              <button
                type="button"
                onClick={handleTripsClick}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer ${
                  (isTripSection && !isBudget) || showTripsDropdown
                    ? 'border-b-2 border-[#006194] pb-1 font-semibold text-[#006194]'
                    : 'text-[#3f4850] hover:text-[#006194]'
                }`}
                aria-expanded={showTripsDropdown}
                aria-haspopup="true"
              >
                <span>Trips</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${showTripsDropdown ? 'rotate-180 text-[#006194]' : 'text-[#707881]'}`}
                />
              </button>

              {showTripsDropdown && (
                <div className="absolute left-0 mt-2 w-80 rounded-2xl border border-[#d3e4fe] bg-white p-3 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="mb-2 flex items-center justify-between border-b border-[#e5eeff] pb-2 px-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#707881]">
                      Your Trips ({trips.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTripsDropdown(false)
                        navigate('/dashboard?newTrip=1')
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-[#006194] hover:underline cursor-pointer"
                    >
                      <Plus size={13} strokeWidth={2.5} />
                      <span>New Trip</span>
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1 py-1">
                    {trips.length === 0 ? (
                      <div className="py-4 text-center">
                        <Compass className="mx-auto h-8 w-8 text-[#93ccff]" />
                        <p className="mt-1.5 text-xs text-[#3f4850]">No trips created yet</p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowTripsDropdown(false)
                            navigate('/dashboard?newTrip=1')
                          }}
                          className="mt-2 text-xs font-semibold text-[#006194] hover:underline cursor-pointer"
                        >
                          + Plan your first trip
                        </button>
                      </div>
                    ) : (
                      trips.map((trip) => {
                        const isCurrent = trip.id === currentTripId
                        return (
                          <button
                            key={trip.id}
                            type="button"
                            onClick={() => {
                              setShowTripsDropdown(false)
                              navigate(`/trip/${trip.id}`)
                            }}
                            className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition cursor-pointer ${
                              isCurrent
                                ? 'bg-[#cce5ff]/50 text-[#006194]'
                                : 'hover:bg-[#eff4ff] text-[#0b1c30]'
                            }`}
                          >
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-[#d3e4fe]">
                              {trip.cover_image ? (
                                <img
                                  src={trip.cover_image}
                                  alt={trip.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[#006194]">
                                  <MapPin size={16} />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-[#0b1c30]">
                                {trip.title}
                              </p>
                              <div className="flex items-center gap-1 text-[11px] text-[#707881]">
                                <Calendar size={11} />
                                <span>
                                  {formatDateShort(trip.start_date)} -{' '}
                                  {formatDateShort(trip.end_date)}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                trip.status === 'active'
                                  ? 'bg-[#cce5ff] text-[#006194]'
                                  : trip.status === 'completed'
                                    ? 'bg-[#e5eeff] text-[#3f4850]'
                                    : 'bg-[#ffdad6] text-[#ba1a1a]'
                              }`}
                            >
                              {trip.status}
                            </span>
                          </button>
                        )
                      })
                    )}
                  </div>

                  <div className="mt-2 border-t border-[#e5eeff] pt-2 flex items-center justify-between px-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTripsDropdown(false)
                        navigate('/dashboard')
                      }}
                      className="text-xs font-medium text-[#3f4850] hover:text-[#006194] cursor-pointer"
                    >
                      View All in Dashboard →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {currentTripId ? (
              <Link
                to={`/trip/${currentTripId}/budget`}
                className={`text-sm font-medium transition-colors ${
                  isBudget
                    ? 'border-b-2 border-[#006194] pb-1 font-semibold text-[#006194]'
                    : 'text-[#3f4850] hover:text-[#006194]'
                }`}
              >
                Budget
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            aria-label="Open help guide"
            title="Help Guide"
            className="rounded-full p-2 text-[#3f4850] transition hover:bg-[#eff4ff] hover:text-[#006194] cursor-pointer"
          >
            <HelpCircle size={19} />
          </button>

          <button
            type="button"
            onClick={triggerNotification}
            aria-label="Notifications"
            title="Notifications"
            className="relative rounded-full p-2 text-[#3f4850] transition hover:bg-[#eff4ff] hover:text-[#006194] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#006194]" />
          </button>

          {/* User Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-full border border-[#d3e4fe] bg-[#ffffff] p-1 pl-1.5 pr-2.5 text-xs font-semibold text-[#0b1c30] shadow-xs transition hover:border-[#006194] cursor-pointer"
              aria-expanded={showUserMenu}
              aria-label="User profile menu"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006194] text-xs font-bold text-white">
                {userInitials}
              </div>
              <span className="hidden max-w-[120px] truncate md:inline-block">
                {user?.full_name || 'Traveler'}
              </span>
            </button>

            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#d3e4fe] bg-white p-2 shadow-xl"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div className="border-b border-[#e5eeff] px-3 py-2.5">
                  <p className="text-xs font-bold text-[#0b1c30] truncate">{user?.full_name}</p>
                  <p className="text-[11px] text-[#3f4850] truncate">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false)
                    setShowHelp(true)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#3f4850] transition hover:bg-[#eff4ff] hover:text-[#006194] cursor-pointer"
                >
                  <HelpCircle size={15} />
                  <span>How to use GlobeTrotter</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#ba1a1a] transition hover:bg-[#ffdad6] cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="rounded-lg p-2 text-[#3f4850] transition hover:bg-[#eff4ff] md:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-16 z-40 border-b border-[#d3e4fe] bg-white p-4 shadow-lg md:hidden">
          <nav className="flex flex-col gap-2">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-[#0b1c30] hover:bg-[#eff4ff]"
            >
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              Dashboard
            </Link>

            {/* Mobile Trips Sub-list */}
            <div className="rounded-xl bg-[#eff4ff]/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-[#006194] uppercase tracking-wider">
                  Your Trips ({trips.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate('/dashboard?newTrip=1')
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-[#006194] cursor-pointer"
                >
                  <Plus size={13} />
                  <span>New</span>
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {trips.length === 0 ? (
                  <p className="text-xs text-[#707881] py-1">No trips yet</p>
                ) : (
                  trips.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        navigate(`/trip/${t.id}`)
                      }}
                      className="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs font-medium text-[#0b1c30] hover:bg-white cursor-pointer"
                    >
                      <span className="truncate">{t.title}</span>
                      <span className="text-[10px] text-[#707881] capitalize">{t.status}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {currentTripId && (
              <>
                <Link
                  to={`/trip/${currentTripId}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-[#0b1c30] hover:bg-[#eff4ff]"
                >
                  <span className="material-symbols-outlined text-[18px]">overview</span>
                  Trip Overview
                </Link>
                <Link
                  to={`/trip/${currentTripId}/itinerary`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-[#0b1c30] hover:bg-[#eff4ff]"
                >
                  <span className="material-symbols-outlined text-[18px]">event_note</span>
                  Itinerary
                </Link>
                <Link
                  to={`/trip/${currentTripId}/budget`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-[#0b1c30] hover:bg-[#eff4ff]"
                >
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                  Budget
                </Link>
                <Link
                  to={`/trip/${currentTripId}/collaboration`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-[#0b1c30] hover:bg-[#eff4ff]"
                >
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  Members
                </Link>
              </>
            )}
            <div className="border-t border-[#e5eeff] pt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setShowHelp(true)
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#3f4850] hover:bg-[#eff4ff] cursor-pointer"
              >
                <HelpCircle size={18} />
                Help Guide
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-[#ba1a1a] hover:bg-[#ffdad6] cursor-pointer"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Notification Toast */}
      {notificationToast && (
        <div className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-xl bg-[#0b1c30] px-4 py-3 text-xs font-semibold text-white shadow-xl md:bottom-6">
          <Check size={16} className="text-[#93ccff]" />
          <span>All trip updates and invites are up to date!</span>
        </div>
      )}

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  )
}
