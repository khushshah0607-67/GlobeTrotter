import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import {
  UserPlus,
  Trash2,
  Shield,
  Crown,
  Edit3,
  Eye,
  Mail,
  CheckCircle2,
  X,
  Users,
} from 'lucide-react'

import { apiClient, getApiErrorMessage } from '../api/client'
import { ErrorAlert } from '../components/ErrorAlert'
import { TopNavBar } from '../components/TopNavBar'
import { TripSidebar } from '../components/TripSidebar'
import { TripBottomNav } from '../components/TripBottomNav'
import { useAuth } from '../hooks/useAuth'
import type { TripMember, Trip } from '../types'

type Role = 'owner' | 'editor' | 'viewer'

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

const roleConfig: Record<
  Role,
  { label: string; icon: React.ComponentType<{ size: number; className?: string }>; badgeClass: string; desc: string }
> = {
  owner: {
    label: 'Trip Owner',
    icon: Crown,
    badgeClass: 'bg-[#fea619]/20 text-[#855300] border border-[#fea619]/40',
    desc: 'Full administrative access to edit trip, manage members, and delete.',
  },
  editor: {
    label: 'Editor',
    icon: Edit3,
    badgeClass: 'bg-[#cce5ff] text-[#004b73] border border-[#93ccff]',
    desc: 'Can add/edit destinations, activities, and budget allocations.',
  },
  viewer: {
    label: 'Viewer',
    icon: Eye,
    badgeClass: 'bg-[#eff4ff] text-[#3f4850] border border-[#d3e4fe]',
    desc: 'Read-only access to view itinerary, budget, and member list.',
  },
}

