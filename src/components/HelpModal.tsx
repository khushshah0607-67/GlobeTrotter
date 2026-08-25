import { HelpCircle, X, MapPin, Calendar, DollarSign, Users } from 'lucide-react'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0b1c30]/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-xl rounded-2xl border border-[#d3e4fe] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-[#e5eeff] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#cce5ff] text-[#006194]">
              <HelpCircle size={22} />
            </div>
            <div>
              <h2 id="help-title" className="text-xl font-bold text-[#0b1c30]">
                GlobeTrotter Guide
              </h2>
              <p className="text-xs text-[#3f4850]">How to plan trips together seamlessly</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close help"
            className="rounded-full p-2 text-[#3f4850] transition hover:bg-[#eff4ff] hover:text-[#0b1c30]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 py-2 text-sm text-[#3f4850]">
          <div className="flex gap-3.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#dce9ff] text-[#006194]">
              <MapPin size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-[#0b1c30]">1. Add Destinations & Stops</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-[#3f4850]">
                Break down your journey into cities or stops. Set arrival and departure dates for each destination.
              </p>
            </div>
          </div>

          <div className="flex gap-3.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fea619]/20 text-[#855300]">
              <Calendar size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-[#0b1c30]">2. Schedule Daily Activities</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-[#3f4850]">
                Inside each destination, add sightseeing, dining, tours, or transport with times and estimated costs.
              </p>
            </div>
          </div>

          <div className="flex gap-3.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#8a4cfc]/20 text-[#712ae2]">
              <DollarSign size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-[#0b1c30]">3. Track Budget Allocations</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-[#3f4850]">
                Define category caps for Accommodation, Food, Transportation, Activities, and Miscellaneous. GlobeTrotter tracks your remaining spend automatically.
              </p>
            </div>
          </div>

          <div className="flex gap-3.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#cce5ff] text-[#004b73]">
              <Users size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-[#0b1c30]">4. Collaborate with Friends & Family</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-[#3f4850]">
                Invite travel companions by email as Editors (to add activities) or Viewers (read-only itinerary access).
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-[#e5eeff] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#006194] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007bb9]"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  )
}