export function CollaborationPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('editor')
  const [removingMember, setRemovingMember] = useState<TripMember | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const tripQuery = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => (await apiClient.get(`/api/v1/trips/${tripId}`)).data as Trip,
    enabled: Boolean(tripId),
  })

  const membersQuery = useQuery({
    queryKey: ['trip', tripId, 'members'],
    queryFn: async () => (await apiClient.get(`/api/v1/trips/${tripId}/members`)).data as TripMember[],
    enabled: Boolean(tripId),
  })

  const invalidateMembers = () => {
    queryClient.invalidateQueries({ queryKey: ['trip', tripId, 'members'] })
  }

  const addMemberMutation = useMutation({
    mutationFn: async () =>
      (await apiClient.post(`/api/v1/trips/${tripId}/members`, { email: email.trim(), role })).data as TripMember,
    onSuccess: () => {
      invalidateMembers()
      setEmail('')
      setRole('editor')
      setIsAddOpen(false)
      setNotice('Member successfully added to this trip!')
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ member, nextRole }: { member: TripMember; nextRole: Role }) =>
      (
        await apiClient.patch(`/api/v1/trips/${tripId}/members/${member.user_id}`, {
          role: nextRole,
        })
      ).data as TripMember,
    onSuccess: () => {
      invalidateMembers()
      setNotice('Collaborator permissions updated.')
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (member: TripMember) =>
      apiClient.delete(`/api/v1/trips/${tripId}/members/${member.user_id}`),
    onSuccess: () => {
      invalidateMembers()
      setRemovingMember(null)
      setNotice('Collaborator removed from this trip.')
    },
  })

  const members = membersQuery.data ?? []
  const currentUserMember = members.find((m) => m.user_id === user?.id)
  const canManageMembers = currentUserMember?.role === 'owner'

  const mutationError =
    addMemberMutation.error ?? updateRoleMutation.error ?? removeMemberMutation.error
  const error = membersQuery.error ?? tripQuery.error ?? mutationError

  const submitAddMember = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setNotice(null)
    addMemberMutation.mutate()
  }

  const confirmRemove = () => {
    if (removingMember) {
      removeMemberMutation.mutate(removingMember)
    }
  }

  const trip = tripQuery.data

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

      {/* Main Collaboration Page */}
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-20 sm:px-6 lg:pl-[280px] lg:pr-10">
        {/* Header Bar */}
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#e5eeff] pb-5 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0b1c30]">Trip Members & Roles</h1>
            <p className="mt-1 text-sm text-[#3f4850]">
              {trip
                ? `Manage who can plan, edit, and view ${trip.title}`
                : 'Share and collaborate in real-time'}
            </p>
          </div>

          {canManageMembers && (
            <button
              type="button"
              onClick={() => {
                setNotice(null)
                setIsAddOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#006194] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007bb9] active:scale-95"
            >
              <UserPlus size={16} />
              <span>Invite Collaborator</span>
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={getApiErrorMessage(error)} />
          </div>
        )}

        {notice && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-[#b7e4c7] bg-[#e7f6ec] p-4 text-sm text-[#166534]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{notice}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="rounded-lg p-1 text-[#166534] hover:bg-[#b7e4c7]/40"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {membersQuery.isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white shadow-xs" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#bfc7d2] bg-white p-12 text-center shadow-xs">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#cce5ff] text-[#006194]">
              <Users size={32} />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[#0b1c30]">No Members Found</h2>
            <p className="mt-1 max-w-sm text-xs text-[#3f4850]">
              Invite family, friends, or travel companions to start co-planning.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Members Card */}
            <div className="overflow-hidden rounded-2xl border border-[#d3e4fe] bg-white shadow-xs">
              <div className="flex items-center justify-between border-b border-[#e5eeff] bg-[#eff4ff] p-5">
                <div>
                  <h2 className="text-lg font-bold text-[#0b1c30]">Active Collaborators</h2>
                  <p className="text-xs text-[#3f4850]">
                    {members.length} {members.length === 1 ? 'member' : 'members'} with access to this trip
                  </p>
                </div>
                {canManageMembers && (
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-[#006194] bg-white px-3 py-1.5 text-xs font-semibold text-[#006194] transition hover:bg-[#cce5ff]"
                  >
                    <UserPlus size={14} />
                    <span>Invite</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#f8f9ff] p-4 sm:p-5">
                {members.map((member) => {
                  const roleInfo = roleConfig[member.role] || roleConfig.viewer
                  const RoleIcon = roleInfo.icon
                  const isCurrent = member.user_id === user?.id

                  return (
                    <div
                      key={member.id}
                      className="flex flex-col justify-between gap-4 rounded-xl p-3.5 transition hover:bg-[#eff4ff]/60 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#006194] text-sm font-bold text-white shadow-xs">
                          {getInitials(member.full_name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-[#0b1c30]">{member.full_name}</span>
                            {isCurrent && (
                              <span className="rounded-full bg-[#d3e4fe] px-2 py-0.5 text-[10px] font-bold text-[#004b73]">
                                You
                              </span>
                            )}
                          </div>
                          <p className="flex items-center gap-1 text-xs text-[#707881]">
                            <Mail size={12} />
                            <span>{member.email}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:justify-end">
                        {member.role === 'owner' ? (
                          <span
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${roleInfo.badgeClass}`}
                          >
                            <RoleIcon size={14} />
                            <span>{roleInfo.label}</span>
                          </span>
                        ) : canManageMembers ? (
                          <div className="flex items-center gap-2">
                            <select
                              aria-label={`Role for ${member.full_name}`}
                              value={member.role}
                              onChange={(e) =>
                                updateRoleMutation.mutate({
                                  member,
                                  nextRole: e.target.value as Role,
                                })
                              }
                              disabled={updateRoleMutation.isPending}
                              className="rounded-xl border border-[#bfc7d2] bg-white px-3 py-1.5 text-xs font-semibold text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-1 focus:ring-[#006194]"
                            >
                              <option value="editor">Editor</option>
                              <option value="viewer">Viewer</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => {
                                setNotice(null)
                                setRemovingMember(member)
                              }}
                              aria-label={`Remove ${member.full_name}`}
                              className="rounded-lg p-2 text-[#ba1a1a] transition hover:bg-[#ffdad6]"
                              title="Remove member"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${roleInfo.badgeClass}`}
                          >
                            <RoleIcon size={14} />
                            <span>{roleInfo.label}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Roles & Permissions Explanation Guide */}
            <div className="rounded-2xl border border-[#d3e4fe] bg-white p-6 shadow-xs">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[#0b1c30]">
                <Shield size={18} className="text-[#006194]" />
                <span>Permission Levels & Capabilities</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {Object.entries(roleConfig).map(([key, config]) => {
                  const Icon = config.icon
                  return (
                    <div key={key} className="rounded-xl bg-[#eff4ff] p-4">
                      <div className="flex items-center gap-2">
                        <Icon size={16} className="text-[#006194]" />
                        <span className="font-bold text-[#0b1c30]">{config.label}</span>
                      </div>
                      <p className="mt-1.5 text-xs text-[#3f4850]">{config.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {tripId && <TripBottomNav tripId={tripId} />}

      {/* Invite Member Modal */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-[#0b1c30]/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsAddOpen(false)
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[#d3e4fe] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between border-b border-[#e5eeff] pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#0b1c30]">Invite Collaborator</h2>
                <p className="text-xs text-[#3f4850]">
                  Enter the email address of a registered user.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                aria-label="Close dialog"
                className="rounded-full p-1.5 text-[#3f4850] hover:bg-[#eff4ff]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitAddMember} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#3f4850]">
                  Email Address *
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. friend@example.com"
                  className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3.5 py-2.5 text-sm text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                />
              </div>

              {/* Quick helper buttons for testing */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#707881]">
                <span>Quick demo users:</span>
                <button
                  type="button"
                  onClick={() => setEmail('demo@globetrotter.com')}
                  className="rounded-md bg-[#eff4ff] px-2 py-0.5 font-medium text-[#006194] hover:bg-[#dce9ff]"
                >
                  demo@globetrotter.com
                </button>
                <button
                  type="button"
                  onClick={() => setEmail('traveler@globetrotter.com')}
                  className="rounded-md bg-[#eff4ff] px-2 py-0.5 font-medium text-[#006194] hover:bg-[#dce9ff]"
                >
                  traveler@globetrotter.com
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#3f4850]">Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full rounded-xl border border-[#bfc7d2] bg-[#f8f9ff] px-3.5 py-2.5 text-sm font-semibold text-[#0b1c30] outline-none focus:border-[#006194] focus:ring-2 focus:ring-[#93ccff]"
                >
                  <option value="editor">Editor (Can manage itinerary and budget)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-[#e5eeff] pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-xl border border-[#bfc7d2] px-4 py-2 text-sm font-semibold text-[#3f4850] hover:bg-[#eff4ff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMemberMutation.isPending}
                  className="rounded-xl bg-[#006194] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007bb9] disabled:opacity-60"
                >
                  {addMemberMutation.isPending ? 'Sending Invite...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Dialog */}
      {removingMember && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0b1c30]/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#ffdad6] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#ffdad6] text-[#ba1a1a]">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-[#0b1c30]">
              Remove {removingMember.full_name}?
            </h3>
            <p className="mt-2 text-sm text-[#3f4850]">
              They will lose access to this trip, its destinations, and its budget.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRemovingMember(null)}
                className="rounded-xl border border-[#bfc7d2] px-4 py-2 text-sm font-semibold text-[#3f4850] hover:bg-[#eff4ff]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removeMemberMutation.isPending}
                onClick={confirmRemove}
                className="rounded-xl bg-[#ba1a1a] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#93000a] disabled:opacity-60"
              >
                {removeMemberMutation.isPending ? 'Removing...' : 'Remove Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
